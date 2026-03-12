/**
 * Role-Based Access Control (RBAC) Middleware
 * Defines permissions for different user roles
 */

import { requireRole } from './auth-jwt.js';
import logger from '../services/logger.js';

// Role definitions
export const ROLES = {
  ADMIN: 'admin',
  ESTIMATOR: 'estimator',
  VIEWER: 'viewer'
};

// Permission definitions
export const PERMISSIONS = {
  // User management
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  
  // Lead management
  LEADS_READ: 'leads:read',
  LEADS_CREATE: 'leads:create',
  LEADS_UPDATE: 'leads:update',
  LEADS_DELETE: 'leads:delete',
  LEADS_SCORE: 'leads:score',
  
  // Project management
  PROJECTS_READ: 'projects:read',
  PROJECTS_CREATE: 'projects:create',
  PROJECTS_UPDATE: 'projects:update',
  PROJECTS_DELETE: 'projects:delete',
  
  // Estimates
  ESTIMATES_READ: 'estimates:read',
  ESTIMATES_CREATE: 'estimates:create',
  ESTIMATES_UPDATE: 'estimates:update',
  ESTIMATES_DELETE: 'estimates:delete',
  ESTIMATES_EXPORT: 'estimates:export',
  
  // Blueprints
  BLUEPRINTS_READ: 'blueprints:read',
  BLUEPRINTS_UPLOAD: 'blueprints:upload',
  BLUEPRINTS_ANALYZE: 'blueprints:analyze',
  BLUEPRINTS_DELETE: 'blueprints:delete',
  
  // Materials
  MATERIALS_READ: 'materials:read',
  MATERIALS_CREATE: 'materials:create',
  MATERIALS_UPDATE: 'materials:update',
  MATERIALS_DELETE: 'materials:delete',
  
  // Permits
  PERMITS_READ: 'permits:read',
  PERMITS_INGEST: 'permits:ingest',
  PERMITS_SCORE: 'permits:score',
  
  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
  
  // System
  SYSTEM_ADMIN: 'system:admin',
  BACKUP_MANAGE: 'backup:manage',
  LOGS_READ: 'logs:read'
};

// Role-permission mappings
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Admin has all permissions
    ...Object.values(PERMISSIONS)
  ],
  [ROLES.ESTIMATOR]: [
    // Leads
    PERMISSIONS.LEADS_READ,
    PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_UPDATE,
    PERMISSIONS.LEADS_SCORE,
    
    // Projects
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_UPDATE,
    
    // Estimates
    PERMISSIONS.ESTIMATES_READ,
    PERMISSIONS.ESTIMATES_CREATE,
    PERMISSIONS.ESTIMATES_UPDATE,
    PERMISSIONS.ESTIMATES_EXPORT,
    
    // Blueprints
    PERMISSIONS.BLUEPRINTS_READ,
    PERMISSIONS.BLUEPRINTS_UPLOAD,
    PERMISSIONS.BLUEPRINTS_ANALYZE,
    
    // Materials
    PERMISSIONS.MATERIALS_READ,
    PERMISSIONS.MATERIALS_CREATE,
    PERMISSIONS.MATERIALS_UPDATE,
    
    // Permits
    PERMISSIONS.PERMITS_READ,
    PERMISSIONS.PERMITS_SCORE,
    
    // Settings (read-only)
    PERMISSIONS.SETTINGS_READ
  ],
  [ROLES.VIEWER]: [
    // Viewers can only read
    PERMISSIONS.LEADS_READ,
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.ESTIMATES_READ,
    PERMISSIONS.BLUEPRINTS_READ,
    PERMISSIONS.MATERIALS_READ,
    PERMISSIONS.PERMITS_READ,
    PERMISSIONS.SETTINGS_READ
  ]
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission) || permissions.includes(PERMISSIONS.SYSTEM_ADMIN);
}

/**
 * Check if a role has all of the specified permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean}
 */
export function hasAllPermissions(role, permissions) {
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Check if a role has any of the specified permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean}
 */
export function hasAnyPermission(role, permissions) {
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Middleware to require a specific permission
 * @param {string} permission - Required permission
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.error('Unauthorized', 'UNAUTHORIZED', null, 401);
    }

    if (!hasPermission(req.user.role, permission)) {
      logger.warn(`Permission denied: ${req.user.id} (${req.user.role}) attempted ${permission}`);
      return res.error('Insufficient permissions', 'FORBIDDEN', { required: permission }, 403);
    }

    next();
  };
}

/**
 * Middleware to require any of the specified permissions
 * @param {string[]} permissions - Required permissions (any one sufficient)
 */
export function requireAnyPermission(permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.error('Unauthorized', 'UNAUTHORIZED', null, 401);
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      logger.warn(`Permission denied: ${req.user.id} (${req.user.role}) attempted [${permissions.join(', ')}]`);
      return res.error('Insufficient permissions', 'FORBIDDEN', { required: permissions }, 403);
    }

    next();
  };
}

/**
 * Middleware to require all of the specified permissions
 * @param {string[]} permissions - Required permissions (all required)
 */
export function requireAllPermissions(permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.error('Unauthorized', 'UNAUTHORIZED', null, 401);
    }

    if (!hasAllPermissions(req.user.role, permissions)) {
      logger.warn(`Permission denied: ${req.user.id} (${req.user.role}) attempted [${permissions.join(', ')}]`);
      return res.error('Insufficient permissions', 'FORBIDDEN', { required: permissions }, 403);
    }

    next();
  };
}

// Convenience middleware for common role combinations
export const requireAdmin = requireRole([ROLES.ADMIN]);
export const requireEstimator = requireRole([ROLES.ADMIN, ROLES.ESTIMATOR]);
export const requireAnyUser = requireRole([ROLES.ADMIN, ROLES.ESTIMATOR, ROLES.VIEWER]);

// Permission-based middleware shortcuts
export const canManageUsers = requirePermission(PERMISSIONS.USERS_UPDATE);
export const canManageSettings = requirePermission(PERMISSIONS.SETTINGS_UPDATE);
export const canExportEstimates = requirePermission(PERMISSIONS.ESTIMATES_EXPORT);
export const canAnalyzeBlueprints = requirePermission(PERMISSIONS.BLUEPRINTS_ANALYZE);

/**
 * Get all permissions for a role
 * @param {string} role 
 * @returns {string[]}
 */
export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if role is valid
 * @param {string} role 
 * @returns {boolean}
 */
export function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}

export default {
  ROLES,
  PERMISSIONS,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireAdmin,
  requireEstimator,
  requireAnyUser,
  canManageUsers,
  canManageSettings,
  canExportEstimates,
  canAnalyzeBlueprints,
  getRolePermissions,
  isValidRole
};
