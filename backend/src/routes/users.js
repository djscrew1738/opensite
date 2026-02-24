// routes/users.js - User management routes

import express from 'express';
import { db } from '../services/database.js';
import { tryCatch } from '../utils/response.js';
import { authenticateToken, requireRole } from '../middleware/auth-jwt.js';

const router = express.Router();

// All routes in this file require admin access
router.use(authenticateToken, requireRole(['admin']));

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', tryCatch(async (req, res) => {
  const users = await db.getAllUsers();
  res.success(users);
}));

export default router;
