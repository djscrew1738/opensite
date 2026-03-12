// Permit management routes
// Provides endpoints for permit summary, city stats, builder intelligence, and geographic search

import express from 'express';
import { db } from '../services/database.js';
import logger from '../services/logger.js';
import { tryCatch, parsePagination, paginationMeta } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth-jwt.js';

const router = express.Router();

// Secure all permit routes
router.use(authenticateToken);

/**
 * GET /api/permits/summary - Dashboard statistics
 */
router.get('/summary', tryCatch(async (req, res) => {
  const summary = await db.getPermitSummary();
  res.success(summary);
}));

/**
 * GET /api/permits/cities - City list with permit counts
 */
router.get('/cities', tryCatch(async (req, res) => {
  const cities = await db.getCitiesWithCounts();
  res.success(cities);
}));

/**
 * GET /api/permits/stats/city/:city - Detailed city statistics
 */
router.get('/stats/city/:city', tryCatch(async (req, res) => {
  const city = decodeURIComponent(req.params.city);
  const stats = await db.getCityStats(city);
  res.success(stats);
}));

/**
 * GET /api/permits/search - Unified search across permits, leads, and builders
 */
router.get('/search', tryCatch(async (req, res) => {
  const { q, type } = req.query;
  if (!q || q.trim().length < 2) {
    return res.success({ permits: [], leads: [], builders: [] });
  }
  const results = await db.unifiedSearch(q.trim(), type || null);
  res.success(results);
}));

/**
 * GET /api/permits/builders - Builder leaderboard with filtering
 */
router.get('/builders', tryCatch(async (req, res) => {
  const { search, hasPlumber } = req.query;
  const { page, limit, offset } = parsePagination(req.query, { limit: 50 });
  
  const builders = await db.getAllBuilders({
    search,
    hasPlumber: hasPlumber !== undefined ? (hasPlumber === 'true' || hasPlumber === '1') : undefined,
    limit,
    offset
  });
  
  res.success({ builders, total: builders.length }, null, paginationMeta(page, limit, builders.length));
}));

/**
 * GET /api/permits/builders/prospects - Top active builders without known plumbers
 */
router.get('/builders/prospects', tryCatch(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  
  // Dynamic import for the intelligence service
  const { getTopProspects } = await import('../services/permits/intelligence.js');
  const prospects = await getTopProspects(db, limit);
  
  res.success({ prospects, count: prospects.length });
}));

/**
 * GET /api/permits/builders/:id - Single builder details and permit history
 */
router.get('/builders/:id', tryCatch(async (req, res) => {
  const builder = await db.getBuilder(req.params.id);
  if (!builder) return res.error('Builder not found', 'NOT_FOUND', null, 404);

  const permits = await db.getBuilderPermits(req.params.id);
  res.success({ ...builder, permits });
}));

/**
 * GET /api/permits/near - Geographic permit search
 */
router.get('/near', tryCatch(async (req, res) => {
  const { lat, lng, radius } = req.query;
  if (!lat || !lng || !radius) {
    return res.error('lat, lng, and radius are required', 'VALIDATION_ERROR', null, 400);
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const radiusMiles = parseFloat(radius);

  if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusMiles)) {
    return res.error('Invalid numeric values for coordinates or radius', 'VALIDATION_ERROR', null, 400);
  }

  const permits = await db.getPermitsNearLocation(latitude, longitude, radiusMiles);
  res.success({ permits, count: permits.length });
}));

/**
 * GET /api/permits - Main permit listing with comprehensive filters
 */
router.get('/', tryCatch(async (req, res) => {
  const { tier, status, city, zipCode, minScore, startDate, endDate, search } = req.query;
  const { page, limit, offset } = parsePagination(req.query);
  
  const permits = await db.getAllPermits({
    tier, status, city, zipCode, search,
    minScore: minScore ? parseInt(minScore) : undefined,
    startDate, endDate,
    limit, offset
  });
  
  res.success({ permits, total: permits.length }, null, paginationMeta(page, limit, permits.length));
}));

/**
 * GET /api/permits/:id - Detailed permit info
 */
router.get('/:id', tryCatch(async (req, res) => {
  const permit = await db.getPermit(req.params.id);
  if (!permit) return res.error('Permit not found', 'NOT_FOUND', null, 404);

  const builders = await db.getPermitBuilders(req.params.id);
  res.success({ ...permit, builders });
}));

/**
 * PATCH /api/permits/:id/status - Update permit status/lead tracking
 */
router.patch('/:id/status', tryCatch(async (req, res) => {
  const { status, tier, leadScore } = req.body;
  
  const updated = await db.updatePermit(req.params.id, { status, tier, leadScore });
  if (!updated) return res.error('Permit not found', 'NOT_FOUND', null, 404);
  
  res.success(updated, 'Permit updated successfully');
}));

export default router;
