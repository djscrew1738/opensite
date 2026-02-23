// Email Monitor API routes — test connection, check now, get alerts/status

import express from 'express';
import {
  testImapConnection,
  checkEmails,
  getMonitorStatus,
  getRecentAlerts,
  DEFAULT_KEYWORDS,
} from '../services/email-monitor.js';
import { db } from '../services/database.js';
import { encrypt, isEncrypted } from '../utils/encryption.js';

const router = express.Router();

// POST /api/email-monitor/test — test IMAP connection
router.post('/test', async (req, res) => {
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

    res.success(result, 'IMAP connection successful');
  } catch (err) {
    res.error(err.message, 'IMAP_ERROR', null, 400);
  }
});

// POST /api/email-monitor/check-now — manually trigger an email check
router.post('/check-now', async (req, res) => {
  try {
    const result = await checkEmails();
    res.success(result, 'Email check complete');
  } catch (err) {
    res.error(`Email check failed: ${err.message}`, 'CHECK_ERROR', null, 500);
  }
});

// GET /api/email-monitor/status — get monitor status
router.get('/status', (req, res) => {
  const status = getMonitorStatus();
  res.success(status);
});

// GET /api/email-monitor/alerts — list recent alerts
router.get('/alerts', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;
  const alerts = getRecentAlerts(limit, offset);
  res.success({ alerts, limit, offset });
});

// PUT /api/email-monitor/settings — save email monitor settings
router.put('/settings', async (req, res) => {
  const { enabled, host, port, user, pass, keywords } = req.body;

  if (enabled !== undefined) await db.setSetting('email_monitor_enabled', enabled ? 'true' : 'false');
  if (host) await db.setSetting('imap_host', host);
  if (port) await db.setSetting('imap_port', String(port));
  if (user) await db.setSetting('imap_user', user);
  if (pass) {
    // Encrypt password before storing
    const encryptedPass = isEncrypted(pass) ? pass : encrypt(pass);
    await db.setSetting('imap_pass', encryptedPass);
  }
  if (keywords !== undefined) await db.setSetting('email_monitor_keywords', keywords);

  res.success({ saved: true }, 'Email monitor settings saved');
});

// GET /api/email-monitor/settings — get email monitor settings (masked)
router.get('/settings', async (req, res) => {
  const user = (await db.getSetting('imap_user')) || '';
  const pass = (await db.getSetting('imap_pass')) || '';
  const host = (await db.getSetting('imap_host')) || process.env.IMAP_DEFAULT_HOST || 'outlook.office365.com';
  const port = (await db.getSetting('imap_port')) || process.env.IMAP_DEFAULT_PORT || '993';
  const enabled = (await db.getSetting('email_monitor_enabled')) === 'true';
  const keywords = (await db.getSetting('email_monitor_keywords')) || DEFAULT_KEYWORDS.join(', ');

  // Always mask password as '••••••••' regardless of encryption state
  // Never expose any part of the actual password or encrypted value
  res.success({
    enabled,
    host,
    port: parseInt(port),
    user,
    passMasked: pass ? '••••••••' : '',
    passConfigured: !!pass,
    keywords,
  });
});

export default router;
