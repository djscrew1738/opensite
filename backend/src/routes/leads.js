// Lead management routes

import express from 'express';
import { db } from '../services/database.js';
import { cache } from '../services/cache.js';
import { scoringService } from '../services/scoring.js';
import { validateLead, validateId, validateLeadQuery } from '../middleware/validation.js';
import logger from '../services/logger.js';

const router = express.Router();

// Get all leads with optional filtering
router.get('/', validateLeadQuery, (req, res) => {
  try {
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

    res.json({
      leads,
      total: leads.length
    });
  } catch (error) {
    logger.error('Error fetching leads', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get single lead
router.get('/:id', validateId, (req, res) => {
  try {
    const cacheKey = `lead:${req.params.id}`;
    let lead = cache.get(cacheKey);

    if (!lead) {
      lead = db.getLead(req.params.id);
      if (lead) {
        cache.set(cacheKey, lead, 60); // Cache for 1 minute
      }
    }

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({ lead });
  } catch (error) {
    logger.error('Error fetching lead', { error: error.message, id: req.params.id });
    res.status(500).json({ error: error.message });
  }
});

// Create new lead
router.post('/', validateLead, (req, res) => {
  try {
    const lead = db.createLead(req.body);

    // Invalidate leads cache
    cache.delPattern('leads:');

    logger.info('Lead created', { id: lead.id, name: lead.name });
    res.status(201).json({ lead });
  } catch (error) {
    logger.error('Error creating lead', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Update lead
router.put('/:id', validateId, validateLead, (req, res) => {
  try {
    const lead = db.updateLead(req.params.id, req.body);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Invalidate cache
    cache.del(`lead:${req.params.id}`);
    cache.delPattern('leads:');

    logger.info('Lead updated', { id: lead.id });
    res.json({ lead });
  } catch (error) {
    logger.error('Error updating lead', { error: error.message, id: req.params.id });
    res.status(500).json({ error: error.message });
  }
});

// Delete lead
router.delete('/:id', validateId, (req, res) => {
  try {
    const deleted = db.deleteLead(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Invalidate cache
    cache.del(`lead:${req.params.id}`);
    cache.delPattern('leads:');

    logger.info('Lead deleted', { id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting lead', { error: error.message, id: req.params.id });
    res.status(500).json({ error: error.message });
  }
});

// Score lead with AI
router.post('/:id/score', async (req, res) => {
  try {
    const result = await scoringService.scoreLead(req.params.id);

    res.json({
      lead: result.lead,
      score: result.scoring.score,
      status: result.scoring.status,
      reasoning: result.scoring.reasoning
    });
  } catch (error) {
    if (error.message === 'Lead not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
