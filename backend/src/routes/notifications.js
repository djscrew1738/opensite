/**
 * Notifications API Routes
 * Configuration checking and testing for email/SMS
 */

import express from 'express';
import {
  checkAllNotificationConfigs,
} from '../utils/notification-config-checker.js';
import { testImapConnection, checkEmails } from '../services/email-monitor.js';
import twilio from 'twilio';
import { db } from '../services/database.js';
import { tryCatch } from '../utils/response.js';
import { authenticateToken, requireRole } from '../middleware/auth-jwt.js';
import logger from '../services/logger.js';

const router = express.Router();

// Secure all notification routes
router.use(authenticateToken);

/**
 * GET /api/notifications/config-status
 * Get complete configuration status for email and SMS
 */
router.get('/config-status', tryCatch(async (req, res) => {
  const status = await checkAllNotificationConfigs();
  res.success(status);
}));

/**
 * POST /api/notifications/test-email-connection
 * Test IMAP email connection
 */
router.post('/test-email-connection', tryCatch(async (req, res) => {
  const { host, port, user, pass } = req.body;

  if (!user || !pass) {
    return res.error('Email and password are required', 'VALIDATION_ERROR', null, 400);
  }

  const result = await testImapConnection({
    host: host || 'outlook.office365.com',
    port: port || 993,
    user,
    pass,
  });

  res.success({
    connected: true,
    mailbox: result.mailbox,
    messages: result.messages,
    unseen: result.unseen,
  }, 'Email connection successful');
}));

/**
 * POST /api/notifications/test-sms
 */
router.post('/test-sms', tryCatch(async (req, res) => {
  const { phone } = req.body;
  const toPhone = phone || (await db.getSetting('notify_phone')) || process.env.NOTIFY_PHONE_NUMBER;
  
  const accountSid = (await db.getSetting('twilio_account_sid')) || process.env.TWILIO_ACCOUNT_SID;
  const authToken = (await db.getSetting('twilio_auth_token')) || process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = (await db.getSetting('twilio_from_phone')) || process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken) {
    return res.error('Twilio credentials not configured', 'TWILIO_NOT_CONFIGURED', null, 400);
  }

  if (!fromPhone) {
    return res.error('Twilio from number not configured', 'TWILIO_FROM_NOT_SET', null, 400);
  }

  if (!toPhone) {
    return res.error('Destination phone number not provided', 'PHONE_REQUIRED', null, 400);
  }

  const client = twilio(accountSid, authToken);
  
  const message = await client.messages.create({
    body: `🔧 OpenSite Test Message\n\nThis is a test SMS from your OpenSite dashboard. If you received this, your SMS notifications are working correctly!\n\nTime: ${new Date().toLocaleTimeString()}`,
    from: fromPhone,
    to: toPhone,
  });

  res.success({
    sid: message.sid,
    status: message.status,
    to: toPhone,
  }, 'Test SMS sent successfully');
}));

/**
 * GET /api/notifications/settings
 */
router.get('/settings', tryCatch(async (req, res) => {
  const settings = {
    email: {
      enabled: (await db.getSetting('email_monitor_enabled')) === 'true',
      host: (await db.getSetting('imap_host')) || process.env.IMAP_HOST || 'outlook.office365.com',
      port: parseInt((await db.getSetting('imap_port')) || process.env.IMAP_PORT || '993'),
      user: (await db.getSetting('imap_user')) || '',
    },
    twilio: {
      accountSidConfigured: !!((await db.getSetting('twilio_account_sid')) || process.env.TWILIO_ACCOUNT_SID),
      fromPhone: (await db.getSetting('twilio_from_phone')) || process.env.TWILIO_FROM_NUMBER || '',
      toPhone: (await db.getSetting('notify_phone')) || process.env.NOTIFY_PHONE_NUMBER || '',
    }
  };

  res.success(settings);
}));

/**
 * PUT /api/notifications/settings - Admin only
 */
router.put('/settings', requireRole(['admin']), tryCatch(async (req, res) => {
  const { 
    emailEnabled, imapHost, imapPort, imapUser, imapPass,
    twilioAccountSid, twilioAuthToken, twilioFromPhone, notifyPhone
  } = req.body;

  if (emailEnabled !== undefined) await db.setSetting('email_monitor_enabled', emailEnabled ? 'true' : 'false');
  if (imapHost) await db.setSetting('imap_host', imapHost);
  if (imapPort) await db.setSetting('imap_port', String(imapPort));
  if (imapUser) await db.setSetting('imap_user', imapUser);
  if (imapPass) await db.setSetting('imap_pass', imapPass);

  if (twilioAccountSid) await db.setSetting('twilio_account_sid', twilioAccountSid);
  if (twilioAuthToken) await db.setSetting('twilio_auth_token', twilioAuthToken);
  if (twilioFromPhone) await db.setSetting('twilio_from_phone', twilioFromPhone);
  if (notifyPhone) await db.setSetting('notify_phone', notifyPhone);

  res.success({ saved: true }, 'Notification settings updated');
}));

/**
 * POST /api/notifications/trigger-email-check
 */
router.post('/trigger-email-check', tryCatch(async (req, res) => {
  const result = await checkEmails();
  res.success(result, 'Email check triggered');
}));

export default router;
