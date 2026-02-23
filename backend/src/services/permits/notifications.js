import twilio from 'twilio';
import nodemailer from 'nodemailer';

let twilioClient = null;
let emailTransporter = null;

/**
 * Initialize Twilio client (lazy load)
 */
function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (accountSid && authToken) {
      twilioClient = twilio(accountSid, authToken);
    }
  }
  return twilioClient;
}

/**
 * Initialize email transporter (lazy load)
 */
function getEmailTransporter() {
  if (!emailTransporter) {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (user && pass) {
      emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: parseInt(process.env.SMTP_PORT || '587') === 465,
        auth: { user, pass },
      });
    }
  }
  return emailTransporter;
}

/**
 * Send SMS notification for a hot lead
 */
export async function sendLeadAlert(permit, db, logger) {
  const enabled = process.env.PERMIT_NOTIFICATIONS_ENABLED === 'true';
  if (!enabled) {
    logger.debug('Permit notifications disabled');
    return null;
  }

  const client = getTwilioClient();
  const toPhone = process.env.NOTIFY_PHONE_NUMBER;
  const fromPhone = process.env.TWILIO_FROM_NUMBER;

  if (!client || !toPhone) {
    logger.warn('Twilio not configured. Skipping SMS notification.');
    return null;
  }

  const costStr = permit.estimatedCost
    ? `$${Number(permit.estimatedCost).toLocaleString()}`
    : 'N/A';

  const message = [
    `🔥 HOT LEAD (Score: ${permit.leadScore})`,
    ``,
    `${permit.permitType}`,
    `📍 ${permit.address}`,
    `💰 Est: ${costStr}`,
    permit.contractorName ? `🏗️ Builder: ${permit.contractorName}` : '',
    permit.units ? `🏠 Units: ${permit.units}` : '',
    ``,
    permit.description ? permit.description.substring(0, 100) : '',
    ``,
    `Permit #${permit.permitNumber}`,
  ].filter(Boolean).join('\n');

  try {
    const result = await client.messages.create({
      body: message,
      from: fromPhone,
      to: toPhone,
    });

    await db.createPermitNotification({
      permitId: permit.id,
      channel: 'sms',
      recipient: toPhone,
      message: message,
      status: 'sent',
      externalId: result.sid,
      sentAt: new Date().toISOString()
    });

    logger.info(`SMS sent for permit ${permit.permitNumber}: ${result.sid}`);
    return result.sid;

  } catch (err) {
    await db.createPermitNotification({
      permitId: permit.id,
      channel: 'sms',
      recipient: toPhone,
      message: message,
      status: 'failed',
      errorMessage: err.message
    });
    logger.error(`SMS failed for permit ${permit.permitNumber}: ${err.message}`);
    return null;
  }
}

/**
 * Send daily digest email with all new leads
 */
export async function sendDailyDigest(db, logger) {
  const enabled = process.env.PERMIT_NOTIFICATIONS_ENABLED === 'true';
  if (!enabled) {
    logger.debug('Permit notifications disabled');
    return;
  }

  const mailer = getEmailTransporter();
  const toEmail = process.env.NOTIFY_EMAIL;
  const fromEmail = process.env.SMTP_USER;

  if (!mailer || !toEmail) {
    logger.warn('Email not configured. Skipping daily digest.');
    return;
  }

  try {
    // Fetch today's new permits, scored
    const today = new Date().toISOString().split('T')[0];
    const permits = await db.all(`
      SELECT p.*
      FROM permits p
      WHERE DATE(p.createdAt) = ?
        AND p.tier != 'unscored'
      ORDER BY p.leadScore DESC
    `, [today]);

    if (permits.length === 0) {
      logger.info('No new permits today. Skipping digest.');
      return;
    }

    // Get builder info for each permit
    const permitsWithBuilders = [];
    for (const p of permits) {
      const builders = await db.getPermitBuilders(p.id);
      const contractor = builders.find(b => b.role === 'contractor');
      permitsWithBuilders.push({
        ...p,
        builderCompany: contractor?.company,
        activityTrend: contractor?.activityTrend,
        hasPlumber: contractor?.hasPlumber
      });
    }

    const hot = permitsWithBuilders.filter(p => p.tier === 'hot');
    const warm = permitsWithBuilders.filter(p => p.tier === 'warm');
    const cold = permitsWithBuilders.filter(p => p.tier === 'cold');

    // Build HTML email
    const html = buildDigestHTML(permitsWithBuilders, hot, warm, cold);

    await mailer.sendMail({
      from: `"Opensite Lead Finder" <${fromEmail}>`,
      to: toEmail,
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
    const cost = p.estimatedCost
      ? `$${Number(p.estimatedCost).toLocaleString()}`
      : '—';
    const tierColor = p.tier === 'hot' ? '#e53e3e' : p.tier === 'warm' ? '#dd6b20' : '#718096';
    const tierEmoji = p.tier === 'hot' ? '🔥' : p.tier === 'warm' ? '🟡' : '⚪';
    const plumberFlag = p.hasPlumber === false || p.hasPlumber === 0 ? ' ⚡ No plumber detected' : '';

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-size: 14px;">
          <span style="color: ${tierColor}; font-weight: bold;">${tierEmoji} ${p.leadScore}</span>
        </td>
        <td style="padding: 10px; font-size: 14px;">
          <strong>${p.address || 'N/A'}</strong><br>
          <span style="color: #718096; font-size: 12px;">${p.permitType} — ${p.permitNumber}</span>
        </td>
        <td style="padding: 10px; font-size: 14px;">${cost}</td>
        <td style="padding: 10px; font-size: 14px;">
          ${p.contractorName || p.builderCompany || '—'}
          ${p.activityTrend === 'ramping_up' ? '<br><span style="color: #38a169; font-size: 11px;">📈 Ramping up</span>' : ''}
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
        <h1 style="margin: 0; font-size: 22px;">🔍 Opensite Daily Lead Report</h1>
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
        Opensite Lead Finder — CTL Plumbing LLC
      </div>
    </body>
    </html>
  `;
}

/**
 * Send batch notification summary (SMS)
 */
export async function sendDailySummary(stats, db, logger) {
  const enabled = process.env.PERMIT_NOTIFICATIONS_ENABLED === 'true';
  if (!enabled) return;

  const client = getTwilioClient();
  const toPhone = process.env.NOTIFY_PHONE_NUMBER;
  const fromPhone = process.env.TWILIO_FROM_NUMBER;

  if (!client || !toPhone) return;

  const message = [
    `📊 Daily Lead Report`,
    ``,
    `New permits: ${stats.newPermits || 0}`,
    `Hot leads: ${stats.hotLeads || 0}`,
    `Warm leads: ${stats.warmLeads || 0}`,
    stats.topBuilder ? `Top builder: ${stats.topBuilder}` : '',
    ``,
    `Check dashboard for details.`,
  ].filter(Boolean).join('\n');

  try {
    await client.messages.create({
      body: message,
      from: fromPhone,
      to: toPhone,
    });
    logger.info('Daily summary SMS sent');
  } catch (err) {
    logger.error(`Daily summary SMS failed: ${err.message}`);
  }
}
