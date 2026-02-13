import express from 'express';
import { db } from '../services/database.js';

const router = express.Router();

// Logger middleware
const log = (req, _res, next) => {
  console.log(`[permits] ${req.method} ${req.path}`);
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
    res.json({ success: true, data: summary });
  } catch (err) {
    console.error('[permits] Summary error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/permits
 * List permits with filters
 * Query params: tier, status, category, zipCode, minScore, startDate, endDate, search, limit
 */
router.get('/', (req, res) => {
  try {
    const filters = {
      tier: req.query.tier,
      status: req.query.status,
      category: req.query.category,
      zipCode: req.query.zipCode,
      minScore: req.query.minScore ? parseInt(req.query.minScore) : undefined,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) delete filters[key];
    });

    const permits = db.getAllPermits(filters);
    res.json({ success: true, data: permits, count: permits.length });
  } catch (err) {
    console.error('[permits] List error:', err);
    res.status(500).json({ success: false, error: err.message });
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
      return res.status(404).json({ success: false, error: 'Permit not found' });
    }

    // Get associated builders
    const builders = db.getPermitBuilders(req.params.id);

    res.json({
      success: true,
      data: {
        ...permit,
        builders
      }
    });
  } catch (err) {
    console.error('[permits] Get error:', err);
    res.status(500).json({ success: false, error: err.message });
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
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const validStatuses = ['new', 'contacted', 'quoted', 'won', 'lost', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
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
      return res.status(404).json({ success: false, error: 'Permit not found' });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[permits] Status update error:', err);
    res.status(500).json({ success: false, error: err.message });
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
    res.json({ success: true, data: builders, count: builders.length });
  } catch (err) {
    console.error('[permits] Builders list error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/permits/builders/prospects
 * Top builder prospects without plumbers
 */
router.get('/builders/prospects', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    // Import intelligence module dynamically to avoid circular dependencies
    const { getTopProspects } = await import('../services/permits/intelligence.js');
    const prospects = await getTopProspects(db, limit);

    res.json({ success: true, data: prospects, count: prospects.length });
  } catch (err) {
    console.error('[permits] Prospects error:', err);
    res.status(500).json({ success: false, error: err.message });
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
      return res.status(404).json({ success: false, error: 'Builder not found' });
    }

    // Get permit history
    const permits = db.getBuilderPermits(req.params.id);

    res.json({
      success: true,
      data: {
        ...builder,
        permits
      }
    });
  } catch (err) {
    console.error('[permits] Builder get error:', err);
    res.status(500).json({ success: false, error: err.message });
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
      return res.status(400).json({
        success: false,
        error: 'lat, lng, and radius are required'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusMiles = parseFloat(radius);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusMiles)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates or radius'
      });
    }

    const permits = db.getPermitsNearLocation(latitude, longitude, radiusMiles);

    res.json({ success: true, data: permits, count: permits.length });
  } catch (err) {
    console.error('[permits] Near location error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
