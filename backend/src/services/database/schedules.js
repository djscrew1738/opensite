// Schedules Database Operations
// Follow-up scheduling and task management

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger.js';

/**
 * Add schedule operations to DatabaseService prototype
 * @param {typeof import('./core.js').DatabaseService} DatabaseService 
 */
export default function addScheduleOperations(DatabaseService) {
  
  // ═══════════════════════════════════════════════════════════════
  // Schedule CRUD Operations
  // ═══════════════════════════════════════════════════════════════

  /**
   * Create a new schedule
   */
  DatabaseService.prototype.createSchedule = async function(schedule) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
      await this.run(`
        INSERT INTO schedules (
          id, lead_id, user_id, type, title, description,
          scheduled_date, scheduled_time, duration_minutes, status,
          priority, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        schedule.lead_id || null,
        schedule.user_id || null,
        schedule.type || 'follow_up',
        schedule.title,
        schedule.description || null,
        schedule.scheduled_date,
        schedule.scheduled_time || null,
        schedule.duration_minutes || 30,
        schedule.status || 'pending',
        schedule.priority || 'medium',
        schedule.notes || null,
        now,
        now
      ]);
      
      return await this.getScheduleById(id);
    } catch (error) {
      logger.error('Failed to create schedule', { error: error.message });
      throw error;
    }
  };

  /**
   * Get schedule by ID
   */
  DatabaseService.prototype.getScheduleById = async function(id) {
    try {
      return await this.get(`
        SELECT s.*, 
          l.name as lead_name,
          l.company as lead_company,
          u.username as user_name
        FROM schedules s
        LEFT JOIN leads l ON s.lead_id = l.id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id = ?
      `, [id]);
    } catch (error) {
      return null;
    }
  };

  /**
   * Update a schedule
   */
  DatabaseService.prototype.updateSchedule = async function(id, updates) {
    const allowedFields = [
      'type', 'title', 'description', 'scheduled_date', 'scheduled_time',
      'duration_minutes', 'status', 'priority', 'notes', 'completed_at', 'completed_by'
    ];
    
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) {
      return await this.getScheduleById(id);
    }
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    try {
      const result = await this.run(`
        UPDATE schedules SET ${fields.join(', ')} WHERE id = ?
      `, values);
      
      if (result.changes === 0) return null;
      return await this.getScheduleById(id);
    } catch (error) {
      logger.error(`Failed to update schedule: ${id}`, { error: error.message });
      throw error;
    }
  };

  /**
   * Delete a schedule
   */
  DatabaseService.prototype.deleteSchedule = async function(id) {
    try {
      const result = await this.run('DELETE FROM schedules WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      return false;
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // Query Operations
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get schedules for a specific date range
   */
  DatabaseService.prototype.getSchedulesByDateRange = async function(options) {
    const { startDate, endDate, user_id, status } = options;
    
    let sql = `
      SELECT s.*, 
        l.name as lead_name,
        l.company as lead_company,
        l.phone as lead_phone,
        l.email as lead_email,
        u.username as user_name
      FROM schedules s
      LEFT JOIN leads l ON s.lead_id = l.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.scheduled_date >= ? AND s.scheduled_date <= ?
    `;
    const params = [startDate, endDate];
    
    if (user_id) {
      sql += ' AND s.user_id = ?';
      params.push(user_id);
    }
    
    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY s.scheduled_date, s.scheduled_time';
    
    try {
      return await this.all(sql, params);
    } catch (error) {
      return [];
    }
  };

  /**
   * Get today's tasks
   */
  DatabaseService.prototype.getTodaysTasks = async function(user_id) {
    const today = new Date().toISOString().split('T')[0];
    
    let sql = `
      SELECT s.*, 
        l.name as lead_name,
        l.company as lead_company,
        l.phone as lead_phone,
        l.email as lead_email
      FROM schedules s
      LEFT JOIN leads l ON s.lead_id = l.id
      WHERE s.scheduled_date = ? AND s.status = 'pending'
    `;
    const params = [today];
    
    if (user_id) {
      sql += ' AND (s.user_id = ? OR s.user_id IS NULL)';
      params.push(user_id);
    }
    
    sql += ' ORDER BY s.scheduled_time, s.priority DESC';
    
    try {
      return await this.all(sql, params);
    } catch (error) {
      return [];
    }
  };

  /**
   * Get upcoming follow-ups
   */
  DatabaseService.prototype.getUpcomingFollowUps = async function(options = {}) {
    const { days = 7, user_id } = options;
    
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const endDate = futureDate.toISOString().split('T')[0];
    
    let sql = `
      SELECT s.*, 
        l.name as lead_name,
        l.company as lead_company,
        l.phone as lead_phone,
        l.email as lead_email,
        l.status as lead_status,
        l.score as lead_score
      FROM schedules s
      LEFT JOIN leads l ON s.lead_id = l.id
      WHERE s.scheduled_date >= ? 
        AND s.scheduled_date <= ?
        AND s.status = 'pending'
        AND s.type IN ('follow_up', 'call', 'email')
    `;
    const params = [today, endDate];
    
    if (user_id) {
      sql += ' AND (s.user_id = ? OR s.user_id IS NULL)';
      params.push(user_id);
    }
    
    sql += ' ORDER BY s.scheduled_date, s.scheduled_time, s.priority DESC';
    
    try {
      return await this.all(sql, params);
    } catch (error) {
      return [];
    }
  };

  /**
   * Get overdue schedules
   */
  DatabaseService.prototype.getOverdueSchedules = async function(user_id) {
    const today = new Date().toISOString().split('T')[0];
    
    let sql = `
      SELECT s.*, 
        l.name as lead_name,
        l.company as lead_company,
        l.phone as lead_phone,
        l.email as lead_email
      FROM schedules s
      LEFT JOIN leads l ON s.lead_id = l.id
      WHERE s.scheduled_date < ? AND s.status = 'pending'
    `;
    const params = [today];
    
    if (user_id) {
      sql += ' AND (s.user_id = ? OR s.user_id IS NULL)';
      params.push(user_id);
    }
    
    sql += ' ORDER BY s.scheduled_date DESC';
    
    try {
      return await this.all(sql, params);
    } catch (error) {
      return [];
    }
  };

  /**
   * Get schedules by lead
   */
  DatabaseService.prototype.getSchedulesByLead = async function(lead_id) {
    try {
      return await this.all(`
        SELECT s.*, u.username as user_name
        FROM schedules s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.lead_id = ?
        ORDER BY s.scheduled_date DESC, s.created_at DESC
      `, [lead_id]);
    } catch (error) {
      return [];
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // Statistics
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get schedule statistics
   */
  DatabaseService.prototype.getScheduleStats = async function(options = {}) {
    const { user_id, days = 30 } = options;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    let whereClause = 'WHERE scheduled_date >= ?';
    const params = [startDateStr];
    
    if (user_id) {
      whereClause += ' AND (user_id = ? OR user_id IS NULL)';
      params.push(user_id);
    }
    
    try {
      const totalRow = await this.get(`SELECT COUNT(*) as count FROM schedules ${whereClause}`, params);
      const pendingRow = await this.get(`SELECT COUNT(*) as count FROM schedules ${whereClause} AND status = 'pending'`, params);
      const completedRow = await this.get(`SELECT COUNT(*) as count FROM schedules ${whereClause} AND status = 'completed'`, params);
      
      const overdueParams = user_id ? [user_id] : [];
      const overdueRow = await this.get(`
        SELECT COUNT(*) as count FROM schedules 
        WHERE scheduled_date < date('now') AND status = 'pending'
        ${user_id ? 'AND (user_id = ? OR user_id IS NULL)' : ''}
      `, overdueParams);
      
      return {
        total: totalRow?.count || 0,
        pending: pendingRow?.count || 0,
        completed: completedRow?.count || 0,
        overdue: overdueRow?.count || 0,
        period_days: days
      };
    } catch (error) {
      return { total: 0, pending: 0, completed: 0, overdue: 0, period_days: days };
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // Reminder Operations
  // ═══════════════════════════════════════════════════════════════

  /**
   * Create a reminder
   */
  DatabaseService.prototype.createScheduleReminder = async function(reminder) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
      await this.run(`
        INSERT INTO schedule_reminders (
          id, schedule_id, reminder_type, minutes_before, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        id,
        reminder.schedule_id,
        reminder.reminder_type || 'in_app',
        reminder.minutes_before || 15,
        reminder.status || 'pending',
        now
      ]);
      
      return { id, ...reminder, status: 'pending', created_at: now };
    } catch (error) {
      logger.error('Failed to create reminder', { error: error.message });
      throw error;
    }
  };

  /**
   * Get pending reminders
   */
  DatabaseService.prototype.getPendingReminders = async function() {
    try {
      return await this.all(`
        SELECT r.*, 
          s.title as schedule_title,
          s.scheduled_date,
          s.scheduled_time,
          s.description as schedule_description,
          l.name as lead_name,
          l.company as lead_company
        FROM schedule_reminders r
        JOIN schedules s ON r.schedule_id = s.id
        LEFT JOIN leads l ON s.lead_id = l.id
        WHERE r.status = 'pending'
          AND s.status = 'pending'
          AND datetime(s.scheduled_date || ' ' || COALESCE(s.scheduled_time, '00:00')) > datetime('now')
      `);
    } catch (error) {
      return [];
    }
  };

  /**
   * Mark reminder as sent
   */
  DatabaseService.prototype.markReminderSent = async function(id) {
    try {
      const result = await this.run(`
        UPDATE schedule_reminders 
        SET status = 'sent', sent_at = ? 
        WHERE id = ?
      `, [new Date().toISOString(), id]);
      return result.changes > 0;
    } catch (error) {
      return false;
    }
  };
}
