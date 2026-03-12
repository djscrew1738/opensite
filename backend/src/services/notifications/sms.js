/**
 * SMS Notification Channel
 * Uses Twilio for SMS delivery
 */

import twilio from 'twilio';
import logger from '../logger.js';
import { db } from '../database.js';

let twilioClient = null;

/**
 * Get or create Twilio client
 */
async function getTwilioClient() {
  if (twilioClient) return twilioClient;
  
  const settings = await db.getSettings();
  
  const accountSid = settings?.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID;
  const authToken = settings?.twilio_auth_token || process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    throw new Error('Twilio not configured');
  }
  
  twilioClient = twilio(accountSid, authToken);
  return twilioClient;
}

/**
 * Send SMS
 * @param {Object} options
 * @param {string} options.to - Recipient phone number
 * @param {string} options.body - Message body
 * @param {string} [options.from] - Sender number (optional, uses default)
 */
export async function sendSMS(options) {
  const { to, body, from } = options;
  
  if (!to || !body) {
    throw new Error('Missing required SMS fields: to, body');
  }
  
  const client = await getTwilioClient();
  const settings = await db.getSettings();
  
  const fromNumber = from || settings?.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER;
  
  if (!fromNumber) {
    throw new Error('Twilio phone number not configured');
  }
  
  const result = await client.messages.create({
    body,
    from: fromNumber,
    to
  });
  
  logger.info('[notifications:sms] SMS sent', {
    to,
    sid: result.sid,
    status: result.status
  });
  
  return {
    success: true,
    sid: result.sid,
    status: result.status,
    timestamp: new Date().toISOString()
  };
}

export default { sendSMS };
