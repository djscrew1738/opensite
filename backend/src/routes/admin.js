/**
 * Admin Routes
 * System administration endpoints for user management and system operations
 */

import express from 'express';
import { db } from '../services/database.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { requireAdmin, ROLES, isValidRole, getRolePermissions } from '../middleware/rbac.js';
import { hashPassword } from '../utils/auth.js';
import { tryCatch } from '../utils/response.js';
import logger from '../services/logger.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * Get all users
 * GET /api/admin/users
 */
router.get('/users', tryCatch(async (req, res) => {
  const users = await db.getAllUsers();
  res.success({ users, count: users.length });
}));

/**
 * Get single user
 * GET /api/admin/users/:id
 */
router.get('/users/:id', tryCatch(async (req, res) => {
  const user = await db.getUser(req.params.id);
  
  if (!user) {
    return res.error('User not found', 'NOT_FOUND', null, 404);
  }
  
  res.success({ user });
}));

/**
 * Create new user
 * POST /api/admin/users
 */
router.post('/users', tryCatch(async (req, res) => {
  const { username, email, password, role = ROLES.VIEWER } = req.body;
  
  // Validation
  if (!username || !email || !password) {
    return res.error('Username, email, and password are required', 'VALIDATION_ERROR', null, 400);
  }
  
  if (!isValidRole(role)) {
    return res.error(`Invalid role. Must be one of: ${Object.values(ROLES).join(', ')}`, 'VALIDATION_ERROR', null, 400);
  }
  
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check if email exists
  const existing = await db.getUserByEmail(normalizedEmail);
  if (existing) {
    return res.error('Email already in use', 'CONFLICT', null, 409);
  }
  
  const hashedPassword = await hashPassword(password);
  
  const user = await db.createUser({
    username: username.trim(),
    email: normalizedEmail,
    passwordHash: hashedPassword,
    role,
    isActive: true
  });
  
  logger.info('Admin created user', { 
    adminId: req.user.id, 
    newUserId: user.id, 
    role 
  });
  
  res.success({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    }
  }, 'User created successfully', 201);
}));

/**
 * Update user
 * PUT /api/admin/users/:id
 */
router.put('/users/:id', tryCatch(async (req, res) => {
  const { username, email, role, isActive } = req.body;
  
  const user = await db.getUser(req.params.id);
  if (!user) {
    return res.error('User not found', 'NOT_FOUND', null, 404);
  }
  
  // Prevent self-demotion from admin
  if (user.id === req.user.id && role && role !== ROLES.ADMIN) {
    return res.error('Cannot change your own admin role', 'FORBIDDEN', null, 403);
  }
  
  // Validate role if provided
  if (role && !isValidRole(role)) {
    return res.error(`Invalid role. Must be one of: ${Object.values(ROLES).join(', ')}`, 'VALIDATION_ERROR', null, 400);
  }
  
  const updates = {};
  if (username !== undefined) updates.username = username.trim();
  if (email !== undefined) updates.email = email.toLowerCase().trim();
  if (role !== undefined) updates.role = role;
  if (isActive !== undefined) updates.isActive = isActive;
  
  const updated = await db.updateUser(req.params.id, updates);
  
  logger.info('Admin updated user', { 
    adminId: req.user.id, 
    targetUserId: user.id,
    updates: Object.keys(updates)
  });
  
  res.success({ user: updated }, 'User updated successfully');
}));

/**
 * Delete user
 * DELETE /api/admin/users/:id
 */
router.delete('/users/:id', tryCatch(async (req, res) => {
  const user = await db.getUser(req.params.id);
  
  if (!user) {
    return res.error('User not found', 'NOT_FOUND', null, 404);
  }
  
  // Prevent self-deletion
  if (user.id === req.user.id) {
    return res.error('Cannot delete your own account', 'FORBIDDEN', null, 403);
  }
  
  await db.deleteUser(req.params.id);
  
  logger.info('Admin deleted user', { 
    adminId: req.user.id, 
    deletedUserId: user.id 
  });
  
  res.success({ id: req.params.id }, 'User deleted successfully');
}));

/**
 * Reset user password
 * POST /api/admin/users/:id/reset-password
 */
router.post('/users/:id/reset-password', tryCatch(async (req, res) => {
  const { newPassword } = req.body;
  
  if (!newPassword || newPassword.length < 6) {
    return res.error('Password must be at least 6 characters', 'VALIDATION_ERROR', null, 400);
  }
  
  const user = await db.getUser(req.params.id);
  if (!user) {
    return res.error('User not found', 'NOT_FOUND', null, 404);
  }
  
  const hashedPassword = await hashPassword(newPassword);
  await db.updateUser(req.params.id, { passwordHash: hashedPassword });
  
  logger.info('Admin reset user password', { 
    adminId: req.user.id, 
    targetUserId: user.id 
  });
  
  res.success({ message: 'Password reset successfully' });
}));

/**
 * Get role definitions and permissions
 * GET /api/admin/roles
 */
router.get('/roles', tryCatch(async (req, res) => {
  const roles = Object.values(ROLES).map(role => ({
    name: role,
    permissions: getRolePermissions(role)
  }));
  
  res.success({ roles });
}));

/**
 * Get system stats
 * GET /api/admin/stats
 */
router.get('/stats', tryCatch(async (req, res) => {
  const stats = {
    users: { total: 0, byRole: {} },
    leads: { total: 0, byStatus: {} },
    projects: { total: 0, byStatus: {} },
    permits: { total: 0, byTier: {} },
    estimates: { total: 0 },
    blueprints: { total: 0 }
  };
  
  // User stats
  const users = await db.getAllUsers();
  stats.users.total = users.length;
  stats.users.byRole = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});
  
  // Try to get other stats (may fail if tables don't exist yet)
  try {
    const leadsResult = await db.query('SELECT COUNT(*) as count FROM leads');
    stats.leads.total = parseInt(leadsResult[0]?.count || 0);
  } catch (e) { /* ignore */ }
  
  try {
    const projectsResult = await db.query('SELECT COUNT(*) as count FROM projects');
    stats.projects.total = parseInt(projectsResult[0]?.count || 0);
  } catch (e) { /* ignore */ }
  
  try {
    const permitsResult = await db.query('SELECT COUNT(*) as count FROM permits');
    stats.permits.total = parseInt(permitsResult[0]?.count || 0);
  } catch (e) { /* ignore */ }
  
  res.success({ stats });
}));

/**
 * Seed default service areas
 * POST /api/admin/seed-service-areas
 */
router.post('/seed-service-areas', tryCatch(async (req, res) => {
  const result = await db.seedDefaultServiceAreas();
  
  if (result.seeded) {
    res.success(result, 'Service areas seeded successfully');
  } else {
    res.success(result, 'Service areas already exist');
  }
}));

export default router;
