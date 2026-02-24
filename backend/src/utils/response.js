// Standardized API Response Utility
// Ensures all API responses have consistent format

import logger from '../services/logger.js';

/**
 * Success response wrapper
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @param {object} meta - Optional metadata
 * @returns {object} Standardized success response
 */
export function successResponse(data, message = null, meta = {}) {
  return {
    success: true,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
}

/**
 * Error response wrapper
 * @param {string} message - Error message
 * @param {number} code - Error code
 * @param {object} details - Additional error details
 * @returns {object} Standardized error response
 */
export function errorResponse(message, code = 'INTERNAL_ERROR', details = null) {
  return {
    success: false,
    error: {
      message,
      code,
      details,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Paginated response wrapper
 * @param {Array} items - Array of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {object} Standardized paginated response
 */
export function paginatedResponse(items, page, limit, total) {
  const totalPages = Math.ceil(total / limit);

  return successResponse(items, null, {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
}

/**
 * Express middleware to wrap responses
 */
export function responseWrapper(req, res, next) {
  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method
  res.json = function(data) {
    // If already wrapped, send as-is
    if (data && (data.success !== undefined)) {
      return originalJson(data);
    }

    // If error status, wrap as error
    if (res.statusCode >= 400) {
      const wrapped = errorResponse(
        data?.error || data?.message || 'An error occurred',
        data?.code || `ERROR_${res.statusCode}`,
        data?.details || null
      );
      return originalJson(wrapped);
    }

    // Wrap as success
    const wrapped = successResponse(data);
    return originalJson(wrapped);
  };

  // Add helper methods
  res.success = function(data, message, meta) {
    return res.json(successResponse(data, message, meta));
  };

  res.error = function(message, code, details, statusCode = 400) {
    return res.status(statusCode).json(errorResponse(message, code, details));
  };

  res.paginated = function(items, page, limit, total) {
    return res.json(paginatedResponse(items, page, limit, total));
  };

  next();
}

/**
 * Async route handler wrapper
 * Catches errors and passes to error handler
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Try-catch wrapper for route handlers
 */
export function tryCatch(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      logger.error('Route handler error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
      });

      // Send user-friendly error
      res.error(
        error.message || 'An unexpected error occurred',
        error.code || 'HANDLER_ERROR',
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : null,
        error.statusCode || 500
      );
    }
  };
}

/**
 * Parse pagination query params from request
 * @param {object} query - req.query object
 * @param {object} defaults - Default values { page, limit }
 * @returns {{ page: number, limit: number, offset: number }}
 */
export function parsePagination(query, defaults = {}) {
  const page = Math.max(parseInt(query.page) || defaults.page || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit) || defaults.limit || 50, 1), 1000);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Build pagination metadata for res.success() calls
 * @param {number} page
 * @param {number} limit
 * @param {number} total
 * @returns {object} Meta object with pagination info
 */
export function paginationMeta(page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  return {
    pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
  };
}

// Common error codes
export const ERROR_CODES = {
  // Client errors (400s)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT_EXCEEDED',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED: 'MISSING_REQUIRED_FIELD',

  // Server errors (500s)
  INTERNAL_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  AI_ERROR: 'AI_SERVICE_ERROR',
  UPLOAD_ERROR: 'UPLOAD_ERROR',
  TIMEOUT: 'REQUEST_TIMEOUT',

  // Business logic errors
  DUPLICATE: 'DUPLICATE_ENTRY',
  INVALID_STATE: 'INVALID_STATE',
  OPERATION_FAILED: 'OPERATION_FAILED'
};

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};
