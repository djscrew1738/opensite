/**
 * Email Alert Log API Routes
 * View alert history and statistics
 */

import express from 'express';
import { query, param, validationResult } from 'express-validator';
import { db } from '../../services/database.js';
import logger from '../../services/logger.js';
import { tryCatch } from '../../utils/response.js';

const router = express.Router();

/**
 * GET /api/email-alerts/log
 * Get alert log with optional filters
 */
router.get('/', [
  query('status').optional().isIn(['sent', 'failed']),
  query('channel').optional().isIn(['sms', 'telegram']),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('days').optional().isInt({ min: 1, max: 30 }).toInt(),
  tryCatch(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 'VALIDATION_ERROR', errors.array(), 400);
    }

    const filters = {
      status: req.query.status,
      channel: req.query.channel,
      rule_id: req.query.rule_id,
      limit: req.query.limit || 50,
    };

    const logs = await db.getAlertLog(filters);
    res.success(logs);
  })
]);

/**
 * GET /api/email-alerts/log/stats
 * Get alert statistics
 */
router.get('/stats', [
  query('days').optional().isInt({ min: 1, max: 90 }).toInt(),
  tryCatch(async (req, res) => {
    const days = req.query.days || 7;
    const stats = await db.getAlertStats(days);
    res.success(stats);
  })
]);

/**
 * GET /api/email-alerts/log/processed
 * Get recently processed emails
 */
router.get('/processed', [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  tryCatch(async (req, res) => {
    const limit = req.query.limit || 25;
    const emails = await db.getRecentProcessedEmails(limit);
    res.success(emails);
  })
]);

/**
 * GET /api/email-alerts/log/:id
 * Get a single log entry
 */
router.get('/:id', [param('id').isUUID(), tryCatch(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.error('Invalid log ID', 'VALIDATION_ERROR', errors.array(), 400);
  }

  const entry = await db.getAlertLogEntry(req.params.id);
  if (!entry) {
    return res.error('Log entry not found', 'NOT_FOUND', null, 404);
  }
  res.success(entry);
})]);

export default router;
