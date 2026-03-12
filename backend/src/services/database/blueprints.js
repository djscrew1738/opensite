// Blueprint Operations Module
// Adds CRUD operations for the legacy blueprints table to DatabaseService

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger.js';

/**
 * Blueprint operations mixin
 */
export function addBlueprintOperations(DatabaseService) {
  /**
   * Create a new blueprint record
   */
  DatabaseService.prototype.createBlueprint = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
      await this.run(`
        INSERT INTO blueprints (
          id, userId, fileName, filePath, extractedData, aiAnalysis, estimateId, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        data.userId || null,
        data.fileName,
        data.filePath || null,
        data.extractedData ? JSON.stringify(data.extractedData) : null,
        data.aiAnalysis ? JSON.stringify(data.aiAnalysis) : null,
        data.estimateId || null,
        now
      ]);
      
      return await this.getBlueprint(id);
    } catch (error) {
      logger.error('Failed to create blueprint', { error: error.message, fileName: data.fileName });
      throw error;
    }
  };

  /**
   * Get single blueprint by ID
   */
  DatabaseService.prototype.getBlueprint = async function(id) {
    try {
      const blueprint = await this.get('SELECT * FROM blueprints WHERE id = ?', [id]);
      if (blueprint) {
        if (blueprint.extractedData) {
          try { blueprint.extractedData = JSON.parse(blueprint.extractedData); } catch (e) {}
        }
        if (blueprint.aiAnalysis) {
          try { blueprint.aiAnalysis = JSON.parse(blueprint.aiAnalysis); } catch (e) {}
        }
      }
      return blueprint;
    } catch (error) {
      return null;
    }
  };

  /**
   * Update blueprint record
   */
  DatabaseService.prototype.updateBlueprint = async function(id, data) {
    const fields = [];
    const params = [];

    const allowed = ['fileName', 'filePath', 'extractedData', 'aiAnalysis', 'estimateId'];
    
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        if (key === 'extractedData' || key === 'aiAnalysis') {
          params.push(JSON.stringify(data[key]));
        } else {
          params.push(data[key]);
        }
      }
    }

    if (fields.length === 0) return await this.getBlueprint(id);

    params.push(id);

    try {
      await this.run(`UPDATE blueprints SET ${fields.join(', ')} WHERE id = ?`, params);
      return await this.getBlueprint(id);
    } catch (error) {
      logger.error(`Failed to update blueprint: ${id}`, { error: error.message });
      throw error;
    }
  };

  /**
   * Delete blueprint
   */
  DatabaseService.prototype.deleteBlueprint = async function(id) {
    try {
      const result = await this.run('DELETE FROM blueprints WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      return false;
    }
  };

  /**
   * Get all blueprints with filtering
   */
  DatabaseService.prototype.getAllBlueprints = async function(filters = {}) {
    let query = 'SELECT * FROM blueprints WHERE 1=1';
    const params = [];

    if (filters.userId) {
      query += ' AND userId = ?';
      params.push(filters.userId);
    }

    if (filters.estimateId) {
      query += ' AND estimateId = ?';
      params.push(filters.estimateId);
    }

    query += ' ORDER BY createdAt DESC';

    try {
      const rows = await this.all(query, params);
      return rows.map(row => {
        if (row.extractedData) {
          try { row.extractedData = JSON.parse(row.extractedData); } catch (e) {}
        }
        if (row.aiAnalysis) {
          try { row.aiAnalysis = JSON.parse(row.aiAnalysis); } catch (e) {}
        }
        return row;
      });
    } catch (error) {
      return [];
    }
  };

  /**
   * Get blueprints by estimate ID
   */
  DatabaseService.prototype.getBlueprintsByEstimateId = async function(estimateId) {
    return await this.getAllBlueprints({ estimateId });
  };
}

export default addBlueprintOperations;
