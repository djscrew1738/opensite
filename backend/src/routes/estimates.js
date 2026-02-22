// Pricing and estimation routes

import express from 'express';
import { pricingService } from '../services/pricing.js';
import { aiProvider } from '../services/ai-provider.js';
import { db } from '../services/database.js';
import { tryCatch } from '../utils/response.js';
import logger from '../services/logger.js';

const router = express.Router();

// Calculate estimate
router.post('/calculate', tryCatch(async (req, res) => {
  // Fixture-based pricing mode
  if (req.body.mode === 'fixture-based') {
    const estimate = pricingService.calculateFixtureBased(req.body.fixtures || req.body);

    const saved = db.createEstimate({
      ...req.body,
      ...estimate
    });

    return res.success({
      ...estimate,
      estimateId: saved.id
    });
  }

  // Legacy tier-based pricing
  const { sqft, bathrooms, units, stories, tier } = req.body;

  // Validate required fields
  if (!sqft || !bathrooms || !units || !stories || !tier) {
    return res.error(
      'Missing required fields: sqft, bathrooms, units, stories, tier',
      'VALIDATION_ERROR',
      null,
      400
    );
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

  res.success({
    ...estimate,
    estimateId: saved.id
  });
}));

// Deep AI analysis of blueprint/estimate
router.post('/analyze', tryCatch(async (req, res) => {
  let estimate;

  if (req.body.mode === 'fixture-based') {
    estimate = pricingService.calculateFixtureBased(req.body.fixtures || req.body);
  } else {
    const { sqft, bathrooms, units, stories, tier } = req.body;

    if (!sqft || !bathrooms || !units || !stories || !tier) {
      return res.error(
        'Missing required fields: sqft, bathrooms, units, stories, tier',
        'VALIDATION_ERROR',
        null,
        400
      );
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
    return res.error(
      result.error || 'AI analysis failed',
      'AI_ERROR',
      null,
      503
    );
  }

  // Save estimate with analysis
  const saved = db.createEstimate({
    ...req.body,
    ...estimate,
    analysis: result.response
  });

  res.success({
    ...estimate,
    analysis: result.response,
    estimateId: saved.id
  });
}));

// Get saved estimate
router.get('/:id', tryCatch(async (req, res) => {
  const estimate = db.getEstimate(req.params.id);

  if (!estimate) {
    return res.error('Estimate not found', 'NOT_FOUND', null, 404);
  }

  res.success({ estimate });
}));

// Get all pricing tiers
router.get('/tiers/all', tryCatch(async (req, res) => {
  const tiers = pricingService.getAllTiers();
  res.success({ tiers });
}));

export default router;
