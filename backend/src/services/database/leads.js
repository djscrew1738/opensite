// Lead Operations Module
// Adds lead CRUD operations to DatabaseService

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger.js';

/**
 * Lead operations mixin
 * Adds lead-related methods to DatabaseService
 */
export function addLeadOperations(DatabaseService) {
  /**
   * Create new lead
   * @param {Object} data - Lead data
   * @returns {Promise<Object>} The created lead
   */
  DatabaseService.prototype.createLead = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
      await this.run(`
        INSERT INTO leads (
          id, userId, name, company, email, phone, location, 
          projectType, value, score, tier, status, notes, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        data.userId || null,
        data.name,
        data.company || null,
        data.email || null,
        data.phone || null,
        data.location || null,
        data.projectType || null,
        data.value || 0,
        data.score || null,
        data.tier || 'unscored',
        data.status || 'new',
        data.notes || null,
        now,
        now
      ]);
      
      return await this.getLead(id);
    } catch (error) {
      logger.error('Failed to create lead', { error: error.message, name: data.name });
      throw error;
    }
  };

  /**
   * Get single lead
   * @param {string} id - Lead UUID
   * @returns {Promise<Object|null>}
   */
  DatabaseService.prototype.getLead = async function(id) {
    try {
      return await this.get('SELECT * FROM leads WHERE id = ?', [id]);
    } catch (error) {
      logger.error(`Error getting lead: ${id}`, { error: error.message });
      return null;
    }
  };

  /**
   * Get all leads with optional filtering and pagination
   * @param {Object} filters - Filter options (status, search, userId, limit, offset)
   * @returns {Promise<Object>} { leads, total }
   */
  DatabaseService.prototype.getAllLeads = async function(filters = {}) {
    let where = 'WHERE 1=1';
    const params = [];

    // Optional: Filter by user if requested and allowed
    if (filters.userId && !filters.allUsers) {
      where += ' AND userId = ?';
      params.push(filters.userId);
    }

    if (filters.status) {
      where += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.tier) {
      where += ' AND tier = ?';
      params.push(filters.tier);
    }

    if (filters.search) {
      where += ' AND (name LIKE ? OR company LIKE ? OR email LIKE ? OR phone LIKE ? OR location LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    try {
      // Count total before pagination
      const countRow = await this.get(`SELECT COUNT(*) as total FROM leads ${where}`, params);
      const total = countRow?.total || 0;

      let query = `SELECT * FROM leads ${where} ORDER BY updatedAt DESC`;

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(parseInt(filters.limit));
        if (filters.offset) {
          query += ' OFFSET ?';
          params.push(parseInt(filters.offset));
        }
      }

      const leads = await this.all(query, params);
      return { leads, total };
    } catch (error) {
      logger.error('Error getting all leads', { error: error.message, filters });
      return { leads: [], total: 0 };
    }
  };

  /**
   * Update lead
   * @param {string} id - Lead UUID
   * @param {Object} data - Update data
   * @returns {Promise<Object|null>} Updated lead
   */
  DatabaseService.prototype.updateLead = async function(id, data) {
    const fields = [];
    const params = [];
    const now = new Date().toISOString();

    const allowedFields = [
      'name', 'company', 'email', 'phone', 'location', 
      'projectType', 'value', 'score', 'tier', 'status', 'notes'
    ];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }

    if (fields.length === 0) return await this.getLead(id);

    fields.push('updatedAt = ?');
    params.push(now);
    params.push(id);

    try {
      const result = await this.run(`
        UPDATE leads SET ${fields.join(', ')}
        WHERE id = ?
      `, params);
      
      if (result.changes === 0) return null;
      return await this.getLead(id);
    } catch (error) {
      logger.error(`Failed to update lead: ${id}`, { error: error.message });
      throw error;
    }
  };

  /**
   * Delete lead
   * @param {string} id - Lead UUID
   * @returns {Promise<boolean>}
   */
  DatabaseService.prototype.deleteLead = async function(id) {
    try {
      const result = await this.run('DELETE FROM leads WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      logger.error(`Failed to delete lead: ${id}`, { error: error.message });
      return false;
    }
  };

  /**
   * Bulk update lead status
   * @param {Array<string>} ids - Lead UUIDs
   * @param {string} status - New status
   */
  DatabaseService.prototype.bulkUpdateLeadStatus = async function(ids, status) {
    if (!ids || ids.length === 0) return 0;
    const now = new Date().toISOString();
    const placeholders = ids.map(() => '?').join(',');
    
    try {
      const result = await this.run(`
        UPDATE leads SET status = ?, updatedAt = ?
        WHERE id IN (${placeholders})
      `, [status, now, ...ids]);
      return result.changes;
    } catch (error) {
      logger.error('Bulk update lead status failed', { error: error.message });
      throw error;
    }
  };
}

export default addLeadOperations;
