import express from 'express';
import { db } from '../services/database.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { tryCatch } from '../utils/response.js';
import logger from '../services/logger.js';

const router = express.Router();

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', tryCatch(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.error('Username, email, and password are required', 'VALIDATION_ERROR', null, 400);
  }

  // Check if user exists
  const existingUser = await db.getUserByEmail(email);
  if (existingUser) {
    return res.error('Email already in use', 'CONFLICT', null, 409);
  }

  const hashedPassword = await hashPassword(password);

  // Check if this is the first user (make admin)
  const allUsers = await db.getAllUsers();
  const role = allUsers.length === 0 ? 'admin' : 'viewer';

  const user = await db.createUser({
    username,
    email,
    passwordHash: hashedPassword,
    role
  });

  const token = generateToken(user);

  logger.info('User registered', { id: user.id, email: user.email, role });

  res.status(201).success({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    token
  }, 'User registered successfully');
}));

/**
 * Login
 * POST /api/auth/login
 */
router.post('/login', tryCatch(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.error('Email and password are required', 'VALIDATION_ERROR', null, 400);
  }

  const user = await db.getUserByEmail(email);
  if (!user) {
    return res.error('Invalid credentials', 'AUTH_ERROR', null, 401);
  }

  if (!user.isActive) {
    return res.error('Account is disabled', 'AUTH_ERROR', null, 403);
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    return res.error('Invalid credentials', 'AUTH_ERROR', null, 401);
  }

  // Update last login
  await db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

  const token = generateToken(user);

  logger.info('User logged in', { id: user.id, email: user.email });

  res.success({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    token
  }, 'Login successful');
}));

/**
 * Get current user
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, tryCatch(async (req, res) => {
  const user = await db.getUser(req.user.id);
  
  if (!user) {
    return res.error('User not found', 'NOT_FOUND', null, 404);
  }

  res.success({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      lastLoginAt: user.lastLoginAt
    }
  });
}));

export default router;
