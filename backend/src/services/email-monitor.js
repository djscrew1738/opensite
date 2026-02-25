// Email Monitor Service — watches Outlook inbox via IMAP for keyword matches, sends SMS via Twilio

import { ImapFlow } from 'imapflow';
import twilio from 'twilio';
import { db } from './database.js';
import { decrypt } from '../utils/encryption.js';
import logger from './logger.js';

// Default keywords — permit, inspection, plumbing, schedule-related
const DEFAULT_KEYWORDS = [
  'permit', 'inspection', 'variance', 'schedule change', 'change order',
  'delay', 'urgent', 'plumbing', 'rough-in', 'roughin', 'rough in',
  'top-out', 'topout', 'top out', 'trim', 'final walk', 'water heater',
  'backflow', 'sewer', 'drain', 'pex', 'copper', 'fixture', 'code violation',
  'failed', 'approved', 'rescheduled', 'leak', 'pressure test', 'city inspector',
  'building department', 'punch list', 'warranty', 'callback',
];

const log = logger;

// Check encryption key configuration at module load (after log is defined)
if (!process.env.ENCRYPTION_KEY) {
  log.warn('[email-monitor] ENCRYPTION_KEY environment variable not set. IMAP passwords will be stored but encryption security depends on environment configuration.');
}

// Track monitor state
let lastCheckTime = null;
let lastCheckResult = null;
let isChecking = false;

/**
 * Get IMAP config from database settings or environment
 */
async function getImapConfig() {
  const host = (await db.getSetting('imap_host')) || process.env.IMAP_HOST || process.env.IMAP_DEFAULT_HOST || 'imap.outlook.com';
  const port = parseInt((await db.getSetting('imap_port')) || process.env.IMAP_PORT || process.env.IMAP_DEFAULT_PORT || '993');
  const user = (await db.getSetting('imap_user')) || process.env.IMAP_USER || '';
  const encryptedPass = (await db.getSetting('imap_pass')) || process.env.IMAP_PASS || '';

  // Decrypt password if it's encrypted
  let pass = encryptedPass;
  try {
    pass = decrypt(encryptedPass) || encryptedPass;
  } catch (e) {
    // If decryption fails, use as-is (might be legacy plaintext)
    pass = encryptedPass;
  }

  return { host, port, user, pass };
}

/**
 * Get keyword list from database settings or use defaults
 */
async function getKeywords() {
  const custom = await db.getSetting('email_monitor_keywords');
  if (custom) {
    return custom.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
  }
  return DEFAULT_KEYWORDS;
}

/**
 * Get Twilio config for sending SMS
 */
async function getTwilioConfig() {
  const accountSid = (await db.getSetting('twilio_account_sid')) || process.env.TWILIO_ACCOUNT_SID;
  const authToken = (await db.getSetting('twilio_auth_token')) || process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = (await db.getSetting('twilio_from_phone')) || process.env.TWILIO_FROM_NUMBER;
  const toPhone = (await db.getSetting('notify_phone')) || process.env.NOTIFY_PHONE_NUMBER;

  return { accountSid, authToken, fromPhone, toPhone };
}

/**
 * Check if the email monitor is enabled
 */
async function isEnabled() {
  const enabled = await db.getSetting('email_monitor_enabled');
  return enabled === 'true' || enabled === '1';
}

/**
 * Scan text for keyword matches (case-insensitive)
 */
function findKeywordMatches(text, keywords) {
  if (!text) return [];
  const lower = text.toLowerCase();
  return keywords.filter(kw => lower.includes(kw));
}

/**
 * Send SMS alert for a matched email
 */
