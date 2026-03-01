/**
 * Standardized API Response Utility
 * TypeScript version with strict typing
 */

import { Response } from 'express';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ApiMeta {
  timestamp: string;
  [key: string]: any;
}

export interface ApiError {
  message: string;
  code: string;
  details: any;
  timestamp: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message: string | null;
  meta: ApiMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationMeta extends ApiMeta {
  pagination: PaginationInfo;
}

// ============================================================================
// Response Functions
// ============================================================================

/**
 * Create a success response object
 */
export function successResponse<T>(
  data: T,
  message: string | null = null,
  meta: Partial<ApiMeta> = {}
): ApiSuccessResponse<T> {
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
 * Create an error response object
 */
export function errorResponse(
  message: string,
  code: string = 'INTERNAL_ERROR',
  details: any = null
): ApiErrorResponse {
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
 * Create a paginated response object
 */
export function paginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number
): ApiSuccessResponse<T[]> {
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

// ============================================================================
// Express Response Extensions
// ============================================================================

export interface ExtendedResponse extends Response {
  success<T>(data: T, message?: string | null, meta?: Partial<ApiMeta>): Response;
  error(message: string, code?: string, details?: any, statusCode?: number): Response;
  paginated<T>(items: T[], page: number, limit: number, total: number): Response;
}

/**
 * Middleware to add response helper methods
 */
export function responseWrapper(req: any, res: ExtendedResponse, next: Function): void {
  const originalJson = res.json.bind(res);

  res.json = function(data: any): Response {
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

  res.success = function<T>(data: T, message?: string | null, meta?: Partial<ApiMeta>): Response {
    return res.json(successResponse(data, message, meta));
  };

  res.error = function(message: string, code?: string, details?: any, statusCode: number = 400): Response {
    return res.status(statusCode).json(errorResponse(message, code, details));
  };

  res.paginated = function<T>(items: T[], page: number, limit: number, total: number): Response {
    return res.json(paginatedResponse(items, page, limit, total));
  };

  next();
}

// ============================================================================
// Async Handler Utilities
// ============================================================================

import logger from '../services/logger.js';

/**
 * Wrap async route handlers to catch errors
 */
export function asyncHandler(
  fn: (req: any, res: ExtendedResponse, next: Function) => Promise<any>
): (req: any, res: ExtendedResponse, next: Function) => void {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Wrap route handler with try-catch and logging
 */
export function tryCatch(
  handler: (req: any, res: ExtendedResponse, next: Function) => Promise<any>
): (req: any, res: ExtendedResponse, next: Function) => Promise<void> {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error: any) {
      logger.error('Route handler error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
      });

      res.error(
        error.message || 'An unexpected error occurred',
        error.code || 'HANDLER_ERROR',
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : null,
        error.statusCode || 500
      );
    }
  };
}

// ============================================================================
// Pagination Utilities
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Parse pagination parameters from query string
 */
export function parsePagination(
  query: { page?: string; limit?: string },
  defaults: Partial<PaginationParams> = {}
): PaginationParams {
  const page = Math.max(parseInt(query.page || '') || defaults.page || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '') || defaults.limit || 50, 1), 1000);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Build pagination metadata
 */
export function paginationMeta(page: number, limit: number, total: number): { pagination: PaginationInfo } {
  const totalPages = Math.ceil(total / limit);
  return {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}

// ============================================================================
// Error Codes
// ============================================================================

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
} as const;

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
} as const;
