// Pricing and estimation routes

import express from 'express';
import { pricingService } from '../services/pricing.js';
import { aiProvider } from '../services/ai-provider.js';
import { db } from '../services/database.js';
import { cache } from '../services/cache.js';
import { validateEstimate, validateId } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { tryCatch, parsePagination, paginationMeta } from '../utils/response.js';
import logger from '../services/logger.js';

const router = express.Router();

// Apply authentication to all estimates routes
router.use(authenticateToken);

/**
 * GET /estimates - List saved estimates
 */
router.get('/', tryCatch(async (req, res) => {
  const { search, leadId } = req.query;
  const { page, limit, offset } = parsePagination(req.query);
  const userId = req.user.id;
  
  const result = await db.getAllEstimates({ 
    search, 
    leadId,
    userId, 
    limit, 
    offset 
  });
  
  res.success({
    estimates: result.estimates,
    total: result.total
  }, null, paginationMeta(page, limit, result.total));
}));

/**
 * GET /estimates/:id - Get detailed estimate
 */
router.get('/:id', validateId, tryCatch(async (req, res) => {
  const { id } = req.params;
  const estimate = await db.getEstimate(id);

  if (!estimate) {
    return res.error('Estimate not found', 'NOT_FOUND', { id }, 404);
  }

  res.success({ estimate });
}));

/**
 * Helper to process calculation parameters
 */
function getCalculationParams(body) {
  if (body.mode === 'fixture-based') {
    return { mode: 'fixture-based', fixtures: body.fixtures || body };
  }

  const { sqft, bathrooms, units, stories, tier, leadId } = body;
  
  if (!sqft || !bathrooms || !units || !stories || !tier) {
    throw new Error('Missing required fields: sqft, bathrooms, units, stories, tier');
  }

  return {
    mode: 'tier-based',
    params: {
      sqft: Number(sqft),
      bathrooms: Number(bathrooms),
      units: Number(units),
      stories: Number(stories),
      tier: tier.toLowerCase()
    },
    leadId
  };
}

/**
 * POST /estimates/calculate - Perform calculation and save
 */
router.post('/calculate', tryCatch(async (req, res) => {
  let calcParams;
  try {
    calcParams = getCalculationParams(req.body);
  } catch (err) {
    return res.error(err.message, 'VALIDATION_ERROR', null, 400);
  }

  let estimate;
  if (calcParams.mode === 'fixture-based') {
    estimate = pricingService.calculateFixtureBased(calcParams.fixtures);
  } else {
    estimate = pricingService.calculateEstimate(calcParams.params);
  }

  // Save to database
  const saved = await db.createEstimate({
    ...req.body,
    ...estimate,
    userId: req.user.id
  });

  res.success({
    ...estimate,
    estimateId: saved.id
  }, 'Estimate calculated and saved');
}));

/**
 * POST /estimates/analyze - Perform calculation + AI analysis and save
 */
router.post('/analyze', tryCatch(async (req, res) => {
  let calcParams;
  try {
    calcParams = getCalculationParams(req.body);
  } catch (err) {
    return res.error(err.message, 'VALIDATION_ERROR', null, 400);
  }

  let estimate;
  if (calcParams.mode === 'fixture-based') {
    estimate = pricingService.calculateFixtureBased(calcParams.fixtures);
  } else {
    estimate = pricingService.calculateEstimate(calcParams.params);
  }

  // Generate AI analysis
  const analysisPrompt = aiProvider.getBlueprintAnalysisPrompt({
    ...req.body,
    total: estimate.total,
    breakdown: estimate.breakdown
  });

  const aiResult = await aiProvider.generate(analysisPrompt);

  if (!aiResult.success) {
    logger.warn('AI analysis failed during estimate generation', { error: aiResult.error });
  }

  // Save estimate with analysis
  const saved = await db.createEstimate({
    ...req.body,
    ...estimate,
    analysis: aiResult.success ? aiResult.response : 'AI analysis unavailable',
    userId: req.user.id
  });

  res.success({
    ...estimate,
    analysis: aiResult.success ? aiResult.response : null,
    estimateId: saved.id,
    aiError: aiResult.success ? null : aiResult.error
  }, 'Detailed AI analysis completed');
}));

/**
 * DELETE /estimates/:id - Delete an estimate
 */
router.delete('/:id', validateId, tryCatch(async (req, res) => {
  const { id } = req.params;
  const deleted = await db.deleteEstimate(id);

  if (!deleted) {
    return res.error('Estimate not found', 'NOT_FOUND', { id }, 404);
  }

  res.success({ deleted: true }, 'Estimate deleted successfully');
}));

/**
 * GET /estimates/tiers/all - List available pricing tiers
 */
router.get('/tiers/all', tryCatch(async (req, res) => {
  const tiers = pricingService.getAllTiers();
  res.success({ tiers });
}));

export default router;
