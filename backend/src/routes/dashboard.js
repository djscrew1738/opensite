// Dashboard statistics and overview routes

import express from 'express';
import { db } from '../services/database.js';
import { pricingService } from '../services/pricing.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', (req, res) => {
  try {
    const stats = db.getDashboardStats();

    res.json({
      pipelineValue: stats.pipelineValue,
      activeProjectsCount: stats.activeProjectsCount,
      activeProjects: stats.activeProjects,
      hotLeadsCount: stats.hotLeadsCount,
      hotLeads: stats.hotLeads,
      totalLeads: stats.totalLeads
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pricing tiers reference
router.get('/tiers', (req, res) => {
  try {
    const tiers = pricingService.getAllTiers();
    res.json({ tiers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
