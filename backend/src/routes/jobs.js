// Job status polling routes for background tasks

import express from 'express';
import { jobQueue } from '../services/jobQueuePersistent.js';
import { db } from '../services/database.js';
import { tryCatch, parsePagination, paginationMeta } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import logger from '../services/logger.js';

const router = express.Router();

// Apply authentication to all job routes
router.use(authenticateToken);

/**
 * GET /api/jobs - List analysis jobs with filtering and pagination
 */
router.get('/', tryCatch(async (req, res) => {
  const { status, blueprintId } = req.query;
  const { page, limit, offset } = parsePagination(req.query);
  
  const jobs = await db.getAllAnalysisJobs({ 
    status, 
    blueprintId,
    limit, 
    offset 
  });
  
  // We don't have a count all for analysis_jobs yet in the service, 
  // but we can return the length for now or add it to service later.
  res.success({
    jobs,
    total: jobs.length // This is not accurate for total count across all pages, but matches the service output
  }, null, paginationMeta(page, limit, jobs.length));
}));

/**
 * GET /api/jobs/queue/stats - Get real-time queue statistics
 */
router.get('/queue/stats', tryCatch(async (req, res) => {
  const stats = jobQueue.getStats();
  res.success(stats);
}));

/**
 * GET /api/jobs/:jobId - Get job status (checks queue first, then database)
 */
router.get('/:jobId', tryCatch(async (req, res) => {
  const { jobId } = req.params;

  // 1. Try to get from active queue (short-term persistence)
  let job = jobQueue.getJobStatus(jobId);

  if (job) {
    return res.success(job);
  }

  // 2. Try to get from permanent analysis jobs table
  job = await db.getAnalysisJob(jobId);

  if (!job) {
    return res.error('Job not found', 'NOT_FOUND', { jobId }, 404);
  }

  res.success(job);
}));

/**
 * DELETE /api/jobs/:jobId - Cancel a pending job
 */
router.delete('/:jobId', tryCatch(async (req, res) => {
  const { jobId } = req.params;

  // Try to cancel in the active queue
  const cancelled = jobQueue.cancelJob(jobId);

  if (!cancelled) {
    // Check if it's in the database as pending and mark as cancelled there?
    // For now, only handle active queue cancellation
    return res.error(
      'Job cannot be cancelled (not found or already processing)',
      'CANCEL_FAILED',
      { jobId },
      400
    );
  }

  // Also update database if it exists there
  try {
    await db.updateAnalysisJob(jobId, { status: 'cancelled' });
  } catch (e) {
    // Ignore if not in db
  }

  logger.info('Job cancelled by user', { jobId, userId: req.user.id });
  res.success({ jobId, status: 'cancelled' }, 'Job cancelled successfully');
}));

/**
 * POST /api/jobs/cleanup - Cleanup old jobs (Admin only)
 */
router.post('/cleanup', tryCatch(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.error('Unauthorized', 'FORBIDDEN', null, 403);
  }

  const { days = 7 } = req.body;
  const count = await db.cleanupAnalysisJobs(days);
  
  res.success({ deletedCount: count }, `Cleaned up ${count} jobs older than ${days} days`);
}));

export default router;
