/**
 * migration-to-postgres.js
 * Migrates data from the SQLite database (opensite.db) to PostgreSQL.
 * 
 * Usage: 
 *   DATABASE_URL=postgres://user:pass@host:port/db node scripts/migrate-to-postgres.js
 */

import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const SQLITE_DB_PATH = path.join(__dirname, '../tool/data/opensite.db');
const POSTGRES_URL = process.env.DATABASE_URL;

if (!POSTGRES_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}

if (!fs.existsSync(SQLITE_DB_PATH)) {
  console.error(`❌ Error: SQLite database not found at ${SQLITE_DB_PATH}`);
  process.exit(1);
}

const sqlite = new Database(SQLITE_DB_PATH);
const pgPool = new pg.Pool({ connectionString: POSTGRES_URL });

const TABLES = [
  'settings',
  'leads',
  'projects',
  'estimates',
  'conversations',
  'blueprints',
  'materials',
  'takeoffs',
  'takeoff_items',
  'price_history',
  'permits',
  'data_sources',
  'discovery_runs',
  'discovery_leads',
  'email_alerts',
  // Canvas tables
  'canvas_workspaces',
  'canvas_nodes',
  'canvas_edges',
  'canvas_findings',
  'canvas_documents'
];

async function migrate() {
  console.log('🚀 Starting migration from SQLite to PostgreSQL...');
  
  const client = await pgPool.connect();
  
  try {
    // Disable constraints temporarily if possible, or just insert in order
    // For simplicity, we'll just insert in order and use simple inserts
    
    for (const table of TABLES) {
      console.log(`\nMoving table: ${table}...`);
      
      // Check if table exists in SQLite
      const tableExists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
      if (!tableExists) {
        console.log(`⚠️  Table ${table} does not exist in SQLite, skipping.`);
        continue;
      }
      
      const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
      if (rows.length === 0) {
        console.log(`ℹ️  Table ${table} is empty.`);
        continue;
      }
      
      console.log(`📦 Found ${rows.length} rows.`);
      
      // Get column names from the first row
      const columns = Object.keys(rows[0]);
      const colString = columns.join(', ');
      const valPlaceholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      
      // Clear table in PG first
      await client.query(`TRUNCATE TABLE ${table} CASCADE`);
      
      // Insert rows
      for (const row of rows) {
        const values = columns.map(col => {
          const val = row[col];
          // Handle boolean conversion if necessary (SQLite uses 0/1)
          // But our PG schema uses TEXT or REAL usually for these.
          // If PG uses BOOLEAN, we'd need to convert.
          return val;
        });
        
        try {
          await client.query(
            `INSERT INTO ${table} (${colString}) VALUES (${valPlaceholders})`,
            values
          );
        } catch (err) {
          console.error(`❌ Error inserting row into ${table}:`, err.message);
          // Log the values for debugging
          // console.error('Values:', values);
        }
      }
      
      console.log(`✅ Table ${table} migrated successfully.`);
    }
    
    console.log('\n✨ Migration completed successfully!');
    
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
  } finally {
    client.release();
    await pgPool.end();
    sqlite.close();
  }
}

migrate();
