const express = require('express');
const cors = require('cors');
const config = require('../config');
const db = require('../db');
const { getTopProspects } = require('../builders/intelligence');
const logger = require('../utils/logger');

const app = express();
app.use(cors());
app.use(express.json());

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'opensite-lead-finder', timestamp: new Date().toISOString() });
});

// ── Dashboard summary stats ──
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*) as total_permits,
        COUNT(*) FILTER (WHERE lead_tier = 'hot') as hot_leads,
        COUNT(*) FILTER (WHERE lead_tier = 'warm') as warm_leads,
        COUNT(*) FILTER (WHERE lead_tier = 'cold') as cold_leads,
        COUNT(*) FILTER (WHERE lead_status = 'new') as new_leads,
        COUNT(*) FILTER (WHERE lead_status = 'contacted') as contacted,
        COUNT(*) FILTER (WHERE lead_status = 'quoted') as quoted,
        COUNT(*) FILTER (WHERE lead_status = 'won') as won,
        COUNT(*) FILTER (WHERE lead_status = 'lost') as lost,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_new,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_new
      FROM permits
    `);

    const builderResult = await db.query(`
      SELECT
        COUNT(*) as total_builders,
        COUNT(*) FILTER (WHERE activity_trend = 'ramping_up') as ramping_up,
        COUNT(*) FILTER (WHERE has_plumber = FALSE AND permits_last_30d > 0) as no_plumber_active
      FROM builders
    `);

    res.json({
      permits: result.rows[0],
      builders: builderResult.rows[0],
    });
  } catch (err) {
    logger.error(`Dashboard summary error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Get leads with filtering and pagination ──
