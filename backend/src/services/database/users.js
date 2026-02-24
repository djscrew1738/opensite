// User Operations Module
// Adds user CRUD operations to DatabaseService

import { v4 as uuidv4 } from 'uuid';
import cache from '../cache.js';

/**
 * User operations mixin
 * Adds user-related methods to DatabaseService
 */
export function addUserOperations(DatabaseService) {
  // Create new user
  DatabaseService.prototype.createUser = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
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
    
    cache.del('users:all');
    return await this.getUser(id);
  };

  // Get single user by ID
  DatabaseService.prototype.getUser = async function(id) {
    const cacheKey = `user:${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const user = await this.get('SELECT * FROM users WHERE id = ?', [id]);
    if (user) {
      user.isActive = Boolean(user.isActive);
      cache.set(cacheKey, user, 3600); // Cache for 1 hour
    }
    return user;
  };

  // Get user by email
  DatabaseService.prototype.getUserByEmail = async function(email) {
    const cacheKey = `user-by-email:${email}`;
    const cachedId = cache.get(cacheKey);
    if (cachedId) {
      const cachedUser = await this.getUser(cachedId);
      if (cachedUser) return cachedUser;
    }

    const user = await this.get('SELECT * FROM users WHERE email = ?', [email]);
    if (user) {
      user.isActive = Boolean(user.isActive);
      cache.set(cacheKey, user.id, 3600); // Cache ID by email
      cache.set(`user:${user.id}`, user, 3600); // Cache full user object
    }
    return user;
  };

  // Get user by username
  DatabaseService.prototype.getUserByUsername = async function(username) {
    // This is less frequently cached as it's a fallback
    const user = await this.get('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [username]);
    if (user) {
      user.isActive = Boolean(user.isActive);
    }
    return user;
  };

  // Get all users
  DatabaseService.prototype.getAllUsers = async function() {
    const cached = cache.get('users:all');
    if (cached) return cached;

    const users = await this.all('SELECT id, username, email, role, isActive, lastLoginAt, createdAt FROM users ORDER BY createdAt DESC');
    const result = users.map(u => ({ ...u, isActive: Boolean(u.isActive) }));
    cache.set('users:all', result, 3600);
    return result;
  };

  // Update user
  DatabaseService.prototype.updateUser = async function(id, data) {
    const now = new Date().toISOString();
    const sets = [];
    const values = [];

    const user = await this.getUser(id);

    if (data.username !== undefined) { sets.push('username = ?'); values.push(data.username); }
    if (data.email !== undefined) { sets.push('email = ?'); values.push(data.email); }
    if (data.passwordHash !== undefined) { sets.push('passwordHash = ?'); values.push(data.passwordHash); }
    if (data.role !== undefined) { sets.push('role = ?'); values.push(data.role); }
    if (data.isActive !== undefined) { sets.push('isActive = ?'); values.push(data.isActive ? 1 : 0); }
    if (data.lastLoginAt !== undefined) { sets.push('lastLoginAt = ?'); values.push(data.lastLoginAt); }

    if (sets.length === 0) return user;

    sets.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await this.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, values);
    
    // Invalidate caches
    cache.del(`user:${id}`);
    if (user && user.email) {
      cache.del(`user-by-email:${user.email}`);
    }
    if (data.email && data.email !== user.email) {
      cache.del(`user-by-email:${data.email}`);
    }
    cache.del('users:all');
    
    return await this.getUser(id);
  };

  // Delete user
  DatabaseService.prototype.deleteUser = async function(id) {
    const user = await this.getUser(id);
    const result = await this.run('DELETE FROM users WHERE id = ?', [id]);

    if (result.changes > 0 && user) {
      cache.del(`user:${id}`);
      cache.del(`user-by-email:${user.email}`);
      cache.del('users:all');
    }
    
    return result.changes > 0;
  };
}

export default addUserOperations;
