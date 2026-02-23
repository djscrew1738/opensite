/**
 * Google Gmail API Client
 * Handles OAuth2 authentication and inbox fetching via Gmail API
 */

import axios from 'axios';
import logger from '../logger.js';
import { db } from '../database.js';

class GmailClient {
  constructor(accountId = null) {
    this.accountId = accountId;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    
    // Google API endpoints
    this.baseUrl = 'https://gmail.googleapis.com/gmail/v1';
    this.authUrl = 'https://oauth2.googleapis.com';
    this.accountsUrl = 'https://accounts.google.com/o/oauth2/v2';
    
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/email-alerts/auth/google/callback';
    
    // Gmail API scopes
    this.scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email',
    ];
  }

  /**
   * Load account credentials from database
   */
  async loadAccount() {
    // OAuth2 credentials from env or settings
    this.clientId = process.env.GOOGLE_CLIENT_ID || (await db.getSetting('google_client_id'));
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || (await db.getSetting('google_client_secret'));

    if (!this.accountId) {
      // Use default/first active Gmail account
      const allAccounts = await db.getActiveEmailWatcherAccounts();
      const accounts = allAccounts.filter(a => a.provider === 'gmail');
      if (accounts.length === 0) {
        throw new Error('No active Gmail accounts configured');
      }
      this.accountId = accounts[0].id;
    }

    const allAccounts = await db.getActiveEmailWatcherAccounts();
    const account = allAccounts.find(a => a.id === this.accountId && a.provider === 'gmail');
    
    if (!account) {
      throw new Error(`Gmail account ${this.accountId} not found`);
    }

    // Get full account data with tokens
    const fullAccount = await db.get('SELECT * FROM email_watcher_accounts WHERE id = ?', [this.accountId]);
    
    this.accessToken = fullAccount.access_token;
    this.refreshToken = fullAccount.refresh_token;
    this.tokenExpiresAt = fullAccount.token_expires_at;
    this.emailAddress = fullAccount.email_address;

    // Refresh token if needed
    if (this.tokenExpiresAt && new Date(this.tokenExpiresAt) <= new Date()) {
      await this.refreshAccessToken();
    }

    return this;
  }

  /**
   * Get OAuth2 authorization URL
   */
  async getAuthUrl(state = null) {
    if (!this.clientId) {
      this.clientId = process.env.GOOGLE_CLIENT_ID || (await db.getSetting('google_client_id'));
    }
    
    if (!this.clientId) {
      throw new Error('Google Client ID not configured');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
    });

    if (state) {
      params.append('state', state);
    }

    return `${this.accountsUrl}/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code) {
    if (!this.clientId) {
      this.clientId = process.env.GOOGLE_CLIENT_ID || (await db.getSetting('google_client_id'));
    }
    if (!this.clientSecret) {
      this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || (await db.getSetting('google_client_secret'));
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    try {
      const response = await axios.post(`${this.authUrl}/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token, refresh_token, expires_in } = response.data;
      
      this.accessToken = access_token;
      this.refreshToken = refresh_token;
      this.tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

      return {
        access_token,
        refresh_token,
        expires_at: this.tokenExpiresAt,
      };
    } catch (error) {
      logger.error('[gmailClient] Token exchange failed:', error.response?.data || error.message);
      throw new Error(`Token exchange failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    if (!this.clientId) {
      this.clientId = process.env.GOOGLE_CLIENT_ID || (await db.getSetting('google_client_id'));
    }
    if (!this.clientSecret) {
      this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || (await db.getSetting('google_client_secret'));
    }

    try {
      const response = await axios.post(`${this.authUrl}/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token, expires_in } = response.data;
      
      this.accessToken = access_token;
      this.tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

      // Update database
      if (this.accountId) {
        await db.updateEmailWatcherAccountTokens(this.accountId, {
          access_token: this.accessToken,
          refresh_token: this.refreshToken,
          expires_at: this.tokenExpiresAt,
        });
      }

      logger.debug('[gmailClient] Access token refreshed');
      return true;
    } catch (error) {
      logger.error('[gmailClient] Token refresh failed:', error.response?.data || error.message);
      throw new Error(`Token refresh failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Make authenticated request to Gmail API
   */
  async request(endpoint, options = {}) {
    if (!this.accessToken) {
      await this.loadAccount();
    }

    // Check token expiration
    if (this.tokenExpiresAt && new Date(this.tokenExpiresAt) <= new Date(Date.now() + 60000)) {
      await this.refreshAccessToken();
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await axios({
        url,
        method: options.method || 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        data: options.body,
        params: options.params,
        timeout: options.timeout || 30000,
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expired, try refresh once
        await this.refreshAccessToken();
        return this.request(endpoint, options);
      }
      
      logger.error('[gmailClient] Gmail API request failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get unread messages from inbox
   */
  async getUnreadMessages(options = {}) {
    const { maxResults = 25, pageToken = null, since = null } = options;

    // Build query for unread messages
    let query = 'is:unread';
    if (since) {
      const afterDate = new Date(since).toISOString().split('T')[0];
      query += ` after:${afterDate}`;
    }

    const params = {
      userId: 'me',
      q: query,
      maxResults,
      ...(pageToken && { pageToken }),
    };

    // Get message list
    const listData = await this.request('/users/me/messages', { params });
    const messages = listData.messages || [];

    // Fetch full details for each message
    const fullMessages = await Promise.all(
      messages.map(async (msg) => {
        try {
          const fullMsg = await this.getMessage(msg.id);
          return this.parseMessage(fullMsg);
        } catch (err) {
          logger.warn(`[gmailClient] Failed to fetch message ${msg.id}:`, err.message);
          return null;
        }
      })
    );

    return fullMessages.filter(Boolean);
  }

  /**
   * Get full message content
   */
  async getMessage(messageId) {
    return this.request(`/users/me/messages/${messageId}`, {
      params: { format: 'full' }
    });
  }

  /**
   * Parse Gmail message into standard format
   */
  parseMessage(gmailMessage) {
    const { id, threadId, labelIds, snippet, payload, internalDate } = gmailMessage;
    
    // Extract headers
    const headers = {};
    if (payload?.headers) {
      for (const header of payload.headers) {
        headers[header.name.toLowerCase()] = header.value;
      }
    }

    // Parse from header
    let fromName = '';
    let fromEmail = '';
    if (headers.from) {
      const match = headers.from.match(/(?:(?:"([^"]+)")|([^<]+))\s*<([^>]+)>/);
      if (match) {
        fromName = match[1] || match[2]?.trim() || '';
        fromEmail = match[3];
      } else {
        fromEmail = headers.from;
      }
    }

    return {
      id,
      threadId,
      internetMessageId: headers['message-id'] || id,
      subject: headers.subject || '(No Subject)',
      from: {
        emailAddress: {
          name: fromName,
          address: fromEmail,
        }
      },
      sender: fromName,
      senderEmail: fromEmail,
      to: headers.to || '',
      receivedDateTime: new Date(parseInt(internalDate)).toISOString(),
      bodyPreview: snippet || '',
      isRead: !labelIds?.includes('UNREAD'),
      labelIds,
    };
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId) {
    return this.request(`/users/me/messages/${messageId}/modify`, {
      method: 'POST',
      body: {
        removeLabelIds: ['UNREAD'],
      },
    });
  }

  /**
   * Get user profile
   */
  async getProfile() {
    return this.request('/users/me/profile');
  }

  /**
   * Check connection health
   */
  async healthCheck() {
    try {
      if (!this.accessToken) {
        await this.loadAccount();
      }

      const profile = await this.getProfile();
      return {
        connected: true,
        email: profile.emailAddress,
        messagesTotal: profile.messagesTotal,
        threadsTotal: profile.threadsTotal,
        historyId: profile.historyId,
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }
}

export { GmailClient };
export default GmailClient;
