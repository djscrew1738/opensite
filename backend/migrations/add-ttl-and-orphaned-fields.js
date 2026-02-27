/**
 * Migration: Add TTL and orphaned file tracking fields
 * Date: 2026-02-27
 * 
 * Adds:
 * - files.expires_at: TTL for anonymous uploads
 * - files.orphaned: Flag for files marked as orphaned
 * - files.orphaned_reason: Reason why file was marked orphaned
 * - text_documents.expires_at: TTL for anonymous document uploads
 * 
 * Also creates index on files.expires_at for efficient cleanup queries
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../tool/data/opensite.db');

async function migrate() {
  console.log(`[migrate] Connecting to database: ${DB_PATH}`);
  const db = new Database(DB_PATH);

  try {
    db.exec('BEGIN TRANSACTION');

    // Check if columns already exist
    const filesColumns = db.prepare("PRAGMA table_info(files)").all();
    const docColumns = db.prepare("PRAGMA table_info(text_documents)").all();
    
    const filesColNames = filesColumns.map(c => c.name);
    const docColNames = docColumns.map(c => c.name);

    // Add expires_at to files table (for anonymous upload TTL)
    if (!filesColNames.includes('expires_at')) {
      console.log('[migrate] Adding expires_at column to files table');
      db.exec('ALTER TABLE files ADD COLUMN expires_at TEXT');
      db.exec('CREATE INDEX IF NOT EXISTS idx_files_expires_at ON files(expires_at)');
    } else {
      console.log('[migrate] expires_at column already exists in files table');
    }

    // Add orphaned flag and reason to files table
    if (!filesColNames.includes('orphaned')) {
      console.log('[migrate] Adding orphaned column to files table');
      db.exec('ALTER TABLE files ADD COLUMN orphaned INTEGER DEFAULT 0');
      db.exec('CREATE INDEX IF NOT EXISTS idx_files_orphaned ON files(orphaned)');
    } else {
      console.log('[migrate] orphaned column already exists in files table');
    }

    if (!filesColNames.includes('orphaned_reason')) {
      console.log('[migrate] Adding orphaned_reason column to files table');
      db.exec('ALTER TABLE files ADD COLUMN orphaned_reason TEXT');
    } else {
      console.log('[migrate] orphaned_reason column already exists in files table');
    }

    // Add expires_at to text_documents table
    if (!docColNames.includes('expires_at')) {
      console.log('[migrate] Adding expires_at column to text_documents table');
      db.exec('ALTER TABLE text_documents ADD COLUMN expires_at TEXT');
      db.exec('CREATE INDEX IF NOT EXISTS idx_text_docs_expires_at ON text_documents(expires_at)');
    } else {
      console.log('[migrate] expires_at column already exists in text_documents table');
    }

    // Create cleanup function
    console.log('[migrate] Creating cleanup_expired_files function');
    db.exec(`
      CREATE TABLE IF NOT EXISTS cleanup_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_name TEXT UNIQUE NOT NULL,
        last_run TEXT,
        items_cleaned INTEGER DEFAULT 0,
        errors TEXT
      )
    `);

    db.exec(`
      INSERT OR IGNORE INTO cleanup_jobs (job_name) VALUES ('expired_anonymous_uploads')
    `);

    db.exec('COMMIT');
    console.log('[migrate] Migration completed successfully');

  } catch (err) {
    db.exec('ROLLBACK');
    console.error('[migrate] Migration failed:', err.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

migrate();
