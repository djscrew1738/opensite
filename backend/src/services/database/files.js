// File Operations Module
// Adds file and job_files operations to DatabaseService

import { v4 as uuidv4 } from 'uuid';

/**
 * File operations mixin
 * Adds file-related methods to DatabaseService
 */
export function addFileOperations(DatabaseService) {

  // ==================== File CRUD ====================

  /**
   * Insert a new file record
   */
  DatabaseService.prototype.insertFile = async function(fileData) {
    const id = fileData.id || uuidv4();
    const now = new Date().toISOString();

    await this.run(`
      INSERT INTO files (id, original_name, stored_name, stored_path, mime_type, size_bytes, category, pipeline_status, vision_project_id, docvault_id, uploaded_by, job_id, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      fileData.original_name,
      fileData.stored_name,
      fileData.stored_path,
      fileData.mime_type,
      fileData.size_bytes,
      fileData.category || 'other',
      fileData.pipeline_status || 'pending',
      fileData.vision_project_id || null,
      fileData.docvault_id || null,
      fileData.uploaded_by || null,
      fileData.job_id || null,
      fileData.notes || null,
      now,
      now
    ]);

    return await this.getFileById(id);
  };

  /**
   * Get a single file by ID
   */
  DatabaseService.prototype.getFileById = async function(id) {
    return await this.get('SELECT * FROM files WHERE id = ?', [id]);
  };

  /**
   * Get all files for a job (via job_files junction table)
   */
  DatabaseService.prototype.getFilesByJob = async function(jobId) {
    return await this.all(`
      SELECT f.*, jf.notes AS link_notes, jf.created_at AS linked_at
      FROM files f
      JOIN job_files jf ON jf.file_id = f.id
      WHERE jf.job_id = ?
      ORDER BY f.created_at DESC
    `, [jobId]);
  };

  /**
   * Update file pipeline status and linked service IDs.
   *
   * NOTE: COALESCE(?, column) is used for vision_project_id and docvault_id,
   * which means passing null/undefined will keep the existing value rather than
   * clearing it. To intentionally set these columns back to NULL, a separate
   * method or direct SQL would be needed.
   */
  DatabaseService.prototype.updateFilePipeline = async function(id, status, visionProjectId, docvaultId) {
    const now = new Date().toISOString();
    await this.run(`
      UPDATE files
      SET pipeline_status = ?,
          vision_project_id = COALESCE(?, vision_project_id),
          docvault_id = COALESCE(?, docvault_id),
          updated_at = ?
      WHERE id = ?
    `, [status, visionProjectId || null, docvaultId || null, now, id]);

    return await this.getFileById(id);
  };

  /**
   * Delete a file record and all job_files links (transactional)
   */
  DatabaseService.prototype.deleteFile = async function(id) {
    const file = await this.getFileById(id);
    if (!file) return null;

    const deleteOp = this.db.transaction(() => {
      this.db.prepare('DELETE FROM job_files WHERE file_id = ?').run(id);
      this.db.prepare('DELETE FROM files WHERE id = ?').run(id);
    });
    deleteOp();

    return file;
  };

  // ==================== Job-File Linking ====================

  /**
   * Link a file to a job (insert into junction table).
   * Returns the existing row if the link already exists (INSERT OR IGNORE).
   */
  DatabaseService.prototype.linkFileToJob = async function(fileId, jobId, notes) {
    const id = uuidv4();
    const result = await this.run(`
      INSERT OR IGNORE INTO job_files (id, job_id, file_id, notes)
      VALUES (?, ?, ?, ?)
    `, [id, jobId, fileId, notes || null]);

    if (result.changes === 0) {
      return await this.get(
        'SELECT * FROM job_files WHERE file_id = ? AND job_id = ?',
        [fileId, jobId]
      );
    }
    return { id, job_id: jobId, file_id: fileId, notes: notes || null };
  };

  /**
   * Get files for a job (alias matching task spec)
   */
  DatabaseService.prototype.getJobFiles = async function(jobId) {
    return await this.getFilesByJob(jobId);
  };

  /**
   * Unlink a file from a job
   */
  DatabaseService.prototype.unlinkFileFromJob = async function(fileId, jobId) {
    await this.run('DELETE FROM job_files WHERE file_id = ? AND job_id = ?', [fileId, jobId]);
  };

  /**
   * Get all files with optional filters
   */
  DatabaseService.prototype.getFiles = async function(filters = {}) {
    let sql = 'SELECT * FROM files WHERE 1=1';
    const params = [];

    if (filters.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters.pipeline_status) {
      sql += ' AND pipeline_status = ?';
      params.push(filters.pipeline_status);
    }
    if (filters.uploaded_by) {
      sql += ' AND uploaded_by = ?';
      params.push(filters.uploaded_by);
    }
    if (filters.job_id) {
      sql += ' AND job_id = ?';
      params.push(filters.job_id);
    }

    sql += ' ORDER BY created_at DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }

    return await this.all(sql, params);
  };
}

export default addFileOperations;
