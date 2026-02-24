/**
 * Notifications API Routes
 * Configuration checking and testing for email/SMS
 */

import express from 'express';
import {
  checkEmailConfig,
  checkTwilioConfig,
  checkSMTPConfig,
  checkAllNotificationConfigs,
} from '../utils/notification-config-checker.js';
import { testImapConnection, checkEmails } from '../services/email-monitor.js';
import twilio from 'twilio';
import { db } from '../services/database.js';
import { tryCatch } from '../utils/response.js';
import logger from '../services/logger.js';

const router = express.Router();

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
router.post('/test-email-connection', async (req, res) => {
  try {
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

  } catch (err) {
    res.error(err.message, 'EMAIL_CONNECTION_ERROR', null, 400);
  }
});

/**
 * POST /api/notifications/test-sms
 * Send a test SMS message
 */
router.post('/test-sms', async (req, res) => {
  try {
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
      from: fromPhone,
    }, 'Test SMS sent successfully');

  } catch (err) {
    logger.error('SMS test error:', err);
    res.error(err.message, 'SMS_SEND_ERROR', null, 500);
  }
});

/**
 * POST /api/notifications/send-test-email
 * Send a test email via SMTP
 */
router.post('/send-test-email', async (req, res) => {
  try {
    const nodemailer = await import('nodemailer');
    
    const { to } = req.body;
    const toEmail = to || process.env.NOTIFY_EMAIL;
    
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    };

    if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.pass) {
      return res.error('SMTP not fully configured', 'SMTP_NOT_CONFIGURED', null, 400);
    }

    if (!toEmail) {
      return res.error('Destination email not provided', 'EMAIL_REQUIRED', null, 400);
    }

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.port === 465,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"OpenSite Test" <${smtpConfig.user}>`,
      to: toEmail,
      subject: '🔧 OpenSite Email Test',
      text: `This is a test email from your OpenSite dashboard.\n\nIf you received this, your email notifications are working correctly!\n\nTime: ${new Date().toLocaleString()}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #E5A31E;">🔧 OpenSite Email Test</h1>
          <p>This is a test email from your OpenSite dashboard.</p>
          <p style="padding: 15px; background: #f0f0f0; border-radius: 8px;">
            <strong>If you received this, your email notifications are working correctly!</strong>
          </p>
          <p style="color: #666;">Time: ${new Date().toLocaleString()}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">
            OpenSite - CTL Plumbing LLC<br>
            This is an automated test message.
          </p>
        </div>
      `,
    });

    res.success({
      messageId: info.messageId,
      to: toEmail,
      from: smtpConfig.user,
    }, 'Test email sent successfully');

  } catch (err) {
    logger.error('Email test error:', err);
    res.error(err.message, 'EMAIL_SEND_ERROR', null, 500);
  }
});

/**
 * GET /api/notifications/settings
 * Get all notification settings
 */
router.get('/settings', tryCatch(async (req, res) => {
  const settings = {
    // Email Monitor (IMAP)
    email: {
      enabled: (await db.getSetting('email_monitor_enabled')) === 'true',
      host: (await db.getSetting('imap_host')) || process.env.IMAP_HOST || 'outlook.office365.com',
      port: parseInt((await db.getSetting('imap_port')) || process.env.IMAP_PORT || '993'),
      user: (await db.getSetting('imap_user')) || '',
    },
    // Twilio SMS
    twilio: {
      accountSidConfigured: !!((await db.getSetting('twilio_account_sid')) || process.env.TWILIO_ACCOUNT_SID),
      fromPhone: (await db.getSetting('twilio_from_phone')) || process.env.TWILIO_FROM_NUMBER || '',
      toPhone: (await db.getSetting('notify_phone')) || process.env.NOTIFY_PHONE_NUMBER || '',
    },
    // SMTP (Outgoing Email)
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER || '',
      toEmail: process.env.NOTIFY_EMAIL || '',
    },
  };

  res.success(settings);
}));

/**
 * PUT /api/notifications/settings
 * Update notification settings
 */
router.put('/settings', tryCatch(async (req, res) => {
  const { 
    emailEnabled, 
    imapHost, 
    imapPort, 
    imapUser, 
    imapPass,
    twilioAccountSid,
    twilioAuthToken,
    twilioFromPhone,
    notifyPhone,
  } = req.body;

  // Update email settings
  if (emailEnabled !== undefined) {
    await db.setSetting('email_monitor_enabled', emailEnabled ? 'true' : 'false');
  }
  if (imapHost) await db.setSetting('imap_host', imapHost);
  if (imapPort) await db.setSetting('imap_port', String(imapPort));
  if (imapUser) await db.setSetting('imap_user', imapUser);
  if (imapPass) await db.setSetting('imap_pass', imapPass);

  // Update Twilio settings
  if (twilioAccountSid) await db.setSetting('twilio_account_sid', twilioAccountSid);
  if (twilioAuthToken) await db.setSetting('twilio_auth_token', twilioAuthToken);
  if (twilioFromPhone) await db.setSetting('twilio_from_phone', twilioFromPhone);
  if (notifyPhone) await db.setSetting('notify_phone', notifyPhone);

  res.success({ saved: true }, 'Notification settings updated');
}));

/**
 * POST /api/notifications/trigger-email-check
 * Manually trigger email check
 */
router.post('/trigger-email-check', async (req, res) => {
  try {
    const result = await checkEmails();
    res.success(result, 'Email check triggered');
  } catch (err) {
    res.error(err.message, 'EMAIL_CHECK_ERROR', null, 500);
  }
});

export default router;
