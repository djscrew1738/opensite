// middleware/error-handlers.js
// Centralized error handling for the Express app

import logger from '../services/logger.js';

export function registerErrorHandlers(app) {
  // 404 handler
  app.use((req, res, next) => {
    logger.warn('404 Not Found', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      requestId: req.id
    });
    
    if (res.error) {
      return res.error('Endpoint not found', 'NOT_FOUND', { path: req.originalUrl }, 404);
    }
    
    res.status(404).json({
      success: false,
      error: {
        message: 'Endpoint not found',
        code: 'NOT_FOUND',
        details: { path: req.originalUrl },
        timestamp: new Date().toISOString()
      }
    });
  });

  // Unhandled error handler
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
}
