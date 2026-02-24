const express = require('express');
const db = require('../db');

const router = express.Router();

/**
 * GET /api/projects
 * List all projects
 */
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT p.*, 
             COUNT(DISTINCT s.id) as session_count,
             COUNT(DISTINCT CASE WHEN ai.completed = FALSE THEN ai.id END) as open_actions
      FROM projects p
      LEFT JOIN sessions s ON p.id = s.project_id
      LEFT JOIN action_items ai ON p.id = ai.project_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.json({ projects: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/projects
 * Create new project
 */
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const { rows: [project] } = await db.query(
      `INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING *`,
      [name, description]
    );

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/projects/:id
 * Get project details with sessions
 */
router.get('/:id', async (req, res) => {
  try {
    const { rows: [project] } = await db.query(
      'SELECT * FROM projects WHERE id = $1',
      [req.params.id]
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { rows: sessions } = await db.query(
      `SELECT id, title, status, duration_secs, created_at, summary
       FROM sessions WHERE project_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );

    const { rows: actionItems } = await db.query(
      `SELECT * FROM action_items 
       WHERE project_id = $1 AND completed = FALSE
       ORDER BY created_at DESC`,
      [req.params.id]
    );

    res.json({ ...project, sessions, action_items: actionItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
