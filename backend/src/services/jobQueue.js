// Background Job Queue Service
// Handles long-running tasks without blocking API responses
// Memory-optimized: auto-evicts completed jobs, nulls handler refs

import { EventEmitter } from 'events';
import logger from './logger.js';

const MAX_COMPLETED_JOBS = 50;    // Max completed jobs to keep in memory
const COMPLETED_TTL_MS = 600000;  // 10 minutes — then evict
const CLEANUP_INTERVAL = 120000;  // Check every 2 minutes

class JobQueue extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map();
    this.processing = new Set();
    this.maxConcurrent = 3;
    this.jobId = 0;
  }

  /**
   * Add job to queue
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

    logger.info('Job added to queue', { jobId, type });

    this.processNext();

    return jobId;
  }

  /**
   * Process next job in queue
   */
  async processNext() {
    if (this.processing.size >= this.maxConcurrent) return;

    const nextJob = Array.from(this.jobs.values())
      .find(job => job.status === 'pending');

    if (!nextJob) return;

    nextJob.status = 'processing';
    nextJob.startedAt = new Date();
    this.processing.add(nextJob.id);

    logger.info('Job started', { jobId: nextJob.id, type: nextJob.type });

    try {
      const result = await nextJob.handler(nextJob.data, (progress) => {
        nextJob.progress = progress;
        this.emit('progress', nextJob.id, progress);
      });

      nextJob.status = 'completed';
      nextJob.result = result;
      nextJob.progress = 100;
      nextJob.completedAt = new Date();

      logger.info('Job completed', {
        jobId: nextJob.id,
        duration: nextJob.completedAt - nextJob.startedAt
      });

      this.emit('completed', nextJob.id, result);

    } catch (error) {
      nextJob.status = 'failed';
      nextJob.error = error.message;
      nextJob.completedAt = new Date();

      logger.error('Job failed', { jobId: nextJob.id, error: error.message });

      this.emit('failed', nextJob.id, error);
    } finally {
      this.processing.delete(nextJob.id);

      // Release handler reference — this is the main memory leak fix.
      // Handlers often close over large buffers (file data, base64 images).
      nextJob.handler = null;
      nextJob.data = null;

      // Trim completed jobs if too many
      this._trimCompleted();

      setImmediate(() => this.processNext());
    }
  }

  /**
   * Get job status (lightweight — no handler/data)
   */
  getJobStatus(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return null;

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
   */
  async waitForJob(jobId, timeout = 300000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Job timeout'));
      }, timeout);

      const onCompleted = (completedJobId, result) => {
        if (completedJobId === jobId) { cleanup(); resolve(result); }
      };

      const onFailed = (failedJobId, error) => {
        if (failedJobId === jobId) { cleanup(); reject(error); }
      };

      const cleanup = () => {
        clearTimeout(timeoutId);
        this.off('completed', onCompleted);
        this.off('failed', onFailed);
      };

      this.on('completed', onCompleted);
      this.on('failed', onFailed);

      // Check if already done
      const job = this.getJobStatus(jobId);
      if (job) {
        if (job.status === 'completed') { cleanup(); resolve(job.result); }
        else if (job.status === 'failed') { cleanup(); reject(new Error(job.error)); }
      }
    });
  }

  /**
   * Cancel job
   */
  cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (job && job.status === 'pending') {
      job.status = 'cancelled';
      job.completedAt = new Date();
      job.handler = null;
      job.data = null;
      logger.info('Job cancelled', { jobId });
      return true;
    }
    return false;
  }

  /**
   * Trim completed/failed/cancelled jobs to keep memory bounded
   */
  _trimCompleted() {
    const now = Date.now();
    const done = [];

    for (const [id, job] of this.jobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        done.push({ id, completedAt: job.completedAt ? job.completedAt.getTime() : 0 });
      }
    }

    // Evict jobs older than TTL
    for (const { id, completedAt } of done) {
      if (now - completedAt > COMPLETED_TTL_MS) {
        this.jobs.delete(id);
      }
    }

    // If still over limit, evict oldest first
    if (done.length > MAX_COMPLETED_JOBS) {
      done.sort((a, b) => a.completedAt - b.completedAt);
      const toEvict = done.length - MAX_COMPLETED_JOBS;
      for (let i = 0; i < toEvict; i++) {
        this.jobs.delete(done[i].id);
      }
    }
  }

  /**
   * Full cleanup pass
   */
  cleanup() {
    const before = this.jobs.size;
    this._trimCompleted();
    const after = this.jobs.size;
    if (before !== after) {
      logger.info('Job cleanup', { before, after, freed: before - after });
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

// Singleton
export const jobQueue = new JobQueue();

// Cleanup every 2 minutes instead of every hour
setInterval(() => jobQueue.cleanup(), CLEANUP_INTERVAL);

export const JOB_TYPES = {
  BLUEPRINT_ANALYSIS: 'blueprint_analysis',
  LEAD_SCORING: 'lead_scoring',
  ESTIMATE_ANALYSIS: 'estimate_analysis'
};

export default jobQueue;
