// Project Operations Module
// Adds project CRUD operations to DatabaseService

import { v4 as uuidv4 } from 'uuid';

/**
 * Project operations mixin
 * Adds project-related methods to DatabaseService
 */
export function addProjectOperations(DatabaseService) {
  // Create new project
  DatabaseService.prototype.createProject = function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO projects (id, name, leadId, phase, progress, value, startDate, estimatedCompletion, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
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
    );
    
    return this.getProject(id);
  };

  // Get single project
  DatabaseService.prototype.getProject = function(id) {
    return this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  };

  // Get all projects
  DatabaseService.prototype.getAllProjects = function() {
    return this.db.prepare('SELECT * FROM projects ORDER BY updatedAt DESC').all();
  };

  // Update project
  DatabaseService.prototype.updateProject = function(id, data) {
    const existing = this.getProject(id);
    if (!existing) return null;
    
    const now = new Date().toISOString();
    
    this.db.prepare(`
      UPDATE projects SET
        name = COALESCE(?, name),
        leadId = COALESCE(?, leadId),
        phase = COALESCE(?, phase),
        progress = COALESCE(?, progress),
        value = COALESCE(?, value),
        startDate = COALESCE(?, startDate),
        estimatedCompletion = COALESCE(?, estimatedCompletion),
        status = COALESCE(?, status),
        updatedAt = ?
      WHERE id = ?
    `).run(
      data.name,
      data.leadId,
      data.phase,
      data.progress,
      data.value,
      data.startDate,
      data.estimatedCompletion,
      data.status,
      now,
      id
    );
    
    return this.getProject(id);
  };

  // Delete project
  DatabaseService.prototype.deleteProject = function(id) {
    const result = this.db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    return result.changes > 0;
  };
}

export default addProjectOperations;
