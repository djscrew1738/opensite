/**
 * Notification Configuration Checker
 * Validates email and SMS configuration settings
 */

import { db } from '../services/database.js';
import logger from '../services/logger.js';

/**
 * Check Email (IMAP) Configuration
 */
export async function checkEmailConfig() {
  const config = {
    host: (await db.getSetting('imap_host')) || process.env.IMAP_HOST || 'outlook.office365.com',
    port: parseInt((await db.getSetting('imap_port')) || process.env.IMAP_PORT || '993'),
    user: (await db.getSetting('imap_user')) || process.env.IMAP_USER || '',
    pass: (await db.getSetting('imap_pass')) || process.env.IMAP_PASS || '',
  };

  const enabled = (await db.getSetting('email_monitor_enabled')) === 'true';
  
  const results = {
    enabled,
    configured: false,
    canConnect: false,
    issues: [],
    config: {
      host: config.host,
      port: config.port,
      user: config.user ? `${config.user.substring(0, 3)}***` : '(not set)',
      pass: config.pass ? '********' : '(not set)',
    },
  };

  // Check if enabled
  if (!enabled) {
    results.issues.push('Email monitor is disabled. Set email_monitor_enabled to "true" to enable.');
  }

  // Check required fields
  if (!config.user) {
    results.issues.push('IMAP username/email is not configured. Set IMAP_USER or imap_user in settings.');
  }

  if (!config.pass) {
    results.issues.push('IMAP password is not configured. Set IMAP_PASS or imap_pass in settings.');
  }

  // Check for app password (recommended for Outlook/Gmail)
  if (config.pass && config.pass.length < 8) {
    results.issues.push('Password seems short. If using Outlook/Gmail, you may need an App Password instead of your regular password.');
  }

  results.configured = !!(config.user && config.pass);
  results.canConnect = enabled && results.configured;

  return results;
}

/**
 * Check Twilio SMS Configuration
 */
export async function checkTwilioConfig() {
  const config = {
    accountSid: (await db.getSetting('twilio_account_sid')) || process.env.TWILIO_ACCOUNT_SID,
    authToken: (await db.getSetting('twilio_auth_token')) || process.env.TWILIO_AUTH_TOKEN,
    fromPhone: (await db.getSetting('twilio_from_phone')) || process.env.TWILIO_FROM_NUMBER,
    toPhone: (await db.getSetting('notify_phone')) || process.env.NOTIFY_PHONE_NUMBER,
  };

  const results = {
    configured: false,
    canSend: false,
    issues: [],
    config: {
      accountSid: config.accountSid 
        ? `${config.accountSid.substring(0, 5)}...${config.accountSid.substring(config.accountSid.length - 4)}`
        : '(not set)',
      authToken: config.authToken ? '********' : '(not set)',
      fromPhone: config.fromPhone || '(not set)',
      toPhone: config.toPhone || '(not set)',
    },
  };

  // Check Account SID
  if (!config.accountSid) {
    results.issues.push('Twilio Account SID is not configured. Set TWILIO_ACCOUNT_SID.');
  } else if (!config.accountSid.startsWith('AC')) {
    results.issues.push('Twilio Account SID should start with "AC". Check your Twilio console.');
  }

  // Check Auth Token
  if (!config.authToken) {
    results.issues.push('Twilio Auth Token is not configured. Set TWILIO_AUTH_TOKEN.');
  }

  // Check From Number
  if (!config.fromPhone) {
    results.issues.push('Twilio From Number is not configured. Set TWILIO_FROM_NUMBER.');
  } else {
    // Format check
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(config.fromPhone)) {
      results.issues.push('Twilio From Number format looks invalid. Use format: +1234567890 or (817) 555-0123');
    }
  }

  // Check To Number
  if (!config.toPhone) {
    results.issues.push('Notification phone number is not configured. Set NOTIFY_PHONE_NUMBER.');
  } else {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(config.toPhone)) {
      results.issues.push('Notification phone number format looks invalid. Use format: +1234567890');
    }
  }

  results.configured = !!(config.accountSid && config.authToken && config.fromPhone);
  results.canSend = results.configured && !!config.toPhone;

  return results;
}

/**
 * Check SMTP Configuration (for sending emails)
 */
export function checkSMTPConfig() {
  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    toEmail: process.env.NOTIFY_EMAIL,
  };

  const results = {
    configured: false,
    canSend: false,
    issues: [],
    config: {
      host: config.host || '(not set)',
      port: config.port,
      user: config.user ? `${config.user.substring(0, 3)}***` : '(not set)',
      pass: config.pass ? '********' : '(not set)',
      toEmail: config.toEmail || '(not set)',
    },
  };

  if (!config.host) {
    results.issues.push('SMTP host is not configured. Set SMTP_HOST (e.g., smtp.gmail.com).');
  }

  if (!config.user) {
    results.issues.push('SMTP username is not configured. Set SMTP_USER.');
  }

  if (!config.pass) {
    results.issues.push('SMTP password is not configured. Set SMTP_PASS. For Gmail, use an App Password.');
  }

  if (!config.toEmail) {
    results.issues.push('Notification email is not configured. Set NOTIFY_EMAIL.');
  }

  results.configured = !!(config.host && config.user && config.pass);
  results.canSend = results.configured && !!config.toEmail;

  return results;
}

