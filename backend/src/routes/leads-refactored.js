/**
 * Lead Routes - Refactored with Service Layer
 * 
 * This version demonstrates the improved architecture:
 * - Route handlers are thin (HTTP only)
 * - Business logic is in LeadService
 * - Data access is in LeadRepository
 * - Consistent error handling with custom error classes
 */

import { Router } from 'express';
import { leadService } from '../services/LeadService.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { asyncHandler } from '../utils/errors.js';
import { parsePagination } from '../utils/response.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * GET /leads - List leads with filtering and pagination
 * 
 * Before: Controller had business logic (caching, validation, etc.)
 * After: Controller only handles HTTP - delegates to service
 */
router.get('/', asyncHandler(async (req, res) => {
  const { status, tier, search } = req.query;
  const pagination = parsePagination(req.query);

  const result = await leadService.getLeads(
    { status, tier, search, userId: req.user.id },
    pagination
  );

  res.success(result.leads, null, {
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / pagination.limit),
      hasNext: pagination.page * pagination.limit < result.total,
      hasPrev: pagination.page > 1
    }
  }));
}));

/**
 * GET /leads/:id - Get detailed lead information
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const lead = await leadService.getLead(req.params.id);
  res.success({ lead });
}));

/**
 * POST /leads - Create a new lead
 */
router.post('/', asyncHandler(async (req, res) => {
  const lead = await leadService.createLead(req.body, req.user.id);
  res.status(201).success({ lead }, 'Lead created successfully');
}));

/**
 * PUT /leads/:id - Update an existing lead
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const lead = await leadService.updateLead(req.params.id, req.body);
  res.success({ lead }, 'Lead updated successfully');
}));

/**
 * DELETE /leads/:id - Delete a lead
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  await leadService.deleteLead(req.params.id);
  res.success({ deleted: true }, 'Lead deleted successfully');
}));

/**
 * POST /leads/:id/score - Run AI scoring for a lead
 */
router.post('/:id/score', asyncHandler(async (req, res) => {
  const result = await leadService.scoreLead(req.params.id);
  res.success(result, 'Lead scored successfully');
}));

/**
 * POST /leads/bulk-status - Update status for multiple leads
 */
router.post('/bulk-status', asyncHandler(async (req, res) => {
  const { ids, status } = req.body;
  const updatedCount = await leadService.bulkUpdateStatus(ids, status);
  res.success({ updatedCount }, `Updated ${updatedCount} leads to status: ${status}`);
}));

/**
 * GET /leads/stats/overview - Get lead statistics
 */
router.get('/stats/overview', asyncHandler(async (req, res) => {
  const stats = await leadService.getStatistics();
  res.success(stats);
}));

/**
 * POST /leads/:id/assign - Assign lead to user
 */
router.post('/:id/assign', asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const lead = await leadService.assignLead(req.params.id, userId);
  res.success({ lead }, 'Lead assigned successfully');
}));

export default router;
