// Dashboard statistics and overview routes

import express from 'express';
import { db } from '../services/database.js';
import { pricingService } from '../services/pricing.js';
import { dbOptimizations } from '../services/dbOptimizations.js';
import { tryCatch } from '../utils/response.js';

const router = express.Router();

// Get dashboard statistics (optimized)
router.get('/stats', tryCatch(async (req, res) => {
  // Use optimized single-query approach with caching
  const stats = dbOptimizations.getDashboardStatsOptimized();

  res.success({
    pipelineValue: stats.pipelineValue,
    activeProjectsCount: stats.activeProjectsCount,
    activeProjects: stats.activeProjects,
    hotLeadsCount: stats.hotLeadsCount,
    hotLeads: stats.hotLeads,
    totalLeads: stats.totalLeads
  });
}));

// Get pricing tiers reference
router.get('/tiers', tryCatch(async (req, res) => {
  const tiers = pricingService.getAllTiers();
  res.success({ tiers });
}));

export default router;
