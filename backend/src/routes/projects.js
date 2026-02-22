// Project management routes

import express from 'express';
import { db } from '../services/database.js';
import { tryCatch } from '../utils/response.js';

const router = express.Router();

// Get all projects
router.get('/', tryCatch(async (req, res) => {
  const projects = db.getAllProjects();
  res.success({ projects, total: projects.length });
}));

// Get single project
router.get('/:id', tryCatch(async (req, res) => {
  const project = db.getProject(req.params.id);

  if (!project) {
    return res.error('Project not found', 'NOT_FOUND', null, 404);
  }

  res.success({ project });
}));

// Create new project
router.post('/', tryCatch(async (req, res) => {
  const project = db.createProject(req.body);
  res.success({ project }, 'Project created successfully', 201);
}));

// Update project phase
router.put('/:id/phase', tryCatch(async (req, res) => {
  const { phase, progress } = req.body;

  if (!phase) {
    return res.error('Phase is required', 'VALIDATION_ERROR', null, 400);
  }

  const validPhases = ['rough-in', 'top-out', 'trim', 'complete'];
  if (!validPhases.includes(phase)) {
    return res.error(
      `Invalid phase. Must be one of: ${validPhases.join(', ')}`,
      'VALIDATION_ERROR',
      null,
      400
    );
  }

  const project = db.updateProject(req.params.id, {
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
  const project = db.updateProject(req.params.id, req.body);

  if (!project) {
    return res.error('Project not found', 'NOT_FOUND', null, 404);
  }

  res.success({ project }, 'Project updated successfully');
}));

export default router;
