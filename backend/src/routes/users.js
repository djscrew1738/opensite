// routes/users.js - User management routes

import express from 'express';
import { db } from '../services/database.js';
import { tryCatch } from '../utils/response.js';
import { hashPassword } from '../utils/auth.js';
import { authenticateToken, requireRole } from '../middleware/auth-jwt.js';
import { validateId } from '../middleware/validation.js';
import logger from '../services/logger.js';

const router = express.Router();

// All routes in this file require admin access
router.use(authenticateToken, requireRole(['admin']));

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 */
router.get('/', tryCatch(async (req, res) => {
  const users = await db.getAllUsers();
  res.success(users);
}));

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 */
router.get('/:id', validateId, tryCatch(async (req, res) => {
  const user = await db.getUser(req.params.id);
  if (!user) return res.error('User not found', 'NOT_FOUND', null, 404);
  
  // Remove sensitive data
  delete user.passwordHash;
  res.success(user);
}));

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 */
router.post('/', tryCatch(async (req, res) => {
  const { username, email, password, role } = req.body;
  
  if (!username || !email || !password) {
    return res.error('Username, email and password are required', 'VALIDATION_ERROR', null, 400);
  }

  // Check if user already exists
  const existing = await db.getUserByEmail(email);
  if (existing) {
    return res.error('User with this email already exists', 'CONFLICT', null, 409);
  }

  const hashedPassword = await hashPassword(password);
  const user = await db.createUser({ 
    username, 
    email, 
    passwordHash: hashedPassword, 
    role: role || 'viewer' 
  });

  logger.info('User created by admin', { id: user.id, email: user.email, adminId: req.user.id });
  res.status(201).success(user, 'User created successfully');
}));

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
 */
router.put('/:id', validateId, tryCatch(async (req, res) => {
  const { id } = req.params;
  const { password, ...updateData } = req.body;

  // Verify user exists
  const existing = await db.getUser(id);
  if (!existing) return res.error('User not found', 'NOT_FOUND', null, 404);

  // Handle password update separately if provided
  if (password) {
    updateData.passwordHash = await hashPassword(password);
  }

  const user = await db.updateUser(id, updateData);
  
  logger.info('User updated by admin', { id, adminId: req.user.id });
  res.success(user, 'User updated successfully');
}));

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 */
router.delete('/:id', validateId, tryCatch(async (req, res) => {
  const { id } = req.params;
  
  // Prevent self-deletion
  if (id === req.user.id) {
    return res.error('Cannot delete your own account', 'FORBIDDEN', null, 403);
  }

  const deleted = await db.deleteUser(id);
  if (!deleted) return res.error('User not found', 'NOT_FOUND', null, 404);
  
  logger.info('User deleted by admin', { id, adminId: req.user.id });
  res.success({ id }, 'User deleted successfully');
}));

export default router;
