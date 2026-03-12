// Estimate Operations Module
// Adds estimate CRUD operations to DatabaseService

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger.js';

/**
 * Estimate operations mixin
 * Adds estimate-related methods to DatabaseService
 */
export function addEstimateOperations(DatabaseService) {
  /**
   * Create new estimate
   * @param {Object} data - Estimate data
   * @returns {Promise<Object>} The created estimate
   */
  DatabaseService.prototype.createEstimate = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
      await this.run(`
        INSERT INTO estimates (
          id, userId, leadId, sqft, bathrooms, units, stories,
          lavatories, barSinks, tubs, showerBases, mudPans,
          washingMachines, toilets, waterSoftenerPreplumb, kitchenFaucets,
          total, perUnit, breakdown, margin, analysis, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        data.userId || null,
        data.leadId || null,
        data.sqft || null,
        data.bathrooms || null,
        data.units || null,
        data.stories || null,
        data.lavatories || 0,
        data.barSinks || 0,
        data.tubs || 0,
        data.showerBases || 0,
        data.mudPans || 0,
        data.washingMachines || 0,
        data.toilets || 0,
        data.waterSoftenerPreplumb || 0,
        data.kitchenFaucets || 0,
        data.total || null,
        data.perUnit || null,
        data.breakdown ? JSON.stringify(data.breakdown) : null,
        data.margin ? JSON.stringify(data.margin) : null,
        data.analysis || null,
        now
      ]);
      
      return await this.getEstimate(id);
    } catch (error) {
      logger.error('Failed to create estimate', { error: error.message, userId: data.userId });
      throw error;
    }
  };

  /**
   * Get single estimate
   * @param {string} id - Estimate UUID
   * @returns {Promise<Object|null>}
   */
  DatabaseService.prototype.getEstimate = async function(id) {
    try {
      const estimate = await this.get('SELECT * FROM estimates WHERE id = ?', [id]);
      if (estimate) {
        // Parse JSON fields
        if (estimate.breakdown && typeof estimate.breakdown === 'string') {
          try { estimate.breakdown = JSON.parse(estimate.breakdown); } catch (e) { logger.warn(`Failed to parse breakdown for estimate ${id}`); }
        }
        if (estimate.margin && typeof estimate.margin === 'string') {
          try { estimate.margin = JSON.parse(estimate.margin); } catch (e) { logger.warn(`Failed to parse margin for estimate ${id}`); }
        }
      }
      return estimate;
    } catch (error) {
      logger.error(`Error getting estimate: ${id}`, { error: error.message });
      return null;
    }
  };

  /**
   * Get all estimates with optional filtering and pagination
   * @param {Object} filters - Filter options (search, userId, leadId, limit, offset)
   * @returns {Promise<Object>} { estimates, total }
   */
  DatabaseService.prototype.getAllEstimates = async function(filters = {}) {
    const { search, userId, leadId } = filters;
    let where = 'WHERE 1=1';
    const params = [];

    if (userId) {
      where += ' AND e.userId = ?';
      params.push(userId);
    }
    
    if (leadId) {
      where += ' AND e.leadId = ?';
      params.push(leadId);
    }

    if (search) {
      where += ' AND (e.id LIKE ? OR e.leadId LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    try {
      const countRow = await this.get(`SELECT COUNT(*) as total FROM estimates e ${where}`, params);
      const total = countRow?.total || 0;

      let query = `
        SELECT e.*, GROUP_CONCAT(b.fileName) as blueprintFileNames
        FROM estimates e
        LEFT JOIN blueprints b ON b.estimateId = e.id
        ${where}
        GROUP BY e.id 
        ORDER BY e.createdAt DESC
      `;

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(parseInt(filters.limit));
        if (filters.offset) {
          query += ' OFFSET ?';
          params.push(parseInt(filters.offset));
        }
      }

      const estimates = await this.all(query, params);
      
      // Parse JSON fields for all estimates
      estimates.forEach(e => {
        if (e.breakdown && typeof e.breakdown === 'string') {
          try { e.breakdown = JSON.parse(e.breakdown); } catch (err) {}
        }
        if (e.margin && typeof e.margin === 'string') {
          try { e.margin = JSON.parse(e.margin); } catch (err) {}
        }
      });
      
      return { estimates, total };
    } catch (error) {
      logger.error('Error getting all estimates', { error: error.message, filters });
      return { estimates: [], total: 0 };
    }
  };

  /**
   * Delete estimate
   * @param {string} id - Estimate UUID
   * @returns {Promise<boolean>}
   */
  DatabaseService.prototype.deleteEstimate = async function(id) {
    try {
      // Clear estimateId from associated blueprints first (integrity)
      await this.run('UPDATE blueprints SET estimateId = NULL WHERE estimateId = ?', [id]);
      
      const result = await this.run('DELETE FROM estimates WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      logger.error(`Failed to delete estimate: ${id}`, { error: error.message });
      return false;
    }
  };

  /**
   * Link estimate to a lead
   * @param {string} estimateId 
   * @param {string} leadId 
   */
  DatabaseService.prototype.linkEstimateToLead = async function(estimateId, leadId) {
    try {
      const result = await this.run('UPDATE estimates SET leadId = ? WHERE id = ?', [leadId, estimateId]);
      return result.changes > 0;
    } catch (error) {
      logger.error(`Failed to link estimate ${estimateId} to lead ${leadId}`, { error: error.message });
      return false;
    }
  };
}

export default addEstimateOperations;
