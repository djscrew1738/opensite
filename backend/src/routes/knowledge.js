/**
 * Knowledge Base Management Routes
 */

import express from 'express';
import { db } from '../services/database.js';
import { tryCatch } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../services/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INDEXER_PATH = path.join(__dirname, '../scripts/index-knowledge-base.js');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/* ── GET /api/knowledge ────────────────────────────────────────────── */
router.get('/', tryCatch(async (req, res) => {
  const sql = `
    SELECT id, title, source_type, source_path, metadata, createdAt, updatedAt 
    FROM knowledge_base 
    ORDER BY source_path, title
  `;
  const entries = await db.all(sql);
  
  // Group by source_path to make it easier for the frontend
  const grouped = entries.reduce((acc, entry) => {
    const path = entry.source_path || 'Other';
    if (!acc[path]) acc[path] = { path, title: entry.title.split(' (')[0], chunks: 0, entries: [] };
    acc[path].chunks++;
    acc[path].entries.push(entry);
    return acc;
  }, {});

  res.success({
    total: entries.length,
    files: Object.values(grouped),
    raw: entries
  });
}));

/* ── DELETE /api/knowledge/:id ─────────────────────────────────────── */
router.delete('/:id', tryCatch(async (req, res) => {
  await db.run('DELETE FROM knowledge_base WHERE id = ?', [req.params.id]);
  res.success({}, 'Entry deleted');
}));

/* ── POST /api/knowledge/reindex ───────────────────────────────────── */
router.post('/reindex', tryCatch(async (req, res) => {
  logger.info('[Knowledge] Triggering manual re-index...');
  
  // Run indexer as a background process
  const child = exec(`node ${INDEXER_PATH}`, (error, stdout, stderr) => {
    if (error) {
      logger.error(`[Knowledge] Re-index failed: ${error.message}`);
      return;
    }
    logger.info('[Knowledge] Manual re-index complete.');
  });

  res.success({ status: 'started' }, 'Re-indexing started in background');
}));

export default router;
