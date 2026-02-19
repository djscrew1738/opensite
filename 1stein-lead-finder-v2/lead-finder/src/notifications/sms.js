const config = require('../config');
const db = require('../db');
const logger = require('../utils/logger');

let twilioClient = null;

/**
 * Initialize Twilio client (lazy load)
 */
function getClient() {
  if (!twilioClient && config.twilio.accountSid && config.twilio.authToken) {
    const twilio = require('twilio');
    twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
  }
  return twilioClient;
}

/**
 * Send SMS notification for a hot lead
 */
async function sendLeadAlert(permit) {
  const client = getClient();
  if (!client || !config.notify.phone) {
    logger.warn('Twilio not configured. Skipping SMS notification.');
    return null;
  }

  const costStr = permit.estimated_cost
    ? `$${Number(permit.estimated_cost).toLocaleString()}`
    : 'N/A';

  const message = [
    `🔥 HOT LEAD (Score: ${permit.lead_score})`,
    ``,
    `${permit.permit_type}`,
    `📍 ${permit.address}`,
    `💰 Est: ${costStr}`,
    permit.contractor_name ? `🏗️ Builder: ${permit.contractor_name}` : '',
    permit.units ? `🏠 Units: ${permit.units}` : '',
    ``,
    permit.description ? permit.description.substring(0, 100) : '',
    ``,
    `Permit #${permit.permit_number}`,
  ].filter(Boolean).join('\n');

  try {
    const result = await client.messages.create({
      body: message,
      from: config.twilio.fromNumber,
      to: config.notify.phone,
    });

    await db.logNotification(
      permit.id, 'sms', config.notify.phone, message, 'sent', result.sid
    );

    logger.info(`SMS sent for permit ${permit.permit_number}: ${result.sid}`);
    return result.sid;

  } catch (err) {
    await db.logNotification(
      permit.id, 'sms', config.notify.phone, message, 'failed', null
    );
    logger.error(`SMS failed for permit ${permit.permit_number}: ${err.message}`);
    return null;
  }
}

/**
 * Send batch notification summary
 */
async function sendDailySummary(stats) {
  const client = getClient();
  if (!client || !config.notify.phone) return;

  const message = [
    `📊 Daily Lead Report`,
    ``,
    `New permits: ${stats.newPermits}`,
    `Hot leads: ${stats.hotLeads}`,
    `Warm leads: ${stats.warmLeads}`,
    stats.topBuilder ? `Top builder: ${stats.topBuilder}` : '',
    ``,
    `Check dashboard for details.`,
  ].filter(Boolean).join('\n');

  try {
    await client.messages.create({
      body: message,
      from: config.twilio.fromNumber,
      to: config.notify.phone,
    });
    logger.info('Daily summary SMS sent');
  } catch (err) {
    logger.error(`Daily summary SMS failed: ${err.message}`);
  }
}

module.exports = { sendLeadAlert, sendDailySummary };
