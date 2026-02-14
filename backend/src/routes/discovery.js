// Discovery Pipeline Routes
// Manages Google Maps scraping, website enrichment, and AI scoring pipeline

import express from 'express';
import { db } from '../services/database.js';
import { startDiscoveryPipeline } from '../services/discovery/pipeline.js';
import { tryCatch } from '../utils/response.js';

const router = express.Router();

/**
 * Start a discovery pipeline run
 * @route POST /api/discovery/run
 */
router.post('/run', tryCatch(async (req, res) => {
  const { keyword, city } = req.body;

  if (!keyword || !city) {
    return res.error('Keyword and city are required', 'VALIDATION_ERROR', null, 400);
  }

  const { runId, jobId } = await startDiscoveryPipeline(keyword, city);

  res.success({ runId, jobId }, 'Discovery pipeline started');
}));

/**
 * List all past discovery runs
 * @route GET /api/discovery/runs
 */
router.get('/runs', tryCatch(async (req, res) => {
  const runs = db.getAllDiscoveryRuns();
  res.success({ runs, total: runs.length });
}));

/**
 * Get a specific run's status and progress
 * @route GET /api/discovery/runs/:runId
 */
router.get('/runs/:runId', tryCatch(async (req, res) => {
  const run = db.getDiscoveryRun(req.params.runId);
  if (!run) {
    return res.error('Run not found', 'NOT_FOUND', null, 404);
  }
  res.success(run);
}));

/**
 * Get leads for a specific run
 * @route GET /api/discovery/runs/:runId/leads
 */
router.get('/runs/:runId/leads', tryCatch(async (req, res) => {
  const run = db.getDiscoveryRun(req.params.runId);
  if (!run) {
    return res.error('Run not found', 'NOT_FOUND', null, 404);
  }

  const filters = {
    tier: req.query.tier || undefined,
    status: req.query.status || undefined
  };

  const leads = db.getDiscoveryLeadsByRun(req.params.runId, filters);
  res.success({ leads, total: leads.length });
}));

/**
 * Get a single discovery lead
 * @route GET /api/discovery/leads/:id
 */
router.get('/leads/:id', tryCatch(async (req, res) => {
  const lead = db.getDiscoveryLead(req.params.id);
  if (!lead) {
    return res.error('Lead not found', 'NOT_FOUND', null, 404);
  }
  res.success(lead);
}));

/**
 * Update a discovery lead's contact status
 * @route PATCH /api/discovery/leads/:id/status
 */
router.patch('/leads/:id/status', tryCatch(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['new', 'contacted', 'responded', 'converted', 'dismissed'];

  if (!status || !validStatuses.includes(status)) {
    return res.error(
      `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      'VALIDATION_ERROR', null, 400
    );
  }

  const lead = db.updateDiscoveryLead(req.params.id, { contactStatus: status });
  if (!lead) {
    return res.error('Lead not found', 'NOT_FOUND', null, 404);
  }

  res.success(lead, `Status updated to ${status}`);
}));

/**
 * Delete a discovery run and its leads
 * @route DELETE /api/discovery/runs/:runId
 */
router.delete('/runs/:runId', tryCatch(async (req, res) => {
  const deleted = db.deleteDiscoveryRun(req.params.runId);
  if (!deleted) {
    return res.error('Run not found', 'NOT_FOUND', null, 404);
  }
  res.success({ id: req.params.runId }, 'Run deleted successfully');
}));

export default router;
