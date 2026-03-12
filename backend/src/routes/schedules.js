// Schedules API Routes
// Follow-up scheduling and task management endpoints

import express from 'express';
import { db } from '../services/database.js';
import { tryCatch, parsePagination, paginationMeta } from '../utils/response.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { validateId } from '../middleware/validation.js';
import logger from '../services/logger.js';

const router = express.Router();

// Apply authentication to all schedule routes
router.use(authenticateToken);

// ═══════════════════════════════════════════════════════════════
// Schedule CRUD Endpoints
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/schedules - List all schedules with filtering
 */
router.get('/', tryCatch(async (req, res) => {
  const { 
    start_date, 
    end_date, 
    status, 
    type, 
    lead_id,
    priority
  } = req.query;
  
  const { page, limit, offset } = parsePagination(req.query, { limit: 100 });
  
  // Build date range (default to current month)
  const today = new Date();
  const startDate = start_date || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const endDate = end_date || new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const schedules = await db.getSchedulesByDateRange({
    startDate,
    endDate,
    user_id: req.user.id,
    status,
    type,
    priority,
    limit,
    offset
  });
  
  res.success({
    schedules,
    total: schedules.length // Currently getSchedulesByDateRange doesn't return total count for pagination
  }, null, paginationMeta(page, limit, schedules.length));
}));

/**
 * GET /api/schedules/:id - Get a single schedule
 */
router.get('/:id', validateId, tryCatch(async (req, res) => {
  const schedule = await db.getScheduleById(req.params.id);
  
  if (!schedule) {
    return res.error('Schedule not found', 'NOT_FOUND', null, 404);
  }
  
  // Basic security check - owner or admin
  if (schedule.user_id && schedule.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.error('Access denied', 'FORBIDDEN', null, 403);
  }
  
  res.success(schedule);
}));

/**
 * POST /api/schedules - Create a new schedule
 */
router.post('/', tryCatch(async (req, res) => {
  const {
    lead_id,
    type = 'follow_up',
    title,
    description,
    scheduled_date,
    scheduled_time,
    duration_minutes = 30,
    priority = 'medium',
    notes
  } = req.body;
  
  if (!title || !scheduled_date) {
    return res.error('Title and scheduled date are required', 'VALIDATION_ERROR', null, 400);
  }
  
  const schedule = await db.createSchedule({
    lead_id,
    user_id: req.user.id,
    type,
    title,
    description,
    scheduled_date,
    scheduled_time,
    duration_minutes,
    priority,
    notes
  });
  
  logger.info('Schedule created', { scheduleId: schedule.id, userId: req.user.id });
  res.status(201).success(schedule, 'Schedule created successfully');
}));

/**
 * PUT /api/schedules/:id - Update a schedule
 */
router.put('/:id', validateId, tryCatch(async (req, res) => {
  const existing = await db.getScheduleById(req.params.id);
  
  if (!existing) {
    return res.error('Schedule not found', 'NOT_FOUND', null, 404);
  }
  
  if (existing.user_id && existing.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.error('Access denied', 'FORBIDDEN', null, 403);
  }
  
  const updates = { ...req.body };
  
  // Handle status completion logic
  if (updates.status === 'completed' && existing.status !== 'completed') {
    updates.completed_at = new Date().toISOString();
    updates.completed_by = req.user.id;
  }
  
  const schedule = await db.updateSchedule(req.params.id, updates);
  res.success(schedule, 'Schedule updated successfully');
}));

/**
 * DELETE /api/schedules/:id - Delete a schedule
 */
router.delete('/:id', validateId, tryCatch(async (req, res) => {
  const existing = await db.getScheduleById(req.params.id);
  
  if (!existing) {
    return res.error('Schedule not found', 'NOT_FOUND', null, 404);
  }
  
  if (existing.user_id && existing.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.error('Access denied', 'FORBIDDEN', null, 403);
  }
  
  await db.deleteSchedule(req.params.id);
  res.success({ id: req.params.id }, 'Schedule deleted successfully');
}));

// ═══════════════════════════════════════════════════════════════
// Query Endpoints
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/schedules/queries/today - Today's tasks
 */
router.get('/queries/today', tryCatch(async (req, res) => {
  const tasks = await db.getTodaysTasks(req.user.id);
  res.success({ tasks, count: tasks.length });
}));

/**
 * GET /api/schedules/queries/upcoming - Upcoming follow-ups
 */
router.get('/queries/upcoming', tryCatch(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 90);
  const followUps = await db.getUpcomingFollowUps({ user_id: req.user.id, days });
  
  // Group by date
  const grouped = followUps.reduce((acc, followUp) => {
    const date = followUp.scheduled_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(followUp);
    return acc;
  }, {});
  
  res.success({ followUps, grouped, count: followUps.length });
}));

/**
 * GET /api/schedules/queries/overdue - Overdue tasks
 */
router.get('/queries/overdue', tryCatch(async (req, res) => {
  const schedules = await db.getOverdueSchedules(req.user.id);
  res.success({ schedules, count: schedules.length });
}));

/**
 * GET /api/schedules/lead/:leadId - Schedules for a specific lead
 */
router.get('/lead/:leadId', validateId, tryCatch(async (req, res) => {
  const schedules = await db.getSchedulesByLead(req.params.leadId);
  res.success({ schedules, count: schedules.length });
}));

/**
 * GET /api/schedules/stats/overview - Schedule statistics
 */
router.get('/stats/overview', tryCatch(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days) || 30, 1), 365);
  const stats = await db.getScheduleStats({ user_id: req.user.id, days });
  
  res.success({
    ...stats,
    completion_rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
  });
}));

export default router;
