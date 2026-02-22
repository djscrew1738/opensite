/**
 * Email Alert Health API Routes
 * Service status, testing, and account management
 */

import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { emailWatcherService } from '../../services/emailWatcher/EmailWatcherService.js';
import { EmailProviderFactory } from '../../services/emailWatcher/emailProviderFactory.js';
import { alertDispatcher } from '../../services/emailWatcher/alertDispatcher.js';
import { db } from '../../services/database.js';
import logger from '../../services/logger.js';

const router = express.Router();

/**
 * GET /api/email-alerts/health
 * Get watcher service health status
 */
router.get('/health', (req, res) => {
  try {
    const status = emailWatcherService.getStatus();
    const stats = emailWatcherService.getStats(1); // Last 24 hours

    res.success({
      service: status,
      stats: {
        alertsToday: stats.total,
        sent: stats.sent,
        failed: stats.failed,
      },
      alertChannels: alertDispatcher.getStatus(),
    });
  } catch (error) {
    logger.error('[emailAlerts/health] Failed to get health:', error.message);
    res.error('Failed to retrieve health status', 'ERROR', null, 500);
  }
});

/**
 * GET /api/email-alerts/providers
 * Get OAuth provider configuration statuses
 */
router.get('/providers', (req, res) => {
  try {
    const providers = emailWatcherService.getProviderStatuses();
    res.success(providers);
  } catch (error) {
    logger.error('[emailAlerts/health] Failed to get providers:', error.message);
    res.error('Failed to retrieve provider statuses', 'ERROR', null, 500);
  }
});

/**
 * POST /api/email-alerts/trigger
 * Manually trigger a poll
 */
router.post('/trigger', async (req, res) => {
  try {
    const result = await emailWatcherService.triggerPoll();
    res.success(result, 'Poll triggered successfully');
  } catch (error) {
    logger.error('[emailAlerts/health] Failed to trigger poll:', error.message);
    res.error('Failed to trigger poll', 'ERROR', null, 500);
  }
});

/**
 * POST /api/email-alerts/reload
 * Reload rules from database
 */
router.post('/reload', async (req, res) => {
  try {
    const rules = await emailWatcherService.reloadRules();
    res.success({ rulesCount: rules.length }, 'Rules reloaded successfully');
  } catch (error) {
    logger.error('[emailAlerts/health] Failed to reload rules:', error.message);
    res.error('Failed to reload rules', 'ERROR', null, 500);
  }
});

/**
 * POST /api/email-alerts/test
 * Send test alerts to configured channels
 */
router.post('/test', [
  body('channels').optional().isArray(),
  body('channels.*').optional().isIn(['sms', 'telegram']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.error('Validation failed', 'VALIDATION_ERROR', errors.array(), 400);
  }

  try {
    const channels = req.body.channels || ['sms', 'telegram'];
    const results = await emailWatcherService.testAlerts(channels);
    
    const allSucceeded = results.every(r => r.success);
    res.success(results, allSucceeded ? 'Test alerts sent' : 'Some test alerts failed');
  } catch (error) {
    logger.error('[emailAlerts/health] Test alert failed:', error.message);
    res.error('Test alert failed', 'ERROR', null, 500);
  }
});

/**
 * GET /api/email-alerts/accounts
 * Get all watcher accounts
 */
router.get('/accounts', (req, res) => {
  try {
    const accounts = db.getAllEmailWatcherAccounts();
    res.success(accounts);
  } catch (error) {
    logger.error('[emailAlerts/health] Failed to get accounts:', error.message);
    res.error('Failed to retrieve accounts', 'ERROR', null, 500);
  }
});

/**
 * POST /api/email-alerts/accounts
 * Start OAuth flow for new account
 */
router.post('/accounts', [
  body('provider').isIn(['gmail', 'outlook']).withMessage('Provider must be gmail or outlook'),
  body('name').optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.error('Validation failed', 'VALIDATION_ERROR', errors.array(), 400);
  }

  try {
    const { provider, name } = req.body;
    
    // Get OAuth URL for selected provider
    const authUrl = EmailProviderFactory.getAuthUrl(provider);

    // Store pending account setup
    const pendingId = Math.random().toString(36).substring(7);
    db.setSetting(`email_watcher_pending_${pendingId}`, JSON.stringify({
      provider,
      name: name || `${provider} Account`,
      created_at: new Date().toISOString(),
    }));

    res.success({
      authUrl,
      pendingId,
      provider,
      message: `Complete ${provider} OAuth flow by visiting authUrl`,
    });
  } catch (error) {
    logger.error('[emailAlerts/health] Failed to create account:', error.message);
    res.error(error.message, 'OAUTH_ERROR', null, 400);
  }
});

/**
 * GET /api/email-alerts/auth/microsoft/callback
 * OAuth callback from Microsoft
 */
