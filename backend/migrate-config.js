// migrate-config.js
// Configuration for node-pg-migrate

import 'dotenv/config';

export default {
  databaseUrl: process.env.DATABASE_URL,
  migrationsTable: 'pgmigrations',
  dir: 'migrations',
  direction: 'up',
  count: Infinity,
  // This is important for ESM
  esm: true,
};
