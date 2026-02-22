// Lead Operations Module
// Adds lead CRUD operations to DatabaseService

import { v4 as uuidv4 } from 'uuid';

/**
 * Lead operations mixin
 * Adds lead-related methods to DatabaseService
 */
export function addLeadOperations(DatabaseService) {
  // Create new lead
  DatabaseService.prototype.createLead = function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO leads (id, name, company, email, phone, location, projectType, value, score, status, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.name,
      data.company || null,
      data.email || null,
      data.phone || null,
      data.location || null,
      data.projectType || null,
      data.value || 0,
      data.score || null,
      data.status || 'new',
      data.notes || null,
      now,
      now
    );
    
    return this.getLead(id);
  };

  // Get single lead
  DatabaseService.prototype.getLead = function(id) {
    return this.db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  };

  // Get all leads with optional filtering
  DatabaseService.prototype.getAllLeads = function(filters = {}) {
    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];
    
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters.search) {
      query += ' AND (name LIKE ? OR company LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY updatedAt DESC';
    
    return this.db.prepare(query).all(...params);
  };

  // Update lead
  DatabaseService.prototype.updateLead = function(id, data) {
    const existing = this.getLead(id);
    if (!existing) return null;
    
    const now = new Date().toISOString();
    
    this.db.prepare(`
      UPDATE leads SET
        name = COALESCE(?, name),
        company = COALESCE(?, company),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        location = COALESCE(?, location),
        projectType = COALESCE(?, projectType),
        value = COALESCE(?, value),
        score = COALESCE(?, score),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        updatedAt = ?
      WHERE id = ?
    `).run(
      data.name,
      data.company,
      data.email,
      data.phone,
      data.location,
      data.projectType,
      data.value,
      data.score,
      data.status,
      data.notes,
      now,
      id
    );
    
    return this.getLead(id);
  };

  // Delete lead
  DatabaseService.prototype.deleteLead = function(id) {
    const result = this.db.prepare('DELETE FROM leads WHERE id = ?').run(id);
    return result.changes > 0;
  };
}

export default addLeadOperations;
