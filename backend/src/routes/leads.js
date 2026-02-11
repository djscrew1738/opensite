// Lead management routes

import express from 'express';
import { dataStore } from '../data/store.js';
import { scoringService } from '../services/scoring.js';

const router = express.Router();

// Get all leads with optional filtering
router.get('/', (req, res) => {
  try {
    const { status, search } = req.query;
    const leads = dataStore.getAllLeads({ status, search });

    res.json({
      leads,
      total: leads.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single lead
router.get('/:id', (req, res) => {
  try {
    const lead = dataStore.getLead(req.params.id);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({ lead });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new lead
router.post('/', (req, res) => {
  try {
    const lead = dataStore.createLead(req.body);
    res.status(201).json({ lead });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update lead
router.put('/:id', (req, res) => {
  try {
    const lead = dataStore.updateLead(req.params.id, req.body);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({ lead });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete lead
router.delete('/:id', (req, res) => {
  try {
    const deleted = dataStore.deleteLead(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({ success: true });
  } catch (error) {
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
