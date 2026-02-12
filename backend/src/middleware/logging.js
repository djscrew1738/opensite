// Logging Middleware

import logger from '../services/logger.js';

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    requestId: req.id
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel]('Request completed', {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.id
    });
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
    ip: req.ip,
    requestId: req.id
  });

  next(err);
};

// Slow request logger
export const slowRequestLogger = (threshold = 1000) => {
  return (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      if (duration > threshold) {
        logger.warn('Slow request detected', {
          method: req.method,
          url: req.originalUrl || req.url,
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          requestId: req.id
        });
      }
    });

    next();
  };
};

// Performance logger
export const performanceLogger = (req, res, next) => {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationNs = endTime - startTime;
    const durationMs = Number(durationNs) / 1000000;

    if (durationMs > 100) {
      logger.debug('Request performance', {
        method: req.method,
        url: req.originalUrl || req.url,
        duration: `${durationMs.toFixed(2)}ms`,
        requestId: req.id
      });
    }
  });

  next();
};