/**
 * Run all configuration checks
 */
export async function checkAllNotificationConfigs() {
  const email = await checkEmailConfig();
  const twilio = await checkTwilioConfig();
  const smtp = checkSMTPConfig();

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      emailReady: email.canConnect,
      smsReady: twilio.canSend,
      smtpReady: smtp.canSend,
      allReady: email.canConnect && twilio.canSend,
    },
    email,
    twilio,
    smtp,
    recommendations: [],
  };

  // Generate recommendations
  if (!email.canConnect && !email.enabled) {
    report.recommendations.push('Enable email monitoring in Settings to receive email alerts.');
  }

  if (!twilio.canSend) {
    report.recommendations.push('Configure Twilio settings to receive SMS alerts for urgent emails.');
  }

  if (email.configured && !twilio.configured) {
    report.recommendations.push('Email is configured but SMS is not. Add Twilio credentials for mobile alerts.');
  }

  return report;
}

/**
 * Print configuration status to console
 */
export async function printConfigStatus() {
  const report = await checkAllNotificationConfigs();

  logger.info('\n' + '='.repeat(60));
  logger.info('NOTIFICATION CONFIGURATION STATUS');
  logger.info('='.repeat(60));
  logger.info(`Timestamp: ${report.timestamp}`);
  logger.info('');

  // Email Status
  logger.info('EMAIL MONITOR (IMAP)');
  logger.info('-'.repeat(40));
  logger.info(`Enabled: ${report.email.enabled ? 'Yes' : 'No'}`);
  logger.info(`Configured: ${report.email.configured ? 'Yes' : 'No'}`);
  logger.info(`Host: ${report.email.config.host}`);
  logger.info(`Port: ${report.email.config.port}`);
  logger.info(`User: ${report.email.config.user}`);
  logger.info(`Can Connect: ${report.email.canConnect ? 'Yes' : 'No'}`);

  if (report.email.issues.length > 0) {
    logger.info('\nIssues:');
    report.email.issues.forEach(issue => logger.warn(`  ${issue}`));
  }

  logger.info('');

  // Twilio Status
  logger.info('TWILIO SMS');
  logger.info('-'.repeat(40));
  logger.info(`Configured: ${report.twilio.configured ? 'Yes' : 'No'}`);
  logger.info(`Account SID: ${report.twilio.config.accountSid}`);
  logger.info(`From Number: ${report.twilio.config.fromPhone}`);
  logger.info(`To Number: ${report.twilio.config.toPhone}`);
  logger.info(`Can Send: ${report.twilio.canSend ? 'Yes' : 'No'}`);

  if (report.twilio.issues.length > 0) {
    logger.info('\nIssues:');
    report.twilio.issues.forEach(issue => logger.warn(`  ${issue}`));
  }

  logger.info('');

  // SMTP Status
  logger.info('SMTP (Outgoing Email)');
  logger.info('-'.repeat(40));
  logger.info(`Configured: ${report.smtp.configured ? 'Yes' : 'No'}`);
  logger.info(`Host: ${report.smtp.config.host}`);
  logger.info(`Port: ${report.smtp.config.port}`);
  logger.info(`User: ${report.smtp.config.user}`);
  logger.info(`To Email: ${report.smtp.config.toEmail}`);
  logger.info(`Can Send: ${report.smtp.canSend ? 'Yes' : 'No'}`);

  if (report.smtp.issues.length > 0) {
    logger.info('\nIssues:');
    report.smtp.issues.forEach(issue => logger.warn(`  ${issue}`));
  }

  logger.info('');
  logger.info('='.repeat(60));
  logger.info('SUMMARY');
  logger.info('='.repeat(60));
  logger.info(`Email Monitoring: ${report.summary.emailReady ? 'Ready' : 'Not Ready'}`);
  logger.info(`SMS Alerts: ${report.summary.smsReady ? 'Ready' : 'Not Ready'}`);
  logger.info(`SMTP Email: ${report.summary.smtpReady ? 'Ready' : 'Not Ready'}`);
  logger.info('');

  if (report.recommendations.length > 0) {
    logger.info('RECOMMENDATIONS:');
    report.recommendations.forEach(rec => logger.info(`  ${rec}`));
  }

  if (report.summary.allReady) {
    logger.info('All notification systems are configured and ready!');
  } else {
    logger.warn('Some notification systems need configuration.');
  }

  logger.info('='.repeat(60) + '\n');

  return report;
}

export default {
  checkEmailConfig,
  checkTwilioConfig,
  checkSMTPConfig,
  checkAllNotificationConfigs,
  printConfigStatus,
};
