// Opensite Backend Server - CTL Plumbing Intelligence Platform
// Enhanced with persistence, caching, logging, and security

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import os from 'os';

// Import services
import logger from './services/logger.js';
import { db } from './services/database.js';
import cache from './services/cache.js';

// Import middleware
import {
  securityHeaders,
  apiLimiter,
  uploadLimiter,
  aiChatLimiter,
  discoveryLimiter,
  requestSizeLimiter,
  requestId,
  corsOptions
} from './middleware/security.js';
import { sanitizeInput } from './middleware/validation.js';
import { requireAdminToken, checkAdminTokenConfig } from './middleware/auth.js';
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
import emailAlertsRoutes from './routes/emailAlerts/index.js';
import notificationRoutes from './routes/notifications.js';
import canvasRoutes from './routes/canvas.js';
import { visionService } from './services/vision.js';
import { printConfigStatus } from './utils/notification-config-checker.js';

// Import permit jobs
import { startPermitJobs, stopPermitJobs } from './jobs/permit-jobs.js';

// Import AI provider manager (Ollama, Groq, Anthropic, OpenClaw)
import { aiProvider } from './services/ai-provider.js';

// Import email watcher service
import { emailWatcherService } from './services/emailWatcher/index.js';

// Load environment variables
dotenv.config();

/**
 * Validate required and optional environment variables at startup
 * Exits with fatal error if ENCRYPTION_KEY is missing or invalid
 * Logs warnings for missing AI provider keys (non-fatal)
 */
function validateEnvironment() {
  console.log('🔍 Validating environment...');
  const errors = [];
  const warnings = [];

  // CRITICAL: ENCRYPTION_KEY must be set and valid
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    errors.push('ENCRYPTION_KEY is not set. Email passwords cannot be safely stored without encryption.');
  } else {
    // Validate key is exactly 32 bytes when hex-decoded
    try {
      // Check if it's base64 encoded (44 chars with padding) or hex (64 chars)
      let keyBuffer;
      if (encryptionKey.length === 64) {
        // Likely hex encoded
        keyBuffer = Buffer.from(encryptionKey, 'hex');
      } else if (encryptionKey.length === 44 || encryptionKey.length === 43) {
        // Likely base64 encoded
        keyBuffer = Buffer.from(encryptionKey, 'base64');
      } else {
        // Try base64 as default
        keyBuffer = Buffer.from(encryptionKey, 'base64');
      }
      
      if (keyBuffer.length !== 32) {
        errors.push(`ENCRYPTION_KEY must be 32 bytes when decoded. Got ${keyBuffer.length} bytes.`);
      }
    } catch (e) {
      errors.push(`ENCRYPTION_KEY is invalid: ${e.message}`);
    }
  }

  // OPTIONAL: AI provider keys - warn if none are configured
  const aiKeys = [
    { key: 'GROQ_API_KEY', name: 'Groq' },
    { key: 'ANTHROPIC_API_KEY', name: 'Anthropic' },
    { key: 'OPENCLAW_URL', name: 'OpenClaw' },
  ];
  
  const hasAnyAiKey = aiKeys.some(({ key }) => !!process.env[key]);
  if (!hasAnyAiKey) {
    warnings.push('No AI provider API keys configured (GROQ_API_KEY, ANTHROPIC_API_KEY, or OPENCLAW_URL). AI features will be unavailable.');
  }

  // OPTIONAL: Other service keys
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    warnings.push('Twilio credentials not configured. SMS notifications will be unavailable.');
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    warnings.push('Telegram bot token not configured. Telegram notifications will be unavailable.');
  }

  // Log warnings (non-fatal)
  for (const warning of warnings) {
    logger.warn('[env] ' + warning);
  }

  // Log errors and exit if critical checks failed
  if (errors.length > 0) {
    for (const error of errors) {
      logger.error('[env] FATAL: ' + error);
    }
    logger.error('[env] Server startup aborted due to missing required configuration.');
    logger.error('[env] Please set the required environment variables and restart.');
    process.exit(1);
  }
}

// Run validation before starting server
validateEnvironment();

const app = express();
const PORT = process.env.PORT || 5001;

/**
 * Get the primary non-loopback IPv4 address
 * Falls back to SERVER_IP env var, then '0.0.0.0'
 */
