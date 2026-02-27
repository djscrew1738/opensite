import express from 'express';
import path from 'path';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { universalUpload, UPLOAD_DIR } from '../middleware/universalUpload.js';
import { db } from '../services/database.js';
import { visionService } from '../services/vision.js';
import { extractText } from '../services/text-extractor.js';
import logger from '../services/logger.js';

const router = express.Router();
router.use(authenticateToken);

// Constants
const MAX_USER_STORAGE = 1024 * 1024 * 1024; // 1GB per user
const ANONYMOUS_TTL_HOURS = 24; // Anonymous files expire after 24 hours

// Category detection from file extension
function categorizeFile(ext) {
  const imageExts = new Set(['.png', '.jpg', '.jpeg', '.tiff', '.tif', '.webp']);
  const blueprintExts = new Set(['.dwg']);
  const docExts = new Set(['.docx', '.doc', '.txt', '.md', '.csv', '.html', '.htm', '.json', '.xml', '.xlsx', '.xls']);

  if (ext === '.pdf') return 'blueprint'; // PDFs get both pipelines
  if (imageExts.has(ext)) return 'image';
  if (blueprintExts.has(ext)) return 'blueprint';
  if (docExts.has(ext)) return 'document';
  return 'other';
}

// Determine which pipelines to run
function getPipelines(ext) {
  const imageExts = new Set(['.png', '.jpg', '.jpeg', '.tiff', '.tif', '.webp']);
  const textExts = new Set(['.docx', '.doc', '.txt', '.md', '.csv', '.html', '.htm', '.json', '.xml', '.xlsx', '.xls']);

  if (ext === '.pdf') return ['vision', 'docvault']; // Both
  if (imageExts.has(ext)) return ['vision'];
  if (textExts.has(ext)) return ['docvault'];
  if (ext === '.dwg') return ['vision'];
  return [];
}

/**
 * Check user's storage quota
 * @param {string} userId 
 * @param {number} newFileSize 
 * @returns {Promise<{allowed: boolean, used: number, limit: number}>}
 */
async function checkUserQuota(userId, newFileSize) {
  const result = db.prepare(`
    SELECT COALESCE(SUM(size_bytes), 0) as total 
    FROM files 
    WHERE uploaded_by = ?
  `).get(userId);
  
  const used = result?.total || 0;
  const allowed = used + newFileSize <= MAX_USER_STORAGE;
  
  return { allowed, used, limit: MAX_USER_STORAGE };
}

/**
 * Schedule anonymous file for cleanup
 * @param {string} fileId 
 * @param {number} ttlHours 
 */
async function scheduleAnonymousCleanup(fileId, ttlHours = ANONYMOUS_TTL_HOURS) {
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
  
  // Add expires_at column if not exists (for backwards compatibility)
  try {
    db.prepare(`
      ALTER TABLE files ADD COLUMN expires_at TEXT
    `).run();
  } catch { /* Column may already exist */ }
  
  db.prepare(`
    UPDATE files SET expires_at = ? WHERE id = ?
  `).run(expiresAt, fileId);
  
  logger.info(`Scheduled anonymous file ${fileId} for cleanup at ${expiresAt}`);
}

/**
 * Clean up expired anonymous files
 */
export async function cleanupExpiredAnonymousFiles() {
  try {
    const expiredFiles = db.prepare(`
      SELECT id, stored_path FROM files 
      WHERE uploaded_by = 'anonymous' 
      AND expires_at IS NOT NULL 
      AND expires_at < datetime('now')
    `).all();
    
    for (const file of expiredFiles) {
      try {
        // Delete physical file
        if (file.stored_path) {
          await fs.unlink(file.stored_path).catch(() => {});
        }
        
        // Delete from job_files first (foreign key)
        db.prepare('DELETE FROM job_files WHERE file_id = ?').run(file.id);
        
        // Delete file record
        db.prepare('DELETE FROM files WHERE id = ?').run(file.id);
        
        logger.info(`Cleaned up expired anonymous file: ${file.id}`);
      } catch (err) {
        logger.error(`Failed to cleanup anonymous file ${file.id}:`, err.message);
      }
    }
    
    if (expiredFiles.length > 0) {
      logger.info(`Anonymous cleanup complete: ${expiredFiles.length} files removed`);
    }
  } catch (err) {
    logger.error('Anonymous cleanup job failed:', err.message);
  }
}

