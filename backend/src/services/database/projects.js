// Project Operations Module
// Adds project CRUD operations to DatabaseService

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger.js';

/**
 * Project operations mixin
 * Adds project-related methods to DatabaseService
 */
export function addProjectOperations(DatabaseService) {
  /**
   * Create new project
   * @param {Object} data - Project data
   * @returns {Promise<Object>} The created project
   */
  DatabaseService.prototype.createProject = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
      await this.run(`
        INSERT INTO projects (
          id, userId, name, leadId, phase, progress, 
          value, startDate, estimatedCompletion, status, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        data.userId || null,
        data.name,
        data.leadId || null,
        data.phase || 'rough-in',
        data.progress || 0,
        data.value || 0,
        data.startDate || null,
        data.estimatedCompletion || null,
        data.status || 'active',
        now,
        now
      ]);
      
      return await this.getProject(id);
    } catch (error) {
      logger.error('Failed to create project', { error: error.message, name: data.name });
      throw error;
    }
  };

  /**
   * Get single project
   * @param {string} id - Project UUID
   * @returns {Promise<Object|null>}
   */
  DatabaseService.prototype.getProject = async function(id) {
    try {
      return await this.get(`
        SELECT p.*, l.name as leadName, l.company as leadCompany
        FROM projects p
        LEFT JOIN leads l ON p.leadId = l.id
        WHERE p.id = ?
      `, [id]);
    } catch (error) {
      logger.error(`Error getting project: ${id}`, { error: error.message });
      return null;
    }
  };

  /**
   * Get all projects with optional filtering and pagination
   * @param {Object} filters - Filter options (status, phase, userId, leadId, search, limit, offset)
   * @returns {Promise<Object>} { projects, total }
   */
  DatabaseService.prototype.getAllProjects = async function(filters = {}) {
    let where = 'WHERE 1=1';
    const params = [];

    if (filters.userId && !filters.allUsers) {
      where += ' AND p.userId = ?';
      params.push(filters.userId);
    }

    if (filters.status) {
      where += ' AND p.status = ?';
      params.push(filters.status);
    }

    if (filters.phase) {
      where += ' AND p.phase = ?';
      params.push(filters.phase);
    }

    if (filters.leadId) {
      where += ' AND p.leadId = ?';
      params.push(filters.leadId);
    }

    if (filters.search) {
      where += ' AND (p.name LIKE ? OR l.name LIKE ? OR l.company LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    try {
      // Count total before pagination
      const countRow = await this.get(`
        SELECT COUNT(*) as total 
        FROM projects p
        LEFT JOIN leads l ON p.leadId = l.id
        ${where}
      `, params);
      const total = countRow?.total || 0;

      let query = `
        SELECT p.*, l.name as leadName, l.company as leadCompany
        FROM projects p
        LEFT JOIN leads l ON p.leadId = l.id
        ${where} 
        ORDER BY p.updatedAt DESC
      `;

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(parseInt(filters.limit));
        if (filters.offset) {
          query += ' OFFSET ?';
          params.push(parseInt(filters.offset));
        }
      }

      const projects = await this.all(query, params);
      return { projects, total };
    } catch (error) {
      logger.error('Error getting all projects', { error: error.message, filters });
      return { projects: [], total: 0 };
    }
  };

  /**
   * Update project
   * @param {string} id - Project UUID
   * @param {Object} data - Update data
   * @returns {Promise<Object|null>} Updated project
   */
  DatabaseService.prototype.updateProject = async function(id, data) {
    const fields = [];
    const params = [];
    const now = new Date().toISOString();

    const allowedFields = [
      'name', 'leadId', 'phase', 'progress', 'value', 
      'startDate', 'estimatedCompletion', 'status'
    ];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }

    if (fields.length === 0) return await this.getProject(id);

    fields.push('updatedAt = ?');
    params.push(now);
    params.push(id);

    try {
      const result = await this.run(`
        UPDATE projects SET ${fields.join(', ')}
        WHERE id = ?
      `, params);
      
      if (result.changes === 0) return null;
      return await this.getProject(id);
    } catch (error) {
      logger.error(`Failed to update project: ${id}`, { error: error.message });
      throw error;
    }
  };

  /**
   * Delete project
   * @param {string} id - Project UUID
   * @returns {Promise<boolean>}
   */
  DatabaseService.prototype.deleteProject = async function(id) {
    try {
      const result = await this.run('DELETE FROM projects WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      logger.error(`Failed to delete project: ${id}`, { error: error.message });
      return false;
    }
  };

  /**
   * Get project stats
   * @returns {Promise<Object>}
   */
  DatabaseService.prototype.getProjectStats = async function() {
    try {
      const stats = await this.get(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(value) as totalValue
        FROM projects
      `);
      
      const phaseStats = await this.all(`
        SELECT phase, COUNT(*) as count FROM projects GROUP BY phase
      `);
      
      return {
        ...stats,
        phases: phaseStats
      };
    } catch (error) {
      logger.error('Error getting project stats', { error: error.message });
      return { total: 0, active: 0, completed: 0, totalValue: 0, phases: [] };
    }
  };
}

export default addProjectOperations;
