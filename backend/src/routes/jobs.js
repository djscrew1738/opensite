// Job status polling routes for background tasks

import express from 'express';
import { jobQueue } from '../services/jobQueue.js';
import { tryCatch } from '../utils/response.js';

const router = express.Router();

/**
 * Get job status
 * @route GET /api/jobs/:jobId
 */
router.get('/:jobId', tryCatch(async (req, res) => {
  const { jobId } = req.params;

  const job = jobQueue.getJobStatus(jobId);

  if (!job) {
    return res.error('Job not found', 'NOT_FOUND', { jobId }, 404);
  }

  res.success(job);
}));

/**
 * Get queue statistics
 * @route GET /api/jobs/queue/stats
 */
router.get('/queue/stats', tryCatch(async (req, res) => {
  const stats = jobQueue.getStats();
  res.success(stats);
}));

/**
 * Cancel a pending job
 * @route DELETE /api/jobs/:jobId
 */
router.delete('/:jobId', tryCatch(async (req, res) => {
  const { jobId } = req.params;

  const cancelled = jobQueue.cancelJob(jobId);

  if (!cancelled) {
    return res.error(
      'Job cannot be cancelled (not found or already processing)',
      'CANCEL_FAILED',
      { jobId },
      400
    );
  }

  res.success({ jobId, status: 'cancelled' }, 'Job cancelled successfully');
}));

export default router;
