// Enhanced Discovery Routes
// Additional routes for lead export, follow-ups, and analytics

import express from 'express';
import { db } from '../services/database.js';
import * as leadExport from '../services/discovery/leadExport.js';
import * as followUpScheduler from '../services/discovery/followUpScheduler.js';
import * as sourceAnalytics from '../services/discovery/sourceAnalytics.js';
import * as deduplication from '../services/discovery/deduplication.js';
import { tryCatch } from '../utils/response.js';

const router = express.Router();

// ==================== Lead Export Routes ====================

/**
 * Export leads to CSV
 * POST /api/discovery/export
 */
router.post('/export', tryCatch(async (req, res) => {
  const { runId, tier, minScore, format = 'csv' } = req.body;

  if (!runId) {
    return res.error('Run ID is required', 'VALIDATION_ERROR', null, 400);
  }

  const run = db.getDiscoveryRun(runId);
  if (!run) {
    return res.error('Run not found', 'NOT_FOUND', null, 404);
  }

  const leads = db.getDiscoveryLeadsByRun(runId, { tier });
  const filteredLeads = minScore ? leads.filter(l => (l.icpScore || 0) >= minScore) : leads;

  let result;
  if (format === 'json') {
    result = leadExport.exportToJson(filteredLeads, { tier, minScore });
  } else if (format === 'crm') {
    result = leadExport.exportToCrmFormat(filteredLeads, { tier, minScore });
  } else {
    result = leadExport.exportToCsv(filteredLeads, { tier, minScore });
  }

  if (!result.success) {
    return res.error(result.error, 'EXPORT_ERROR', null, 400);
  }

  res.success(result, 'Export created successfully');
}));

/**
 * Export leads by tier (creates multiple files)
 * POST /api/discovery/export/by-tier
 */
router.post('/export/by-tier', tryCatch(async (req, res) => {
  const { runId } = req.body;

  if (!runId) {
    return res.error('Run ID is required', 'VALIDATION_ERROR', null, 400);
  }

  const leads = db.getDiscoveryLeadsByRun(runId);
  const results = leadExport.exportByTier(leads);

  res.success(results, 'Tier exports created');
}));

/**
 * List available exports
 * GET /api/discovery/exports
 */
router.get('/exports', tryCatch(async (req, res) => {
  const exports = leadExport.listExports();
  res.success({ exports, total: exports.length });
}));

/**
 * Download export file
 * GET /api/discovery/exports/:filename
 */
router.get('/exports/:filename', tryCatch(async (req, res) => {
  const result = leadExport.readExport(req.params.filename);

  if (!result.success) {
    return res.error(result.error, 'NOT_FOUND', null, 404);
  }

  const contentType = req.params.filename.endsWith('.json')
    ? 'application/json'
    : 'text/csv';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
  res.send(result.content);
}));

/**
 * Delete export file
 * DELETE /api/discovery/exports/:filename
 */
router.delete('/exports/:filename', tryCatch(async (req, res) => {
  const result = leadExport.deleteExport(req.params.filename);

  if (!result.success) {
    return res.error(result.error, 'NOT_FOUND', null, 404);
  }

  res.success({ filename: req.params.filename }, 'Export deleted');
}));

// ==================== Follow-Up Schedule Routes ====================

/**
 * Create follow-up schedule for a lead
 * POST /api/discovery/leads/:id/schedule
 */
router.post('/leads/:id/schedule', tryCatch(async (req, res) => {
  const lead = db.getDiscoveryLead(req.params.id);
  if (!lead) {
    return res.error('Lead not found', 'NOT_FOUND', null, 404);
  }

  const schedule = followUpScheduler.createFollowUpSchedule(lead, req.body);

  // Store schedule in database (would need a new table)
  // For now, return the schedule object
  res.success({ schedule }, 'Follow-up schedule created');
}));

/**
 * Get daily follow-up tasks
 * GET /api/discovery/tasks/today
 * 
 * NOTE: This endpoint is not yet implemented. Schedules table required.
 */
router.get('/tasks/today', tryCatch(async (req, res) => {
  return res.error('Daily tasks endpoint requires schedules table implementation. Use /api/discovery/leads/:id/schedule to create individual schedules.', 'NOT_IMPLEMENTED', null, 501);
}));

/**
 * Get upcoming follow-ups
 * GET /api/discovery/follow-ups/upcoming
 * 
 * NOTE: This endpoint is not yet implemented. Schedules table required.
 */
router.get('/follow-ups/upcoming', tryCatch(async (req, res) => {
  return res.error('Upcoming follow-ups endpoint requires schedules table implementation.', 'NOT_IMPLEMENTED', null, 501);
}));



// ==================== Analytics Routes ====================