// POST /api/upload/universal
router.post('/', universalUpload.array('files', 20), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, error: 'No files uploaded' });
  }

  // Reject anonymous uploads (option A from audit)
  if (!req.user?.id) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required. Anonymous uploads are not allowed.' 
    });
  }

  const { jobId, notes } = req.body;
  const userId = req.user.id;
  const results = [];

  // Calculate total size of upload batch
  const totalBatchSize = req.files.reduce((sum, file) => sum + file.size, 0);
  
  // Check quota before processing
  const quota = await checkUserQuota(userId, totalBatchSize);
  if (!quota.allowed) {
    return res.status(413).json({
      success: false,
      error: `Storage quota exceeded. Used: ${(quota.used / 1024 / 1024).toFixed(1)}MB / Limit: ${(quota.limit / 1024 / 1024).toFixed(0)}MB`,
      code: 'QUOTA_EXCEEDED',
      quota: {
        used: quota.used,
        limit: quota.limit,
        available: quota.limit - quota.used
      }
    });
  }

  for (const file of req.files) {
    const fileId = randomUUID();
    const ext = path.extname(file.originalname).toLowerCase();
    const category = req.body.category || categorizeFile(ext);
    const pipelines = getPipelines(ext);
    const now = new Date().toISOString();

    // Insert file record
    db.prepare(`
      INSERT INTO files (id, original_name, stored_name, stored_path, mime_type, size_bytes, category, pipeline_status, uploaded_by, job_id, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'processing', ?, ?, ?, ?, ?)
    `).run(fileId, file.originalname, file.filename, file.path, file.mimetype, file.size, category, userId, jobId || null, notes || null, now, now);

    // Link to job if provided
    if (jobId) {
      const linkId = randomUUID();
      db.prepare(`INSERT OR IGNORE INTO job_files (id, job_id, file_id, notes, created_at) VALUES (?, ?, ?, ?, ?)`)
        .run(linkId, jobId, fileId, notes || null, now);
    }

    // Fire async pipelines
    processFile(fileId, file, ext, pipelines, userId);

    results.push({
      id: fileId,
      filename: file.originalname,
      type: ext.slice(1),
      size: file.size,
      category,
      pipelines,
      status: 'processing',
      jobId: jobId || null,
    });
  }

  res.json({ success: true, data: { uploads: results } });
});

