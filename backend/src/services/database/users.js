// User Operations Module
// Adds user CRUD operations to DatabaseService

import { v4 as uuidv4 } from 'uuid';
import cache from '../cache.js';
import logger from '../logger.js';

/**
 * User operations mixin
 * Adds user-related methods to DatabaseService
 */
export function addUserOperations(DatabaseService) {
  /**
   * Create new user
   * @param {Object} data - User data
   * @returns {Promise<Object>} The created user
   */
  DatabaseService.prototype.createUser = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
      await this.run(`
        INSERT INTO users (
          id, username, email, passwordHash, role, isActive, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        data.username,
        data.email,
        data.passwordHash,
        data.role || 'viewer',
        data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
        now,
        now
      ]);
      
      this._invalidateUserCache(id, data.email);
      return await this.getUser(id);
    } catch (error) {
      logger.error('Failed to create user', { error: error.message, email: data.email });
      throw error;
    }
  };

  /**
   * Get single user by ID
   * @param {string} id - User UUID
   * @returns {Promise<Object|null>}
   */
  DatabaseService.prototype.getUser = async function(id) {
    const cacheKey = `user:${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const user = await this.get('SELECT * FROM users WHERE id = ?', [id]);
      if (user) {
        user.isActive = Boolean(user.isActive);
        cache.set(cacheKey, user, 3600); // Cache for 1 hour
      }
      return user;
    } catch (error) {
      logger.error(`Error getting user: ${id}`, { error: error.message });
      return null;
    }
  };

  /**
   * Get user by email
   * @param {string} email 
   * @returns {Promise<Object|null>}
   */
  DatabaseService.prototype.getUserByEmail = async function(email) {
    if (!email) return null;
    
    const cacheKey = `user-by-email:${email.toLowerCase()}`;
    const cachedId = cache.get(cacheKey);
    if (cachedId) {
      return await this.getUser(cachedId);
    }

    try {
      const user = await this.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
      if (user) {
        user.isActive = Boolean(user.isActive);
        cache.set(cacheKey, user.id, 3600);
        cache.set(`user:${user.id}`, user, 3600);
      }
      return user;
    } catch (error) {
      logger.error(`Error getting user by email: ${email}`, { error: error.message });
      return null;
    }
  };

  /**
   * Get user by username
   * @param {string} username 
   * @returns {Promise<Object|null>}
   */
  DatabaseService.prototype.getUserByUsername = async function(username) {
    if (!username) return null;
    
    const cacheKey = `user-by-username:${username}`;
    const cachedId = cache.get(cacheKey);
    if (cachedId) {
      return await this.getUser(cachedId);
    }

    try {
      const user = await this.get('SELECT * FROM users WHERE username = ?', [username]);
      if (user) {
        user.isActive = Boolean(user.isActive);
        cache.set(cacheKey, user.id, 3600);
        cache.set(`user:${user.id}`, user, 3600);
      }
      return user;
    } catch (error) {
      logger.error(`Error getting user by username: ${username}`, { error: error.message });
      return null;
    }
  };

  /**
   * Get all users
   * @returns {Promise<Array>}
   */
  DatabaseService.prototype.getAllUsers = async function() {
    const cached = cache.get('users:all');
    if (cached) return cached;

    try {
      const users = await this.all(`
        SELECT id, username, email, role, isActive, lastLoginAt, createdAt 
        FROM users 
        ORDER BY createdAt DESC
      `);
      
      const result = users.map(u => ({ ...u, isActive: Boolean(u.isActive) }));
      cache.set('users:all', result, 1800); // Cache for 30 mins
      return result;
    } catch (error) {
      logger.error('Error getting all users', { error: error.message });
      return [];
    }
  };

  /**
   * Update user
   * @param {string} id - User UUID
   * @param {Object} data - Update data
   * @returns {Promise<Object|null>} Updated user
   */
  DatabaseService.prototype.updateUser = async function(id, data) {
    const fields = [];
    const params = [];
    const now = new Date().toISOString();

    const allowedFields = ['username', 'email', 'passwordHash', 'role', 'isActive', 'lastLoginAt'];
    
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(key === 'isActive' ? (data[key] ? 1 : 0) : data[key]);
      }
    }

    if (fields.length === 0) return await this.getUser(id);

    fields.push('updatedAt = ?');
    params.push(now);
    params.push(id);

    try {
      const existing = await this.getUser(id);
      if (!existing) return null;

      const result = await this.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
      
      if (result.changes > 0) {
        this._invalidateUserCache(id, existing.email, data.email);
      }
      
      return await this.getUser(id);
    } catch (error) {
      logger.error(`Failed to update user: ${id}`, { error: error.message });
      throw error;
    }
  };

  /**
   * Delete user
   * @param {string} id - User UUID
   * @returns {Promise<boolean>}
   */
  DatabaseService.prototype.deleteUser = async function(id) {
    try {
      const user = await this.getUser(id);
      if (!user) return false;

      const result = await this.run('DELETE FROM users WHERE id = ?', [id]);

      if (result.changes > 0) {
        this._invalidateUserCache(id, user.email);
      }
      
      return result.changes > 0;
    } catch (error) {
      logger.error(`Failed to delete user: ${id}`, { error: error.message });
      return false;
    }
  };

  /**
   * Internal helper to invalidate user-related caches
   */
  DatabaseService.prototype._invalidateUserCache = function(id, oldEmail, newEmail = null) {
    cache.del(`user:${id}`);
    if (oldEmail) cache.del(`user-by-email:${oldEmail.toLowerCase()}`);
    if (newEmail) cache.del(`user-by-email:${newEmail.toLowerCase()}`);
    cache.del('users:all');
  };
}

export default addUserOperations;
