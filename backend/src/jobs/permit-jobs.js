import cron from 'node-cron';
import { db } from '../services/database.js';
import { runIngestion } from '../services/permits/ingestion.js';
import { scoreAllUnscored } from '../services/permits/scoring.js';
import { runBuilderRollup } from '../services/permits/intelligence.js';
import { sendLeadAlert, sendDailyDigest } from '../services/permits/notifications.js';
import { checkEmails } from '../services/email-monitor.js';

// Simple console logger
const logger = {
  info: (msg) => console.log(`[permit-jobs] ${msg}`),
  warn: (msg) => console.warn(`[permit-jobs] ${msg}`),
  error: (msg) => console.error(`[permit-jobs] ${msg}`),
  debug: (msg) => console.log(`[permit-jobs] DEBUG: ${msg}`)
};

let isRunning = false;

/**
 * Initialize and start all permit-related cron jobs
 */
export function startPermitJobs() {
  if (isRunning) {
    logger.warn('Permit jobs already running');
    return;
  }

  logger.info('Initializing permit cron jobs...');

  // Get cron schedules from environment or use defaults
  const ingestSchedule = process.env.PERMIT_INGEST_CRON || '0 6 * * *';      // 6:00 AM daily
  const scoreSchedule = process.env.PERMIT_SCORING_CRON || '5 6 * * *';      // 6:05 AM daily
  const alertsSchedule = process.env.PERMIT_ALERTS_CRON || '10 6 * * *';     // 6:10 AM daily
  const digestSchedule = process.env.PERMIT_DIGEST_CRON || '0 8 * * *';      // 8:00 AM daily
  const rollupSchedule = process.env.PERMIT_ROLLUP_CRON || '0 2 * * 0';      // 2:00 AM Sunday

  // Job 1: Ingest permits from all active sources
  cron.schedule(ingestSchedule, async () => {
    logger.info('Starting scheduled permit ingestion...');
    try {
      const stats = await runIngestion(db, logger, { daysBack: 1 });
      logger.info(`Ingestion complete: ${stats.newPermits} new, ${stats.errors} errors`);
    } catch (err) {
      logger.error(`Ingestion job failed: ${err.message}`);
    }
  }, {
    timezone: 'America/Chicago' // Central Time
  });
  logger.info(`📅 Permit ingestion scheduled: ${ingestSchedule} CT`);

  // Job 2: Score all unscored permits
  cron.schedule(scoreSchedule, async () => {
    logger.info('Starting scheduled permit scoring...');
    try {
      const config = {
        ollamaUrl: process.env.OLLAMA_URL,
        ollamaModel: process.env.OLLAMA_MODEL,
        hotThreshold: parseInt(process.env.HOT_SCORE_THRESHOLD || '80'),
        warmThreshold: parseInt(process.env.WARM_SCORE_THRESHOLD || '50'),
        minProjectCost: parseInt(process.env.MIN_PROJECT_COST || '50000')
      };
      const stats = await scoreAllUnscored(db, logger, config);
      logger.info(`Scoring complete: ${stats.totalScored} scored, ${stats.totalHot} hot`);
    } catch (err) {
      logger.error(`Scoring job failed: ${err.message}`);
    }
  }, {
    timezone: 'America/Chicago'
  });
  logger.info(`📊 Permit scoring scheduled: ${scoreSchedule} CT`);

  // Job 3: Send SMS alerts for new hot leads
  cron.schedule(alertsSchedule, async () => {
    logger.info('Checking for new hot leads to alert...');
    try {
      // Get hot leads created today that haven't been notified via SMS
      const today = new Date().toISOString().split('T')[0];
      const hotLeads = db.db.prepare(`
        SELECT p.*
        FROM permits p
        WHERE p.leadTier = 'hot'
          AND DATE(p.createdAt) = ?
          AND NOT EXISTS (
            SELECT 1 FROM permit_notifications pn
            WHERE pn.permitId = p.id AND pn.channel = 'sms' AND pn.status = 'sent'
          )
        ORDER BY p.leadScore DESC
        LIMIT 10
      `).all(today);

      for (const lead of hotLeads) {
        await sendLeadAlert(lead, db, logger);
        // Small delay between messages
        await new Promise(r => setTimeout(r, 1000));
      }

      logger.info(`Sent alerts for ${hotLeads.length} hot leads`);
    } catch (err) {
      logger.error(`Alerts job failed: ${err.message}`);
    }
  }, {
    timezone: 'America/Chicago'
  });
  logger.info(`🔔 SMS alerts scheduled: ${alertsSchedule} CT`);

  // Job 4: Send daily email digest
  cron.schedule(digestSchedule, async () => {
    logger.info('Sending daily email digest...');
    try {
      await sendDailyDigest(db, logger);
    } catch (err) {
      logger.error(`Digest job failed: ${err.message}`);
    }
  }, {
    timezone: 'America/Chicago'
  });
  logger.info(`📧 Email digest scheduled: ${digestSchedule} CT`);

  // Job 5: Builder intelligence rollup (weekly)
  cron.schedule(rollupSchedule, async () => {
    logger.info('Starting weekly builder intelligence rollup...');
    try {
      const stats = await runBuilderRollup(db, logger);
      logger.info(`Rollup complete: ${stats.totalBuilders} builders processed`);
    } catch (err) {
      logger.error(`Rollup job failed: ${err.message}`);
    }
  }, {
    timezone: 'America/Chicago'
  });
  logger.info(`🏗️  Builder rollup scheduled: ${rollupSchedule} CT`);

  // Job 6: Email monitor — check inbox for keyword-matched emails every 10 min
  const emailMonitorSchedule = process.env.EMAIL_MONITOR_CRON || '*/10 * * * *';
  cron.schedule(emailMonitorSchedule, async () => {
    logger.info('Running email monitor check...');
    try {
      const result = await checkEmails();
      if (result.matched > 0) {
        logger.info(`Email monitor: ${result.matched} keyword matches, ${result.smsSent} SMS sent`);
      } else if (!result.disabled && !result.skipped && !result.error) {
        logger.debug('Email monitor: no keyword matches');
      }
    } catch (err) {
      logger.error(`Email monitor job failed: ${err.message}`);
    }
  }, {
    timezone: 'America/Chicago'
  });
  logger.info(`📧 Email monitor scheduled: ${emailMonitorSchedule} CT`);

  isRunning = true;
  logger.info('✅ All permit jobs initialized and running');
}

