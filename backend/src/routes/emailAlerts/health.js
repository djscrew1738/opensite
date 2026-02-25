/**
 * Email Alert Health API Routes
 * Service status, testing, and account management
 */

import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { randomUUID } from 'crypto';
import { emailWatcherService } from '../../services/emailWatcher/EmailWatcherService.js';
import { EmailProviderFactory } from '../../services/emailWatcher/emailProviderFactory.js';
import { alertDispatcher } from '../../services/emailWatcher/alertDispatcher.js';
import { db } from '../../services/database.js';
import logger from '../../services/logger.js';
import { tryCatch } from '../../utils/response.js';
import { authenticateToken } from '../../middleware/auth-jwt.js';

const router = express.Router();

/**
 * GET /api/email-alerts/health
 * Get watcher service health status
 */
router.get('/health', authenticateToken, tryCatch(async (req, res) => {
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
}));

/**
 * GET /api/email-alerts/providers
 * Get OAuth provider configuration statuses
 */
router.get('/providers', authenticateToken, tryCatch(async (req, res) => {
  const providers = emailWatcherService.getProviderStatuses();
  res.success(providers);
}));

/**
 * POST /api/email-alerts/trigger
 * Manually trigger a poll
 */
router.post('/trigger', authenticateToken, tryCatch(async (req, res) => {
  const result = await emailWatcherService.triggerPoll();
  res.success(result, 'Poll triggered successfully');
}));

/**
 * POST /api/email-alerts/reload
 * Reload rules from database
 */
router.post('/reload', authenticateToken, tryCatch(async (req, res) => {
  const rules = await emailWatcherService.reloadRules();
  res.success({ rulesCount: rules.length }, 'Rules reloaded successfully');
}));

/**
 * POST /api/email-alerts/test
 * Send test alerts to configured channels
 */
router.post('/test', authenticateToken, [
  body('channels').optional().isArray(),
  body('channels.*').optional().isIn(['sms', 'telegram']),
  tryCatch(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 'VALIDATION_ERROR', errors.array(), 400);
    }

    const channels = req.body.channels || ['sms', 'telegram'];
    const results = await emailWatcherService.testAlerts(channels);
    
    const allSucceeded = results.every(r => r.success);
    res.success(results, allSucceeded ? 'Test alerts sent' : 'Some test alerts failed');
  })
]);

/**
 * GET /api/email-alerts/accounts
 * Get all watcher accounts
 */
router.get('/accounts', authenticateToken, tryCatch(async (req, res) => {
  const accounts = await db.getAllEmailWatcherAccounts();
  res.success(accounts);
}));

/**
 * POST /api/email-alerts/accounts
 * Start OAuth flow for new account
 */
router.post('/accounts', authenticateToken, [
  body('provider').isIn(['gmail', 'outlook']).withMessage('Provider must be gmail or outlook'),
  body('name').optional().trim(),
  tryCatch(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 'VALIDATION_ERROR', errors.array(), 400);
    }

    const { provider, name } = req.body;
    
    // Get OAuth URL for selected provider
    const authUrl = EmailProviderFactory.getAuthUrl(provider);

    // Store pending account setup (cryptographically random ID prevents CSRF)
    const pendingId = randomUUID();
    await db.setSetting(`email_watcher_pending_${pendingId}`, JSON.stringify({
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
  })
]);

/**
 * GET /api/email-alerts/auth/microsoft/callback
 * OAuth callback from Microsoft
 */
router.get('/auth/microsoft/callback', tryCatch(async (req, res) => {
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
}));

/**
 * GET /api/email-alerts/auth/google/callback
 * OAuth callback from Google
 */
router.get('/auth/google/callback', tryCatch(async (req, res) => {
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
}));

/**
 * GET /api/email-alerts/accounts/:id/health
 * Check health of a specific account
 */
router.get('/accounts/:id/health', authenticateToken, tryCatch(async (req, res) => {
  const account = await db.getEmailWatcherAccount(req.params.id);
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
}));

/**
 * PATCH /api/email-alerts/accounts/:id
 * Update account
 */
router.patch('/accounts/:id', authenticateToken, [
  body('name').optional().trim(),
  body('active').optional().isBoolean(),
  tryCatch(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 'VALIDATION_ERROR', errors.array(), 400);
    }

    const account = await db.getEmailWatcherAccount(req.params.id);
    if (!account) {
      return res.error('Account not found', 'NOT_FOUND', null, 404);
    }

    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.active !== undefined) updateData.active = req.body.active;

    const updated = await db.updateEmailWatcherAccount(req.params.id, updateData);
    res.success(updated, 'Account updated successfully');
  })
]);

/**
 * DELETE /api/email-alerts/accounts/:id
 * Delete an account
 */
router.delete('/accounts/:id', authenticateToken, tryCatch(async (req, res) => {
  const account = await db.getEmailWatcherAccount(req.params.id);
  if (!account) {
    return res.error('Account not found', 'NOT_FOUND', null, 404);
  }

  await db.deleteEmailWatcherAccount(req.params.id);
  res.success({ deleted: true }, 'Account deleted successfully');
}));

/**
 * GET /api/email-alerts/config
 * Get email watcher configuration settings
 */
router.get('/config', authenticateToken, tryCatch(async (req, res) => {
  const config = {
    pollInterval: parseInt(await db.getSetting('email_watcher_poll_interval')) || 60,
    markAsRead: (await db.getSetting('email_watcher_mark_read')) === 'true',
    maxAgeHours: parseInt(await db.getSetting('email_watcher_max_age_hours')) || 24,
    providers: emailWatcherService.getProviderStatuses(),
  };

  res.success(config);
}));

/**
 * PUT /api/email-alerts/config
 * Update email watcher configuration
 */
router.put('/config', authenticateToken, [
  body('pollInterval').optional().isInt({ min: 30, max: 3600 }),
  body('markAsRead').optional().isBoolean(),
  body('maxAgeHours').optional().isInt({ min: 1, max: 168 }),
  tryCatch(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 'VALIDATION_ERROR', errors.array(), 400);
    }

    if (req.body.pollInterval !== undefined) {
      await db.setSetting('email_watcher_poll_interval', String(req.body.pollInterval));
    }
    if (req.body.markAsRead !== undefined) {
      await db.setSetting('email_watcher_mark_read', String(req.body.markAsRead));
    }
    if (req.body.maxAgeHours !== undefined) {
      await db.setSetting('email_watcher_max_age_hours', String(req.body.maxAgeHours));
    }

    res.success({ saved: true }, 'Configuration updated');
  })
]);

export default router;
