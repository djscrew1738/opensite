const db = require('../db');
const sms = require('./sms');
const logger = require('../utils/logger');

/**
 * Check for new hot leads that haven't been notified yet
 * and send SMS alerts.
 *
 * Called after the scoring job completes.
 */
async function dispatchHotLeadAlerts() {
  try {
    // Find hot leads that were scored today and haven't been notified
    const result = await db.query(`
      SELECT p.*
      FROM permits p
      LEFT JOIN notifications n ON n.permit_id = p.id AND n.channel = 'sms' AND n.status = 'sent'
      WHERE p.lead_tier = 'hot'
        AND p.ai_scored_at >= CURRENT_DATE
        AND n.id IS NULL
      ORDER BY p.lead_score DESC
      LIMIT 10
    `);

    const hotLeads = result.rows;
    if (hotLeads.length === 0) {
      logger.info('No new hot leads to notify');
      return 0;
    }

    logger.info(`Dispatching SMS alerts for ${hotLeads.length} hot leads`);

    let sent = 0;
    for (const lead of hotLeads) {
      const sid = await sms.sendLeadAlert(lead);
      if (sid) sent++;
      // Space out SMS sends
      await new Promise(r => setTimeout(r, 1000));
    }

    logger.info(`Sent ${sent}/${hotLeads.length} hot lead alerts`);
    return sent;

  } catch (err) {
    logger.error(`Hot lead dispatch failed: ${err.message}`);
    return 0;
  }
}

module.exports = { dispatchHotLeadAlerts };
