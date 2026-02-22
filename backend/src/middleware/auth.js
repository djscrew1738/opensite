// Authentication Middleware
// Simple API key-based auth for admin endpoints

import logger from '../services/logger.js';
import crypto from 'crypto';

// Admin API key from environment - falls back to a default only in development
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// Track if admin endpoints are disabled due to missing ADMIN_TOKEN
let adminEndpointsDisabled = false;

/**
 * Check if admin endpoints should be disabled
 * Call this at server startup to log warning if ADMIN_TOKEN is not set
 */
export function checkAdminTokenConfig() {
  if (!ADMIN_TOKEN) {
    adminEndpointsDisabled = true;
    logger.warn('ADMIN_TOKEN environment variable not set. Admin endpoints (/api/admin/*) are DISABLED.');
    return false;
  }
  adminEndpointsDisabled = false;
  return true;
}

/**
 * Check if admin endpoints are disabled
 */
export function areAdminEndpointsDisabled() {
  return adminEndpointsDisabled;
}

/**
 * Require admin Bearer token for access
 * Header: Authorization: Bearer <token>
 * Checks against ADMIN_TOKEN environment variable
 */
export const requireAdminToken = (req, res, next) => {
  // If ADMIN_TOKEN is not configured, disable admin endpoints
  if (!ADMIN_TOKEN) {
    logger.warn('Admin access attempted but ADMIN_TOKEN not configured', {
      ip: req.ip,
      path: req.path
    });
    return res.status(503).json({
      error: 'Admin endpoints disabled - ADMIN_TOKEN not configured',
      code: 'ADMIN_NOT_CONFIGURED'
    });
  }

  // Get Authorization header
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    logger.warn('Admin access attempted without Authorization header', {
      ip: req.ip,
      path: req.path
    });
    return res.status(401).json({
      error: 'Unauthorized - Bearer token required',
      code: 'UNAUTHORIZED'
    });
  }

  // Parse Bearer token
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    logger.warn('Admin access attempted with invalid Authorization format', {
      ip: req.ip,
      path: req.path
    });
    return res.status(401).json({
      error: 'Unauthorized - Invalid Authorization format. Use: Bearer <token>',
      code: 'UNAUTHORIZED'
    });
  }

  const providedToken = parts[1];

  // Validate provided token using timing-safe comparison
  if (!providedToken || !timingSafeCompare(providedToken, ADMIN_TOKEN)) {
    logger.warn('Invalid admin Bearer token provided', {
      ip: req.ip,
      path: req.path,
      hasToken: !!providedToken
    });
    return res.status(401).json({
      error: 'Unauthorized - Invalid token',
      code: 'UNAUTHORIZED'
    });
  }
  
  next();
};

/**
 * Require admin API key for access (legacy X-Admin-Key header)
 * Header: X-Admin-Key
 * @deprecated Use requireAdminToken with Bearer token instead
 */
export const requireAdmin = (req, res, next) => {
  const providedKey = req.headers['x-admin-key'];
  
  // If no admin key is configured, deny access in production
  if (!ADMIN_API_KEY) {
    logger.warn('Admin access attempted but ADMIN_API_KEY not configured', {
      ip: req.ip,
      path: req.path
    });
    return res.status(503).json({
      error: 'Admin access not configured',
      code: 'ADMIN_NOT_CONFIGURED'
    });
  }
  
  // Validate provided key using timing-safe comparison
  if (!providedKey || !timingSafeCompare(providedKey, ADMIN_API_KEY)) {
    logger.warn('Invalid admin key provided', {
      ip: req.ip,
      path: req.path,
      hasKey: !!providedKey
    });
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'UNAUTHORIZED'
    });
  }
  
  next();
};

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeCompare(a, b) {
  if (a.length !== b.length) {
    // Still do a comparison to avoid leaking length info via timing
    // But return false regardless
    const dummy = 'x'.repeat(a.length);
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ dummy.charCodeAt(i);
    }
    return false;
  }
  
  // Use Node.js built-in timing-safe comparison if available
  if (crypto.timingSafeEqual) {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  }
  
  // Fallback for older Node versions
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generate a secure admin API key
 * Run this once and set as ADMIN_API_KEY environment variable
 * @deprecated Use generateAdminToken instead
 */
export function generateAdminKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'osk_';
  for (let i = 0; i < 48; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

/**
 * Generate a secure admin Bearer token
 * Run this once and set as ADMIN_TOKEN environment variable
 */
export function generateAdminToken() {
  return 'atk_' + crypto.randomBytes(32).toString('base64url');
}

export default { requireAdmin, requireAdminToken, generateAdminKey, generateAdminToken, checkAdminTokenConfig, areAdminEndpointsDisabled };
