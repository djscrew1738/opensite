/**
 * Cleanup Job: Remove expired anonymous uploads
 * 
 * - Deletes files where expires_at < now AND uploaded_by IS NULL
 * - Marks orphaned files that failed deletion
 * - Updates cleanup_jobs table with statistics
 */

import fs from 'fs/promises';
import path from 'path';
import { db } from '../services/database.js';
import logger from '../services/logger.js';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './tool/data/uploads';

/**
 * Run the cleanup job
 * @returns {Promise<{cleaned: number, errors: string[]}>}
 */
export async function cleanupExpiredUploads() {
  const errors = [];
  let cleaned = 0;

  logger.info('[cleanup] Starting expired upload cleanup');

  try {
    // Find expired files
    const expiredFiles = db.prepare(`
      SELECT id, stored_path, originalName 
      FROM files 
      WHERE expires_at < datetime('now') 
        AND uploaded_by IS NULL
        AND orphaned = 0
    `).all();

    logger.info(`[cleanup] Found ${expiredFiles.length} expired anonymous uploads`);

    for (const file of expiredFiles) {
      try {
        // Attempt to delete physical file (async, non-blocking)
        try {
          await fs.unlink(file.stored_path);
          logger.debug(`[cleanup] Deleted file: ${file.stored_path}`);
        } catch (fsErr) {
          if (fsErr.code !== 'ENOENT') {
            throw fsErr; // Re-throw if not "file not found"
          }
          // File already deleted, that's fine
        }

        // Delete database record
        db.prepare('DELETE FROM files WHERE id = ?').run(file.id);
        cleaned++;

      } catch (err) {
        logger.error(`[cleanup] Failed to delete file ${file.id}:`, err.message);
        errors.push(`${file.id}: ${err.message}`);

        // Mark as orphaned for later cleanup
        try {
          db.prepare(`
            UPDATE files 
            SET orphaned = 1, orphaned_reason = ? 
            WHERE id = ?
          `).run(err.message, file.id);
        } catch (dbErr) {
          logger.error(`[cleanup] Failed to mark file as orphaned:`, dbErr.message);
        }
      }
    }

    // Also check text_documents table for expired anonymous uploads
    const expiredDocs = db.prepare(`
      SELECT id, filePath 
      FROM text_documents 
      WHERE expires_at < datetime('now') 
        AND userId IS NULL
    `).all();

    logger.info(`[cleanup] Found ${expiredDocs.length} expired anonymous documents`);

    for (const doc of expiredDocs) {
      try {
        // Delete physical file if exists
        if (doc.filePath) {
          try {
            await fs.unlink(doc.filePath);
          } catch (fsErr) {
            if (fsErr.code !== 'ENOENT') throw fsErr;
          }
        }

        // Delete database record
        db.prepare('DELETE FROM text_documents WHERE id = ?').run(doc.id);
        cleaned++;

      } catch (err) {
        logger.error(`[cleanup] Failed to delete document ${doc.id}:`, err.message);
        errors.push(`doc:${doc.id}: ${err.message}`);
      }
    }

    // Update cleanup_jobs statistics
    db.prepare(`
      UPDATE cleanup_jobs 
      SET last_run = datetime('now'), 
          items_cleaned = items_cleaned + ?,
          errors = ?
      WHERE job_name = 'expired_anonymous_uploads'
    `).run(cleaned, errors.length > 0 ? JSON.stringify(errors) : null);

    logger.info(`[cleanup] Completed. Cleaned: ${cleaned}, Errors: ${errors.length}`);

    return { cleaned, errors };

  } catch (err) {
    logger.error('[cleanup] Cleanup job failed:', err.message);
    throw err;
  }
}

/**
 * Schedule cleanup to run periodically
 * @param {number} intervalMs - Interval in milliseconds (default: 1 hour)
 */
export function scheduleCleanup(intervalMs = 60 * 60 * 1000) {
  logger.info(`[cleanup] Scheduling cleanup job every ${intervalMs}ms`);
  
  // Run immediately on startup
  cleanupExpiredUploads().catch(err => {
    logger.error('[cleanup] Initial cleanup failed:', err.message);
  });

  // Schedule recurring cleanup
  const intervalId = setInterval(() => {
    cleanupExpiredUploads().catch(err => {
      logger.error('[cleanup] Scheduled cleanup failed:', err.message);
    });
  }, intervalMs);

  return intervalId;
}

// Run if called directly (CLI usage)
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupExpiredUploads()
    .then(result => {
      console.log(`Cleanup completed: ${result.cleaned} items cleaned`);
      if (result.errors.length > 0) {
        console.error('Errors:', result.errors);
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(err => {
      console.error('Cleanup failed:', err.message);
      process.exit(1);
    });
}
