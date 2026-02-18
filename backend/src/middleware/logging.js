// Unified Logging Middleware
// Replaces 3 separate middlewares (requestLogger + slowRequestLogger + performanceLogger)
// with a single middleware that handles all logging — fewer closures per request.

import logger from '../services/logger.js';

const SLOW_THRESHOLD_MS = 2000;

/**
 * Single request logging middleware — replaces requestLogger, slowRequestLogger, performanceLogger.
 * Only allocates one 'finish' listener per request instead of three.
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel]('Request', {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.id
    });

    if (duration > SLOW_THRESHOLD_MS) {
      logger.warn('Slow request', {
        method: req.method,
        url: req.originalUrl || req.url,
        duration: `${duration}ms`,
        requestId: req.id
      });
    }
  });

  next();
};

// Error logging middleware
export const errorLogger = (err, req, res, next) => {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl || req.url,
    requestId: req.id
  });
  next(err);
};

// Kept for backward compat but now a no-op — the unified requestLogger handles slow requests
export const slowRequestLogger = () => (req, res, next) => next();
export const performanceLogger = (req, res, next) => next();
