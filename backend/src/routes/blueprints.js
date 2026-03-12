// Blueprint API Routes - CRUD for legacy blueprint records

import express from 'express';
import { db } from '../services/database.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { tryCatch, parsePagination, paginationMeta } from '../utils/response.js';
import { validateId } from '../middleware/validation.js';
import logger from '../services/logger.js';

const router = express.Router();

// Apply authentication to all blueprint routes
router.use(authenticateToken);

/**
 * GET /api/blueprints - List all legacy blueprints
 */
router.get('/', tryCatch(async (req, res) => {
  const { estimateId } = req.query;
  const { page, limit, offset } = parsePagination(req.query);
  
  const blueprints = await db.getAllBlueprints({ 
    userId: req.user.id,
    estimateId,
    limit,
    offset
  });
  
  res.success({
    blueprints,
    total: blueprints.length
  }, null, paginationMeta(page, limit, blueprints.length));
}));

/**
 * GET /api/blueprints/:id - Get single blueprint
 */
router.get('/:id', validateId, tryCatch(async (req, res) => {
  const blueprint = await db.getBlueprint(req.params.id);
  
  if (!blueprint) {
    return res.error('Blueprint not found', 'NOT_FOUND', null, 404);
  }
  
  // Basic security check
  if (blueprint.userId && blueprint.userId !== req.user.id && req.user.role !== 'admin') {
    return res.error('Access denied', 'FORBIDDEN', null, 403);
  }
  
  res.success(blueprint);
}));

/**
 * DELETE /api/blueprints/:id - Delete a blueprint record
 */
router.delete('/:id', validateId, tryCatch(async (req, res) => {
  const blueprint = await db.getBlueprint(req.params.id);
  
  if (!blueprint) {
    return res.error('Blueprint not found', 'NOT_FOUND', null, 404);
  }
  
  // Ownership check
  if (blueprint.userId && blueprint.userId !== req.user.id && req.user.role !== 'admin') {
    return res.error('Access denied', 'FORBIDDEN', null, 403);
  }
  
  const deleted = await db.deleteBlueprint(req.params.id);
  
  if (!deleted) {
    return res.error('Failed to delete blueprint', 'INTERNAL_ERROR', null, 500);
  }
  
  logger.info('Blueprint record deleted', { id: req.params.id, userId: req.user.id });
  res.success({ id: req.params.id }, 'Blueprint deleted successfully');
}));

/**
 * PATCH /api/blueprints/:id - Update blueprint details
 */
router.patch('/:id', validateId, tryCatch(async (req, res) => {
  const { fileName, estimateId } = req.body;
  
  const updated = await db.updateBlueprint(req.params.id, { fileName, estimateId });
  
  if (!updated) {
    return res.error('Blueprint not found', 'NOT_FOUND', null, 404);
  }
  
  res.success(updated, 'Blueprint updated');
}));

export default router;
