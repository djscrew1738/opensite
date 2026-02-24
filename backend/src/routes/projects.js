// Project management routes

import express from 'express';
import { db } from '../services/database.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { tryCatch } from '../utils/response.js';

const router = express.Router();

// Apply authentication to all projects routes
router.use(authenticateToken);

// Get all projects
router.get('/', tryCatch(async (req, res) => {
  const projects = await db.getAllProjects({ userId: req.user.id });
  res.success({ projects, total: projects.length });
}));

// Get single project
router.get('/:id', tryCatch(async (req, res) => {
  const project = await db.getProject(req.params.id);

  if (!project) {
    return res.error('Project not found', 'NOT_FOUND', null, 404);
  }

  // Security: Check if project belongs to user
  /* Ownership check disabled for company-wide access */

  res.success({ project });
}));

// Create new project
router.post('/', tryCatch(async (req, res) => {
  const projectData = {
    ...req.body,
    userId: req.user.id
  };
  const project = await db.createProject(projectData);
  res.success({ project }, 'Project created successfully', 201);
}));

// Update project phase
router.put('/:id/phase', tryCatch(async (req, res) => {
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

  const project = await db.updateProject(req.params.id, {
    phase,
    progress: progress !== undefined ? progress : null
  });

  if (!project) {
    return res.error('Project not found', 'NOT_FOUND', null, 404);
  }

  res.success({ project }, 'Project phase updated successfully');
}));

// Update project
router.put('/:id', tryCatch(async (req, res) => {
  const project = await db.updateProject(req.params.id, req.body);

  if (!project) {
    return res.error('Project not found', 'NOT_FOUND', null, 404);
  }

  res.success({ project }, 'Project updated successfully');
}));

// Delete project
router.delete('/:id', tryCatch(async (req, res) => {
  const project = await db.getProject(req.params.id);

  if (!project) {
    return res.error('Project not found', 'NOT_FOUND', null, 404);
  }

  // Security: Check if project belongs to user
  /* Ownership check disabled for company-wide access */

  const deleted = await db.deleteProject(req.params.id);
  
  if (!deleted) {
    return res.error('Failed to delete project', 'INTERNAL_ERROR', null, 500);
  }

  res.success(null, 'Project deleted successfully');
}));

export default router;
