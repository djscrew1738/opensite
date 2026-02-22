/**
 * Twilio SMS Alert Sender
 */

import twilio from 'twilio';
import logger from '../logger.js';
import { db } from '../database.js';

class TwilioAlert {
  constructor() {
    this.client = null;
    this.fromPhone = null;
    this.toPhone = null;
    this.initialized = false;
  }

  /**
   * Initialize Twilio client
   */
  init() {
    if (this.initialized) return true;

    const accountSid = db.getSetting('twilio_account_sid') || process.env.TWILIO_ACCOUNT_SID;
    const authToken = db.getSetting('twilio_auth_token') || process.env.TWILIO_AUTH_TOKEN;
    this.fromPhone = db.getSetting('twilio_from_phone') || process.env.TWILIO_FROM_NUMBER;
    this.toPhone = db.getSetting('notify_phone') || process.env.NOTIFY_PHONE_NUMBER;

    if (!accountSid || !authToken) {
      logger.warn('[twilioAlert] Twilio credentials not configured');
      return false;
    }

    if (!this.fromPhone) {
      logger.warn('[twilioAlert] Twilio from number not configured');
      return false;
    }

    this.client = twilio(accountSid, authToken);
    this.initialized = true;
    return true;
  }

  /**
   * Send SMS alert
   */
  async send(alertData, retryCount = 1) {
    if (!this.init()) {
      return {
        success: false,
        error: 'Twilio not configured',
        channel: 'sms',
      };
    }

    const {
      sender,
      subject,
      matchedKeywords,
      priority = 'medium',
      bodyPreview = '',
      receivedAt,
    } = alertData;

    const toPhone = alertData.toPhone || this.toPhone;
    
    if (!toPhone) {
      return {
        success: false,
        error: 'No destination phone number configured',
        channel: 'sms',
      };
    }

    // Format message
    const priorityEmoji = priority === 'high' ? '🚨' : priority === 'medium' ? '⚠️' : 'ℹ️';
    const priorityLabel = priority.toUpperCase();
    const keywordStr = Array.isArray(matchedKeywords) ? matchedKeywords.join(', ') : matchedKeywords;
    
    // Truncate subject if too long
    const truncatedSubject = subject.length > 60 ? subject.substring(0, 57) + '...' : subject;
    
    const messageBody = `${priorityEmoji} [${priorityLabel}] New email from ${sender || 'Unknown'}

Subject: ${truncatedSubject}
Matched: ${keywordStr}

${bodyPreview ? bodyPreview.substring(0, 100) + (bodyPreview.length > 100 ? '...' : '') : ''}

${receivedAt ? new Date(receivedAt).toLocaleString() : new Date().toLocaleString()}`;

    let lastError = null;
    
    // Try sending with retry
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const message = await this.client.messages.create({
          body: messageBody,
          from: this.fromPhone,
          to: toPhone,
        });

        logger.info(`[twilioAlert] SMS sent: ${message.sid}`);
        
        return {
          success: true,
          messageId: message.sid,
          status: message.status,
          channel: 'sms',
          attempt: attempt + 1,
        };
      } catch (error) {
        lastError = error;
        logger.error(`[twilioAlert] SMS send failed (attempt ${attempt + 1}):`, error.message);
        
        if (attempt < retryCount) {
          // Wait before retry
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    // All retries failed
    const errorMessage = lastError?.message || 'Unknown error';
    logger.error('[twilioAlert] SMS send failed after retries:', errorMessage);

    return {
      success: false,
      error: errorMessage,
      channel: 'sms',
      attempts: retryCount + 1,
    };
  }

  /**
   * Send test SMS
   */
  async sendTest(phoneNumber) {
    if (!this.init()) {
      throw new Error('Twilio not configured');
    }

    const message = await this.client.messages.create({
      body: `🔧 OpenSite Email Alert Test\n\nYour SMS alerts are configured correctly!\n\nTime: ${new Date().toLocaleString()}`,
      from: this.fromPhone,
      to: phoneNumber || this.toPhone,
    });

    return {
      messageId: message.sid,
      status: message.status,
    };
  }

  /**
   * Check configuration status
   */
  getStatus() {
    const accountSid = db.getSetting('twilio_account_sid') || process.env.TWILIO_ACCOUNT_SID;
    const authToken = db.getSetting('twilio_auth_token') || process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = db.getSetting('twilio_from_phone') || process.env.TWILIO_FROM_NUMBER;
    const toPhone = db.getSetting('notify_phone') || process.env.NOTIFY_PHONE_NUMBER;

    return {
      configured: !!(accountSid && authToken && fromPhone),
      hasCredentials: !!(accountSid && authToken),
      hasFromPhone: !!fromPhone,
      hasToPhone: !!toPhone,
      fromPhone: fromPhone || null,
      toPhone: toPhone || null,
    };
  }
}

export const twilioAlert = new TwilioAlert();
export default twilioAlert;
