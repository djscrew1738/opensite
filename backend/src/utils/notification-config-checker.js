/**
 * Notification Configuration Checker
 * Validates email and SMS configuration settings
 */

import { db } from '../services/database.js';

const logger = {
  info: (msg) => console.log(`[ConfigChecker] ✅ ${msg}`),
  warn: (msg) => console.warn(`[ConfigChecker] ⚠️  ${msg}`),
  error: (msg) => console.error(`[ConfigChecker] ❌ ${msg}`),
};

/**
 * Check Email (IMAP) Configuration
 */
export function checkEmailConfig() {
  const config = {
    host: db.getSetting('imap_host') || process.env.IMAP_HOST || 'outlook.office365.com',
    port: parseInt(db.getSetting('imap_port') || process.env.IMAP_PORT || '993'),
    user: db.getSetting('imap_user') || process.env.IMAP_USER || '',
    pass: db.getSetting('imap_pass') || process.env.IMAP_PASS || '',
  };

  const enabled = db.getSetting('email_monitor_enabled') === 'true';
  
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
export function checkTwilioConfig() {
  const config = {
    accountSid: db.getSetting('twilio_account_sid') || process.env.TWILIO_ACCOUNT_SID,
    authToken: db.getSetting('twilio_auth_token') || process.env.TWILIO_AUTH_TOKEN,
    fromPhone: db.getSetting('twilio_from_phone') || process.env.TWILIO_FROM_NUMBER,
    toPhone: db.getSetting('notify_phone') || process.env.NOTIFY_PHONE_NUMBER,
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
export function checkAllNotificationConfigs() {
  const email = checkEmailConfig();
  const twilio = checkTwilioConfig();
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
export function printConfigStatus() {
  const report = checkAllNotificationConfigs();

  console.log('\n' + '='.repeat(60));
  console.log('NOTIFICATION CONFIGURATION STATUS');
  console.log('='.repeat(60));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log('');

  // Email Status
  console.log('📧 EMAIL MONITOR (IMAP)');
  console.log('-'.repeat(40));
  console.log(`Enabled: ${report.email.enabled ? 'Yes' : 'No'}`);
  console.log(`Configured: ${report.email.configured ? 'Yes' : 'No'}`);
  console.log(`Host: ${report.email.config.host}`);
  console.log(`Port: ${report.email.config.port}`);
  console.log(`User: ${report.email.config.user}`);
  console.log(`Can Connect: ${report.email.canConnect ? '✅ Yes' : '❌ No'}`);
  
  if (report.email.issues.length > 0) {
    console.log('\nIssues:');
    report.email.issues.forEach(issue => console.log(`  ⚠️  ${issue}`));
  }

  console.log('');

  // Twilio Status
  console.log('📱 TWILIO SMS');
  console.log('-'.repeat(40));
  console.log(`Configured: ${report.twilio.configured ? 'Yes' : 'No'}`);
  console.log(`Account SID: ${report.twilio.config.accountSid}`);
  console.log(`From Number: ${report.twilio.config.fromPhone}`);
  console.log(`To Number: ${report.twilio.config.toPhone}`);
  console.log(`Can Send: ${report.twilio.canSend ? '✅ Yes' : '❌ No'}`);
  
  if (report.twilio.issues.length > 0) {
    console.log('\nIssues:');
    report.twilio.issues.forEach(issue => console.log(`  ⚠️  ${issue}`));
  }

  console.log('');

  // SMTP Status
  console.log('📤 SMTP (Outgoing Email)');
  console.log('-'.repeat(40));
  console.log(`Configured: ${report.smtp.configured ? 'Yes' : 'No'}`);
  console.log(`Host: ${report.smtp.config.host}`);
  console.log(`Port: ${report.smtp.config.port}`);
  console.log(`User: ${report.smtp.config.user}`);
  console.log(`To Email: ${report.smtp.config.toEmail}`);
  console.log(`Can Send: ${report.smtp.canSend ? '✅ Yes' : '❌ No'}`);
  
  if (report.smtp.issues.length > 0) {
    console.log('\nIssues:');
    report.smtp.issues.forEach(issue => console.log(`  ⚠️  ${issue}`));
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Email Monitoring: ${report.summary.emailReady ? '✅ Ready' : '❌ Not Ready'}`);
  console.log(`SMS Alerts: ${report.summary.smsReady ? '✅ Ready' : '❌ Not Ready'}`);
  console.log(`SMTP Email: ${report.summary.smtpReady ? '✅ Ready' : '❌ Not Ready'}`);
  console.log('');

  if (report.recommendations.length > 0) {
    console.log('RECOMMENDATIONS:');
    report.recommendations.forEach(rec => console.log(`  💡 ${rec}`));
  }

  if (report.summary.allReady) {
    console.log('\n✅ All notification systems are configured and ready!');
  } else {
    console.log('\n⚠️  Some notification systems need configuration.');
  }

  console.log('='.repeat(60) + '\n');

  return report;
}

export default {
  checkEmailConfig,
  checkTwilioConfig,
  checkSMTPConfig,
  checkAllNotificationConfigs,
  printConfigStatus,
};
