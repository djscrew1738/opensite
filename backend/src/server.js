// Opensite Backend Server - CTL Plumbing Intelligence Platform
// Enhanced with persistence, caching, logging, and security

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';

// Import services
import logger from './services/logger.js';
import { db } from './services/database.js';
import cache from './services/cache.js';

// Import middleware
import {
  securityHeaders,
  apiLimiter,
  uploadLimiter,
  requestSizeLimiter,
  requestId,
  corsOptions
} from './middleware/security.js';
import { sanitizeInput } from './middleware/validation.js';
import {
  requestLogger,
  errorLogger
} from './middleware/logging.js';
import { responseWrapper } from './utils/response.js';

// Import routes
import healthRoutes from './routes/health.js';
import aiRoutes from './routes/ai.js';
import leadsRoutes from './routes/leads.js';
import estimatesRoutes from './routes/estimates.js';
import projectsRoutes from './routes/projects.js';
import dashboardRoutes from './routes/dashboard.js';
import uploadRoutes from './routes/upload.js';
import jobsRoutes from './routes/jobs.js';
import plumbingRoutes from './routes/plumbing.js';
import takeoffRoutes from './routes/takeoff.js';
import permitsRoutes from './routes/permits.js';
import discoveryRoutes from './routes/discovery.js';
import discoveryEnhancedRoutes from './routes/discovery-enhanced.js';
import settingsRoutes from './routes/settings.js';
import historyRoutes from './routes/history.js';
import visionRoutes from './routes/vision.js';
import weatherRoutes from './routes/weather.js';
import emailMonitorRoutes from './routes/email-monitor.js';
import { visionService } from './services/vision.js';

// Import permit jobs
import { startPermitJobs, stopPermitJobs } from './jobs/permit-jobs.js';

// Import AI provider manager (Ollama, Groq, Anthropic, OpenClaw)
import { aiProvider } from './services/ai-provider.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Core middleware
app.use(requestId); // Add unique request ID
app.use(cors(corsOptions)); // CORS
app.use(securityHeaders); // Security headers
app.use(compression()); // Compress responses
app.use(express.json({ limit: '10mb' })); // Parse JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded
app.use(sanitizeInput); // Sanitize inputs
app.use(requestSizeLimiter); // Limit request size
app.use(responseWrapper); // Standardized response format

// Logging middleware (unified — handles request + slow + performance logging)
app.use(requestLogger);

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/estimates', estimatesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes); // Upload routes with stricter rate limit
app.use('/api/jobs', jobsRoutes); // Job status polling
app.use('/api/plumbing', plumbingRoutes);
app.use('/api/takeoff', takeoffRoutes);
app.use('/api/permits', permitsRoutes); // Permit ingestion and lead tracking
app.use('/api/discovery', discoveryRoutes); // Discovery pipeline (Maps scraping + AI scoring)
app.use('/api/discovery', discoveryEnhancedRoutes); // Enhanced discovery features (export, analytics, follow-ups)
app.use('/api/settings', settingsRoutes); // App settings CRUD
app.use('/api/history', historyRoutes); // History browsing
app.use('/api/vision', visionRoutes); // Vision deep-zoom viewer (upload limiter applied inside route)
app.use('/api/weather', weatherRoutes); // Weather forecast (NWS proxy with caching)
app.use('/api/email-monitor', emailMonitorRoutes); // Email keyword monitoring + SMS alerts
app.use('/api/vision/tiles', express.static(visionService.tilesDir, { maxAge: '86400000' })); // Serve DZI tiles as static files

// Root endpoint
app.get('/', (req, res) => {
  res.success({
    name: 'Opensite API',
    version: '2.0.0',
    description: 'CTL Plumbing Intelligence Platform - Enhanced Edition',
    status: 'running',
    features: [
      'SQLite persistence',
      'Multi-tier caching',
      'Daily rotating logs',
      'Rate limiting',
      'Request validation',
      'Security headers',
      'Performance monitoring',
      'Background job queue',
      'Standardized responses'
    ]
  });
});

// Cache stats endpoint (for monitoring)
app.get('/api/cache/stats', (req, res) => {
  res.success(cache.getStats());
});

