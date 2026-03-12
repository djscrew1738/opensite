// Proposal Operations Module
// Adds proposal CRUD operations to DatabaseService

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger.js';

/**
 * Proposal operations mixin
 */
export function addProposalOperations(DatabaseService) {
  /**
   * Initialize proposals table
   */
  DatabaseService.prototype.initializeProposalTables = async function() {
    try {
      await this.exec(`
        CREATE TABLE IF NOT EXISTS proposals (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          estimateId TEXT,
          proposalNumber TEXT UNIQUE NOT NULL,
          clientName TEXT NOT NULL,
          projectAddress TEXT,
          projectType TEXT,
          totalAmount REAL DEFAULT 0,
          status TEXT DEFAULT 'draft',
          filename TEXT,
          filePath TEXT,
          data TEXT, -- Full JSON data used to generate PDF
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (estimateId) REFERENCES estimates(id) ON DELETE SET NULL
        )
      `);
      
      await this.exec(`CREATE INDEX IF NOT EXISTS idx_proposals_user ON proposals(userId)`);
      await this.exec(`CREATE INDEX IF NOT EXISTS idx_proposals_estimate ON proposals(estimateId)`);
    } catch (error) {
      logger.error('Failed to initialize proposal tables', { error: error.message });
    }
  };

  /**
   * Create a new proposal
   */
  DatabaseService.prototype.createProposal = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
      await this.run(`
        INSERT INTO proposals (
          id, userId, estimateId, proposalNumber, clientName,
          projectAddress, projectType, totalAmount, status,
          filename, filePath, data, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        data.userId,
        data.estimateId || null,
        data.proposalNumber,
        data.clientName,
        data.projectAddress || null,
        data.projectType || null,
        data.totalAmount || 0,
        data.status || 'draft',
        data.filename || null,
        data.filePath || null,
        data.data ? JSON.stringify(data.data) : null,
        now,
        now
      ]);
      
      return await this.getProposal(id);
    } catch (error) {
      logger.error('Failed to create proposal', { error: error.message, proposalNumber: data.proposalNumber });
      throw error;
    }
  };

  /**
   * Get single proposal by ID
   */
  DatabaseService.prototype.getProposal = async function(id) {
    try {
      const row = await this.get('SELECT * FROM proposals WHERE id = ?', [id]);
      if (row && row.data) {
        try { row.data = JSON.parse(row.data); } catch (e) {}
      }
      return row;
    } catch (error) {
      return null;
    }
  };

  /**
   * Get all proposals with filtering
   */
  DatabaseService.prototype.getAllProposals = async function(filters = {}) {
    let query = 'SELECT * FROM proposals WHERE 1=1';
    const params = [];

    if (filters.userId) {
      query += ' AND userId = ?';
      params.push(filters.userId);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.estimateId) {
      query += ' AND estimateId = ?';
      params.push(filters.estimateId);
    }

    query += ' ORDER BY createdAt DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(parseInt(filters.offset));
      }
    }

    try {
      const rows = await this.all(query, params);
      return rows.map(row => {
        if (row.data) {
          try { row.data = JSON.parse(row.data); } catch (e) {}
        }
        return row;
      });
    } catch (error) {
      return [];
    }
  };

  /**
   * Update proposal status or metadata
   */
  DatabaseService.prototype.updateProposal = async function(id, data) {
    const fields = [];
    const params = [];
    const now = new Date().toISOString();

    const allowed = ['status', 'clientName', 'projectAddress', 'totalAmount', 'filename', 'filePath', 'data'];
    
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        if (key === 'data' && typeof data[key] === 'object') {
          params.push(JSON.stringify(data[key]));
        } else {
          params.push(data[key]);
        }
      }
    }

    if (fields.length === 0) return await this.getProposal(id);

    fields.push('updatedAt = ?');
    params.push(now);
    params.push(id);

    try {
      const result = await this.run(`UPDATE proposals SET ${fields.join(', ')} WHERE id = ?`, params);
      if (result.changes === 0) return null;
      return await this.getProposal(id);
    } catch (error) {
      logger.error(`Failed to update proposal: ${id}`, { error: error.message });
      throw error;
    }
  };

  /**
   * Delete proposal
   */
  DatabaseService.prototype.deleteProposal = async function(id) {
    try {
      const result = await this.run('DELETE FROM proposals WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      return false;
    }
  };
}

export default addProposalOperations;
