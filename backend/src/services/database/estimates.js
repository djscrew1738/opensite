// Estimate Operations Module
// Adds estimate CRUD operations to DatabaseService

import { v4 as uuidv4 } from 'uuid';

/**
 * Estimate operations mixin
 * Adds estimate-related methods to DatabaseService
 */
export function addEstimateOperations(DatabaseService) {
  // Create new estimate
  DatabaseService.prototype.createEstimate = function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO estimates (
        id, leadId, sqft, bathrooms, units, stories,
        lavatories, barSinks, tubs, showerBases, mudPans,
        washingMachines, toilets, waterSoftenerPreplumb, kitchenFaucets,
        total, perUnit, breakdown, margin, analysis, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
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
    );
    
    return this.getEstimate(id);
  };

  // Get single estimate
  DatabaseService.prototype.getEstimate = function(id) {
    const estimate = this.db.prepare('SELECT * FROM estimates WHERE id = ?').get(id);
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

  // Get all estimates with optional search
  DatabaseService.prototype.getAllEstimates = function(search) {
    let query = `
      SELECT e.*, GROUP_CONCAT(b.fileName) as blueprintFileNames
      FROM estimates e
      LEFT JOIN blueprints b ON b.estimateId = e.id
    `;
    const params = [];
    
    if (search) {
      query += ' WHERE e.id LIKE ? OR e.leadId LIKE ?';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    query += ' GROUP BY e.id ORDER BY e.createdAt DESC';
    
    return this.db.prepare(query).all(...params);
  };

  // Delete estimate
  DatabaseService.prototype.deleteEstimate = function(id) {
    // Clear estimateId from associated blueprints first
    this.db.prepare('UPDATE blueprints SET estimateId = NULL WHERE estimateId = ?').run(id);
    
    const result = this.db.prepare('DELETE FROM estimates WHERE id = ?').run(id);
    return result.changes > 0;
  };
}

export default addEstimateOperations;
