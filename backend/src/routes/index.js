// routes/index.js
// Registers all application routes

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
import { visionService } from '../services/vision.js';
import { authLimiter, aiChatLimiter, uploadLimiter, discoveryLimiter } from '../middleware/security.js';
import { requireAdminToken } from '../middleware/auth.js';
import cache from '../services/cache.js';
import { db } from '../services/database.js';
import logger from '../services/logger.js';
import express from 'express';

export function registerRoutes(app) {
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/ai', aiChatLimiter, aiRoutes);
  app.use('/api/leads', leadsRoutes);
  app.use('/api/estimates', estimatesRoutes);
  app.use('/api/projects', projectsRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/upload', uploadLimiter, uploadRoutes);
  app.use('/api/jobs', jobsRoutes);
  app.use('/api/plumbing', plumbingRoutes);
  app.use('/api/takeoff', takeoffRoutes);
  app.use('/api/permits', permitsRoutes);
  app.use('/api/discovery', discoveryLimiter, discoveryRoutes);
  app.use('/api/discovery', discoveryEnhancedRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/history', historyRoutes);
  app.use('/api/vision', visionRoutes);
  app.use('/api/aecvision', aecvisionRoutes);
  app.use('/api/floorplan', floorplanRoutes);
  app.use('/api/blueprint', orchestratorRoutes);
  app.use('/api/blueprint', blueprintExportRoutes);
  app.use('/api/docs', apiDocsRoutes);
  app.use('/api/weather', weatherRoutes);
  app.use('/api/email-monitor', emailMonitorRoutes);
  app.use('/api/email-alerts', emailAlertsRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/canvas', canvasRoutes);
  app.use('/api/vision/tiles', express.static(visionService.tilesDir, { maxAge: '86400000' }));

  // Root and admin routes
  app.get('/', (req, res) => {
    res.success({ name: 'Opensite API', version: '2.0.0' });
  });
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
}
