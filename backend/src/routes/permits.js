import express from 'express';
import { db } from '../services/database.js';
import logger from '../services/logger.js';

const router = express.Router();

// Logger middleware
const log = (req, _res, next) => {
  logger.debug(`[permits] ${req.method} ${req.path}`);
  next();
};

router.use(log);

/**
 * GET /api/permits/summary
 * Dashboard stats for permits
 */
router.get('/summary', (req, res) => {
  try {
    const summary = db.getPermitSummary();
    res.success(summary);
  } catch (err) {
    logger.error('[permits] Summary error:', { error: err.message, stack: err.stack });
    return res.error(err.message, 'INTERNAL_ERROR', null, 500);
  }
});

/**
 * GET /api/permits/cities
 * City list with permit counts
 */
router.get('/cities', (req, res) => {
  try {
    const cities = db.getCitiesWithCounts();
    res.success(cities);
  } catch (err) {
    logger.error('[permits] Cities error:', { error: err.message, stack: err.stack });
    return res.error(err.message, 'INTERNAL_ERROR', null, 500);
  }
});

/**
 * GET /api/permits/stats/city/:city
 * City-level stats
 */
router.get('/stats/city/:city', (req, res) => {
  try {
    const stats = db.getCityStats(decodeURIComponent(req.params.city));
    res.success(stats);
  } catch (err) {
    logger.error('[permits] City stats error:', { error: err.message, stack: err.stack });
    return res.error(err.message, 'INTERNAL_ERROR', null, 500);
  }
});

/**
 * GET /api/permits/search
 * Unified search across permits, leads, builders
 */
router.get('/search', (req, res) => {
  try {
    const { q, type } = req.query;
    if (!q || q.trim().length < 2) {
      return res.success({ permits: [], leads: [], builders: [] });
    }
    const results = db.unifiedSearch(q.trim(), type || null);
    res.success(results);
  } catch (err) {
    logger.error('[permits] Search error:', { error: err.message, stack: err.stack });
    return res.error(err.message, 'INTERNAL_ERROR', null, 500);
  }
});

/**
 * GET /api/permits/builders
 * Builder leaderboard
 * Query params: search, activityTrend, hasPlumber
 */
router.get('/builders', (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      activityTrend: req.query.activityTrend,
      hasPlumber: req.query.hasPlumber !== undefined ? req.query.hasPlumber === 'true' : undefined
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) delete filters[key];
    });

    const builders = db.getAllBuilders(filters);
    res.success({ builders, count: builders.length });
  } catch (err) {
    logger.error('[permits] Builders list error:', { error: err.message, stack: err.stack });
    return res.error(err.message, 'INTERNAL_ERROR', null, 500);
  }
});

/**
 * GET /api/permits/builders/prospects
 * Top builder prospects without plumbers
 */
router.get('/builders/prospects', async (req, res) => {
  try {
    const limit = req.query.limit ? Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 1000) : 20;

    // Import intelligence module dynamically to avoid circular dependencies
    const { getTopProspects } = await import('../services/permits/intelligence.js');
    const prospects = await getTopProspects(db, limit);

    res.success({ prospects, count: prospects.length });
  } catch (err) {
    logger.error('[permits] Prospects error:', { error: err.message, stack: err.stack });
    return res.error(err.message, 'INTERNAL_ERROR', null, 500);
  }
});

/**
 * GET /api/permits/builders/:id
 * Get single builder with permit history
 */
router.get('/builders/:id', (req, res) => {
  try {
    const builder = db.getBuilder(req.params.id);

    if (!builder) {
      return res.error('Builder not found', 'NOT_FOUND', null, 404);
    }

    // Get permit history
    const permits = db.getBuilderPermits(req.params.id);

    res.success({ ...builder, permits });
  } catch (err) {
    logger.error('[permits] Builder get error:', { error: err.message, stack: err.stack });
    return res.error(err.message, 'INTERNAL_ERROR', null, 500);
  }
});

/**
 * GET /api/permits/near
 * Get permits within radius of a location
 * Query params: lat, lng, radius (in miles)
 */
