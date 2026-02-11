// Project management routes

import express from 'express';
import { dataStore } from '../data/store.js';

const router = express.Router();

// Get all projects
router.get('/', (req, res) => {
  try {
    const projects = dataStore.getAllProjects();
    res.json({ projects, total: projects.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single project
router.get('/:id', (req, res) => {
  try {
    const project = dataStore.getProject(req.params.id);

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
    const project = dataStore.createProject(req.body);
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

    const project = dataStore.updateProject(req.params.id, {
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
    const project = dataStore.updateProject(req.params.id, req.body);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
