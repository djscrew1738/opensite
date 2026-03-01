/**
 * Custom Error Classes
 * 
 * Provides standardized error handling across the application.
 * All errors extend AppError for consistent error responses.
 */

/**
 * Base application error
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distinguishes operational errors from programming errors
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        details: this.details,
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Validation Error - Invalid input data
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Not Found Error - Resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource', id = null) {
    const message = id ? `${resource} not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND', { resource, id });
  }
}

/**
 * Unauthorized Error - Authentication required
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden Error - Permission denied
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Permission denied', required = null) {
    super(message, 403, 'FORBIDDEN', required ? { required } : null);
  }
}

/**
 * Conflict Error - Resource conflict (e.g., duplicate)
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details = null) {
    super(message, 409, 'CONFLICT', details);
  }
}

/**
 * Rate Limit Error - Too many requests
 */
export class RateLimitError extends AppError {
  constructor(retryAfter = null) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED', retryAfter ? { retryAfter } : null);
  }
}

/**
 * Database Error - Database operation failed
 */
export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', details = null) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

/**
 * External Service Error - Third-party service failure
 */
export class ExternalServiceError extends AppError {
  constructor(service, message = 'External service error') {
    super(`${service}: ${message}`, 503, 'EXTERNAL_SERVICE_ERROR', { service });
  }
}

/**
 * AI Service Error - AI provider failure
 */
export class AIServiceError extends AppError {
  constructor(provider, message = 'AI service error') {
    super(`${provider}: ${message}`, 503, 'AI_SERVICE_ERROR', { provider });
  }
}

/**
 * Timeout Error - Operation timed out
 */
export class TimeoutError extends AppError {
  constructor(operation = 'Operation', timeout = null) {
    super(`${operation} timed out`, 504, 'TIMEOUT', timeout ? { timeout } : null);
  }
}

/**
 * Upload Error - File upload failed
 */
export class UploadError extends AppError {
  constructor(message = 'Upload failed', details = null) {
    super(message, 400, 'UPLOAD_ERROR', details);
  }
}

/**
 * Business Logic Error - Domain-specific error
 */
export class BusinessError extends AppError {
  constructor(message, code = 'BUSINESS_ERROR', details = null) {
    super(message, 400, code, details);
  }
}

/**
 * Async handler wrapper - catches errors and passes to Express error handler
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Error codes enum for type safety
 */
export const ErrorCodes = {
  // Client errors (400s)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UPLOAD_ERROR: 'UPLOAD_ERROR',
  
  // Server errors (500s)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  TIMEOUT: 'TIMEOUT'
};

/**
 * HTTP status codes enum
 */
export const HttpStatus = {
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

export default AppError;
