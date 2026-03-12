// Lead management routes

import express from 'express';
import { db } from '../services/database.js';
import { cache } from '../services/cache.js';
import { scoringService } from '../services/scoring.js';
import { validateLead, validateId, validateLeadQuery } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { tryCatch, parsePagination, paginationMeta } from '../utils/response.js';
import logger from '../services/logger.js';

const router = express.Router();

// Apply authentication to all leads routes
router.use(authenticateToken);

/**
 * GET /leads - List leads with filtering and pagination
 */
router.get('/', validateLeadQuery, tryCatch(async (req, res) => {
  const { status, search, tier } = req.query;
  const { page, limit, offset } = parsePagination(req.query);
  const userId = req.user.id;
  
  // Cache key includes all filter parameters
  const cacheKey = `leads:u${userId}:s${status || 'all'}:t${tier || 'all'}:q${search || ''}:p${page}:l${limit}`;

  // Try to get from cache
  let result = cache.getApi(cacheKey);

  if (!result) {
    // Fetch from database
    result = await db.getAllLeads({ 
      status, 
      search, 
      tier,
      userId, 
      limit, 
      offset 
    });
    
    // Store in cache for 30 seconds
    cache.setApi(cacheKey, result, 30);
    logger.debug('Leads fetched from database', { count: result.leads.length, userId });
  }

  res.success({
    leads: result.leads,
    total: result.total
  }, null, paginationMeta(page, limit, result.total));
}));

/**
 * GET /leads/:id - Get detailed lead information
 */
router.get('/:id', validateId, tryCatch(async (req, res) => {
  const { id } = req.params;
  const cacheKey = `lead:${id}`;
  
  let lead = cache.get(cacheKey);

  if (!lead) {
    lead = await db.getLead(id);
    if (lead) {
      cache.set(cacheKey, lead, 300); // Cache for 5 minutes
    }
  }

  if (!lead) {
    return res.error('Lead not found', 'NOT_FOUND', { id }, 404);
  }

  res.success({ lead });
}));

/**
 * POST /leads - Create a new lead
 */
router.post('/', validateLead, tryCatch(async (req, res) => {
  const leadData = {
    ...req.body,
    userId: req.user.id
  };
  
  const lead = await db.createLead(leadData);

  // Invalidate list caches
  cache.delPattern('leads:');

  logger.info('Lead created', { id: lead.id, name: lead.name, userId: req.user.id });
  res.status(201).success({ lead }, 'Lead created successfully');
}));

/**
 * PUT /leads/:id - Update an existing lead
 */
router.put('/:id', validateId, validateLead, tryCatch(async (req, res) => {
  const { id } = req.params;
  const lead = await db.updateLead(id, req.body);

  if (!lead) {
    return res.error('Lead not found', 'NOT_FOUND', { id }, 404);
  }

  // Invalidate caches
  cache.del(`lead:${id}`);
  cache.delPattern('leads:');

  logger.info('Lead updated', { id });
  res.success({ lead }, 'Lead updated successfully');
}));

/**
 * DELETE /leads/:id - Delete a lead
 */
router.delete('/:id', validateId, tryCatch(async (req, res) => {
  const { id } = req.params;
  const deleted = await db.deleteLead(id);

  if (!deleted) {
    return res.error('Lead not found', 'NOT_FOUND', { id }, 404);
  }

  // Invalidate caches
  cache.del(`lead:${id}`);
  cache.delPattern('leads:');

  logger.info('Lead deleted', { id });
  res.success({ deleted: true }, 'Lead deleted successfully');
}));

/**
 * POST /leads/:id/score - Run AI scoring for a lead
 */
router.post('/:id/score', validateId, tryCatch(async (req, res) => {
  const { id } = req.params;
  
  // Verify lead exists
  const lead = await db.getLead(id);
  if (!lead) {
    return res.error('Lead not found', 'NOT_FOUND', { id }, 404);
  }

  // Perform scoring
  const result = await scoringService.scoreLead(id);

  if (!result) {
    return res.error('Scoring failed', 'INTERNAL_ERROR', { id }, 500);
  }

  // Invalidate caches
  cache.del(`lead:${id}`);
  cache.delPattern('leads:');

  res.success({
    lead: result.lead,
    score: result.scoring.score,
    status: result.scoring.status,
    tier: result.scoring.tier,
    reasoning: result.scoring.reasoning
  }, 'Lead scored successfully');
}));

/**
 * POST /leads/bulk-status - Update status for multiple leads
 */
router.post('/bulk-status', tryCatch(async (req, res) => {
  const { ids, status } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.error('No lead IDs provided', 'VALIDATION_ERROR', null, 400);
  }
  
  if (!status) {
    return res.error('No status provided', 'VALIDATION_ERROR', null, 400);
  }

  const updatedCount = await db.bulkUpdateLeadStatus(ids, status);
  
  // Invalidate all related caches
  cache.delPattern('leads:');
  for (const id of ids) {
    cache.del(`lead:${id}`);
  }

  res.success({ updatedCount }, `Updated ${updatedCount} leads to status: ${status}`);
}));

export default router;
