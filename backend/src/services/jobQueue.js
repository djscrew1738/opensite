// Background Job Queue Service
// Handles long-running tasks without blocking API responses

import { EventEmitter } from 'events';
import logger from './logger.js';
import { cache } from './cache.js';

class JobQueue extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map();
    this.processing = new Set();
    this.maxConcurrent = 3; // Max concurrent jobs
    this.jobId = 0;
  }

  /**
   * Add job to queue
   * @param {string} type - Job type
   * @param {object} data - Job data
   * @param {Function} handler - Job handler function
   * @returns {string} Job ID
   */
  async addJob(type, data, handler) {
    const jobId = `job-${++this.jobId}-${Date.now()}`;

    const job = {
      id: jobId,
      type,
      data,
      handler,
      status: 'pending',
      progress: 0,
      result: null,
      error: null,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null
    };

    this.jobs.set(jobId, job);

    // Store in cache for retrieval
    cache.set(`job:${jobId}`, job, 3600); // 1 hour TTL

    logger.info('Job added to queue', { jobId, type });

    // Start processing
    this.processNext();

    return jobId;
  }

  /**
   * Process next job in queue
   */
  async processNext() {
    // Check if we can process more
    if (this.processing.size >= this.maxConcurrent) {
      return;
    }

    // Find next pending job
    const nextJob = Array.from(this.jobs.values())
      .find(job => job.status === 'pending');

    if (!nextJob) {
      return;
    }

    // Mark as processing
    nextJob.status = 'processing';
    nextJob.startedAt = new Date();
    this.processing.add(nextJob.id);

    cache.set(`job:${nextJob.id}`, nextJob, 3600);

    logger.info('Job started', { jobId: nextJob.id, type: nextJob.type });

    try {
      // Execute handler
      const result = await nextJob.handler(nextJob.data, (progress) => {
        nextJob.progress = progress;
        cache.set(`job:${nextJob.id}`, nextJob, 3600);
        this.emit('progress', nextJob.id, progress);
      });

      // Mark as completed
      nextJob.status = 'completed';
      nextJob.result = result;
      nextJob.progress = 100;
      nextJob.completedAt = new Date();

      cache.set(`job:${nextJob.id}`, nextJob, 3600);

      logger.info('Job completed', {
        jobId: nextJob.id,
        duration: nextJob.completedAt - nextJob.startedAt
      });

      this.emit('completed', nextJob.id, result);

    } catch (error) {
      // Mark as failed
      nextJob.status = 'failed';
      nextJob.error = error.message;
      nextJob.completedAt = new Date();

      cache.set(`job:${nextJob.id}`, nextJob, 3600);

      logger.error('Job failed', {
        jobId: nextJob.id,
        error: error.message
      });

      this.emit('failed', nextJob.id, error);
    } finally {
      // Remove from processing
      this.processing.delete(nextJob.id);

      // Process next job
      setImmediate(() => this.processNext());
    }
  }

  /**
   * Get job status
   * @param {string} jobId - Job ID
   * @returns {object} Job status
   */
  getJobStatus(jobId) {
    // Try memory first
    let job = this.jobs.get(jobId);

    // Fall back to cache
    if (!job) {
      job = cache.get(`job:${jobId}`);
    }

    if (!job) {
      return null;
    }

    return {
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt
    };
  }

  /**
   * Wait for job completion
   * @param {string} jobId - Job ID
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<object>} Job result
   */
  async waitForJob(jobId, timeout = 300000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Job timeout'));
      }, timeout);

      const onCompleted = (completedJobId, result) => {
        if (completedJobId === jobId) {
          cleanup();
          resolve(result);
        }
      };

      const onFailed = (failedJobId, error) => {
        if (failedJobId === jobId) {
          cleanup();
          reject(error);
        }
      };

      const cleanup = () => {
        clearTimeout(timeoutId);
        this.off('completed', onCompleted);
        this.off('failed', onFailed);
      };

      this.on('completed', onCompleted);
      this.on('failed', onFailed);

      // Check if already completed
      const job = this.getJobStatus(jobId);
      if (job) {
        if (job.status === 'completed') {
          cleanup();
          resolve(job.result);
        } else if (job.status === 'failed') {
          cleanup();
          reject(new Error(job.error));
        }
      }
    });
  }

  /**
   * Cancel job
   * @param {string} jobId - Job ID
   */
  cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (job && job.status === 'pending') {
      job.status = 'cancelled';
      job.completedAt = new Date();
      cache.set(`job:${jobId}`, job, 3600);
      logger.info('Job cancelled', { jobId });
      return true;
    }
    return false;
  }

  /**
   * Clean up old completed jobs
   */
  cleanup() {
    const cutoff = new Date(Date.now() - 3600000); // 1 hour ago
    let cleaned = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.completedAt && job.completedAt < cutoff) {
        this.jobs.delete(jobId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Cleaned up old jobs', { count: cleaned });
    }
  }

  /**
   * Get queue stats
   */
  getStats() {
    const jobs = Array.from(this.jobs.values());

    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      maxConcurrent: this.maxConcurrent,
      currentConcurrent: this.processing.size
    };
  }
}

// Singleton instance
export const jobQueue = new JobQueue();

// Cleanup old jobs every hour
setInterval(() => jobQueue.cleanup(), 3600000);

// Export job types
export const JOB_TYPES = {
  BLUEPRINT_ANALYSIS: 'blueprint_analysis',
  LEAD_SCORING: 'lead_scoring',
  ESTIMATE_ANALYSIS: 'estimate_analysis'
};

export default jobQueue;
