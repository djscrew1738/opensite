// 1stein Backend Server - CTL Plumbing Intelligence Platform
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
  errorLogger,
  slowRequestLogger,
  performanceLogger
} from './middleware/logging.js';

// Import routes
import healthRoutes from './routes/health.js';
import aiRoutes from './routes/ai.js';
import leadsRoutes from './routes/leads.js';
import estimatesRoutes from './routes/estimates.js';
import projectsRoutes from './routes/projects.js';
import dashboardRoutes from './routes/dashboard.js';
import uploadRoutes from './routes/upload.js';

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

// Logging middleware
app.use(requestLogger); // Log all requests
app.use(slowRequestLogger(2000)); // Log slow requests (>2s)
app.use(performanceLogger); // Log performance metrics

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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: '1stein API',
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
      'Performance monitoring'
    ]
  });
});

// Cache stats endpoint (for monitoring)
app.get('/api/cache/stats', (req, res) => {
  res.json(cache.getStats());
});

// Database backup endpoint
app.post('/api/admin/backup', (req, res) => {
  try {
    const backupPath = db.backup();
    logger.info('Database backup created', { path: backupPath });
    res.json({
      success: true,
      message: 'Database backup created',
      path: backupPath
    });
  } catch (error) {
    logger.error('Backup failed', { error: error.message });
    res.status(500).json({
      error: 'Backup failed',
      message: error.message
    });
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

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    requestId: req.id,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn('404 Not Found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    requestId: req.id
  });

  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    requestId: req.id
  });
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    db.close();
    logger.info('Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    db.close();
    logger.info('Database connection closed');
    process.exit(0);
  });
});

// Start server on all interfaces
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info('Server started', { port: PORT });

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║      1stein Backend Server v2.0 - Enhanced Edition        ║
╚═══════════════════════════════════════════════════════════╝

🚀 Server:    http://localhost:${PORT}
🌐 Network:   http://100.115.136.62:${PORT}
📚 API Docs:  http://100.115.136.62:${PORT}/api/health
🤖 AI Model:  ${process.env.OLLAMA_MODEL || 'llama3.1'}
🏢 Company:   CTL Plumbing LLC

✨ Enhanced Features:
   📊 SQLite Database (tool/data/1stein.db)
   💾 Multi-tier Caching
   📝 Daily Rotating Logs (tool/logs/)
   🔒 Security Headers & Rate Limiting
   ✅ Request Validation
   ⚡ Performance Monitoring

🔒 Accessible via Tailscale network
Press Ctrl+C to stop
  `);
});

export default app;