function getNetworkIp() {
  // First check for explicit server IP from environment
  if (process.env.SERVER_IP) {
    return process.env.SERVER_IP;
  }
  
  // Try to find the primary non-loopback IPv4 address
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  // Fallback to 0.0.0.0 if no external interface found
  return '0.0.0.0';
}

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Core middleware
app.use(requestId); // Add unique request ID
app.use(cors(corsOptions)); // CORS
app.use(securityHeaders); // Security headers
app.use(compression()); // Compress responses
app.use(express.json({ limit: '100mb' })); // Parse JSON - increased for blueprint uploads
app.use(express.urlencoded({ extended: true, limit: '100mb' })); // Parse URL-encoded - increased for blueprint uploads
app.use(sanitizeInput); // Sanitize inputs
app.use(requestSizeLimiter); // Limit request size
app.use(responseWrapper); // Standardized response format

// Logging middleware (unified — handles request + slow + performance logging)
app.use(requestLogger);

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/ai', aiChatLimiter, aiRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/estimates', estimatesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes); // Upload routes with stricter rate limit
app.use('/api/jobs', jobsRoutes); // Job status polling
app.use('/api/plumbing', plumbingRoutes);
app.use('/api/takeoff', takeoffRoutes);
app.use('/api/permits', permitsRoutes); // Permit ingestion and lead tracking
app.use('/api/discovery', discoveryLimiter, discoveryRoutes); // Discovery pipeline (Maps scraping + AI scoring)
app.use('/api/discovery', discoveryEnhancedRoutes); // Enhanced discovery features (export, analytics, follow-ups)
app.use('/api/settings', settingsRoutes); // App settings CRUD
app.use('/api/history', historyRoutes); // History browsing
app.use('/api/vision', visionRoutes); // Vision deep-zoom viewer (upload limiter applied inside route)
app.use('/api/weather', weatherRoutes); // Weather forecast (NWS proxy with caching)
app.use('/api/email-monitor', emailMonitorRoutes); // Legacy email keyword monitoring + SMS alerts
app.use('/api/email-alerts', emailAlertsRoutes); // New Outlook-based email watcher with keyword rules
app.use('/api/notifications', notificationRoutes); // Notification config and testing
app.use('/api/canvas', canvasRoutes); // Canvas workspace management
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

// Memory stats endpoint (protected with Bearer token)
app.get('/api/admin/memory', requireAdminToken, (req, res) => {
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

// Database backup endpoint (protected with Bearer token)
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
  emailWatcherService.stop();
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
  emailWatcherService.stop();
  server.close(() => {
    logger.info('HTTP server closed');
    db.close();
    logger.info('Database connection closed');
    process.exit(0);
  });
});

// Periodic heap monitoring — log if usage exceeds 80% of configured limit
setInterval(() => {
  const mem = process.memoryUsage();
  const heapUsedMB = Math.round(mem.heapUsed / 1048576);
  const heapTotalMB = Math.round(mem.heapTotal / 1048576);
  const rssMB = Math.round(mem.rss / 1048576);

  // Get configured heap limit from environment (default 512MB)
  const configuredHeapMB = parseInt(process.env.NODE_HEAP_MB, 10) || 512;
  const warningThresholdMB = Math.round(configuredHeapMB * 0.8); // 80% of limit

  // Warn if heap usage exceeds 80% of configured limit
  if (heapUsedMB > warningThresholdMB) {
    logger.warn('High memory usage', { 
      heapUsedMB, 
      heapTotalMB, 
      rssMB, 
      configuredLimitMB: configuredHeapMB,
      thresholdMB: warningThresholdMB 
    });
    // Force garbage collection hint
    if (global.gc) global.gc();
  }
}, 60000); // Check every minute

// Check admin token configuration at startup
const adminConfigured = checkAdminTokenConfig();

// Start server on all interfaces
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info('Server started', { port: PORT, adminConfigured });

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

  // Start email watcher service
  if (process.env.EMAIL_WATCHER_ENABLED !== 'false') {
    emailWatcherService.start().catch(err => {
      logger.warn('Email watcher service failed to start', { error: err.message });
    });
  }

  // Print notification configuration status
  printConfigStatus();

  const providerLabel = {
    groq: 'Groq Cloud',
    anthropic: 'Anthropic Claude',
    ollama: 'Ollama Local',
    openclaw: 'OpenClaw Gateway',
  }[aiProvider.activeProviderName] || aiProvider.activeProviderName;

  const networkIp = getNetworkIp();

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║      Opensite Backend Server v2.0 - Enhanced Edition      ║
╚═══════════════════════════════════════════════════════════╝

  Server:    http://localhost:${PORT}
  Network:   http://${networkIp}:${PORT}
  API Docs:  http://${networkIp}:${PORT}/api/health
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
   - Email Watcher (Outlook + Keyword Alerts)
   - Automated Notifications (SMS + Telegram)

  Accessible via Tailscale network
  Press Ctrl+C to stop
  `);
});
