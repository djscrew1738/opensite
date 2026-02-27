/**
 * Monitoring Service
 * Tracks orphaned files and deletion failures for alerting
 */

import { db } from './database.js';
import logger from './logger.js';

/**
 * Get orphaned files count and details
 * @returns {Promise<{count: number, files: Array}>}
 */
export async function getOrphanedFiles() {
  try {
    const files = db.prepare(`
      SELECT 
        id, 
        originalName, 
        stored_path, 
        orphaned_reason, 
        created_at,
        julianday('now') - julianday(created_at) as days_orphaned
      FROM files 
      WHERE orphaned = 1
      ORDER BY created_at DESC
    `).all();

    return {
      count: files.length,
      files: files.map(f => ({
        ...f,
        daysOrphaned: Math.round(f.days_orphaned * 10) / 10
      }))
    };
  } catch (err) {
    logger.error('[monitoring] Failed to get orphaned files:', err.message);
    throw err;
  }
}

/**
 * Get storage statistics per user
 * @returns {Promise<Array>}
 */
export async function getStorageStats() {
  try {
    const stats = db.prepare(`
      SELECT 
        uploaded_by as userId,
        COUNT(*) as fileCount,
        COALESCE(SUM(size_bytes), 0) as totalBytes,
        MAX(created_at) as lastUpload
      FROM files 
      WHERE uploaded_by IS NOT NULL
      GROUP BY uploaded_by
      ORDER BY totalBytes DESC
    `).all();

    const MAX_QUOTA = 1024 * 1024 * 1024; // 1GB

    return stats.map(s => ({
      userId: s.userId,
      fileCount: s.fileCount,
      totalBytes: s.totalBytes,
      totalMB: Math.round(s.totalBytes / (1024 * 1024) * 100) / 100,
      quotaUsedPercent: Math.round(s.totalBytes / MAX_QUOTA * 1000) / 10,
      overQuota: s.totalBytes > MAX_QUOTA,
      lastUpload: s.lastUpload
    }));
  } catch (err) {
    logger.error('[monitoring] Failed to get storage stats:', err.message);
    throw err;
  }
}

/**
 * Get cleanup job statistics
 * @returns {Promise<object>}
 */
export async function getCleanupStats() {
  try {
    const job = db.prepare(`
      SELECT 
        job_name,
        last_run,
        items_cleaned,
        errors
      FROM cleanup_jobs
      WHERE job_name = 'expired_anonymous_uploads'
    `).get();

    if (!job) {
      return {
        enabled: false,
        message: 'Cleanup job not initialized'
      };
    }

    const pendingOrphaned = db.prepare(`
      SELECT COUNT(*) as count FROM files WHERE orphaned = 1
    `).get();

    const pendingExpired = db.prepare(`
      SELECT COUNT(*) as count FROM files 
      WHERE expires_at < datetime('now') AND uploaded_by IS NULL
    `).get();

    return {
      enabled: true,
      lastRun: job.last_run,
      totalCleaned: job.items_cleaned,
      hasErrors: !!job.errors,
      recentErrors: job.errors ? JSON.parse(job.errors).slice(-5) : [],
      pendingOrphaned: pendingOrphaned.count,
      pendingExpired: pendingExpired.count
    };
  } catch (err) {
    logger.error('[monitoring] Failed to get cleanup stats:', err.message);
    throw err;
  }
}

/**
 * Health check for file system
 * @returns {Promise<{healthy: boolean, issues: string[]}>}
 */
export async function healthCheck() {
  const issues = [];

  try {
    // Check for orphaned files
    const orphaned = await getOrphanedFiles();
    if (orphaned.count > 10) {
      issues.push(`High number of orphaned files: ${orphaned.count}`);
    }

    // Check for users over quota
    const stats = await getStorageStats();
    const overQuotaUsers = stats.filter(s => s.overQuota);
    if (overQuotaUsers.length > 0) {
      issues.push(`${overQuotaUsers.length} users over storage quota`);
    }

    // Check cleanup job health
    const cleanup = await getCleanupStats();
    if (cleanup.enabled && cleanup.hasErrors) {
      issues.push('Cleanup job has recent errors');
    }
    if (cleanup.enabled && cleanup.pendingExpired > 100) {
      issues.push(`Backlog of ${cleanup.pendingExpired} expired files`);
    }

    return {
      healthy: issues.length === 0,
      issues,
      details: {
        orphanedFiles: orphaned.count,
        overQuotaUsers: overQuotaUsers.length,
        pendingExpired: cleanup.pendingExpired || 0
      }
    };

  } catch (err) {
    logger.error('[monitoring] Health check failed:', err.message);
    return {
      healthy: false,
      issues: [`Health check error: ${err.message}`]
    };
  }
}

/**
 * Send alert for critical issues (placeholder - integrate with notification service)
 * @param {string} message - Alert message
 * @param {object} details - Additional details
 */
export async function sendAlert(message, details = {}) {
  logger.error('[ALERT]', { message, ...details });
  
  // TODO: Integrate with notification service (email, Slack, etc.)
  // Example:
  // await notificationService.send({
  //   type: 'critical',
  //   message,
  //   details
  // });
}

/**
 * Run periodic monitoring checks
 */
export async function runMonitoringChecks() {
  const health = await healthCheck();
  
  if (!health.healthy) {
    for (const issue of health.issues) {
      await sendAlert(issue, health.details);
    }
  }

  logger.info('[monitoring] Periodic check completed', { healthy: health.healthy });
  return health;
}

/**
 * Schedule monitoring checks
 * @param {number} intervalMs - Check interval in milliseconds (default: 1 hour)
 */
export function scheduleMonitoring(intervalMs = 60 * 60 * 1000) {
  logger.info(`[monitoring] Scheduling checks every ${intervalMs}ms`);
  
  // Run immediately
  runMonitoringChecks().catch(err => {
    logger.error('[monitoring] Initial check failed:', err.message);
  });

  // Schedule recurring checks
  const intervalId = setInterval(() => {
    runMonitoringChecks().catch(err => {
      logger.error('[monitoring] Scheduled check failed:', err.message);
    });
  }, intervalMs);

  return intervalId;
}
