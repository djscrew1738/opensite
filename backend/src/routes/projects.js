// Project management routes

import express from 'express';
import { db } from '../services/database.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { validateProject, validateId } from '../middleware/validation.js';
import { tryCatch, parsePagination, paginationMeta } from '../utils/response.js';
import logger from '../services/logger.js';

const router = express.Router();

// Apply authentication to all projects routes
router.use(authenticateToken);

/**
 * GET /projects - List projects with filtering and pagination
 */
router.get('/', tryCatch(async (req, res) => {
  const { status, phase, search, leadId } = req.query;
  const { page, limit, offset } = parsePagination(req.query);
  
  const result = await db.getAllProjects({ 
    status, 
    phase, 
    search, 
    leadId,
    userId: req.user.id, 
    limit, 
    offset 
  });
  
  res.success({
    projects: result.projects,
    total: result.total
  }, null, paginationMeta(page, limit, result.total));
}));

/**
 * GET /projects/stats - Get project statistics
 */
router.get('/stats', tryCatch(async (req, res) => {
  const stats = await db.getProjectStats();
  res.success(stats);
}));

/**
 * GET /projects/:id - Get detailed project information
 */
router.get('/:id', validateId, tryCatch(async (req, res) => {
  const { id } = req.params;
  const project = await db.getProject(id);

  if (!project) {
    return res.error('Project not found', 'NOT_FOUND', { id }, 404);
  }

  res.success({ project });
}));

/**
 * POST /projects - Create a new project
 */
router.post('/', validateProject, tryCatch(async (req, res) => {
  const projectData = {
    ...req.body,
    userId: req.user.id
  };
  
  const project = await db.createProject(projectData);
  
  logger.info('Project created', { id: project.id, name: project.name, userId: req.user.id });
  res.status(201).success({ project }, 'Project created successfully');
}));

/**
 * PUT /projects/:id/phase - Quick update for project phase/progress
 */
router.put('/:id/phase', validateId, tryCatch(async (req, res) => {
  const { id } = req.params;
  const { phase, progress } = req.body;

  if (!phase) {
    return res.error('Phase is required', 'VALIDATION_ERROR', null, 400);
  }

  const validPhases = ['underground', 'rough-in', 'top-out', 'trim', 'complete'];
  if (!validPhases.includes(phase)) {
    return res.error(
      `Invalid phase. Must be one of: ${validPhases.join(', ')}`,
      'VALIDATION_ERROR',
      null,
      400
    );
  }

  const project = await db.updateProject(id, {
    phase,
    progress: progress !== undefined ? parseInt(progress) : undefined
  });

  if (!project) {
    return res.error('Project not found', 'NOT_FOUND', { id }, 404);
  }

  res.success({ project }, 'Project phase updated');
}));

/**
 * PUT /projects/:id - Update detailed project information
 */
router.put('/:id', validateId, validateProject, tryCatch(async (req, res) => {
  const { id } = req.params;
  const project = await db.updateProject(id, req.body);

  if (!project) {
    return res.error('Project not found', 'NOT_FOUND', { id }, 404);
  }

  res.success({ project }, 'Project updated successfully');
}));

/**
 * DELETE /projects/:id - Delete a project
 */
router.delete('/:id', validateId, tryCatch(async (req, res) => {
  const { id } = req.params;
  const project = await db.getProject(id);

  if (!project) {
    return res.error('Project not found', 'NOT_FOUND', { id }, 404);
  }

  const deleted = await db.deleteProject(id);
  
  if (!deleted) {
    return res.error('Failed to delete project', 'INTERNAL_ERROR', { id }, 500);
  }

  logger.info('Project deleted', { id });
  res.success({ id }, 'Project deleted successfully');
}));

export default router;
