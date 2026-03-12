// Service Areas API Routes
// Management of geographic service areas for lead scoring

import express from 'express';
import { db } from '../services/database.js';
import { authenticateToken, requireRole } from '../middleware/auth-jwt.js';
import { tryCatch } from '../utils/response.js';
import { validateId } from '../middleware/validation.js';
import logger from '../services/logger.js';

const router = express.Router();

// Secure all routes
router.use(authenticateToken);

/**
 * GET /api/service-areas - List all service areas
 */
router.get('/', tryCatch(async (req, res) => {
  const { active, type } = req.query;
  const areas = await db.getAllServiceAreas({
    activeOnly: active !== 'false',
    type
  });
  res.success(areas);
}));

/**
 * GET /api/service-areas/:id - Get single area
 */
router.get('/:id', validateId, tryCatch(async (req, res) => {
  const area = await db.getServiceAreaById(req.params.id);
  if (!area) return res.error('Service area not found', 'NOT_FOUND', null, 404);
  res.success(area);
}));

/**
 * POST /api/service-areas - Create new area (Admin only)
 */
router.post('/', requireRole(['admin']), tryCatch(async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) {
    return res.error('Name and type are required', 'VALIDATION_ERROR', null, 400);
  }

  const area = await db.createServiceArea(req.body);
  logger.info('Service area created', { id: area.id, name: area.name });
  res.status(201).success(area, 'Service area created successfully');
}));

/**
 * PUT /api/service-areas/:id - Update area (Admin only)
 */
router.put('/:id', validateId, requireRole(['admin']), tryCatch(async (req, res) => {
  const area = await db.updateServiceArea(req.params.id, req.body);
  if (!area) return res.error('Service area not found', 'NOT_FOUND', null, 404);
  res.success(area, 'Service area updated');
}));

/**
 * DELETE /api/service-areas/:id - Delete area (Admin only)
 */
router.delete('/:id', validateId, requireRole(['admin']), tryCatch(async (req, res) => {
  const deleted = await db.deleteServiceArea(req.params.id);
  if (!deleted) return res.error('Service area not found', 'NOT_FOUND', null, 404);
  res.success({ id: req.params.id }, 'Service area deleted');
}));

/**
 * POST /api/service-areas/seed - Seed default DFW areas
 */
router.post('/seed', requireRole(['admin']), tryCatch(async (req, res) => {
  const result = await db.seedDefaultServiceAreas();
  res.success(result, 'Seeding complete');
}));

export default router;
