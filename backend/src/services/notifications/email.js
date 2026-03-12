/**
 * Email Notification Channel
 * Uses nodemailer for SMTP email delivery
 */

import nodemailer from 'nodemailer';
import logger from '../logger.js';
import { db } from '../database.js';

let transporter = null;

/**
 * Get or create email transporter
 */
async function getTransporter() {
  if (transporter) return transporter;
  
  const settings = await db.getSettings();
  
  if (!settings?.smtp_host) {
    throw new Error('SMTP not configured');
  }
  
  transporter = nodemailer.createTransporter({
    host: settings.smtp_host,
    port: settings.smtp_port || 587,
    secure: settings.smtp_secure === true || settings.smtp_port === 465,
    auth: {
      user: settings.smtp_user,
      pass: settings.smtp_pass
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certs for internal SMTP
    }
  });
  
  return transporter;
}

/**
 * Send email
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} [options.html] - HTML body
 * @param {Array} [options.attachments] - Attachments
 */
export async function sendEmail(options) {
  const { to, subject, text, html, attachments = [] } = options;
  
  if (!to || !subject || !text) {
    throw new Error('Missing required email fields: to, subject, text');
  }
  
  const transport = await getTransporter();
  const settings = await db.getSettings();
  
  const from = settings?.smtp_from || `OpenSite <${settings?.smtp_user}>`;
  
  const result = await transport.sendMail({
    from,
    to,
    subject,
    text,
    html: html || text.replace(/\n/g, '<br>'),
    attachments
  });
  
  logger.info('[notifications:email] Email sent', {
    to,
    subject,
    messageId: result.messageId
  });
  
  return {
    success: true,
    messageId: result.messageId,
    timestamp: new Date().toISOString()
  };
}

/**
 * Verify SMTP configuration
 */
export async function verifyEmailConfig() {
  try {
    const transport = await getTransporter();
    await transport.verify();
    return { valid: true };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

export default { sendEmail, verifyEmailConfig };
