// Estimate Operations Module
// Adds estimate CRUD operations to DatabaseService

import { v4 as uuidv4 } from 'uuid';

/**
 * Estimate operations mixin
 * Adds estimate-related methods to DatabaseService
 */
export function addEstimateOperations(DatabaseService) {
  // Create new estimate
  DatabaseService.prototype.createEstimate = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
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
  };

  // Get single estimate
  DatabaseService.prototype.getEstimate = async function(id) {
    const estimate = await this.get('SELECT * FROM estimates WHERE id = ?', [id]);
    if (estimate) {
      if (estimate.breakdown) {
        try { estimate.breakdown = JSON.parse(estimate.breakdown); } catch (e) {}
      }
      if (estimate.margin) {
        try { estimate.margin = JSON.parse(estimate.margin); } catch (e) {}
      }
    }
    return estimate;
  };

  // Get all estimates with optional search and pagination
  DatabaseService.prototype.getAllEstimates = async function(filters = {}) {
    const { search, userId } = filters;
    let where = 'WHERE 1=1';
    const params = [];

    if (userId) {
      where += ' AND e.userId = ?';
      params.push(userId);
    }

    if (search) {
      where += ' AND (e.id LIKE ? OR e.leadId LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    const countRow = await this.get(`SELECT COUNT(*) as total FROM estimates e ${where}`, params);
    const total = countRow?.total || 0;

    let query = `
      SELECT e.*, GROUP_CONCAT(b.fileName) as blueprintFileNames
      FROM estimates e
      LEFT JOIN blueprints b ON b.estimateId = e.id
      ${where}
      GROUP BY e.id ORDER BY e.createdAt DESC
    `;

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    const estimates = await this.all(query, params);
    return { estimates, total };
  };

  // Delete estimate
  DatabaseService.prototype.deleteEstimate = async function(id) {
    // Clear estimateId from associated blueprints first
    await this.run('UPDATE blueprints SET estimateId = NULL WHERE estimateId = ?', [id]);
    
    const result = await this.run('DELETE FROM estimates WHERE id = ?', [id]);
    return result.changes > 0;
  };
}

export default addEstimateOperations;
