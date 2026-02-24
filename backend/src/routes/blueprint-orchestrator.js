/**
 * Blueprint Orchestrator Routes
 * Unified API for comprehensive blueprint analysis
 */

import express from 'express';
import { blueprintOrchestrator, JOB_STATUS } from '../services/blueprint-orchestrator.js';
import { tryCatch } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import logger from '../services/logger.js';
import fs from 'fs';

const router = express.Router();

// Secure all routes
router.use(authenticateToken);

/**
 * @route POST /api/blueprint/analyze
 * @desc Submit blueprint for comprehensive analysis
 * @access Private
 */
router.post('/analyze', tryCatch(async (req, res) => {
  const {
    filePath,
    projectId,
    services = ['dimensions', 'vision', 'ai'],
    priority = 'normal'
  } = req.body;

  if (!filePath) {
    return res.error('filePath is required', 'VALIDATION_ERROR', null, 400);
  }

  if (!fs.existsSync(filePath)) {
    return res.error('File not found', 'FILE_NOT_FOUND', null, 404);
  }

  // Validate services
  const validServices = ['dimensions', 'vision', 'ai'];
  const invalidServices = services.filter(s => !validServices.includes(s));
  if (invalidServices.length > 0) {
    return res.error(
      `Invalid services: ${invalidServices.join(', ')}`,
      'VALIDATION_ERROR',
      null,
      400
    );
  }

  logger.info('Submitting blueprint analysis', {
    filePath,
    projectId,
    services,
    userId: req.user?.id
  });

  const jobId = await blueprintOrchestrator.submitAnalysis({
    filePath,
    projectId,
    userId: req.user?.id,
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
 * @route GET /api/blueprint/jobs/:jobId
 * @desc Get job status and results
 * @access Private
 */
router.get('/jobs/:jobId', tryCatch(async (req, res) => {
  const { jobId } = req.params;
  
  const job = blueprintOrchestrator.getJob(jobId);
  
  if (!job) {
    return res.error('Job not found', 'JOB_NOT_FOUND', null, 404);
  }

  // Check if user owns this job
  if (job.userId && job.userId !== req.user?.id) {
    return res.error('Unauthorized', 'UNAUTHORIZED', null, 403);
  }

  res.success({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    results: job.status === JOB_STATUS.COMPLETED ? job.results : null,
    errors: job.errors,
    startedAt: job.startedAt,
    completedAt: job.completedAt
  }, 'Job status retrieved');
}));

/**
 * @route GET /api/blueprint/jobs
 * @desc Get all jobs for current user
 * @access Private
 */
router.get('/jobs', tryCatch(async (req, res) => {
  const jobs = blueprintOrchestrator.getUserJobs(req.user?.id);
  
  res.success({
    jobs: jobs.map(job => ({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      services: job.services,
      startedAt: job.startedAt,
      completedAt: job.completedAt
    }))
  }, 'User jobs retrieved');
}));

/**
 * @route POST /api/blueprint/analyze-sync
 * @desc Synchronous blueprint analysis (waits for completion)
 * @access Private
 */
router.post('/analyze-sync', tryCatch(async (req, res) => {
  const {
    filePath,
    projectId,
    services = ['dimensions', 'vision', 'ai'],
    timeout = 120000
  } = req.body;

  if (!filePath) {
    return res.error('filePath is required', 'VALIDATION_ERROR', null, 400);
  }

  if (!fs.existsSync(filePath)) {
    return res.error('File not found', 'FILE_NOT_FOUND', null, 404);
  }

  logger.info('Starting synchronous blueprint analysis', {
    filePath,
    projectId,
    services
  });

  // Create a promise that resolves when job completes
  const jobPromise = new Promise((resolve, reject) => {
    blueprintOrchestrator.submitAnalysis({
      filePath,
      projectId,
      userId: req.user?.id,
      services,
      callback: resolve
    }).catch(reject);
  });

  // Wait for completion with timeout
  const results = await Promise.race([
    jobPromise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Analysis timeout')), timeout)
    )
  ]);

  res.success(results, 'Blueprint analysis completed');
}));

/**
 * @route GET /api/blueprint/projects/:projectId/analysis
 * @desc Get analysis results for a project
 * @access Private
 */
router.get('/projects/:projectId/analysis', tryCatch(async (req, res) => {
  const { projectId } = req.params;
  
  const results = await blueprintOrchestrator.getProjectAnalysis(projectId);
  
  if (!results) {
    return res.error('No analysis found for this project', 'NOT_FOUND', null, 404);
  }

  res.success(results, 'Project analysis retrieved');
}));

/**
 * @route POST /api/blueprint/quick-estimate
 * @desc Quick estimate using only fastest services
 * @access Private
 */
router.post('/quick-estimate', tryCatch(async (req, res) => {
  const { filePath, projectId } = req.body;

  if (!filePath) {
    return res.error('filePath is required', 'VALIDATION_ERROR', null, 400);
  }

  if (!fs.existsSync(filePath)) {
    return res.error('File not found', 'FILE_NOT_FOUND', null, 404);
  }

  logger.info('Quick estimate requested', { filePath, projectId });

  // Use only text extraction and AI (fastest combination)
  const jobId = await blueprintOrchestrator.submitAnalysis({
    filePath,
    projectId,
    userId: req.user?.id,
    services: ['ai'], // Text extraction is always included
    priority: 'high'
  });

  res.success({
    jobId,
    status: JOB_STATUS.PENDING,
    message: 'Quick estimate submitted'
  });
}));

/**
 * @route POST /api/blueprint/compare-methods
 * @desc Compare different analysis methods
 * @access Private
 */
router.post('/compare-methods', tryCatch(async (req, res) => {
  const { filePath } = req.body;

  if (!filePath) {
    return res.error('filePath is required', 'VALIDATION_ERROR', null, 400);
  }

  if (!fs.existsSync(filePath)) {
    return res.error('File not found', 'FILE_NOT_FOUND', null, 404);
  }

  logger.info('Comparing analysis methods', { filePath });

  // Run all three methods separately
  const results = {
    textOnly: null,
    withDimensions: null,
    withVision: null,
    comprehensive: null,
    comparison: {}
  };

  try {
    // Text + AI only
    const job1 = await blueprintOrchestrator.submitAnalysis({
      filePath,
      services: ['ai'],
      priority: 'high'
    });
    
    // Wait and get results
    await waitForJob(job1);
    results.textOnly = blueprintOrchestrator.getJob(job1).results;

    // Text + Dimensions + AI
    const job2 = await blueprintOrchestrator.submitAnalysis({
      filePath,
      services: ['dimensions', 'ai'],
      priority: 'high'
    });
    await waitForJob(job2);
    results.withDimensions = blueprintOrchestrator.getJob(job2).results;

    // Comprehensive
    const job3 = await blueprintOrchestrator.submitAnalysis({
      filePath,
      services: ['dimensions', 'vision', 'ai'],
      priority: 'high'
    });
    await waitForJob(job3);
    results.comprehensive = blueprintOrchestrator.getJob(job3).results;

    // Generate comparison
    results.comparison = {
      processingTime: {
        textOnly: getProcessingTime(results.textOnly),
        withDimensions: getProcessingTime(results.withDimensions),
        comprehensive: getProcessingTime(results.comprehensive)
      },
      fixtureCounts: compareFixtureCounts(results),
      pipeEstimates: comparePipeEstimates(results),
      recommendation: 'comprehensive' // Always recommend full analysis
    };

    res.success(results, 'Method comparison completed');

  } catch (error) {
    logger.error('Comparison failed:', error);
    throw error;
  }
}));

// Helper functions
async function waitForJob(jobId, maxWait = 120000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    const job = blueprintOrchestrator.getJob(jobId);
    
    if (job.status === JOB_STATUS.COMPLETED) {
      return job;
    }
    
    if (job.status === JOB_STATUS.FAILED) {
      throw new Error(`Job ${jobId} failed: ${job.errors.join(', ')}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Timeout waiting for job completion');
}

function getProcessingTime(results) {
  // Estimate based on available data
  if (!results) return null;
  
  let sources = 0;
  if (results.text) sources++;
  if (results.dimensions) sources++;
  if (results.vision) sources++;
  if (results.ai) sources++;
  
  return {
    estimatedSeconds: sources * 3,
    sourcesUsed: sources
  };
}

function compareFixtureCounts(results) {
  const counts = {};
  
  ['textOnly', 'withDimensions', 'comprehensive'].forEach(method => {
    const fixtures = results[method]?.combined?.fixtures;
    if (fixtures) {
      counts[method] = Object.entries(fixtures)
        .filter(([k, v]) => typeof v === 'number' && v > 0)
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
    }
  });
  
  return counts;
}

function comparePipeEstimates(results) {
  const estimates = {};
  
  ['textOnly', 'withDimensions', 'comprehensive'].forEach(method => {
    const pipeRuns = results[method]?.combined?.pipeRuns;
    if (pipeRuns) {
      estimates[method] = pipeRuns;
    }
  });
  
  return estimates;
}

export default router;