app.get('/api/leads', async (req, res) => {
  try {
    const {
      tier,
      status = 'new',
      category,
      zip,
      minScore,
      limit = 50,
      offset = 0,
      sort = 'lead_score',
      order = 'DESC',
    } = req.query;

    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (tier) {
      conditions.push(`p.lead_tier = $${paramIdx++}`);
      params.push(tier);
    }
    if (status) {
      conditions.push(`p.lead_status = $${paramIdx++}`);
      params.push(status);
    }
    if (category) {
      conditions.push(`p.permit_category = $${paramIdx++}`);
      params.push(category);
    }
    if (zip) {
      conditions.push(`p.zip_code = $${paramIdx++}`);
      params.push(zip);
    }
    if (minScore) {
      conditions.push(`p.lead_score >= $${paramIdx++}`);
      params.push(parseInt(minScore));
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Whitelist sort columns
    const allowedSorts = ['lead_score', 'issued_date', 'estimated_cost', 'created_at'];
    const sortCol = allowedSorts.includes(sort) ? sort : 'lead_score';
    const sortDir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const result = await db.query(`
      SELECT
        p.*,
        b.company as builder_company,
        b.activity_trend as builder_trend,
        b.has_plumber as builder_has_plumber,
        b.permits_last_30d as builder_recent_permits,
        b.relationship_status as builder_relationship,
        ds.display_name as source_name
      FROM permits p
      LEFT JOIN permit_builder_map pbm ON p.id = pbm.permit_id AND pbm.role = 'contractor'
      LEFT JOIN builders b ON pbm.builder_id = b.id
      LEFT JOIN data_sources ds ON p.source_id = ds.id
      ${whereClause}
      ORDER BY p.${sortCol} ${sortDir}
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `, [...params, parseInt(limit), parseInt(offset)]);

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM permits p ${whereClause}`,
      params
    );

    res.json({
      leads: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

  } catch (err) {
    logger.error(`Leads query error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Get single lead detail ──
app.get('/api/leads/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        p.*,
        ds.display_name as source_name,
        json_agg(
          json_build_object(
            'builder_id', b.id,
            'name', b.name,
            'company', b.company,
            'role', pbm.role,
            'activity_trend', b.activity_trend,
            'has_plumber', b.has_plumber,
            'known_plumber', b.known_plumber,
            'permits_last_30d', b.permits_last_30d,
            'relationship_status', b.relationship_status
          )
        ) FILTER (WHERE b.id IS NOT NULL) as builders
      FROM permits p
      LEFT JOIN data_sources ds ON p.source_id = ds.id
      LEFT JOIN permit_builder_map pbm ON p.id = pbm.permit_id
      LEFT JOIN builders b ON pbm.builder_id = b.id
      WHERE p.id = $1
      GROUP BY p.id, ds.display_name
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    logger.error(`Lead detail error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Update lead status ──
app.patch('/api/leads/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['new', 'contacted', 'quoted', 'won', 'lost', 'dismissed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be: ${validStatuses.join(', ')}` });
    }

    const timestampField = {
      contacted: 'contacted_at',
      quoted: 'quoted_at',
      won: 'won_at',
    }[status];

    let query = `UPDATE permits SET lead_status = $1, updated_at = NOW()`;
    const params = [status];

    if (timestampField) {
      query += `, ${timestampField} = NOW()`;
    }
    if (notes) {
      query += `, lead_notes = $${params.length + 1}`;
      params.push(notes);
    }

    query += ` WHERE id = $${params.length + 1} RETURNING *`;
    params.push(req.params.id);

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    logger.error(`Lead status update error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Builder endpoints ──
app.get('/api/builders', async (req, res) => {
  try {
    const { trend, relationship, limit = 50, offset = 0 } = req.query;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (trend) {
      conditions.push(`activity_trend = $${idx++}`);
      params.push(trend);
    }
    if (relationship) {
      conditions.push(`relationship_status = $${idx++}`);
      params.push(relationship);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.query(`
      SELECT * FROM builders ${where}
      ORDER BY permits_last_30d DESC, total_permits DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `, [...params, parseInt(limit), parseInt(offset)]);

    res.json({ builders: result.rows });
  } catch (err) {
    logger.error(`Builders query error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Top prospects (no plumber, active) ──
app.get('/api/builders/prospects', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '20');
    const prospects = await getTopProspects(limit);
    res.json({ prospects });
  } catch (err) {
    logger.error(`Prospects query error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Update builder relationship status ──
app.patch('/api/builders/:id', async (req, res) => {
  try {
    const { relationship_status, notes, priority_rank } = req.body;
    const updates = [];
    const params = [];
    let idx = 1;

    if (relationship_status) {
      updates.push(`relationship_status = $${idx++}`);
      params.push(relationship_status);
    }
    if (notes !== undefined) {
      updates.push(`relationship_notes = $${idx++}`);
      params.push(notes);
    }
    if (priority_rank !== undefined) {
      updates.push(`priority_rank = $${idx++}`);
      params.push(priority_rank);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = NOW()');
    params.push(req.params.id);

    const result = await db.query(
      `UPDATE builders SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Builder not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    logger.error(`Builder update error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Data source status ──
app.get('/api/sources', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM data_sources ORDER BY name');
    res.json({ sources: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Ingestion stats over time ──
app.get('/api/stats/ingestion', async (req, res) => {
  try {
    const days = parseInt(req.query.days || '30');
    const result = await db.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE lead_tier = 'hot') as hot,
        COUNT(*) FILTER (WHERE lead_tier = 'warm') as warm,
        COUNT(*) FILTER (WHERE permit_category = 'new_construction') as new_construction
      FROM permits
      WHERE created_at >= CURRENT_DATE - ($1 || ' days')::interval
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [days]);
    res.json({ stats: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Conversion funnel ──
app.get('/api/stats/funnel', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        lead_status,
        COUNT(*) as count,
        SUM(estimated_cost) as total_value
      FROM permits
      WHERE lead_tier IN ('hot', 'warm')
      GROUP BY lead_status
      ORDER BY
        CASE lead_status
          WHEN 'new' THEN 1
          WHEN 'contacted' THEN 2
          WHEN 'quoted' THEN 3
          WHEN 'won' THEN 4
          WHEN 'lost' THEN 5
          WHEN 'dismissed' THEN 6
        END
    `);
    res.json({ funnel: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Geographic heatmap data ──
app.get('/api/stats/geo', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        zip_code,
        COUNT(*) as permit_count,
        COUNT(*) FILTER (WHERE lead_tier = 'hot') as hot_count,
        AVG(lead_score) as avg_score,
        SUM(estimated_cost) as total_value
      FROM permits
      WHERE zip_code IS NOT NULL
        AND created_at >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY zip_code
      ORDER BY permit_count DESC
    `);
    res.json({ areas: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Start the API server
 */
function startServer() {
  return new Promise((resolve) => {
    app.listen(config.api.port, () => {
      logger.info(`Lead Finder API running on port ${config.api.port}`);
      resolve(app);
    });
  });
}

module.exports = { app, startServer };
