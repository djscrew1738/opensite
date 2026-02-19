#!/usr/bin/env node
/**
 * OpenSite Lead Finder — Main Entry Point
 *
 * Orchestrates the full pipeline:
 *   1. Scheduled permit ingestion from all active sources
 *   2. AI scoring of new permits via Ollama
 *   3. Hot lead notifications via SMS
 *   4. Daily email digest
 *   5. Weekly builder intelligence rollup
 *   6. REST API for dashboard consumption
 *
 * Usage:
 *   node src/index.js              Start scheduler + API server
 *   node src/index.js --run-now    Run ingestion immediately then start scheduler
 *   node src/index.js --ingest     Run ingestion only (no scheduler)
 *   node src/index.js --score      Run scoring only
 *   node src/index.js --rollup     Run builder rollup only
 *   node src/index.js --digest     Send daily digest only
 *   node src/index.js --api-only   Start API server only
 */

const cron = require('node-cron');
const config = require('./config');
const logger = require('./utils/logger');
const { runIngestion } = require('./jobs/ingest');
const { scoreAllUnscored } = require('./scoring/ollama');
const { runBuilderRollup } = require('./builders/intelligence');
const { dispatchHotLeadAlerts } = require('./notifications/dispatcher');
const { sendDailyDigest } = require('./notifications/email');
const { sendDailySummary } = require('./notifications/sms');
const { startServer } = require('./api/server');
const db = require('./db');

// ── Full pipeline: ingest → score → notify ──
async function runFullPipeline(daysBack = 7) {
  logger.info('=== Starting full lead pipeline ===');
  const pipelineStart = Date.now();

  try {
    // Step 1: Ingest permits from all sources
    const ingestStats = await runIngestion({ daysBack });

    // Step 2: Score new permits with AI
    const scoreStats = await scoreAllUnscored();

    // Step 3: Send SMS alerts for hot leads
    const alertsSent = await dispatchHotLeadAlerts();

    const elapsed = ((Date.now() - pipelineStart) / 1000).toFixed(1);
    logger.info(
      `=== Pipeline complete in ${elapsed}s: ` +
      `${ingestStats.newPermits} new permits, ` +
      `${scoreStats.totalHot} hot leads, ` +
      `${alertsSent} alerts sent ===`
    );

    return { ingestStats, scoreStats, alertsSent };

  } catch (err) {
    logger.error(`Pipeline failed: ${err.message}`, err);
    throw err;
  }
}

// ── Schedule all jobs ──
function startScheduler() {
  logger.info('Starting job scheduler...');

  // Daily ingestion + scoring + alerts (default: 6 AM)
  cron.schedule(config.schedule.ingest, async () => {
    logger.info('[CRON] Running daily ingestion pipeline');
    try {
      await runFullPipeline(1); // Just yesterday's permits for daily runs
    } catch (err) {
      logger.error(`[CRON] Daily pipeline failed: ${err.message}`);
    }
  }, { timezone: 'America/Chicago' });

  // Daily email digest (default: 8 AM)
  cron.schedule(config.schedule.digest, async () => {
    logger.info('[CRON] Sending daily digest');
    try {
      await sendDailyDigest();
    } catch (err) {
      logger.error(`[CRON] Digest failed: ${err.message}`);
    }
  }, { timezone: 'America/Chicago' });

  // Weekly builder rollup (default: Sunday 2 AM)
  cron.schedule(config.schedule.rollup, async () => {
    logger.info('[CRON] Running builder intelligence rollup');
    try {
      await runBuilderRollup();
    } catch (err) {
      logger.error(`[CRON] Builder rollup failed: ${err.message}`);
    }
  }, { timezone: 'America/Chicago' });

  logger.info(`Scheduled: Ingestion at ${config.schedule.ingest}`);
  logger.info(`Scheduled: Digest at ${config.schedule.digest}`);
  logger.info(`Scheduled: Builder rollup at ${config.schedule.rollup}`);
}

// ── CLI entry point ──
async function main() {
  const args = process.argv.slice(2);

  logger.info('OpenSite Lead Finder v2.0.0');
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Verify database connection
  try {
    await db.query('SELECT 1');
    logger.info('Database connected');
  } catch (err) {
    logger.error(`Database connection failed: ${err.message}`);
    logger.error('Run: psql -f db/schema.sql to initialize the database');
    process.exit(1);
  }

  // Handle CLI modes
  if (args.includes('--ingest')) {
    const daysBack = parseInt(args[args.indexOf('--days') + 1]) || 7;
    await runIngestion({ daysBack });
    process.exit(0);
  }

  if (args.includes('--score')) {
    await scoreAllUnscored();
    process.exit(0);
  }

  if (args.includes('--rollup')) {
    await runBuilderRollup();
    process.exit(0);
  }

  if (args.includes('--digest')) {
    await sendDailyDigest();
    process.exit(0);
  }

  if (args.includes('--api-only')) {
    await startServer();
    return;
  }

  // Default: start everything
  if (args.includes('--run-now')) {
    const daysBack = parseInt(args[args.indexOf('--days') + 1]) || 7;
    logger.info(`Running immediate ingestion (${daysBack} days back)...`);
    await runFullPipeline(daysBack);
  }

  // Start API server
  await startServer();

  // Start scheduler
  startScheduler();

  logger.info('Lead Finder is running. Press Ctrl+C to stop.');
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  await db.pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down...');
  await db.pool.end();
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection:', err);
});

main().catch((err) => {
  logger.error(`Fatal error: ${err.message}`, err);
  process.exit(1);
});
