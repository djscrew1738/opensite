const nodemailer = require('nodemailer');
const config = require('../config');
const db = require('../db');
const logger = require('../utils/logger');

let transporter = null;

/**
 * Initialize email transporter (lazy load)
 */
function getTransporter() {
  if (!transporter && config.email.user && config.email.pass) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }
  return transporter;
}

/**
 * Send daily digest email with all new leads
 */
async function sendDailyDigest() {
  const mailer = getTransporter();
  if (!mailer || !config.notify.email) {
    logger.warn('Email not configured. Skipping daily digest.');
    return;
  }

  try {
    // Fetch today's new permits, scored
    const result = await db.query(`
      SELECT p.*, b.company as builder_company, b.activity_trend, b.has_plumber
      FROM permits p
      LEFT JOIN permit_builder_map pbm ON p.id = pbm.permit_id AND pbm.role = 'contractor'
      LEFT JOIN builders b ON pbm.builder_id = b.id
      WHERE p.created_at >= CURRENT_DATE
        AND p.lead_tier != 'unscored'
      ORDER BY p.lead_score DESC
    `);

    const permits = result.rows;
    if (permits.length === 0) {
      logger.info('No new permits today. Skipping digest.');
      return;
    }

    const hot = permits.filter(p => p.lead_tier === 'hot');
    const warm = permits.filter(p => p.lead_tier === 'warm');
    const cold = permits.filter(p => p.lead_tier === 'cold');

    // Build HTML email
    const html = buildDigestHTML(permits, hot, warm, cold);

    await mailer.sendMail({
      from: `"OpenSite Lead Finder" <${config.email.user}>`,
      to: config.notify.email,
      subject: `🔍 Daily Leads: ${hot.length} hot, ${warm.length} warm, ${cold.length} cold — ${new Date().toLocaleDateString()}`,
      html: html,
    });

    logger.info(`Daily digest sent: ${permits.length} permits (${hot.length} hot)`);

  } catch (err) {
    logger.error(`Daily digest email failed: ${err.message}`);
  }
}

/**
 * Build HTML email body for daily digest
 */
function buildDigestHTML(all, hot, warm, cold) {
  const permitRow = (p) => {
    const cost = p.estimated_cost
      ? `$${Number(p.estimated_cost).toLocaleString()}`
      : '—';
    const tierColor = p.lead_tier === 'hot' ? '#e53e3e' : p.lead_tier === 'warm' ? '#dd6b20' : '#718096';
    const tierEmoji = p.lead_tier === 'hot' ? '🔥' : p.lead_tier === 'warm' ? '🟡' : '⚪';
    const plumberFlag = p.has_plumber === false ? ' ⚡ No plumber detected' : '';

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-size: 14px;">
          <span style="color: ${tierColor}; font-weight: bold;">${tierEmoji} ${p.lead_score}</span>
        </td>
        <td style="padding: 10px; font-size: 14px;">
          <strong>${p.address || 'N/A'}</strong><br>
          <span style="color: #718096; font-size: 12px;">${p.permit_type} — ${p.permit_number}</span>
        </td>
        <td style="padding: 10px; font-size: 14px;">${cost}</td>
        <td style="padding: 10px; font-size: 14px;">
          ${p.contractor_name || p.builder_company || '—'}
          ${p.activity_trend === 'ramping_up' ? '<br><span style="color: #38a169; font-size: 11px;">📈 Ramping up</span>' : ''}
          ${plumberFlag ? `<br><span style="color: #e53e3e; font-size: 11px;">${plumberFlag}</span>` : ''}
        </td>
        <td style="padding: 10px; font-size: 13px; color: #4a5568;">
          ${(p.description || '').substring(0, 80)}${(p.description || '').length > 80 ? '...' : ''}
        </td>
      </tr>
    `;
  };

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #f7fafc;">
      <div style="background: #1a202c; color: white; padding: 20px 30px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 22px;">🔍 OpenSite Daily Lead Report</h1>
        <p style="margin: 5px 0 0; color: #a0aec0;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div style="background: white; padding: 20px 30px; border-bottom: 1px solid #e2e8f0;">
        <div style="display: flex; gap: 20px;">
          <div style="text-align: center; padding: 10px 20px;">
            <div style="font-size: 32px; font-weight: bold; color: #e53e3e;">${hot.length}</div>
            <div style="font-size: 12px; color: #718096;">HOT LEADS</div>
          </div>
          <div style="text-align: center; padding: 10px 20px;">
            <div style="font-size: 32px; font-weight: bold; color: #dd6b20;">${warm.length}</div>
            <div style="font-size: 12px; color: #718096;">WARM LEADS</div>
          </div>
          <div style="text-align: center; padding: 10px 20px;">
            <div style="font-size: 32px; font-weight: bold; color: #718096;">${cold.length}</div>
            <div style="font-size: 12px; color: #718096;">COLD LEADS</div>
          </div>
          <div style="text-align: center; padding: 10px 20px;">
            <div style="font-size: 32px; font-weight: bold; color: #2d3748;">${all.length}</div>
            <div style="font-size: 12px; color: #718096;">TOTAL</div>
          </div>
        </div>
      </div>

      ${hot.length > 0 ? `
      <div style="background: white; padding: 20px 30px;">
        <h2 style="color: #e53e3e; font-size: 16px; margin-bottom: 10px;">🔥 Hot Leads — Act Now</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f7fafc; font-size: 12px; color: #718096; text-transform: uppercase;">
            <th style="padding: 8px 10px; text-align: left;">Score</th>
            <th style="padding: 8px 10px; text-align: left;">Address / Permit</th>
            <th style="padding: 8px 10px; text-align: left;">Est. Cost</th>
            <th style="padding: 8px 10px; text-align: left;">Builder</th>
            <th style="padding: 8px 10px; text-align: left;">Description</th>
          </tr>
          ${hot.map(permitRow).join('')}
        </table>
      </div>
      ` : ''}

      ${warm.length > 0 ? `
      <div style="background: white; padding: 20px 30px;">
        <h2 style="color: #dd6b20; font-size: 16px; margin-bottom: 10px;">🟡 Warm Leads</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f7fafc; font-size: 12px; color: #718096; text-transform: uppercase;">
            <th style="padding: 8px 10px; text-align: left;">Score</th>
            <th style="padding: 8px 10px; text-align: left;">Address / Permit</th>
            <th style="padding: 8px 10px; text-align: left;">Est. Cost</th>
            <th style="padding: 8px 10px; text-align: left;">Builder</th>
            <th style="padding: 8px 10px; text-align: left;">Description</th>
          </tr>
          ${warm.map(permitRow).join('')}
        </table>
      </div>
      ` : ''}

      <div style="background: #f7fafc; padding: 15px 30px; border-radius: 0 0 8px 8px; text-align: center; color: #a0aec0; font-size: 12px;">
        OpenSite Lead Finder — CTL Plumbing LLC
      </div>
    </body>
    </html>
  `;
}

module.exports = { sendDailyDigest };