router.get('/auth/microsoft/callback', async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      logger.error('[emailAlerts/health] Microsoft OAuth error:', oauthError);
      return res.redirect('/settings/email-alerts?error=' + encodeURIComponent(oauthError));
    }

    if (!code) {
      return res.redirect('/settings/email-alerts?error=no_code');
    }

    // Complete OAuth flow
    const account = await emailWatcherService.completeAuth('outlook', code, 'Outlook Account');

    res.redirect('/settings/email-alerts?success=account_added&provider=outlook&email=' + encodeURIComponent(account.email_address));
  } catch (error) {
    logger.error('[emailAlerts/health] Microsoft OAuth callback failed:', error.message);
    res.redirect('/settings/email-alerts?error=' + encodeURIComponent(error.message));
  }
});

/**
 * GET /api/email-alerts/auth/google/callback
 * OAuth callback from Google
 */
router.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      logger.error('[emailAlerts/health] Google OAuth error:', oauthError);
      return res.redirect('/settings/email-alerts?error=' + encodeURIComponent(oauthError));
    }

    if (!code) {
      return res.redirect('/settings/email-alerts?error=no_code');
    }

    // Complete OAuth flow
    const account = await emailWatcherService.completeAuth('gmail', code, 'Gmail Account');

    res.redirect('/settings/email-alerts?success=account_added&provider=gmail&email=' + encodeURIComponent(account.email_address));
  } catch (error) {
    logger.error('[emailAlerts/health] Google OAuth callback failed:', error.message);
    res.redirect('/settings/email-alerts?error=' + encodeURIComponent(error.message));
  }
});

/**
 * GET /api/email-alerts/accounts/:id/health
 * Check health of a specific account
 */
router.get('/accounts/:id/health', async (req, res) => {
  try {
    const account = db.getEmailWatcherAccount(req.params.id);
    if (!account) {
      return res.error('Account not found', 'NOT_FOUND', null, 404);
    }

    // Create client for this account
    const client = EmailProviderFactory.create(account.provider, account.id);
    const health = await client.healthCheck();

    res.success({
      account: {
        id: account.id,
        name: account.name,
        email: account.email_address,
        provider: account.provider,
      },
      health,
    });
  } catch (error) {
    logger.error('[emailAlerts/health] Account health check failed:', error.message);
    res.error('Health check failed', 'ERROR', null, 500);
  }
});

/**
 * PATCH /api/email-alerts/accounts/:id
 * Update account
 */
router.patch('/accounts/:id', [
  body('name').optional().trim(),
  body('active').optional().isBoolean(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.error('Validation failed', 'VALIDATION_ERROR', errors.array(), 400);
  }

  try {
    const account = db.getEmailWatcherAccount(req.params.id);
    if (!account) {
      return res.error('Account not found', 'NOT_FOUND', null, 404);
    }

    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.active !== undefined) updateData.active = req.body.active;

    const updated = db.updateEmailWatcherAccount(req.params.id, updateData);
    res.success(updated, 'Account updated successfully');
  } catch (error) {
    logger.error('[emailAlerts/health] Failed to update account:', error.message);
    res.error('Failed to update account', 'ERROR', null, 500);
  }
});

/**
 * DELETE /api/email-alerts/accounts/:id
 * Delete an account
 */
router.delete('/accounts/:id', (req, res) => {
  try {
    const account = db.getEmailWatcherAccount(req.params.id);
    if (!account) {
      return res.error('Account not found', 'NOT_FOUND', null, 404);
    }

    db.deleteEmailWatcherAccount(req.params.id);
    res.success({ deleted: true }, 'Account deleted successfully');
  } catch (error) {
    logger.error('[emailAlerts/health] Failed to delete account:', error.message);
    res.error('Failed to delete account', 'ERROR', null, 500);
  }
});

/**
 * GET /api/email-alerts/config
 * Get email watcher configuration settings
 */
router.get('/config', (req, res) => {
  try {
    const config = {
      pollInterval: parseInt(db.getSetting('email_watcher_poll_interval')) || 60,
      markAsRead: db.getSetting('email_watcher_mark_read') === 'true',
      maxAgeHours: parseInt(db.getSetting('email_watcher_max_age_hours')) || 24,
      providers: emailWatcherService.getProviderStatuses(),
    };

    res.success(config);
  } catch (error) {
    logger.error('[emailAlerts/health] Failed to get config:', error.message);
    res.error('Failed to retrieve configuration', 'ERROR', null, 500);
  }
});

/**
 * PUT /api/email-alerts/config
 * Update email watcher configuration
 */
router.put('/config', [
  body('pollInterval').optional().isInt({ min: 30, max: 3600 }),
  body('markAsRead').optional().isBoolean(),
  body('maxAgeHours').optional().isInt({ min: 1, max: 168 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.error('Validation failed', 'VALIDATION_ERROR', errors.array(), 400);
  }

  try {
    if (req.body.pollInterval !== undefined) {
      db.setSetting('email_watcher_poll_interval', String(req.body.pollInterval));
    }
    if (req.body.markAsRead !== undefined) {
      db.setSetting('email_watcher_mark_read', String(req.body.markAsRead));
    }
    if (req.body.maxAgeHours !== undefined) {
      db.setSetting('email_watcher_max_age_hours', String(req.body.maxAgeHours));
    }

    res.success({ saved: true }, 'Configuration updated');
  } catch (error) {
    logger.error('[emailAlerts/health] Failed to save config:', error.message);
    res.error('Failed to save configuration', 'ERROR', null, 500);
  }
});

export default router;
