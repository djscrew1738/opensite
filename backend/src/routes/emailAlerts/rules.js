/**
 * Email Alert Rules API Routes
 * CRUD operations for keyword rules
 */

import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { db } from '../../services/database.js';
import logger from '../../services/logger.js';

const router = express.Router();

/**
 * GET /api/email-alerts/rules
 * Get all keyword rules
 */
router.get('/', (req, res) => {
  try {
    const { active } = req.query;
    const rules = db.getAllEmailAlertRules(active === 'true');
    res.success(rules);
  } catch (error) {
    logger.error('[emailAlerts/rules] Failed to get rules:', error.message);
    res.error('Failed to retrieve rules', 'DB_ERROR', null, 500);
  }
});

/**
 * GET /api/email-alerts/rules/:id
 * Get a single rule
 */
router.get('/:id', param('id').isUUID(), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.error('Invalid rule ID', 'VALIDATION_ERROR', errors.array(), 400);
  }

  try {
    const rule = db.getEmailAlertRule(req.params.id);
    if (!rule) {
      return res.error('Rule not found', 'NOT_FOUND', null, 404);
    }
    res.success(rule);
  } catch (error) {
    logger.error('[emailAlerts/rules] Failed to get rule:', error.message);
    res.error('Failed to retrieve rule', 'DB_ERROR', null, 500);
  }
});

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
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.error('Validation failed', 'VALIDATION_ERROR', errors.array(), 400);
  }

  try {
    const rule = db.createEmailAlertRule({
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
  } catch (error) {
    logger.error('[emailAlerts/rules] Failed to create rule:', error.message);
    res.error('Failed to create rule', 'DB_ERROR', null, 500);
  }
});

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
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.error('Validation failed', 'VALIDATION_ERROR', errors.array(), 400);
  }

  try {
    const existing = db.getEmailAlertRule(req.params.id);
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

    const rule = db.updateEmailAlertRule(req.params.id, updateData);
    logger.info(`[emailAlerts/rules] Updated rule: ${rule.name}`);
    res.success(rule, 'Rule updated successfully');
  } catch (error) {
    logger.error('[emailAlerts/rules] Failed to update rule:', error.message);
    res.error('Failed to update rule', 'DB_ERROR', null, 500);
  }
});

/**
 * DELETE /api/email-alerts/rules/:id
 * Delete a rule
 */
router.delete('/:id', param('id').isUUID(), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.error('Invalid rule ID', 'VALIDATION_ERROR', errors.array(), 400);
  }

  try {
    const existing = db.getEmailAlertRule(req.params.id);
    if (!existing) {
      return res.error('Rule not found', 'NOT_FOUND', null, 404);
    }

    db.deleteEmailAlertRule(req.params.id);
    logger.info(`[emailAlerts/rules] Deleted rule: ${existing.name}`);
    res.success({ deleted: true }, 'Rule deleted successfully');
  } catch (error) {
    logger.error('[emailAlerts/rules] Failed to delete rule:', error.message);
    res.error('Failed to delete rule', 'DB_ERROR', null, 500);
  }
});

/**
 * POST /api/email-alerts/rules/:id/toggle
 * Toggle rule active status
 */
router.post('/:id/toggle', param('id').isUUID(), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.error('Invalid rule ID', 'VALIDATION_ERROR', errors.array(), 400);
  }

  try {
    const rule = db.getEmailAlertRule(req.params.id);
    if (!rule) {
      return res.error('Rule not found', 'NOT_FOUND', null, 404);
    }

    const updated = db.updateEmailAlertRule(req.params.id, { active: !rule.active });
    res.success(updated, `Rule ${updated.active ? 'activated' : 'deactivated'}`);
  } catch (error) {
    logger.error('[emailAlerts/rules] Failed to toggle rule:', error.message);
    res.error('Failed to toggle rule', 'DB_ERROR', null, 500);
  }
});

export default router;
