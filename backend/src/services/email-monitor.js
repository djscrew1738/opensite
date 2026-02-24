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

// Use imported logger from services/logger.js
// Local fallback only if imported logger is not available
const localLogger = {
  info: (msg, meta) => console.log(`[email-monitor] ${msg}`, meta || ''),
  warn: (msg, meta) => console.warn(`[email-monitor] ${msg}`, meta || ''),
  error: (msg, meta) => console.error(`[email-monitor] ${msg}`, meta || ''),
  debug: (msg, meta) => console.log(`[email-monitor] DEBUG: ${msg}`, meta || ''),
};

// Use the imported logger if available, otherwise fallback to local
const log = logger || localLogger;

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
function getImapConfig() {
  const host = db.getSetting('imap_host') || process.env.IMAP_HOST || process.env.IMAP_DEFAULT_HOST || 'outlook.office365.com';
  const port = parseInt(db.getSetting('imap_port') || process.env.IMAP_PORT || process.env.IMAP_DEFAULT_PORT || '993');
  const user = db.getSetting('imap_user') || process.env.IMAP_USER || '';
  const encryptedPass = db.getSetting('imap_pass') || process.env.IMAP_PASS || '';
  
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
function getKeywords() {
  const custom = db.getSetting('email_monitor_keywords');
  if (custom) {
    return custom.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
  }
  return DEFAULT_KEYWORDS;
}

/**
 * Get Twilio config for sending SMS
 */
function getTwilioConfig() {
  const accountSid = db.getSetting('twilio_account_sid') || process.env.TWILIO_ACCOUNT_SID;
  const authToken = db.getSetting('twilio_auth_token') || process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = db.getSetting('twilio_from_phone') || process.env.TWILIO_FROM_NUMBER;
  const toPhone = db.getSetting('notify_phone') || process.env.NOTIFY_PHONE_NUMBER;

  return { accountSid, authToken, fromPhone, toPhone };
}

/**
 * Check if the email monitor is enabled
 */
function isEnabled() {
  const enabled = db.getSetting('email_monitor_enabled');
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
  const { accountSid, authToken, fromPhone, toPhone } = getTwilioConfig();

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
 * Detect if error is due to Outlook/Office365 OAuth requirement
 */
function isOutlookOAuthError(err, host) {
  const message = err.message || '';
  const isOutlook = host?.includes('outlook') || host?.includes('office365');
  
  // Check for various OAuth/authentication failure patterns
  return isOutlook && (
    message.includes('AUTHENTICATE failed') ||
    message.includes('Login failed') ||
    message.includes('Invalid credentials') ||
    message.includes('AUTH') ||
    message.includes('535') ||
    message.includes('5.7.139') ||
    message.includes('5.7.1') ||
    message.includes('BasicAuthDisabled')
  );
}

/**
 * Get helpful error message for Outlook authentication issues
 */
function getOutlookAuthHelpMessage(user) {
  return `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTLOOK/OFFICE365 AUTHENTICATION ERROR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Microsoft has disabled basic password authentication for IMAP.

To fix this, you have two options:

OPTION 1: Use an App Password (Recommended)
─────────────────────────────────────────
1. Go to: https://account.microsoft.com/security
2. Sign in with your Microsoft account
3. Click "Advanced security options"
4. Turn ON "Two-step verification" (required for app passwords)
5. Click "Create a new app password"
6. Name it "OpenSite Job Pulse"
7. Copy the generated password (it looks like: abcd efgh ijkl mnop)
8. Paste it in the Password field above (without spaces)

OPTION 2: Enable Basic Auth (Not Recommended)
─────────────────────────────────────────
Contact your Microsoft 365 administrator to enable
"Basic Authentication" for IMAP in the Exchange Admin Center.
Note: Microsoft is phasing out this option.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

/**
 * Test IMAP connection with given credentials
 */
export async function testImapConnection(config) {
  const client = new ImapFlow({
    host: config.host || 'outlook.office365.com',
    port: parseInt(config.port || '993'),
    secure: true,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    logger: false,
    // Increase connection timeout
    connectionTimeout: 30000,
    greetingTimeout: 30000,
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
    const errorMessage = err.message || 'Unknown error';
    
    // Check for Outlook OAuth issues
    if (isOutlookOAuthError(err, config.host)) {
      const helpMessage = getOutlookAuthHelpMessage(config.user);
      log.warn(`Outlook OAuth error for ${config.user}: ${errorMessage}`);
      throw new Error(`Outlook authentication failed. Please use an App Password instead of your regular password.${helpMessage}`);
    }
    
    // Check for Gmail OAuth issues
    if (config.host?.includes('gmail') || config.host?.includes('google')) {
      if (errorMessage.includes('AUTHENTICATE') || errorMessage.includes('Login failed') || errorMessage.includes('Invalid credentials')) {
        throw new Error(`Gmail authentication failed. Please use an App Password.\n\nTo create an App Password:\n1. Go to https://myaccount.google.com/apppasswords\n2. Sign in with your Google account\n3. Select "Mail" and your device\n4. Copy the 16-character password and paste it here.`);
      }
    }
    
    throw new Error(`IMAP connection failed: ${errorMessage}`);
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

  if (!isEnabled()) {
    log.debug('Email monitor disabled');
    return { disabled: true };
  }

  const { host, port, user, pass } = getImapConfig();
  if (!user || !pass) {
    log.warn('IMAP credentials not configured');
    return { error: 'IMAP credentials not configured' };
  }

  isChecking = true;
  const keywords = getKeywords();
  let processed = 0;
  let matched = 0;
  let smsSent = 0;

  const client = new ImapFlow({
    host,
    port,
    secure: true,
    auth: { user, pass },
    logger: false,
    // Increase connection timeouts for better reliability
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
  });

  try {
    await client.connect();
    
    // Check for authentication errors on connect
    if (!client.authenticated) {
      throw new Error('Authentication failed - please check your credentials');
    }
    
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
          if (db.emailAlertExists(messageId)) {
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
            db.createEmailAlert({
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
    const errorMessage = err.message || 'Unknown error';
    log.error(`Email check failed: ${errorMessage}`);
    
    // Check for Outlook OAuth issues
    if (isOutlookOAuthError(err, host)) {
      const helpMessage = getOutlookAuthHelpMessage(user);
      log.warn(`Outlook OAuth error during check for ${user}: ${errorMessage}`);
      isChecking = false;
      lastCheckTime = new Date().toISOString();
      lastCheckResult = { 
        error: 'Outlook authentication failed. Please use an App Password.',
        help: helpMessage,
        requiresAppPassword: true
      };
      return lastCheckResult;
    }
    
    // Check for Gmail OAuth issues
    if ((host?.includes('gmail') || host?.includes('google')) && 
        (errorMessage.includes('AUTHENTICATE') || errorMessage.includes('Login failed'))) {
      isChecking = false;
      lastCheckTime = new Date().toISOString();
      lastCheckResult = { 
        error: 'Gmail authentication failed. Please use an App Password.',
        requiresAppPassword: true
      };
      return lastCheckResult;
    }
    
    isChecking = false;
    lastCheckTime = new Date().toISOString();
    lastCheckResult = { error: errorMessage };
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
export function getMonitorStatus() {
  const stats = db.getEmailAlertStats();
  return {
    enabled: isEnabled(),
    isChecking,
    lastCheckTime,
    lastCheckResult,
    totalAlerts: stats.total,
    totalSmsSent: stats.smsSentCount,
    lastAlertTime: stats.lastCheck,
    keywords: getKeywords(),
  };
}

/**
 * Get recent alerts
 */
export function getRecentAlerts(limit = 20, offset = 0) {
  return db.getRecentEmailAlerts(limit, offset);
}

export { DEFAULT_KEYWORDS };