/**
 * Stop all permit jobs (for graceful shutdown)
 */
export function stopPermitJobs() {
  logger.info('Stopping permit jobs...');
  isRunning = false;
}

/**
 * Manual execution functions (for CLI overrides)
 */
export async function manualIngest(daysBack = 7) {
  logger.info(`Manual ingestion requested (${daysBack} days back)...`);
  const stats = await runIngestion(db, logger, { daysBack });
  logger.info(`Manual ingestion complete: ${stats.newPermits} new, ${stats.errors} errors`);
  return stats;
}

export async function manualScore() {
  logger.info('Manual scoring requested...');
  const config = {
    ollamaUrl: process.env.OLLAMA_URL,
    ollamaModel: process.env.OLLAMA_MODEL,
    hotThreshold: parseInt(process.env.HOT_SCORE_THRESHOLD || '80'),
    warmThreshold: parseInt(process.env.WARM_SCORE_THRESHOLD || '50'),
    minProjectCost: parseInt(process.env.MIN_PROJECT_COST || '50000')
  };
  const stats = await scoreAllUnscored(db, logger, config);
  logger.info(`Manual scoring complete: ${stats.totalScored} scored, ${stats.totalHot} hot`);
  return stats;
}

export async function manualDigest() {
  logger.info('Manual digest send requested...');
  await sendDailyDigest(db, logger);
  logger.info('Manual digest sent');
}

export async function manualEmailCheck() {
  logger.info('Manual email check requested...');
  const result = await checkEmails();
  logger.info(`Manual email check complete: ${JSON.stringify(result)}`);
  return result;
}

export async function manualRollup() {
  logger.info('Manual builder rollup requested...');
  const stats = await runBuilderRollup(db, logger);
  logger.info(`Manual rollup complete: ${stats.totalBuilders} builders processed`);
  return stats;
}
