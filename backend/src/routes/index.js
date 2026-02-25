// routes/index.js
// Registers all application routes with v1 versioning

import { Router } from 'express';
import express from 'express';
import healthRoutes from './health.js';
import authRoutes from './auth.js';
import aiRoutes from './ai.js';
import leadsRoutes from './leads.js';
import estimatesRoutes from './estimates.js';
import projectsRoutes from './projects.js';
import dashboardRoutes from './dashboard.js';
import uploadRoutes from './upload.js';
import jobsRoutes from './jobs.js';
import plumbingRoutes from './plumbing.js';
import takeoffRoutes from './takeoff.js';
import permitsRoutes from './permits.js';
import discoveryRoutes from './discovery.js';
import discoveryEnhancedRoutes from './discovery-enhanced.js';
import settingsRoutes from './settings.js';
import historyRoutes from './history.js';
import visionRoutes from './vision.js';
import weatherRoutes from './weather.js';
import aecvisionRoutes from './aecvision.js';
import floorplanRoutes from './floorplan.js';
import orchestratorRoutes from './blueprint-orchestrator.js';
import blueprintExportRoutes from './blueprint-export.js';
import apiDocsRoutes from './api-docs.js';
import emailMonitorRoutes from './email-monitor.js';
import emailAlertsRoutes from './emailAlerts/index.js';
import notificationRoutes from './notifications.js';
import canvasRoutes from './canvas.js';
import usersRoutes from './users.js';
import docvaultRoutes from './docvault.js';
import { visionService } from '../services/vision.js';
import { authLimiter, aiChatLimiter, uploadLimiter, discoveryLimiter } from '../middleware/security.js';
import { requireAdminToken } from '../middleware/auth.js';
import cache from '../services/cache.js';
import { db } from '../services/database.js';
import logger from '../services/logger.js';

export function registerRoutes(app) {
  const router = Router();

  router.use('/health', healthRoutes);
  router.use('/auth', authLimiter, authRoutes);
  router.use('/ai', aiChatLimiter, aiRoutes);
  router.use('/leads', leadsRoutes);
  router.use('/estimates', estimatesRoutes);
  router.use('/projects', projectsRoutes);
  router.use('/dashboard', dashboardRoutes);
  router.use('/upload', uploadLimiter, uploadRoutes);
  router.use('/jobs', jobsRoutes);
  router.use('/plumbing', plumbingRoutes);
  router.use('/takeoff', takeoffRoutes);
  router.use('/permits', permitsRoutes);
  router.use('/discovery', discoveryLimiter, discoveryRoutes);
  router.use('/discovery', discoveryEnhancedRoutes);
  router.use('/settings', settingsRoutes);
  router.use('/history', historyRoutes);
  router.use('/vision', visionRoutes);
  router.use('/aecvision', aecvisionRoutes);
  router.use('/floorplan', floorplanRoutes);
  router.use('/blueprint', orchestratorRoutes);
  router.use('/blueprint', blueprintExportRoutes);
  router.use('/docs', apiDocsRoutes);
  router.use('/weather', weatherRoutes);
  router.use('/email-monitor', emailMonitorRoutes);
  router.use('/email-alerts', emailAlertsRoutes);
  router.use('/notifications', notificationRoutes);
  router.use('/canvas', canvasRoutes);
  router.use('/users', usersRoutes);
  router.use('/docvault', docvaultRoutes);
  router.use('/vision/tiles', express.static(visionService.tilesDir, { maxAge: '86400000' }));

  // Mount at /api/v1 (canonical) and /api (backward-compatible with deprecation headers)
  app.use('/api/v1', router);
  app.use('/api', (req, res, next) => {
    res.set('Deprecation', 'true');
    res.set('Sunset', '2026-09-01');
    res.set('Link', `</api/v1${req.path}>; rel="successor-version"`);
    next();
  }, router);

  // Root info
  app.get('/', (req, res) => {
    res.success({ name: 'Opensite API', version: '2.0.0', current: '/api/v1' });
  });

  // Admin routes (not versioned)
  app.get('/api/cache/stats', requireAdminToken, (req, res) => {
    res.success(cache.getStats());
  });
  app.get('/api/admin/memory', requireAdminToken, (req, res) => {
    const mem = process.memoryUsage();
    res.success({
      rss: `${Math.round(mem.rss / 1048576)}MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1048576)}MB`,
      heapUsed: `${Math.round(mem.heapUsed / 1048576)}MB`,
    });
  });
  app.post('/api/admin/backup', requireAdminToken, (req, res) => {
    try {
      const backupPath = db.backup();
      logger.info('Database backup created', { path: backupPath });
      res.success({ path: backupPath }, 'Database backup created');
    } catch (error) {
      logger.error('Backup failed', { error: error.message });
      res.error('Backup failed', 'BACKUP_ERROR', { message: error.message }, 500);
    }
  });
  app.get('/api/admin/backups', requireAdminToken, (req, res) => {
    try {
      const backups = db.listBackups();
      res.success(backups, `${backups.length} backups found`);
    } catch (error) {
      res.error('Failed to list backups', 'BACKUP_ERROR', { message: error.message }, 500);
    }
  });
}
