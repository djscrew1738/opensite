/**
 * Email Alerts API Routes
 * Combined routes for rules, log, health, and accounts
 */

import express from 'express';
import rulesRoutes from './rules.js';
import logRoutes from './log.js';
import healthRoutes from './health.js';

const router = express.Router();

// Mount sub-routes
router.use('/', healthRoutes);  // /health, /trigger, /reload, /test, /accounts, /config
router.use('/rules', rulesRoutes);  // CRUD for keyword rules
router.use('/log', logRoutes);  // Alert log and statistics

export default router;
