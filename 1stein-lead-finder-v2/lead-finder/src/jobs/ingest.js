const db = require('../db');
const { createAdapter } = require('../adapters/registry');
const logger = require('../utils/logger');

/**
 * Main ingestion pipeline
 *
 * 1. Load all active data sources
 * 2. For each source, create the appropriate adapter
 * 3. Fetch and normalize permits
 * 4. Upsert into database with deduplication
 * 5. Link contractors/builders to builder profiles
 * 6. Report results
 */
async function runIngestion(options = {}) {
  const { daysBack = 7, sourceFilter = null } = options;

  const startTime = Date.now();
  const stats = {
    sources: 0,
    fetched: 0,
    newPermits: 0,
    updatedPermits: 0,
    buildersLinked: 0,
    errors: 0,
  };

  try {
    // 1. Load active sources
    let sources = await db.getActiveSources();

    if (sourceFilter) {
      sources = sources.filter(s => s.name === sourceFilter);
    }

    if (sources.length === 0) {
      logger.warn('No active data sources found');
      return stats;
    }

    logger.info(`Starting ingestion for ${sources.length} source(s), ${daysBack} days back`);

    // 2. Process each source
    for (const source of sources) {
      try {
        stats.sources++;
        const adapter = createAdapter(source);

        if (!adapter) {
          logger.warn(`Skipping source ${source.name}: no adapter available`);
          continue;
        }

        // 3. Fetch and normalize
        const permits = await adapter.run(daysBack);
        stats.fetched += permits.length;

        // 4. Upsert into database
        let sourceNew = 0;
        let sourceUpdated = 0;

        for (const permit of permits) {
          try {
            const { id: permitId, isNew } = await db.upsertPermit(permit);

            if (isNew) {
              sourceNew++;
              stats.newPermits++;
            } else {
              sourceUpdated++;
              stats.updatedPermits++;
            }

            // 5. Link builders
            if (permit.contractor_name) {
              const builderId = await db.findOrCreateBuilder(
                permit.contractor_name,
                permit.contractor_name
              );
              if (builderId) {
                await db.linkPermitBuilder(permitId, builderId, 'contractor');
                stats.buildersLinked++;
              }
            }

            if (permit.applicant_name && permit.applicant_name !== permit.contractor_name) {
              const builderId = await db.findOrCreateBuilder(
                permit.applicant_name,
                null
              );
              if (builderId) {
                await db.linkPermitBuilder(permitId, builderId, 'applicant');
                stats.buildersLinked++;
              }
            }

          } catch (err) {
            stats.errors++;
            logger.error(`Failed to upsert permit ${permit.permit_number}: ${err.message}`);
          }
        }

        // Update source fetch status
        await db.updateSourceFetchStatus(source.id, permits.length);

        logger.info(`[${source.name}] Complete: ${sourceNew} new, ${sourceUpdated} updated`);

      } catch (err) {
        stats.errors++;
        await db.updateSourceFetchStatus(source.id, 0, err);
        logger.error(`[${source.name}] Ingestion failed: ${err.message}`);
      }
    }

  } catch (err) {
    logger.error(`Ingestion pipeline error: ${err.message}`, err);
    stats.errors++;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info(
    `Ingestion complete in ${elapsed}s: ` +
    `${stats.fetched} fetched, ${stats.newPermits} new, ` +
    `${stats.updatedPermits} updated, ${stats.buildersLinked} builder links, ` +
    `${stats.errors} errors`
  );

  return stats;
}

module.exports = { runIngestion };
