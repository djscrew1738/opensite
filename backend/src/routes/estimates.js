// Pricing and estimation routes

import express from 'express';
import { pricingService } from '../services/pricing.js';
import { aiProvider } from '../services/ai-provider.js';
import { db } from '../services/database.js';

const router = express.Router();

// Calculate estimate
router.post('/calculate', (req, res) => {
  try {
    // Fixture-based pricing mode
    if (req.body.mode === 'fixture-based') {
      const estimate = pricingService.calculateFixtureBased(req.body.fixtures || req.body);

      const saved = db.createEstimate({
        ...req.body,
        ...estimate
      });

      return res.json({
        ...estimate,
        estimateId: saved.id
      });
    }

    // Legacy tier-based pricing
    const { sqft, bathrooms, units, stories, tier } = req.body;

    // Validate required fields
    if (!sqft || !bathrooms || !units || !stories || !tier) {
      return res.status(400).json({
        error: 'Missing required fields: sqft, bathrooms, units, stories, tier'
      });
    }

    const estimate = pricingService.calculateEstimate({
      sqft: Number(sqft),
      bathrooms: Number(bathrooms),
      units: Number(units),
      stories: Number(stories),
      tier: tier.toLowerCase()
    });

    // Save estimate
    const saved = db.createEstimate({
      ...req.body,
      ...estimate
    });

    res.json({
      ...estimate,
      estimateId: saved.id
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Deep AI analysis of blueprint/estimate
router.post('/analyze', async (req, res) => {
  try {
    let estimate;

    if (req.body.mode === 'fixture-based') {
      estimate = pricingService.calculateFixtureBased(req.body.fixtures || req.body);
    } else {
      const { sqft, bathrooms, units, stories, tier } = req.body;

      if (!sqft || !bathrooms || !units || !stories || !tier) {
        return res.status(400).json({
          error: 'Missing required fields'
        });
      }

      estimate = pricingService.calculateEstimate({
        sqft: Number(sqft),
        bathrooms: Number(bathrooms),
        units: Number(units),
        stories: Number(stories),
        tier: tier.toLowerCase()
      });
    }

    const { sqft, bathrooms, units, stories, tier } = req.body;

    // Generate AI analysis
    const prompt = aiProvider.getBlueprintAnalysisPrompt({
      sqft, bathrooms, units, stories, tier
    });

    const result = await aiProvider.generate(prompt);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Save estimate with analysis
    const saved = db.createEstimate({
      ...req.body,
      ...estimate,
      analysis: result.response
    });

    res.json({
      ...estimate,
      analysis: result.response,
      estimateId: saved.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get saved estimate
router.get('/:id', (req, res) => {
  try {
    const estimate = db.getEstimate(req.params.id);

    if (!estimate) {
      return res.status(404).json({ error: 'Estimate not found' });
    }

    res.json({ estimate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all pricing tiers
router.get('/tiers/all', (req, res) => {
  try {
    const tiers = pricingService.getAllTiers();
    res.json({ tiers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