// Memory stats endpoint
app.get('/api/admin/memory', (req, res) => {
  const mem = process.memoryUsage();
  res.success({
    rss: `${Math.round(mem.rss / 1048576)}MB`,
    heapTotal: `${Math.round(mem.heapTotal / 1048576)}MB`,
    heapUsed: `${Math.round(mem.heapUsed / 1048576)}MB`,
    external: `${Math.round(mem.external / 1048576)}MB`,
    arrayBuffers: `${Math.round(mem.arrayBuffers / 1048576)}MB`,
    uptime: `${Math.round(process.uptime())}s`,
    cache: cache.getStats()
  });
});

// Database backup endpoint
app.post('/api/admin/backup', (req, res) => {
  try {
    const backupPath = db.backup();
    logger.info('Database backup created', { path: backupPath });
    res.success({ path: backupPath }, 'Database backup created');
  } catch (error) {
    logger.error('Backup failed', { error: error.message });
    res.error('Backup failed', 'BACKUP_ERROR', { message: error.message }, 500);
  }
});

// Error handling middleware
app.use(errorLogger); // Log errors

app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    requestId: req.id
  });

  const details = process.env.NODE_ENV === 'development' ? { stack: err.stack } : null;
  res.error(
    err.message || 'Internal server error',
    'INTERNAL_ERROR',
    details,
    err.status || 500
  );
});

// 404 handler
app.use((req, res) => {
  logger.warn('404 Not Found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    requestId: req.id
  });

  res.error('Endpoint not found', 'NOT_FOUND', { path: req.originalUrl }, 404);
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  stopPermitJobs();
  server.close(() => {
    logger.info('HTTP server closed');
    db.close();
    logger.info('Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  stopPermitJobs();
  server.close(() => {
    logger.info('HTTP server closed');
    db.close();
    logger.info('Database connection closed');
    process.exit(0);
  });
});

// Periodic heap monitoring — log if usage exceeds 80% of limit
setInterval(() => {
  const mem = process.memoryUsage();
  const heapUsedMB = Math.round(mem.heapUsed / 1048576);
  const heapTotalMB = Math.round(mem.heapTotal / 1048576);
  const rssMB = Math.round(mem.rss / 1048576);

  // Warn if heap is over 180MB (of 256MB limit)
  if (heapUsedMB > 180) {
    logger.warn('High memory usage', { heapUsedMB, heapTotalMB, rssMB });
    // Force garbage collection hint
    if (global.gc) global.gc();
  }
}, 60000); // Check every minute

// Start server on all interfaces
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info('Server started', { port: PORT });

  // Load saved settings and apply to all AI providers
  try {
    aiProvider.loadFromSettings();
    logger.info('Applied saved settings to AI providers', {
      activeProvider: aiProvider.activeProviderName,
      config: aiProvider.getConfig()
    });
  } catch (err) {
    logger.warn('Could not load saved settings', { error: err.message });
  }

  // Start permit background jobs
  if (process.env.PERMIT_JOBS_ENABLED !== 'false') {
    startPermitJobs();
  }

  const providerLabel = {
    groq: 'Groq Cloud',
    anthropic: 'Anthropic Claude',
    ollama: 'Ollama Local',
    openclaw: 'OpenClaw Gateway',
  }[aiProvider.activeProviderName] || aiProvider.activeProviderName;

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║      Opensite Backend Server v2.0 - Enhanced Edition      ║
╚═══════════════════════════════════════════════════════════╝

  Server:    http://localhost:${PORT}
  Network:   http://100.83.120.32:${PORT}
  API Docs:  http://100.83.120.32:${PORT}/api/health
  AI:        ${providerLabel} (${aiProvider.defaultModel})
  Company:   CTL Plumbing LLC

  Features:
   - SQLite Database (tool/data/opensite.db)
   - Multi-tier Caching
   - Daily Rotating Logs (tool/logs/)
   - Security Headers & Rate Limiting
   - Request Validation
   - Performance Monitoring
   - Permit Lead Tracking & Scoring
   - Automated Notifications

  Accessible via Tailscale network
  Press Ctrl+C to stop
  `);
});
