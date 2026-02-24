const express = require('express');
const db = require('../db');

const router = express.Router();

/**
 * GET /api/sessions
 * List all sessions
 */
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT s.*, p.name as project_name
      FROM sessions s
      LEFT JOIN projects p ON s.project_id = p.id
      ORDER BY s.created_at DESC
    `);
    res.json({ sessions: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/sessions/:id
 * Get session details
 */
router.get('/:id', async (req, res) => {
  try {
    const { rows: [session] } = await db.query(`
      SELECT s.*, p.name as project_name
      FROM sessions s
      LEFT JOIN projects p ON s.project_id = p.id
      WHERE s.id = $1
    `, [req.params.id]);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get action items
    const { rows: actionItems } = await db.query(
      'SELECT * FROM action_items WHERE session_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );

    // Get attachments
    const { rows: attachments } = await db.query(
      'SELECT * FROM attachments WHERE session_id = $1',
      [req.params.id]
    );

    res.json({ ...session, action_items: actionItems, attachments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/sessions/:id/transcript
 * Get session transcript
 */
router.get('/:id/transcript', async (req, res) => {
  try {
    const { rows: [session] } = await db.query(
      'SELECT transcript FROM sessions WHERE id = $1',
      [req.params.id]
    );
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ transcript: session.transcript });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
