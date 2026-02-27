/**
 * Admin Maintenance API
 * Endpoints for monitoring, cleanup, and maintenance tasks
 */

import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import * as monitoring from '../services/monitoring.js';
import { cleanupExpiredUploads } from '../jobs/cleanup-expired-uploads.js';
import { db } from '../services/database.js';
import logger from '../services/logger.js';

const router = Router();

/**
 * GET /api/admin/maintenance/health
 * Get system health status
 */
router.get('/health', requireAdmin, async (req, res) => {
  try {
    const health = await monitoring.healthCheck();
    res.json({
      success: true,
      data: health
    });
  } catch (err) {
    logger.error('[admin-maintenance] Health check failed:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/admin/maintenance/orphaned-files
 * List orphaned files
 */
router.get('/orphaned-files', requireAdmin, async (req, res) => {
  try {
    const orphaned = await monitoring.getOrphanedFiles();
    res.json({
      success: true,
      data: orphaned
    });
  } catch (err) {
    logger.error('[admin-maintenance] Failed to get orphaned files:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/admin/maintenance/storage-stats
 * Get storage statistics per user
 */
router.get('/storage-stats', requireAdmin, async (req, res) => {
  try {
    const stats = await monitoring.getStorageStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    logger.error('[admin-maintenance] Failed to get storage stats:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/admin/maintenance/cleanup-stats
 * Get cleanup job statistics
 */
router.get('/cleanup-stats', requireAdmin, async (req, res) => {
  try {
    const stats = await monitoring.getCleanupStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    logger.error('[admin-maintenance] Failed to get cleanup stats:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/admin/maintenance/cleanup
 * Trigger manual cleanup of expired uploads
 */
router.post('/cleanup', requireAdmin, async (req, res) => {
  try {
    const result = await cleanupExpiredUploads();
    res.json({
      success: true,
      data: result,
      message: `Cleaned ${result.cleaned} expired uploads`
    });
  } catch (err) {
    logger.error('[admin-maintenance] Manual cleanup failed:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * DELETE /api/admin/maintenance/orphaned-files/:id
 * Remove orphaned file record (after manual cleanup)
 */
router.delete('/orphaned-files/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify file is actually orphaned
    const file = db.prepare('SELECT * FROM files WHERE id = ? AND orphaned = 1').get(id);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'Orphaned file not found'
      });
    }
    
    // Delete record
    db.prepare('DELETE FROM files WHERE id = ?').run(id);
    
    res.json({
      success: true,
      message: `Orphaned file ${id} removed from database`
    });
  } catch (err) {
    logger.error('[admin-maintenance] Failed to remove orphaned file:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/admin/maintenance/quota-violations
 * List users exceeding storage quota
 */
router.get('/quota-violations', requireAdmin, async (req, res) => {
  try {
    const stats = await monitoring.getStorageStats();
    const violations = stats.filter(s => s.overQuota);
    
    res.json({
      success: true,
      data: {
        count: violations.length,
        violations
      }
    });
  } catch (err) {
    logger.error('[admin-maintenance] Failed to get quota violations:', err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
