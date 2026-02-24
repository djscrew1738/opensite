// Persistent Job Queue Service with SQLite
// Survives server restarts and provides durability

import { EventEmitter } from 'events';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import logger from './logger.js';

const MAX_COMPLETED_JOBS = 100;
const COMPLETED_TTL_MS = 3600000; // 1 hour
const CLEANUP_INTERVAL = 300000;  // 5 minutes

class PersistentJobQueue extends EventEmitter {
  constructor() {
    super();
    
    // Initialize SQLite database
    const dbPath = path.join(process.cwd(), 'data', 'jobs.db');
    if (!fs.existsSync(path.dirname(dbPath))) {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    }
    
    this.db = new Database(dbPath);
    this.initDatabase();
    
    this.processing = new Set();
    this.handlers = new Map();
    this.maxConcurrent = 3;
    this.jobId = 0;
    
    // Restore pending jobs from database
    this.restoreJobs();
    
    // Start cleanup interval
    setInterval(() => this.cleanup(), CLEANUP_INTERVAL);
  }

  initDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        data TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        result TEXT,
        error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME
      );
      
      CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
      CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at);
    `);
  }

  restoreJobs() {
    try {
      // Get max job ID for counter
      const maxId = this.db.prepare('SELECT MAX(CAST(SUBSTR(id, 5) AS INTEGER)) as max_id FROM jobs').get();
      this.jobId = maxId?.max_id || 0;
      
      // Mark any 'processing' jobs as failed (they were interrupted)
      const stmt = this.db.prepare(`
        UPDATE jobs 
        SET status = 'failed', error = 'Server restarted during processing', completed_at = CURRENT_TIMESTAMP
        WHERE status = 'processing'
      `);
      const result = stmt.run();
      
      if (result.changes > 0) {
        logger.info(`Marked ${result.changes} interrupted jobs as failed`);
      }
      
      // Load pending jobs into memory for processing
      const pendingJobs = this.db.prepare("SELECT * FROM jobs WHERE status = 'pending' ORDER BY created_at").all();
      
      for (const row of pendingJobs) {
        this.emit('pending', row.id);
      }
      
      logger.info(`Restored ${pendingJobs.length} pending jobs from database`);
      
      // Start processing restored jobs
      setImmediate(() => this.processNext());
      
    } catch (error) {
      logger.error('Failed to restore jobs from database', { error: error.message });
    }
  }

  registerHandler(type, handler) {
    this.handlers.set(type, handler);
    logger.debug(`Registered handler for job type: ${type}`);
  }

  async addJob(type, data, handler = null) {
    const jobId = `job-${++this.jobId}-${Date.now()}`;

    if (handler) {
      this.registerHandler(type, handler);
    }

    if (!this.handlers.has(type)) {
      logger.warn(`No handler registered for job type: ${type}. Job will stay pending.`);
    }

    try {
      // Store in database
      const stmt = this.db.prepare(`
        INSERT INTO jobs (id, type, data, status, progress, created_at)
        VALUES (?, ?, ?, 'pending', 0, CURRENT_TIMESTAMP)
      `);
      stmt.run(jobId, type, JSON.stringify(data));

      logger.info('Job added to queue', { jobId, type });

      this.processNext();

      return jobId;
    } catch (error) {
      logger.error('Failed to add job to database', { error: error.message });
      throw error;
    }
  }

  async processNext() {
    if (this.processing.size >= this.maxConcurrent) return;

    // Get next pending job from database
    const job = this.db.prepare(`
      SELECT * FROM jobs 
      WHERE status = 'pending' 
      ORDER BY created_at 
      LIMIT 1
    `).get();

    if (!job) return;

    const handler = this.handlers.get(job.type);
    if (!handler) {
      // Skip jobs with no registered handler for now to avoid blocking the queue
      return;
    }

    // Update status to processing
    this.db.prepare(`
      UPDATE jobs SET status = 'processing', started_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(job.id);

    this.processing.add(job.id);

    logger.info('Job started', { jobId: job.id, type: job.type });

    try {
      // Deserialize data
      const jobData = JSON.parse(job.data);
      jobData.jobId = job.id; // Ensure jobId is available in data

      // Execute handler
      const result = await handler(jobData, (progress) => {
        this.db.prepare('UPDATE jobs SET progress = ? WHERE id = ?').run(progress, job.id);
        this.emit('progress', job.id, progress);
      });

      // Update as completed
      this.db.prepare(`
        UPDATE jobs 
        SET status = 'completed', result = ?, progress = 100, completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(JSON.stringify(result), job.id);

      logger.info('Job completed', { jobId: job.id });

      this.emit('completed', job.id, result);

    } catch (error) {
      this.db.prepare(`
        UPDATE jobs 
        SET status = 'failed', error = ?, completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(error.message, job.id);

      logger.error('Job failed', { jobId: job.id, error: error.message });

      this.emit('failed', job.id, error);
    } finally {
      this.processing.delete(job.id);

      setImmediate(() => this.processNext());
    }
  }

  getJobStatus(jobId) {
    const job = this.db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    if (!job) return null;

    return {
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      result: job.result ? JSON.parse(job.result) : null,
      error: job.error,
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at
    };
  }

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

  cancelJob(jobId) {
    const result = this.db.prepare(`
      UPDATE jobs 
      SET status = 'cancelled', completed_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'pending'
    `).run(jobId);

    if (result.changes > 0) {
      logger.info('Job cancelled', { jobId });
      return true;
    }
    return false;
  }

  cleanup() {
    try {
      // Delete old completed/failed/cancelled jobs
      const result = this.db.prepare(`
        DELETE FROM jobs 
        WHERE status IN ('completed', 'failed', 'cancelled')
        AND completed_at < datetime('now', '-1 hour')
      `).run();

      if (result.changes > 0) {
        logger.info('Cleaned up old jobs', { count: result.changes });
      }

      // Keep only last MAX_COMPLETED_JOBS
      const count = this.db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status IN ('completed', 'failed', 'cancelled')").get();
      if (count.count > MAX_COMPLETED_JOBS) {
        const toDelete = count.count - MAX_COMPLETED_JOBS;
        this.db.prepare(`
          DELETE FROM jobs 
          WHERE id IN (
            SELECT id FROM jobs 
            WHERE status IN ('completed', 'failed', 'cancelled')
            ORDER BY completed_at ASC
            LIMIT ?
          )
        `).run(toDelete);
      }
    } catch (error) {
      logger.error('Job cleanup error', { error: error.message });
    }
  }

  getStats() {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM jobs
    `).get();

    return {
      ...stats,
      maxConcurrent: this.maxConcurrent,
      currentConcurrent: this.processing.size
    };
  }

  close() {
    this.db.close();
  }
}

// Singleton
export const persistentJobQueue = new PersistentJobQueue();

// For compatibility with existing code
export const jobQueue = persistentJobQueue;
export const JOB_TYPES = {
  BLUEPRINT_ANALYSIS: 'blueprint_analysis',
  LEAD_SCORING: 'lead_scoring',
  ESTIMATE_ANALYSIS: 'estimate_analysis'
};

export default persistentJobQueue;
