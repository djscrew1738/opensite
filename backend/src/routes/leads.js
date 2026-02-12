// Lead management routes

import express from 'express';
import { db } from '../services/database.js';
import { cache } from '../services/cache.js';
import { scoringService } from '../services/scoring.js';
import { validateLead, validateId, validateLeadQuery } from '../middleware/validation.js';
import { tryCatch } from '../utils/response.js';
import logger from '../services/logger.js';

const router = express.Router();

// Get all leads with optional filtering
router.get('/', validateLeadQuery, tryCatch(async (req, res) => {
  const { status, search } = req.query;
  const cacheKey = `leads:${status || 'all'}:${search || ''}`;

  // Check cache first
  let leads = cache.getApi(cacheKey);

  if (!leads) {
    leads = db.getAllLeads({ status, search });
    cache.setApi(cacheKey, leads, 30); // Cache for 30 seconds
    logger.debug('Leads fetched from database', { count: leads.length });
  } else {
    logger.debug('Leads fetched from cache', { count: leads.length });
  }

  res.success({
    leads,
    total: leads.length
  });
}));

// Get single lead
router.get('/:id', validateId, tryCatch(async (req, res) => {
  const cacheKey = `lead:${req.params.id}`;
  let lead = cache.get(cacheKey);

  if (!lead) {
    lead = db.getLead(req.params.id);
    if (lead) {
      cache.set(cacheKey, lead, 60); // Cache for 1 minute
    }
  }

  if (!lead) {
    return res.error('Lead not found', 'NOT_FOUND', { id: req.params.id }, 404);
  }

  res.success({ lead });
}));

// Create new lead
router.post('/', validateLead, tryCatch(async (req, res) => {
  const lead = db.createLead(req.body);

  // Invalidate leads cache
  cache.delPattern('leads:');

  logger.info('Lead created', { id: lead.id, name: lead.name });
  res.status(201).success({ lead }, 'Lead created successfully');
}));

// Update lead
router.put('/:id', validateId, validateLead, tryCatch(async (req, res) => {
  const lead = db.updateLead(req.params.id, req.body);

  if (!lead) {
    return res.error('Lead not found', 'NOT_FOUND', { id: req.params.id }, 404);
  }

  // Invalidate cache
  cache.del(`lead:${req.params.id}`);
  cache.delPattern('leads:');

  logger.info('Lead updated', { id: lead.id });
  res.success({ lead }, 'Lead updated successfully');
}));

// Delete lead
router.delete('/:id', validateId, tryCatch(async (req, res) => {
  const deleted = db.deleteLead(req.params.id);

  if (!deleted) {
    return res.error('Lead not found', 'NOT_FOUND', { id: req.params.id }, 404);
  }

  // Invalidate cache
  cache.del(`lead:${req.params.id}`);
  cache.delPattern('leads:');

  logger.info('Lead deleted', { id: req.params.id });
  res.success({ deleted: true }, 'Lead deleted successfully');
}));

// Score lead with AI
router.post('/:id/score', tryCatch(async (req, res) => {
  const result = await scoringService.scoreLead(req.params.id);

  if (!result) {
    return res.error('Lead not found', 'NOT_FOUND', { id: req.params.id }, 404);
  }

  res.success({
    lead: result.lead,
    score: result.scoring.score,
    status: result.scoring.status,
    reasoning: result.scoring.reasoning
  }, 'Lead scored successfully');
}));

export default router;
