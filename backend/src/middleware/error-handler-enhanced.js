/**
 * Enhanced Error Handler Middleware
 * 
 * Provides centralized, consistent error handling for all routes.
 * Uses custom error classes for specific HTTP status codes.
 */

import logger from '../services/logger.js';
import { 
  AppError, 
  ValidationError, 
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  TimeoutError
} from '../utils/errors.js';

/**
 * Map error classes to HTTP status codes
 */
const errorStatusMap = new Map([
  [ValidationError, 400],
  [NotFoundError, 404],
  [UnauthorizedError, 401],
  [ForbiddenError, 403],
  [ConflictError, 409],
  [RateLimitError, 429],
  [DatabaseError, 500],
  [ExternalServiceError, 503],
  [TimeoutError, 504],
  [AppError, 500]
]);

/**
 * Get HTTP status code for an error
 */
function getStatusCode(error) {
  for (const [ErrorClass, statusCode] of errorStatusMap) {
    if (error instanceof ErrorClass) {
      return error.statusCode || statusCode;
    }
  }
  return 500;
}

/**
 * Format error for response
 */
function formatError(error, isDevelopment) {
  const base = {
    success: false,
    error: {
      message: error.message || 'Internal server error',
      code: error.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }
  };

  // Add details if available
  if (error.details) {
    base.error.details = error.details;
  }

  // Add stack trace in development
  if (isDevelopment && error.stack) {
    base.error.stack = error.stack.split('\n');
  }

  return base;
}

/**
 * Log error with appropriate level
 */
function logError(error, req, statusCode) {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    statusCode,
    errorCode: error.code,
    errorMessage: error.message,
    requestId: req.id
  };

  // Client errors (4xx) - warn level
  if (statusCode >= 400 && statusCode < 500) {
    logger.warn('Client error', logData);
  } else {
    // Server errors (5xx) - error level with stack
    logger.error('Server error', {
      ...logData,
      stack: error.stack
    });
  }
}

/**
 * Main error handling middleware
 */
export function errorHandler(error, req, res, next) {
  // Skip if headers already sent
  if (res.headersSent) {
    return next(error);
  }

  const isDevelopment = process.env.NODE_ENV === 'development';
  const statusCode = getStatusCode(error);

  // Log the error
  logError(error, req, statusCode);

  // Send response
  res.status(statusCode).json(formatError(error, isDevelopment));
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req, res) {
  logger.warn('404 Not Found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    requestId: req.id
  });

  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
      details: { path: req.originalUrl },
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Unhandled rejection handler for process
 */
export function handleUnhandledRejection(reason, promise) {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack
  });
  
  // Graceful shutdown
  process.exit(1);
}

/**
 * Uncaught exception handler for process
 */
export function handleUncaughtException(error) {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  
  // Graceful shutdown
  process.exit(1);
}

/**
 * Register all error handlers
 */
export function registerErrorHandlers(app) {
  // 404 handler - must be last route handler
  app.use(notFoundHandler);

  // Global error handler - must be last middleware
  app.use(errorHandler);

  // Process-level error handlers
  process.on('unhandledRejection', handleUnhandledRejection);
  process.on('uncaughtException', handleUncaughtException);
}

export default errorHandler;