// Async pipeline processing (fire-and-forget)
async function processFile(fileId, file, ext, pipelines, userId) {
  let visionProjectId = null;
  let docvaultId = null;

  try {
    // Vision pipeline: generate tiles for images and PDFs
    if (pipelines.includes('vision')) {
      try {
        const projectId = randomUUID();
        const visionNow = new Date().toISOString();
        // Create vision project record
        db.prepare(`
          INSERT INTO vision_projects (id, userId, name, originalFile, fileType, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(projectId, userId, file.originalname, file.originalname, ext.slice(1), visionNow, visionNow);

        // Generate tiles in background
        await visionService.generateTiles(file.path, projectId);
        visionProjectId = projectId;
      } catch (err) {
        logger.error(`Vision pipeline failed for ${fileId}:`, { error: err.message });
      }
    }

    // DocVault pipeline: extract text
    if (pipelines.includes('docvault')) {
      try {
        const docId = randomUUID();
        const now = new Date().toISOString();

        db.prepare(`
          INSERT INTO text_documents (id, userId, filename, originalName, mimeType, fileSize, filePath, status, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'processing', ?, ?)
        `).run(docId, userId, file.filename, file.originalname, file.mimetype, file.size, file.path, now, now);

        const result = await extractText(file.path, file.mimetype);
        const text = result.text || '';
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

        db.prepare(`
          UPDATE text_documents SET extractedText = ?, wordCount = ?, pageCount = ?, status = 'ready', updatedAt = ? WHERE id = ?
        `).run(text, wordCount, result.pageCount || null, new Date().toISOString(), docId);

        docvaultId = docId;
      } catch (err) {
        logger.error(`DocVault pipeline failed for ${fileId}:`, { error: err.message });
      }
    }

    // Update file record with pipeline results
    db.prepare(`
      UPDATE files SET pipeline_status = 'complete', vision_project_id = ?, docvault_id = ?, updated_at = ? WHERE id = ?
    `).run(visionProjectId, docvaultId, new Date().toISOString(), fileId);

  } catch (err) {
    logger.error(`Pipeline processing failed for ${fileId}:`, { error: err.message });
    db.prepare(`UPDATE files SET pipeline_status = 'error', updated_at = ? WHERE id = ?`)
      .run(new Date().toISOString(), fileId);
  }
}

// GET /api/upload/universal/files — list files (optionally by job)
router.get('/files', async (req, res) => {
  const { jobId, limit = 50, offset = 0 } = req.query;
  let files;

  if (jobId) {
    files = db.prepare(`
      SELECT f.*, jf.notes as job_notes
      FROM files f
      JOIN job_files jf ON jf.file_id = f.id
      WHERE jf.job_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `).all(jobId, Number(limit), Number(offset));
  } else {
    files = db.prepare(`
      SELECT * FROM files
      WHERE uploaded_by = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user?.id || 'anonymous', Number(limit), Number(offset));
  }

  res.json({ success: true, data: files });
});

// GET /api/upload/universal/files/:id — single file status
router.get('/files/:id', async (req, res) => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  if (!file) return res.status(404).json({ success: false, error: 'File not found' });
  
  // Ownership check
  if (file.uploaded_by !== req.user?.id) {
    return res.status(403).json({ success: false, error: 'Forbidden: Not file owner' });
  }
  
  res.json({ success: true, data: file });
});

// DELETE /api/upload/universal/files/:id
router.delete('/files/:id', async (req, res) => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  if (!file) return res.status(404).json({ success: false, error: 'File not found' });

  // Ownership check - CRITICAL FIX
  if (file.uploaded_by !== req.user?.id) {
    return res.status(403).json({ success: false, error: 'Forbidden: Not file owner' });
  }

  // Delete from job_files
  db.prepare('DELETE FROM job_files WHERE file_id = ?').run(req.params.id);
  // Delete file record
  db.prepare('DELETE FROM files WHERE id = ?').run(req.params.id);
  
  // Delete physical file with proper error handling
  if (file.stored_path) {
    try {
      await fs.unlink(file.stored_path);
      logger.info(`Deleted physical file: ${file.stored_path}`);
    } catch (err) {
      // Log detailed error but don't fail the request
      logger.error('File deletion failed', {
        fileId: file.id,
        path: file.stored_path,
        error: err.message,
        code: err.code
      });
      
      // Mark as orphaned for cleanup job
      try {
        db.prepare(`
          INSERT INTO orphaned_files (id, original_path, file_id, reason, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(randomUUID(), file.stored_path, file.id, err.message, new Date().toISOString());
      } catch (dbErr) {
        // Table might not exist, just log
        logger.warn('Could not mark file as orphaned:', dbErr.message);
      }
    }
  }

  res.json({ success: true, data: { deleted: req.params.id } });
});

// POST /api/upload/universal/link — link existing file to a job
router.post('/link', async (req, res) => {
  const { fileId, jobId, notes } = req.body;
  if (!fileId || !jobId) return res.status(400).json({ success: false, error: 'fileId and jobId required' });

  // Verify ownership before linking
  const file = db.prepare('SELECT uploaded_by FROM files WHERE id = ?').get(fileId);
  if (!file) return res.status(404).json({ success: false, error: 'File not found' });
  if (file.uploaded_by !== req.user?.id) {
    return res.status(403).json({ success: false, error: 'Forbidden: Not file owner' });
  }

  const linkId = randomUUID();
  db.prepare('INSERT OR IGNORE INTO job_files (id, job_id, file_id, notes, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(linkId, jobId, fileId, notes || null, new Date().toISOString());

  res.json({ success: true, data: { id: linkId } });
});

export default router;
