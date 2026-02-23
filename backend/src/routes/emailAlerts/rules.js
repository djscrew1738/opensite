/**
 * Email Alert Rules API Routes
 * CRUD operations for keyword rules
 */

// Triggering server reload
import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { db } from '../../services/database.js';
import logger from '../../services/logger.js';
import { tryCatch } from '../../utils/response.js';

const router = express.Router();

/**
 * GET /api/email-alerts/rules
 * Get all keyword rules
 */
router.get('/', tryCatch(async (req, res) => {
  const { active } = req.query;
  const rules = await db.getAllEmailAlertRules(active === 'true');
  res.success(rules);
}));

/**
 * GET /api/email-alerts/rules/:id
 * Get a single rule
 */
router.get('/:id', [param('id').isUUID(), tryCatch(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.error('Invalid rule ID', 'VALIDATION_ERROR', errors.array(), 400);
  }

  const rule = await db.getEmailAlertRule(req.params.id);
  if (!rule) {
    return res.error('Rule not found', 'NOT_FOUND', null, 404);
  }
  res.success(rule);
})]);

/**
 * POST /api/email-alerts/rules
 * Create a new rule
 */
router.post('/', [
  body('name').trim().notEmpty().withMessage('Rule name is required'),
  body('keyword').trim().notEmpty().withMessage('Keyword is required'),
  body('match_type').optional().isIn(['exact', 'contains', 'regex']).withMessage('Invalid match type'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('alert_channels').optional().isIn(['sms', 'telegram', 'both']).withMessage('Invalid alert channels'),
  body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  tryCatch(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 'VALIDATION_ERROR', errors.array(), 400);
    }

    const rule = await db.createEmailAlertRule({
      name: req.body.name,
      keyword: req.body.keyword,
      secondary_keyword: req.body.secondary_keyword || null,
      match_type: req.body.match_type || 'contains',
      priority: req.body.priority || 'medium',
      alert_channels: req.body.alert_channels || 'both',
      active: req.body.active !== false,
    });

    logger.info(`[emailAlerts/rules] Created rule: ${rule.name}`);
    res.success(rule, 'Rule created successfully', 201);
  })
]);

/**
 * PATCH /api/email-alerts/rules/:id
 * Update a rule
 */
router.patch('/:id', [
  param('id').isUUID(),
  body('name').optional().trim().notEmpty(),
  body('keyword').optional().trim().notEmpty(),
  body('match_type').optional().isIn(['exact', 'contains', 'regex']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('alert_channels').optional().isIn(['sms', 'telegram', 'both']),
  body('active').optional().isBoolean(),
  tryCatch(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 'VALIDATION_ERROR', errors.array(), 400);
    }

    const existing = await db.getEmailAlertRule(req.params.id);
    if (!existing) {
      return res.error('Rule not found', 'NOT_FOUND', null, 404);
    }

    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.keyword !== undefined) updateData.keyword = req.body.keyword;
    if (req.body.secondary_keyword !== undefined) updateData.secondary_keyword = req.body.secondary_keyword;
    if (req.body.match_type !== undefined) updateData.match_type = req.body.match_type;
    if (req.body.priority !== undefined) updateData.priority = req.body.priority;
    if (req.body.alert_channels !== undefined) updateData.alert_channels = req.body.alert_channels;
    if (req.body.active !== undefined) updateData.active = req.body.active;

    const rule = await db.updateEmailAlertRule(req.params.id, updateData);
    logger.info(`[emailAlerts/rules] Updated rule: ${rule.name}`);
    res.success(rule, 'Rule updated successfully');
  })
]);

/**
 * DELETE /api/email-alerts/rules/:id
 * Delete a rule
 */
router.delete('/:id', [param('id').isUUID(), tryCatch(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.error('Invalid rule ID', 'VALIDATION_ERROR', errors.array(), 400);
  }

  const existing = await db.getEmailAlertRule(req.params.id);
  if (!existing) {
    return res.error('Rule not found', 'NOT_FOUND', null, 404);
  }

  await db.deleteEmailAlertRule(req.params.id);
  logger.info(`[emailAlerts/rules] Deleted rule: ${existing.name}`);
  res.success({ deleted: true }, 'Rule deleted successfully');
})]);

/**
 * POST /api/email-alerts/rules/:id/toggle
 * Toggle rule active status
 */
router.post('/:id/toggle', [param('id').isUUID(), tryCatch(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.error('Invalid rule ID', 'VALIDATION_ERROR', errors.array(), 400);
  }

  const rule = await db.getEmailAlertRule(req.params.id);
  if (!rule) {
    return res.error('Rule not found', 'NOT_FOUND', null, 404);
  }

  const updated = await db.updateEmailAlertRule(req.params.id, { active: !rule.active });
  res.success(updated, `Rule ${updated.active ? 'activated' : 'deactivated'}`);
})]);

export default router;
