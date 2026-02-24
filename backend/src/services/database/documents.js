// Document Operations Module
// Adds document and vision project operations to DatabaseService

import { v4 as uuidv4 } from 'uuid';

/**
 * Document operations mixin
 * Adds document-related methods to DatabaseService
 */
export function addDocumentOperations(DatabaseService) {
  // ==================== Vision Project Operations ====================
  
  // Get all vision projects with full-text search on OCR content or name
  DatabaseService.prototype.searchDocuments = async function(filters = {}) {
    const { query, userId, type } = filters;
    let sql = 'SELECT id, name, originalFile, fileType, width, height, pageCount, createdAt, updatedAt FROM vision_projects WHERE 1=1';
    const params = [];
    
    if (userId) {
      sql += ' AND userId = ?';
      params.push(userId);
    }

    if (type) {
      sql += ' AND fileType = ?';
      params.push(type);
    }

    if (query) {
      // Search in name, originalFile, or metadata (metadata is JSON string in SQLite)
      sql += ' AND (name LIKE ? OR originalFile LIKE ? OR metadata LIKE ?)';
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    sql += ' ORDER BY updatedAt DESC';
    
    return await this.all(sql, params);
  };

  // Get single vision project
  DatabaseService.prototype.getVisionProject = async function(id) {
    return await this.get('SELECT * FROM vision_projects WHERE id = ?', [id]);
  };

  // Update vision project metadata or scale
  DatabaseService.prototype.updateVisionProject = async function(id, data) {
    const now = new Date().toISOString();
    const sets = [];
    const values = [];

    if (data.name !== undefined) { sets.push('name = ?'); values.push(data.name); }
    if (data.scale !== undefined) { sets.push('scale = ?'); values.push(data.scale); }
    if (data.metadata !== undefined) { sets.push('metadata = ?'); values.push(JSON.stringify(data.metadata)); }
    if (data.currentPage !== undefined) { sets.push('currentPage = ?'); values.push(data.currentPage); }

    if (sets.length === 0) return await this.getVisionProject(id);

    sets.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await this.run(`UPDATE vision_projects SET ${sets.join(', ')} WHERE id = ?`, values);
    return await this.getVisionProject(id);
  };

  // Get document summary stats
  DatabaseService.prototype.getDocumentSummary = async function(userId) {
    const params = userId ? [userId] : [];
    const where = userId ? 'WHERE userId = ?' : '';
    
    const stats = await this.get(`
      SELECT 
        COUNT(*) as total_count,
        SUM(pageCount) as total_pages,
        COUNT(DISTINCT fileType) as unique_types
      FROM vision_projects
      ${where}
    `, params);

    const typeDistribution = await this.all(`
      SELECT fileType, COUNT(*) as count
      FROM vision_projects
      ${where}
      GROUP BY fileType
    `, params);

    const recentlyUpdated = await this.all(`
      SELECT id, name, updatedAt
      FROM vision_projects
      ${where}
      ORDER BY updatedAt DESC
      LIMIT 5
    `, params);

    return {
      ...stats,
      typeDistribution,
      recentlyUpdated
    };
  };

  // ==================== Analysis History ====================

  // Create analysis history record
  DatabaseService.prototype.createAnalysisHistory = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await this.run(`
      INSERT INTO blueprint_analysis_history (id, analysis_id, results, analyzed_at, version, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.analysis_id,
      JSON.stringify(data.results),
      data.analyzed_at || now,
      data.version || 1,
      JSON.stringify(data.metadata || {})
    ]);
    
    return id;
  };

  // Get analysis history for an analysis
  DatabaseService.prototype.getAnalysisHistory = async function(analysisId) {
    return await this.all(`
      SELECT * FROM blueprint_analysis_history 
      WHERE analysis_id = ? 
      ORDER BY version DESC
    `, [analysisId]);
  };
}

export default addDocumentOperations;