async function sendEmailAlertSms(emailData, matchedKeywords) {
  const { accountSid, authToken, fromPhone, toPhone } = await getTwilioConfig();

  if (!accountSid || !authToken || !fromPhone || !toPhone) {
    log.warn('Twilio not fully configured — skipping SMS');
    return null;
  }

  const client = twilio(accountSid, authToken);

  const body = [
    `[OpenSite Alert]`,
    `From: ${emailData.fromName || emailData.fromAddress}`,
    `Subject: ${(emailData.subject || '(no subject)').substring(0, 80)}`,
    `Keywords: ${matchedKeywords.join(', ')}`,
    `---`,
    `Received: ${new Date(emailData.receivedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
  ].join('\n');

  try {
    const result = await client.messages.create({
      body,
      from: fromPhone,
      to: toPhone,
    });
    log.info(`SMS sent: ${result.sid}`);
    return result.sid;
  } catch (err) {
    log.error(`SMS send failed: ${err.message}`);
    return null;
  }
}

/**
 * Test IMAP connection with given credentials
 */
export async function testImapConnection(config) {
  const client = new ImapFlow({
    host: config.host || 'imap.outlook.com',
    port: parseInt(config.port || '993'),
    secure: true,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    logger: false,
  });

  try {
    await client.connect();
    const mailbox = await client.mailboxOpen('INBOX');
    const result = {
      connected: true,
      mailbox: mailbox.path,
      messages: mailbox.exists,
      unseen: mailbox.unseen || 0,
    };
    await client.logout();
    return result;
  } catch (err) {
    throw new Error(`IMAP connection failed: ${err.message}`);
  }
}

/**
 * Main email check routine — polls INBOX for UNSEEN emails, scans for keywords
 */
export async function checkEmails() {
  if (isChecking) {
    log.warn('Email check already in progress — skipping');
    return { skipped: true };
  }

  if (!await isEnabled()) {
    log.debug('Email monitor disabled');
    return { disabled: true };
  }

  const { host, port, user, pass } = await getImapConfig();
  if (!user || !pass) {
    log.warn('IMAP credentials not configured');
    return { error: 'IMAP credentials not configured' };
  }

  isChecking = true;
  const keywords = await getKeywords();
  let processed = 0;
  let matched = 0;
  let smsSent = 0;

  const client = new ImapFlow({
    host,
    port,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      // Search for UNSEEN messages
      const unseenMessages = await client.search({ seen: false });

      if (!unseenMessages || unseenMessages.length === 0) {
        log.debug('No unseen messages');
        lastCheckTime = new Date().toISOString();
        lastCheckResult = { processed: 0, matched: 0, smsSent: 0 };
        return lastCheckResult;
      }

      log.info(`Found ${unseenMessages.length} unseen messages to scan`);

      for (const uid of unseenMessages) {
        try {
          const msg = await client.fetchOne(uid, {
            envelope: true,
            bodyStructure: true,
            source: true,
          }, { uid: true });

          if (!msg || !msg.envelope) continue;

          const envelope = msg.envelope;
          const messageId = envelope.messageId || `uid-${uid}`;
          const fromAddr = envelope.from?.[0]?.address || '';
          const fromName = envelope.from?.[0]?.name || fromAddr;
          const subject = envelope.subject || '';
          const receivedAt = envelope.date ? new Date(envelope.date).toISOString() : new Date().toISOString();

          // Skip if already processed
          if (await db.emailAlertExists(messageId)) {
            processed++;
            continue;
          }

          // Extract text body from source
          let bodyText = '';
          if (msg.source) {
            const sourceStr = msg.source.toString();
            // Simple text extraction — get text between boundaries or after headers
            const textMatch = sourceStr.match(/Content-Type:\s*text\/plain[\s\S]*?\n\n([\s\S]*?)(?:\n--|\n\.\r?\n|$)/i);
            if (textMatch) {
              bodyText = textMatch[1].substring(0, 2000); // limit scan length
            } else {
              // Fallback: just use the raw source (limited)
              bodyText = sourceStr.substring(0, 3000);
            }
          }

          // Scan subject + body for keywords
          const subjectMatches = findKeywordMatches(subject, keywords);
          const bodyMatches = findKeywordMatches(bodyText, keywords);
          const allMatches = [...new Set([...subjectMatches, ...bodyMatches])];

          processed++;

          if (allMatches.length > 0) {
            matched++;

            const emailData = {
              messageId,
              fromAddress: fromAddr,
              fromName,
              subject,
              receivedAt,
            };

            // Send SMS
            const smsSid = await sendEmailAlertSms(emailData, allMatches);
            if (smsSid) smsSent++;

            // Log to database
            await db.createEmailAlert({
              messageId,
              fromAddress: fromAddr,
              fromName,
              subject,
              matchedKeywords: allMatches.join(', '),
              snippet: bodyText.substring(0, 200).replace(/\s+/g, ' ').trim(),
              smsSent: !!smsSid,
              smsExternalId: smsSid,
              receivedAt,
            });

            log.info(`Match: "${subject}" from ${fromName} — keywords: ${allMatches.join(', ')}`);
          }

          // Mark as SEEN so we don't process again
          await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true });

        } catch (msgErr) {
          log.error(`Failed to process message uid ${uid}: ${msgErr.message}`);
        }
      }

    } finally {
      lock.release();
    }

    await client.logout();

  } catch (err) {
    log.error(`Email check failed: ${err.message}`);
    isChecking = false;
    lastCheckTime = new Date().toISOString();
    lastCheckResult = { error: err.message };
    return lastCheckResult;
  }

  isChecking = false;
  lastCheckTime = new Date().toISOString();
  lastCheckResult = { processed, matched, smsSent };
  log.info(`Check complete: ${processed} processed, ${matched} matched, ${smsSent} SMS sent`);
  return lastCheckResult;
}

/**
 * Get monitor status
 */
export async function getMonitorStatus() {
  const [stats, keywords, enabled] = await Promise.all([
    db.getEmailAlertStats(),
    getKeywords(),
    isEnabled(),
  ]);
  return {
    enabled,
    isChecking,
    lastCheckTime,
    lastCheckResult,
    totalAlerts: stats.total,
    totalSmsSent: stats.smsSentCount,
    lastAlertTime: stats.lastCheck,
    keywords,
  };
}

/**
 * Get recent alerts
 */
export function getRecentAlerts(limit = 20, offset = 0) {
  return db.getRecentEmailAlerts(limit, offset);
}

export { DEFAULT_KEYWORDS };
