/**
 * In-App Notification Channel
 * Stores notifications in database for in-app display
 */

import { randomUUID } from 'crypto';
import logger from '../logger.js';
import { db } from '../database.js';

/**
 * Create in-app notification
 * @param {Object} options
 * @param {string} options.userId - User ID
 * @param {string} options.type - Notification type
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {Object} [options.data] - Additional data
 * @param {string} [options.entityType] - Related entity type
 * @param {string} [options.entityId] - Related entity ID
 */
export async function createInAppNotification(options) {
  const {
    userId,
    type = 'info',
    title,
    message,
    data = {},
    entityType,
    entityId
  } = options;
  
  if (!userId || !title || !message) {
    throw new Error('Missing required fields: userId, title, message');
  }
  
  const notification = {
    id: randomUUID(),
    user_id: userId,
    type,
    title,
    message,
    data: JSON.stringify(data),
    entity_type: entityType,
    entity_id: entityId,
    read: 0,
    created_at: new Date().toISOString()
  };
  
  // Store in database (requires notifications table)
  try {
    const stmt = db.db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, data, entity_type, entity_id, read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      notification.id,
      notification.user_id,
      notification.type,
      notification.title,
      notification.message,
      notification.data,
      notification.entity_type,
      notification.entity_id,
      notification.read,
      notification.created_at
    );
  } catch (err) {
    // Table might not exist yet, log but don't fail
    logger.warn('[notifications:inapp] Failed to store notification:', err.message);
  }
  
  logger.info('[notifications:inapp] Notification created', {
    userId,
    type,
    title
  });
  
  return {
    success: true,
    id: notification.id,
    timestamp: notification.created_at
  };
}

/**
 * Get user notifications
 * @param {string} userId
 * @param {Object} options
 */
export async function getUserNotifications(userId, options = {}) {
  const { unreadOnly = false, limit = 50, offset = 0 } = options;
  
  let sql = 'SELECT * FROM notifications WHERE user_id = ?';
  const params = [userId];
  
  if (unreadOnly) {
    sql += ' AND read = 0';
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  const stmt = db.db.prepare(sql);
  return stmt.all(...params);
}

/**
 * Mark notification as read
 * @param {string} notificationId
 * @param {string} userId
 */
export async function markAsRead(notificationId, userId) {
  const stmt = db.db.prepare(`
    UPDATE notifications SET read = 1, read_at = ?
    WHERE id = ? AND user_id = ?
  `);
  
  const result = stmt.run(new Date().toISOString(), notificationId, userId);
  return result.changes > 0;
}

export default { createInAppNotification, getUserNotifications, markAsRead };
