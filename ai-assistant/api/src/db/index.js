const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error:', err);
});

async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`[DB] ${text.substring(0, 50)}... — ${duration}ms, ${result.rowCount} rows`);
    return result;
  } catch (err) {
    console.error(`[DB] Query error: ${err.message}`);
    throw err;
  }
}

module.exports = { pool, query };