/**
 * Get analytics for a discovery run
 * GET /api/discovery/runs/:runId/analytics
 */
router.get('/runs/:runId/analytics', tryCatch(async (req, res) => {
  const run = db.getDiscoveryRun(req.params.runId);
  if (!run) {
    return res.error('Run not found', 'NOT_FOUND', null, 404);
  }

  const leads = db.getDiscoveryLeadsByRun(req.params.runId);
  const analytics = sourceAnalytics.analyzeDiscoveryRun(run, leads);

  res.success(analytics);
}));

/**
 * Compare multiple discovery runs
 * POST /api/discovery/analytics/compare-runs
 */
router.post('/analytics/compare-runs', tryCatch(async (req, res) => {
  const { runIds } = req.body;

  if (!Array.isArray(runIds) || runIds.length === 0 || runIds.length > 50) {
    return res.error('Run IDs must be an array with 1 to 50 entries', 'VALIDATION_ERROR', null, 400);
  }

  const analyses = [];
  for (const runId of runIds) {
    const run = db.getDiscoveryRun(runId);
    if (run) {
      const leads = db.getDiscoveryLeadsByRun(runId);
      analyses.push(sourceAnalytics.analyzeDiscoveryRun(run, leads));
    }
  }

  const comparison = sourceAnalytics.compareRuns(analyses);
  res.success(comparison);
}));

/**
 * Get lead progression over time
 * GET /api/discovery/analytics/progression
 */
router.get('/analytics/progression', tryCatch(async (req, res) => {
  const { days: daysParam = 30 } = req.query;
  const days = Math.min(Math.max(parseInt(daysParam) || 30, 1), 365);

  // Get all discovery leads
  const runs = db.getAllDiscoveryRuns();
  let allLeads = [];
  for (const run of runs) {
    const leads = db.getDiscoveryLeadsByRun(run.id);
    allLeads = allLeads.concat(leads);
  }

  const progression = sourceAnalytics.trackLeadProgression(allLeads, days);
  res.success(progression);
}));

/**
 * Get permit source analytics
 * GET /api/discovery/analytics/permit-sources
 */
router.get('/analytics/permit-sources', tryCatch(async (req, res) => {
  const dataSources = db.getAllDataSources();
  const analyses = [];

  for (const source of dataSources) {
    const permits = db.getAllPermits({ sourceId: source.id });
    if (permits.length > 0) {
      analyses.push(sourceAnalytics.analyzePermitSource(permits, source.name));
    }
  }

  const comparison = sourceAnalytics.comparePermitSources(analyses);
  res.success(comparison);
}));

/**
 * Generate overall lead generation report
 * GET /api/discovery/analytics/report
 */
router.get('/analytics/report', tryCatch(async (req, res) => {
  const { startDate, endDate } = req.query;

  const runs = db.getAllDiscoveryRuns();
  const dataSources = db.getAllDataSources();

  const permitSources = [];
  for (const source of dataSources) {
    const permits = db.getAllPermits({ sourceId: source.id });
    if (permits.length > 0) {
      permitSources.push(sourceAnalytics.analyzePermitSource(permits, source.name));
    }
  }

  const timeRange = startDate && endDate ? { start: startDate, end: endDate } : null;
  const report = sourceAnalytics.generateOverallReport(runs, permitSources, timeRange);

  res.success(report);
}));

// ==================== Deduplication Routes ====================

/**
 * Check for duplicates in a run
 * POST /api/discovery/runs/:runId/deduplicate
 */
router.post('/runs/:runId/deduplicate', tryCatch(async (req, res) => {
  const { threshold = 0.7 } = req.body;

  const leads = db.getDiscoveryLeadsByRun(req.params.runId);
  const result = deduplication.deduplicateLeads(leads, threshold);

  res.success({
    stats: result.stats,
    duplicates: result.duplicates.map(d => ({
      lead: d.lead.businessName,
      duplicateOf: d.duplicateOf.businessName,
      matchScore: d.matchScore,
    })),
  }, `Found ${result.stats.duplicates} potential duplicates`);
}));

/**
 * Cross-source deduplication
 * POST /api/discovery/deduplicate-cross-source
 */
router.post('/deduplicate-cross-source', tryCatch(async (req, res) => {
  const { runIdA, runIdB, threshold = 0.7 } = req.body;

  const leadsA = db.getDiscoveryLeadsByRun(runIdA);
  const leadsB = db.getDiscoveryLeadsByRun(runIdB);

  const result = deduplication.crossSourceDeduplicate(leadsA, leadsB, threshold);

  res.success({
    stats: result.stats,
    matches: result.matches.length,
    uniqueInA: result.uniqueInA.length,
    uniqueInB: result.uniqueInB.length,
  }, 'Cross-source deduplication complete');
}));

export default router;
