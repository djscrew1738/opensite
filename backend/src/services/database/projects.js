// Project Operations Module
// Adds project CRUD operations to DatabaseService

import { v4 as uuidv4 } from 'uuid';

/**
 * Project operations mixin
 * Adds project-related methods to DatabaseService
 */
export function addProjectOperations(DatabaseService) {
  // Create new project
  DatabaseService.prototype.createProject = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await this.run(`
      INSERT INTO projects (id, userId, name, leadId, phase, progress, value, startDate, estimatedCompletion, status, createdAt, updatedAt)
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
  };

  // Get single project
  DatabaseService.prototype.getProject = async function(id) {
    return await this.get('SELECT * FROM projects WHERE id = ?', [id]);
  };

  // Get all projects
  DatabaseService.prototype.getAllProjects = async function(filters = {}) {
    let query = 'SELECT * FROM projects WHERE 1=1';
    const params = [];

    if (filters.userId) {
      // Include projects owned by user OR unassigned projects (userId IS NULL or empty)
      query += ' AND (userId = ? OR userId IS NULL OR userId = \'\')';
      params.push(filters.userId);
    }

    query += ' ORDER BY updatedAt DESC';
    
    return await this.all(query, params);
  };

  // Update project
  DatabaseService.prototype.updateProject = async function(id, data) {
    const existing = await this.getProject(id);
    if (!existing) return null;
    
    const now = new Date().toISOString();
    
    await this.run(`
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
    `, [
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
    ]);
    
    return await this.getProject(id);
  };

  // Delete project
  DatabaseService.prototype.deleteProject = async function(id) {
    const result = await this.run('DELETE FROM projects WHERE id = ?', [id]);
    return result.changes > 0;
  };
}

export default addProjectOperations;
