// Project management routes

import express from 'express';
import { db } from '../services/database.js';

const router = express.Router();

// Get all projects
router.get('/', (req, res) => {
  try {
    const projects = db.getAllProjects();
    res.json({ projects, total: projects.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single project
router.get('/:id', (req, res) => {
  try {
    const project = db.getProject(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new project
router.post('/', (req, res) => {
  try {
    const project = db.createProject(req.body);
    res.status(201).json({ project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update project phase
router.put('/:id/phase', (req, res) => {
  try {
    const { phase, progress } = req.body;

    if (!phase) {
      return res.status(400).json({ error: 'Phase is required' });
    }

    const validPhases = ['rough-in', 'top-out', 'trim', 'complete'];
    if (!validPhases.includes(phase)) {
      return res.status(400).json({ error: 'Invalid phase' });
    }

    const project = db.updateProject(req.params.id, {
      phase,
      progress: progress !== undefined ? progress : null
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update project
router.put('/:id', (req, res) => {
  try {
    const project = db.updateProject(req.params.id, req.body);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
