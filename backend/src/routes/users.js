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

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
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
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [admin, editor, viewer]
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post('/', tryCatch(async (req, res) => {
  const { username, email, password, role } = req.body;
  const hashedPassword = await hashPassword(password);
  const user = await db.createUser({ username, email, passwordHash: hashedPassword, role });
  res.status(201).success(user);
}));

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [admin, editor, viewer]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put('/:id', tryCatch(async (req, res) => {
  const { id } = req.params;
  const user = await db.updateUser(id, req.body);
  res.success(user);
}));

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete('/:id', tryCatch(async (req, res) => {
  const { id } = req.params;
  await db.deleteUser(id);
  res.success({ id });
}));

export default router;
