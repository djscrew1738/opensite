const db = require('../db');
const logger = require('../utils/logger');

/**
 * Builder Intelligence Rollup
 *
 * Runs periodically (weekly by default) to update computed stats
 * on the builders table. This turns raw permit data into actionable
 * intelligence about who's building what, where, and how often.
 *
 * Key outputs:
 *   - Permit volume (total, 30d, 90d)
 *   - Average project cost
 *   - Primary zip codes and project types
 *   - Activity trend (ramping up, steady, slowing down)
 *   - Whether they have a plumber relationship
 */

async function runBuilderRollup() {
  const startTime = Date.now();
  logger.info('Starting builder intelligence rollup...');

  try {
    // ── Step 1: Update permit counts and averages ──
    await db.query(`
      UPDATE builders b SET
        total_permits = sub.total_permits,
        permits_last_30d = sub.permits_30d,
        permits_last_90d = sub.permits_90d,
        avg_project_cost = sub.avg_cost,
        first_permit_date = sub.first_permit,
        last_permit_date = sub.last_permit,
        updated_at = NOW()
      FROM (
        SELECT
          pbm.builder_id,
          COUNT(DISTINCT p.id) as total_permits,
          COUNT(DISTINCT p.id) FILTER (
            WHERE p.issued_date >= CURRENT_DATE - INTERVAL '30 days'
          ) as permits_30d,
          COUNT(DISTINCT p.id) FILTER (
            WHERE p.issued_date >= CURRENT_DATE - INTERVAL '90 days'
          ) as permits_90d,
          ROUND(AVG(p.estimated_cost) FILTER (WHERE p.estimated_cost > 0), 2) as avg_cost,
          MIN(p.issued_date) as first_permit,
          MAX(p.issued_date) as last_permit
        FROM permit_builder_map pbm
        JOIN permits p ON pbm.permit_id = p.id
        GROUP BY pbm.builder_id
      ) sub
      WHERE b.id = sub.builder_id
    `);

    logger.info('Updated permit counts and averages');

    // ── Step 2: Compute primary zip codes ──
    await db.query(`
      UPDATE builders b SET
        primary_zip_codes = sub.top_zips
      FROM (
        SELECT
          pbm.builder_id,
          ARRAY(
            SELECT p2.zip_code
            FROM permit_builder_map pbm2
            JOIN permits p2 ON pbm2.permit_id = p2.id
            WHERE pbm2.builder_id = pbm.builder_id
              AND p2.zip_code IS NOT NULL
            GROUP BY p2.zip_code
            ORDER BY COUNT(*) DESC
            LIMIT 5
          ) as top_zips
        FROM permit_builder_map pbm
        GROUP BY pbm.builder_id
      ) sub
      WHERE b.id = sub.builder_id
    `);

    logger.info('Updated primary zip codes');

    // ── Step 3: Compute project types ──
    await db.query(`
      UPDATE builders b SET
        project_types = sub.types
      FROM (
        SELECT
          pbm.builder_id,
          ARRAY(
            SELECT DISTINCT p2.occupancy_type
            FROM permit_builder_map pbm2
            JOIN permits p2 ON pbm2.permit_id = p2.id
            WHERE pbm2.builder_id = pbm.builder_id
              AND p2.occupancy_type IS NOT NULL
          ) as types
        FROM permit_builder_map pbm
        GROUP BY pbm.builder_id
      ) sub
      WHERE b.id = sub.builder_id
    `);

    logger.info('Updated project types');

    // ── Step 4: Compute activity trends ──
    // Compare last 30d vs previous 30d to detect trajectory
    await db.query(`
      UPDATE builders b SET
        activity_trend = CASE
          WHEN sub.permits_30d = 0 AND sub.permits_60_90d = 0 THEN 'inactive'
          WHEN sub.permits_30d > sub.permits_60_90d * 1.5 THEN 'ramping_up'
          WHEN sub.permits_30d < sub.permits_60_90d * 0.5 AND sub.permits_60_90d > 0 THEN 'slowing_down'
          ELSE 'steady'
        END
      FROM (
        SELECT
          pbm.builder_id,
          COUNT(DISTINCT p.id) FILTER (
            WHERE p.issued_date >= CURRENT_DATE - INTERVAL '30 days'
          ) as permits_30d,
          COUNT(DISTINCT p.id) FILTER (
            WHERE p.issued_date >= CURRENT_DATE - INTERVAL '90 days'
              AND p.issued_date < CURRENT_DATE - INTERVAL '30 days'
          ) as permits_60_90d
        FROM permit_builder_map pbm
        JOIN permits p ON pbm.permit_id = p.id
        GROUP BY pbm.builder_id
      ) sub
      WHERE b.id = sub.builder_id
    `);

    logger.info('Updated activity trends');

    // ── Step 5: Detect plumber relationships ──
    // If a builder has plumbing permits at the same addresses as their
    // building permits, and those plumbing permits have a different
    // contractor, that's likely their plumber.
    await db.query(`
      UPDATE builders b SET
        has_plumber = TRUE,
        known_plumber = sub.plumber_name,
        plumber_confidence = sub.confidence
      FROM (
        SELECT DISTINCT ON (build_pbm.builder_id)
          build_pbm.builder_id,
          plumb.contractor_name as plumber_name,
          -- Confidence based on how many address matches
          LEAST(1.0, match_count::numeric / 3.0) as confidence
        FROM permit_builder_map build_pbm
        JOIN permits build_p ON build_pbm.permit_id = build_p.id
        JOIN LATERAL (
          SELECT
            p.contractor_name,
            COUNT(*) as match_count
          FROM permits p
          WHERE p.permit_category = 'plumbing'
            AND p.address = build_p.address
            AND p.contractor_name IS NOT NULL
            AND p.contractor_name != build_p.contractor_name
          GROUP BY p.contractor_name
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) plumb ON TRUE
        WHERE build_p.permit_category = 'new_construction'
        ORDER BY build_pbm.builder_id, plumb.match_count DESC
      ) sub
      WHERE b.id = sub.builder_id
    `);

    logger.info('Updated plumber relationship detection');

    // ── Summary stats ──
    const summary = await db.query(`
      SELECT
        COUNT(*) as total_builders,
        COUNT(*) FILTER (WHERE activity_trend = 'ramping_up') as ramping_up,
        COUNT(*) FILTER (WHERE activity_trend = 'steady') as steady,
        COUNT(*) FILTER (WHERE activity_trend = 'slowing_down') as slowing_down,
        COUNT(*) FILTER (WHERE activity_trend = 'inactive') as inactive,
        COUNT(*) FILTER (WHERE has_plumber = FALSE AND permits_last_30d > 0) as no_plumber_active,
        COUNT(*) FILTER (WHERE relationship_status = 'unknown' AND permits_last_30d >= 2) as high_priority_prospects
      FROM builders
    `);

    const s = summary.rows[0];
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    logger.info(
      `Builder rollup complete in ${elapsed}s: ` +
      `${s.total_builders} total builders, ` +
      `${s.ramping_up} ramping up, ${s.steady} steady, ` +
      `${s.no_plumber_active} active without plumber, ` +
      `${s.high_priority_prospects} high-priority prospects`
    );

    return s;

  } catch (err) {
    logger.error(`Builder rollup failed: ${err.message}`, err);
    throw err;
  }
}

/**
 * Get top builder prospects — active builders without plumber relationships
 */
async function getTopProspects(limit = 20) {
  const result = await db.query(`
    SELECT
      b.*,
      ARRAY_AGG(DISTINCT p.address ORDER BY p.issued_date DESC) FILTER (
        WHERE p.issued_date >= CURRENT_DATE - INTERVAL '90 days'
      ) as recent_addresses,
      SUM(p.estimated_cost) FILTER (
        WHERE p.issued_date >= CURRENT_DATE - INTERVAL '90 days'
      ) as recent_total_value
    FROM builders b
    JOIN permit_builder_map pbm ON b.id = pbm.builder_id
    JOIN permits p ON pbm.permit_id = p.id
    WHERE b.relationship_status IN ('unknown', 'prospecting')
      AND b.has_plumber = FALSE
      AND b.permits_last_30d > 0
    GROUP BY b.id
    ORDER BY b.permits_last_30d DESC, b.avg_project_cost DESC
    LIMIT $1
  `, [limit]);

  return result.rows;
}

module.exports = { runBuilderRollup, getTopProspects };
