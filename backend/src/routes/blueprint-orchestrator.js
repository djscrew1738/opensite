/**
 * Blueprint Orchestrator Routes
 * Unified API for comprehensive blueprint analysis
 */

import express from 'express';
import { blueprintOrchestrator, JOB_STATUS } from '../services/blueprint-orchestrator.js';
import { tryCatch } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { db } from '../services/database.js';
import logger from '../services/logger.js';
import fs from 'fs';

const router = express.Router();

// Secure all routes
router.use(authenticateToken);

/**
 * POST /api/blueprint/analyze - Submit for analysis
 */
router.post('/analyze', tryCatch(async (req, res) => {
  const {
    filePath,
    projectId,
    blueprintId,
    services = ['dimensions', 'vision', 'structural', 'ai'],
    priority = 'normal'
  } = req.body;

  if (!filePath) return res.error('filePath is required', 'VALIDATION_ERROR', null, 400);
  if (!fs.existsSync(filePath)) return res.error('File not found', 'FILE_NOT_FOUND', null, 404);

  const jobId = await blueprintOrchestrator.submitAnalysis({
    filePath,
    projectId,
    blueprintId,
    userId: req.user.id,
    services,
    priority
  });

  res.success({
    jobId,
    status: JOB_STATUS.PENDING,
    message: 'Analysis submitted successfully'
  }, 'Blueprint analysis job created');
}));

/**
 * GET /api/blueprint/jobs/:jobId - Get job status
 */
router.get('/jobs/:jobId', tryCatch(async (req, res) => {
  const { jobId } = req.params;
  const job = await blueprintOrchestrator.getJob(jobId);
  
  if (!job) return res.error('Job not found', 'NOT_FOUND', null, 404);

  // Note: We might want to check ownership here if userId is available in the job object
  
  res.success(job);
}));

/**
 * GET /api/blueprint/jobs - List user's jobs
 */
router.get('/jobs', tryCatch(async (req, res) => {
  const { blueprintId, status } = req.query;
  
  // We now query the persistent database for this
  const jobs = await db.getAllAnalysisJobs({
    blueprintId,
    status
  });
  
  res.success({ jobs, total: jobs.length });
}));

/**
 * GET /api/blueprint/projects/:projectId/analysis - Get results
 */
router.get('/projects/:projectId/analysis', tryCatch(async (req, res) => {
  const { projectId } = req.params;
  const results = await blueprintOrchestrator.getProjectAnalysis(projectId);
  
  if (!results) return res.error('No analysis found', 'NOT_FOUND', null, 404);
  res.success(results);
}));

/**
 * POST /api/blueprint/quick-estimate - Fast track analysis
 */
router.post('/quick-estimate', tryCatch(async (req, res) => {
  const { filePath, projectId, blueprintId } = req.body;
  if (!filePath) return res.error('filePath is required', 'VALIDATION_ERROR', null, 400);

  const jobId = await blueprintOrchestrator.submitAnalysis({
    filePath,
    projectId,
    blueprintId,
    userId: req.user.id,
    services: ['ai'],
    priority: 'high'
  });

  res.success({ jobId, status: JOB_STATUS.PENDING });
}));

export default router;
