import express from 'express';
import { db } from '../services/database.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { tryCatch } from '../utils/response.js';
import logger from '../services/logger.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Email already in use
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
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', tryCatch(async (req, res) => {
  const { email: identifier, password } = req.body;

  if (!identifier || !password) {
    return res.error('Email/Username and password are required', 'VALIDATION_ERROR', null, 400);
  }

  // Try to find user by email first, then by username
  let user = await db.getUserByEmail(identifier);
  if (!user) {
    // If not found by email, try by username
    user = await db.getUserByUsername(identifier);
  }

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
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
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
