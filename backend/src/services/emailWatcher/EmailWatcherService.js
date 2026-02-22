/**
 * Email Watcher Service
 * Main service class for monitoring Gmail/Outlook inboxes and sending alerts
 */

import { EmailProviderFactory } from './emailProviderFactory.js';
import { KeywordMatcher } from './keywordMatcher.js';
import { alertDispatcher } from './alertDispatcher.js';
import { db } from '../database.js';
import logger from '../logger.js';

class EmailWatcherService {
  constructor() {
    this.isRunning = false;
    this.pollInterval = null;
    this.rulesCache = null;
    this.rulesCacheTime = null;
    this.rulesCacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.lastPollTime = null;
    this.pollCount = 0;
    this.errorCount = 0;
    this.keywordMatcher = new KeywordMatcher();
    this.clients = new Map(); // Cache clients by account ID
    
    // Configuration
    this.pollIntervalMs = 60000; // 60 seconds
    this.maxRetries = 3;
    this.processedCache = new Set(); // In-memory cache of recently processed IDs
    this.maxCacheSize = 1000;
  }

  /**
   * Start the email watcher service
   */
  async start() {
    if (this.isRunning) {
      logger.warn('[emailWatcher] Service already running');
      return;
    }

    logger.info('[emailWatcher] Starting email watcher service...');

    try {
      // Check if we have any configured accounts
      const accounts = db.getActiveEmailWatcherAccounts();
      if (accounts.length === 0) {
        logger.warn('[emailWatcher] No active email watcher accounts configured');
        logger.info('[emailWatcher] Configure an account via /api/email-alerts/accounts');
      } else {
        logger.info(`[emailWatcher] Found ${accounts.length} configured account(s): ${accounts.map(a => `${a.email_address} (${a.provider})`).join(', ')}`);
      }

      // Load initial rules
      await this.reloadRules();

      // Start polling
      this.isRunning = true;
      this.pollInterval = setInterval(() => this.poll(), this.pollIntervalMs);
      
      // Do initial poll
      await this.poll();

      logger.info('[emailWatcher] Service started successfully');
    } catch (error) {
      logger.error('[emailWatcher] Failed to start:', error.message);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the email watcher service
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    logger.info('[emailWatcher] Stopping service...');

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    this.isRunning = false;
    this.processedCache.clear();
    this.clients.clear();
    
    logger.info('[emailWatcher] Service stopped');
  }

  /**
   * Reload rules from database
   */
  async reloadRules() {
    try {
      this.rulesCache = db.getAllEmailAlertRules(true); // active only
      this.rulesCacheTime = Date.now();
      logger.debug(`[emailWatcher] Loaded ${this.rulesCache.length} active rules`);
      return this.rulesCache;
    } catch (error) {
      logger.error('[emailWatcher] Failed to reload rules:', error.message);
      throw error;
    }
  }

  /**
   * Get cached rules (reload if expired)
   */
  async getRules() {
    if (!this.rulesCache || !this.rulesCacheTime || 
        Date.now() - this.rulesCacheTime > this.rulesCacheExpiry) {
      await this.reloadRules();
    }
    return this.rulesCache;
  }

  /**
   * Get or create client for account
   */
  async getClient(account) {
    if (this.clients.has(account.id)) {
      return this.clients.get(account.id);
    }

    const client = EmailProviderFactory.create(account.provider, account.id);
    await client.loadAccount();
    this.clients.set(account.id, client);
    return client;
  }

  /**
   * Poll inbox for new emails
   */
  async poll() {
    if (!this.isRunning) return;

    this.lastPollTime = new Date();
    this.pollCount++;

    try {
      // Check if we have any accounts configured
      const accounts = db.getActiveEmailWatcherAccounts();
      if (accounts.length === 0) {
        logger.debug('[emailWatcher] No accounts configured, skipping poll');
        return;
      }

      // Get active rules
      const rules = await this.getRules();
      if (rules.length === 0) {
        logger.debug('[emailWatcher] No active rules, skipping poll');
        return;
      }

      // Check if any alert channel is configured
      if (!alertDispatcher.isAnyChannelConfigured()) {
        logger.warn('[emailWatcher] No alert channels configured (SMS or Telegram)');
      }

      // Poll each account
      for (const account of accounts) {
        await this.pollAccount(account, rules);
      }

    } catch (error) {
      this.errorCount++;
      logger.error('[emailWatcher] Poll error:', error.message);
    }
  }

  /**
   * Poll a specific account
   */
  async pollAccount(account, rules) {
    try {
      // Get or create client for this account
      const client = await this.getClient(account);

      // Check connection
      const health = await client.healthCheck();
      if (!health.connected) {
        logger.warn(`[emailWatcher] Account ${account.email_address} not connected:`, health.error);
        
        // Update account with error
        db.updateEmailWatcherAccount(account.id, {
          last_error: health.error,
          last_poll_at: new Date().toISOString(),
        });
        return;
      }

      // Get unread messages (last 24 hours)
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const messages = await client.getUnreadMessages({ since, maxResults: 25 });

      logger.debug(`[emailWatcher] Account ${account.email_address} (${account.provider}): ${messages.length} unread messages`);

      // Update last poll time
      db.updateEmailWatcherAccount(account.id, {
        last_poll_at: new Date().toISOString(),
        last_error: null,
      });

      // Process each message
      for (const message of messages) {
        await this.processMessage(message, rules, account, client);
      }

    } catch (error) {
      logger.error(`[emailWatcher] Error polling account ${account.email_address}:`, error.message);
      
      // Update account with error
      db.updateEmailWatcherAccount(account.id, {
        last_error: error.message,
        last_poll_at: new Date().toISOString(),
      });
    }
  }

  /**
   * Process a single email message
   */
  async processMessage(message, rules, account, client) {
    const messageId = message.id;
    const internetMessageId = message.internetMessageId || message.id;
    const cacheKey = `${account.id}:${messageId}`;

    // Check if already processed (in-memory cache)
    if (this.processedCache.has(cacheKey)) {
      return;
    }

    // Check if already processed (database)
    const existing = db.getProcessedEmailByProviderId(account.id, messageId);
    if (existing) {
      this.addToCache(cacheKey);
      return;
    }

    // Match against rules
    const matchResult = this.keywordMatcher.matchEmail(message, rules);

    if (!matchResult.matched) {
      // No match - add to cache to avoid re-processing
      this.addToCache(cacheKey);
      return;
    }

    logger.info(`[emailWatcher] Message matched ${matchResult.matches.length} rule(s) from ${account.email_address}: ${message.subject}`);

    // Store processed email
    const processedEmail = db.createProcessedEmail({
      account_id: account.id,
      provider_message_id: messageId,
      sender: message.from?.emailAddress?.name || 'Unknown',
      sender_email: message.from?.emailAddress?.address || '',
      subject: message.subject || '(No Subject)',
      body_preview: message.bodyPreview || message.snippet || '',
      received_at: message.receivedDateTime || new Date().toISOString(),
      matched_keywords: matchResult.matchedKeywords,
      matched_rule_ids: matchResult.matchedRuleIds,
    });

    this.addToCache(cacheKey);

    // Send alerts for each matched rule
    for (const match of matchResult.matches) {
      const rule = match.rule;
      
      // Enrich email data with match info
      const emailData = {
        ...message,
        matchedKeywords: match.matchedKeywords,
        matchedRule: rule,
        accountEmail: account.email_address,
        provider: account.provider,
      };

      // Dispatch alert
      const dispatchResult = await alertDispatcher.dispatch(
        emailData,
        rule,
        processedEmail.id
      );

      if (dispatchResult.anySucceeded) {
        logger.info(`[emailWatcher] Alert sent for rule "${rule.name}"`);
      } else {
        logger.error(`[emailWatcher] All alert channels failed for rule "${rule.name}"`);
      }
    }

    // Optionally mark as read (if configured)
    const markAsRead = db.getSetting('email_watcher_mark_read') === 'true';
    if (markAsRead) {
      try {
        await client.markAsRead(messageId);
        logger.debug(`[emailWatcher] Marked message ${messageId} as read`);
      } catch (error) {
        logger.warn(`[emailWatcher] Failed to mark message as read:`, error.message);
      }
    }
  }

  /**
   * Add message ID to processed cache
   */
  addToCache(cacheKey) {
    this.processedCache.add(cacheKey);
    
    // Limit cache size
    if (this.processedCache.size > this.maxCacheSize) {
      const firstKey = this.processedCache.values().next().value;
      this.processedCache.delete(firstKey);
    }
  }

  /**
   * Manually trigger a poll
   */
  async triggerPoll() {
    logger.info('[emailWatcher] Manual poll triggered');
    await this.poll();
    return {
      pollCount: this.pollCount,
      lastPollTime: this.lastPollTime,
      errorCount: this.errorCount,
    };
  }

  /**
   * Get service status
   */
  getStatus() {
    const accounts = db.getAllEmailWatcherAccounts();
    const activeAccounts = accounts.filter(a => a.active);
    
    return {
      isRunning: this.isRunning,
      lastPollTime: this.lastPollTime,
      pollCount: this.pollCount,
      errorCount: this.errorCount,
      rulesCount: this.rulesCache?.length || 0,
      accountsCount: accounts.length,
      activeAccountsCount: activeAccounts.length,
      accounts: accounts.map(a => ({
        id: a.id,
        email: a.email_address,
        provider: a.provider,
        active: a.active,
        lastPollAt: a.last_poll_at,
        lastError: a.last_error,
      })),
      processedCacheSize: this.processedCache.size,
      alertChannels: alertDispatcher.getStatus(),
    };
  }

  /**
   * Get recent statistics
   */
  getStats(days = 7) {
    const alertStats = db.getAlertStats(days);
    const recentProcessed = db.getRecentProcessedEmails(10);

    return {
      ...alertStats,
      recentEmails: recentProcessed,
      service: this.getStatus(),
    };
  }

  /**
   * Test alert channels
   */
  async testAlerts(channels = ['sms', 'telegram']) {
    return alertDispatcher.sendTest(channels);
  }

  /**
   * Get OAuth URL for provider
   */
  getAuthUrl(provider) {
    return EmailProviderFactory.getAuthUrl(provider);
  }

  /**
   * Complete OAuth flow and save account
   */
  async completeAuth(provider, code, accountName) {
    const tokens = await EmailProviderFactory.exchangeCode(provider, code);
    
    // Get user info based on provider
    let email, name;
    
    if (provider === 'gmail') {
      const { GmailClient } = await import('./gmailClient.js');
      const client = new GmailClient();
      client.accessToken = tokens.access_token;
      const profile = await client.getProfile();
      email = profile.emailAddress;
      name = accountName || email;
    } else {
      const { OutlookClient } = await import('./outlookClient.js');
      const client = new OutlookClient();
      client.accessToken = tokens.access_token;
      const profile = await client.getProfile();
      email = profile.mail || profile.userPrincipalName;
      name = accountName || profile.displayName || email;
    }
    
    // Save account
    const account = db.createEmailWatcherAccount({
      name,
      email_address: email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: tokens.expires_at,
      provider,
      active: true,
    });

    // Clear client cache to force reload
    this.clients.delete(account.id);

    logger.info(`[emailWatcher] ${provider} account added: ${account.email_address}`);
    return account;
  }

  /**
   * Get provider configuration statuses
   */
  getProviderStatuses() {
    return EmailProviderFactory.getAllProviderStatuses();
  }
}

// Export singleton instance
export const emailWatcherService = new EmailWatcherService();
export default emailWatcherService;