router.get('/near', (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng || !radius) {
      return res.error('lat, lng, and radius are required', 'VALIDATION_ERROR', null, 400);
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusMiles = parseFloat(radius);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusMiles)) {
      return res.error('Invalid coordinates or radius', 'VALIDATION_ERROR', null, 400);
    }

    if (latitude < -90 || latitude > 90) {
      return res.error('Latitude must be between -90 and 90', 'VALIDATION_ERROR', null, 400);
    }

    if (longitude < -180 || longitude > 180) {
      return res.error('Longitude must be between -180 and 180', 'VALIDATION_ERROR', null, 400);
    }

    if (radiusMiles < 1 || radiusMiles > 500) {
      return res.error('Radius must be between 1 and 500 miles', 'VALIDATION_ERROR', null, 400);
    }

    const permits = db.getPermitsNearLocation(latitude, longitude, radiusMiles);

    res.success({ permits, count: permits.length });
  } catch (err) {
    logger.error('[permits] Near location error:', { error: err.message, stack: err.stack });
    return res.error(err.message, 'INTERNAL_ERROR', null, 500);
  }
});

/**
 * GET /api/permits
 * List permits with filters
 * Query params: tier, status, category, zipCode, minScore, startDate, endDate, search, limit
 */
router.get('/', (req, res) => {
  try {
    // Whitelist validation for enum params
    const VALID_TIERS = ['hot', 'warm', 'cold', 'unscored'];
    const VALID_STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost', 'dismissed'];
    const VALID_CATEGORIES = ['residential', 'commercial', 'industrial', 'multi-family', 'renovation'];

    if (req.query.tier && !VALID_TIERS.includes(req.query.tier)) {
      return res.error(`Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}`, 'VALIDATION_ERROR', null, 400);
    }

    if (req.query.status && !VALID_STATUSES.includes(req.query.status)) {
      return res.error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 'VALIDATION_ERROR', null, 400);
    }

    if (req.query.category && !VALID_CATEGORIES.includes(req.query.category)) {
      return res.error(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`, 'VALIDATION_ERROR', null, 400);
    }

    const filters = {
      tier: req.query.tier,
      status: req.query.status,
      category: req.query.category,
      zipCode: req.query.zipCode,
      minScore: req.query.minScore ? Math.min(Math.max(parseInt(req.query.minScore) || 0, 0), 100) : undefined,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
      limit: req.query.limit ? Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 1000) : undefined
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) delete filters[key];
    });

    const permits = db.getAllPermits(filters);
    res.success({ permits, count: permits.length });
  } catch (err) {
    logger.error('[permits] List error:', { error: err.message, stack: err.stack });
    return res.error(err.message, 'INTERNAL_ERROR', null, 500);
  }
});

/**
 * GET /api/permits/:id
 * Get single permit with builder context
 */
router.get('/:id', (req, res) => {
  try {
    const permit = db.getPermit(req.params.id);

    if (!permit) {
      return res.error('Permit not found', 'NOT_FOUND', null, 404);
    }

    // Get associated builders
    const builders = db.getPermitBuilders(req.params.id);

    res.success({ ...permit, builders });
  } catch (err) {
    logger.error('[permits] Get error:', { error: err.message, stack: err.stack });
    return res.error(err.message, 'INTERNAL_ERROR', null, 500);
  }
});

/**
 * PATCH /api/permits/:id/status
 * Update lead status
 * Body: { status: 'new' | 'contacted' | 'quoted' | 'won' | 'lost' | 'dismissed', notes?: string }
 */
router.patch('/:id/status', (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.error('Status is required', 'VALIDATION_ERROR', null, 400);
    }

    const validStatuses = ['new', 'contacted', 'quoted', 'won', 'lost', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 'VALIDATION_ERROR', null, 400);
    }

    const updateData = { leadStatus: status };

    // Set timestamp fields based on status
    const now = new Date().toISOString();
    if (status === 'contacted') updateData.contactedAt = now;
    if (status === 'quoted') updateData.quotedAt = now;
    if (status === 'won') updateData.wonAt = now;

    if (notes) updateData.leadNotes = notes;

    const updated = db.updatePermit(req.params.id, updateData);

    if (!updated) {
      return res.error('Permit not found', 'NOT_FOUND', null, 404);
    }

    res.success(updated);
  } catch (err) {
    logger.error('[permits] Status update error:', { error: err.message, stack: err.stack });
    return res.error(err.message, 'INTERNAL_ERROR', null, 500);
  }
});

export default router;
