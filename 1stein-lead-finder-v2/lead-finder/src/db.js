const { Pool } = require('pg');
const config = require('./config');
const logger = require('./utils/logger');

const pool = new Pool(
  config.db.connectionString
    ? { connectionString: config.db.connectionString }
    : {
        host: config.db.host,
        port: config.db.port,
        database: config.db.database,
        user: config.db.user,
        password: config.db.password,
      }
);

pool.on('error', (err) => {
  logger.error('Unexpected database pool error', err);
});

/**
 * Execute a query with parameters
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 1000) {
    logger.warn(`Slow query (${duration}ms): ${text.substring(0, 100)}`);
  }
  return result;
}

/**
 * Get a client for transaction support
 */
async function getClient() {
  return pool.connect();
}

/**
 * Run a function inside a transaction
 */
async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get all active data sources
 */
async function getActiveSources() {
  const result = await query(
    'SELECT * FROM data_sources WHERE is_active = TRUE ORDER BY name'
  );
  return result.rows;
}

/**
 * Upsert a normalized permit record. Returns { id, isNew }
 */
async function upsertPermit(permit) {
  const result = await query(
    `INSERT INTO permits (
      source_id, source_permit_id, permit_number, issued_date, applied_date,
      permit_type, permit_category, description, address, city, zip_code, county,
      contractor_name, contractor_license, applicant_name, owner_name,
      estimated_cost, square_footage, stories, units, work_type, occupancy_type,
      latitude, longitude, location, raw_data, fingerprint
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10, $11, $12,
      $13, $14, $15, $16,
      $17, $18, $19, $20, $21, $22,
      $23, $24,
      CASE WHEN $23 IS NOT NULL AND $24 IS NOT NULL
        THEN ST_SetSRID(ST_MakePoint($24::float, $23::float), 4326)::geography
        ELSE NULL END,
      $25, $26
    )
    ON CONFLICT (source_id, source_permit_id) DO UPDATE SET
      permit_number = EXCLUDED.permit_number,
      issued_date = EXCLUDED.issued_date,
      permit_type = EXCLUDED.permit_type,
      permit_category = EXCLUDED.permit_category,
      description = EXCLUDED.description,
      estimated_cost = EXCLUDED.estimated_cost,
      square_footage = EXCLUDED.square_footage,
      raw_data = EXCLUDED.raw_data,
      updated_at = NOW()
    RETURNING id, (xmax = 0) as is_new`,
    [
      permit.source_id, permit.source_permit_id, permit.permit_number,
      permit.issued_date, permit.applied_date,
      permit.permit_type, permit.permit_category, permit.description,
      permit.address, permit.city, permit.zip_code, permit.county,
      permit.contractor_name, permit.contractor_license,
      permit.applicant_name, permit.owner_name,
      permit.estimated_cost, permit.square_footage, permit.stories, permit.units,
      permit.work_type, permit.occupancy_type,
      permit.latitude, permit.longitude,
      permit.raw_data, permit.fingerprint,
    ]
  );
  return { id: result.rows[0].id, isNew: result.rows[0].is_new };
}

/**
 * Find or create a builder by normalized name
 */
async function findOrCreateBuilder(name, company) {
  const normalized = (company || name || '').toLowerCase().trim().replace(/\s+/g, ' ');
  if (!normalized) return null;

  const existing = await query(
    'SELECT id FROM builders WHERE normalized_name = $1',
    [normalized]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const result = await query(
    `INSERT INTO builders (name, company, normalized_name)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [name, company, normalized]
  );

  if (result.rows.length > 0) {
    return result.rows[0].id;
  }

  // Race condition fallback
  const retry = await query(
    'SELECT id FROM builders WHERE normalized_name = $1',
    [normalized]
  );
  return retry.rows[0]?.id || null;
}

/**
 * Link a permit to a builder
 */
async function linkPermitBuilder(permitId, builderId, role) {
  await query(
    `INSERT INTO permit_builder_map (permit_id, builder_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [permitId, builderId, role]
  );
}

/**
 * Update data source fetch timestamp
 */
async function updateSourceFetchStatus(sourceId, count, error = null) {
  if (error) {
    await query(
      `UPDATE data_sources SET fetch_errors = fetch_errors + 1, updated_at = NOW() WHERE id = $1`,
      [sourceId]
    );
  } else {
    await query(
      `UPDATE data_sources SET last_fetch_at = NOW(), last_fetch_count = $2, fetch_errors = 0, updated_at = NOW() WHERE id = $1`,
      [sourceId, count]
    );
  }
}

/**
 * Get unscored permits for AI processing
 */
async function getUnscoredPermits(limit = 50) {
  const result = await query(
    `SELECT * FROM permits WHERE lead_tier = 'unscored' ORDER BY issued_date DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

/**
 * Update permit with AI score
 */
async function updatePermitScore(permitId, score, tier, classification) {
  await query(
    `UPDATE permits SET
      lead_score = $2, lead_tier = $3, ai_classification = $4, ai_scored_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [permitId, score, tier, classification]
  );
}

/**
 * Log a notification
 */
async function logNotification(permitId, channel, recipient, message, status, externalId = null) {
  await query(
    `INSERT INTO notifications (permit_id, channel, recipient, message, status, external_id, sent_at)
     VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $5 = 'sent' THEN NOW() ELSE NULL END)`,
    [permitId, channel, recipient, message, status, externalId]
  );
}

module.exports = {
  query,
  getClient,
  transaction,
  getActiveSources,
  upsertPermit,
  findOrCreateBuilder,
  linkPermitBuilder,
  updateSourceFetchStatus,
  getUnscoredPermits,
  updatePermitScore,
  logNotification,
  pool,
};
