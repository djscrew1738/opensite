# Universal Upload System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace fragmented upload flows with a single Universal Upload system supporting all file types, auto-routing to pipelines, job file linking, and bulk queue management.

**Architecture:** New `POST /api/upload/universal` endpoint accepts any supported file, auto-routes to existing vision/docvault pipelines. New `files` + `job_files` SQLite tables track all uploads. Frontend `useUniversalUpload` hook manages queue with concurrent uploads. Three UI entry points: inline UploadDropzone, UploadModal, and UploadFAB.

**Tech Stack:** Express + Multer + better-sqlite3 (backend), React 19 + React Query v5 + Framer Motion + Axios (frontend)

**Design Doc:** `docs/plans/2026-02-25-universal-upload-design.md`

---

## Task 1: Database Tables

**Files:**
- Modify: `backend/src/services/database/core.js` (add tables in constructor `exec()` block)

**Step 1:** Add `files` and `job_files` tables to the database initialization in `core.js`. Find the section with `CREATE TABLE IF NOT EXISTS` statements and add:

```sql
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  stored_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  pipeline_status TEXT NOT NULL DEFAULT 'pending',
  vision_project_id TEXT,
  docvault_id TEXT,
  uploaded_by TEXT,
  job_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS job_files (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  file_id TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(job_id, file_id)
);
```

**Step 2:** Add database helper methods in the same file or a new mixin. Add these prepared statements:

```javascript
// In the database service or a new mixin file
insertFile(fileData) // INSERT INTO files
getFilesByJob(jobId) // SELECT files.* FROM files JOIN job_files
getFileById(id) // SELECT * FROM files WHERE id = ?
updateFilePipeline(id, status, visionProjectId, docvaultId) // UPDATE files SET pipeline_status, vision_project_id, docvault_id
deleteFile(id) // DELETE FROM files + DELETE FROM job_files WHERE file_id
linkFileToJob(fileId, jobId, notes) // INSERT INTO job_files
getJobFiles(jobId) // SELECT files.* FROM files JOIN job_files ON ...
```

**Step 3:** Verify — restart backend, check no crash on startup.

**Step 4:** Commit: `feat: add files and job_files database tables`

---

## Task 2: Universal Upload Multer Middleware

**Files:**
- Create: `backend/src/middleware/universalUpload.js`

**Step 1:** Create multer config that accepts all supported file types:

```javascript
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'uploads/universal');
fs.mkdirSync(UPLOAD_DIR, { recursive: true, mode: 0o700 });

const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.tif', '.webp', '.dwg',
  '.docx', '.doc', '.txt', '.md', '.csv', '.html', '.htm', '.json', '.xml',
  '.xlsx', '.xls'
]);

const MIME_MAP = {
  '.pdf': ['application/pdf'],
  '.png': ['image/png'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.tiff': ['image/tiff'],
  '.tif': ['image/tiff'],
  '.webp': ['image/webp'],
  '.dwg': ['application/acad', 'application/x-acad', 'image/vnd.dwg', 'application/octet-stream'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.doc': ['application/msword'],
  '.txt': ['text/plain'],
  '.md': ['text/markdown', 'text/plain', 'application/octet-stream'],
  '.csv': ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
  '.html': ['text/html'],
  '.htm': ['text/html'],
  '.json': ['application/json', 'text/plain'],
  '.xml': ['application/xml', 'text/xml'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.xls': ['application/vnd.ms-excel'],
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `upload-${randomUUID()}${ext}`);
  }
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error(`Unsupported file type: ${ext}`));
  }
  const allowedMimes = MIME_MAP[ext] || [];
  if (allowedMimes.length > 0 && !allowedMimes.includes(file.mimetype)) {
    return cb(new Error(`Invalid MIME type for ${ext}: ${file.mimetype}`));
  }
  cb(null, true);
}

export const universalUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

export { UPLOAD_DIR };
```

**Step 2:** Commit: `feat: add universal upload multer middleware`

---

## Task 3: Universal Upload Route

**Files:**
- Create: `backend/src/routes/universal-upload.js`
- Modify: `backend/src/routes/index.js` (mount route)

**Step 1:** Create the route file with auto-routing logic:

```javascript
import express from 'express';
import path from 'path';
import { randomUUID } from 'crypto';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { universalUpload, UPLOAD_DIR } from '../middleware/universalUpload.js';
import { db } from '../services/database.js';
import { visionService } from '../services/vision.js';
import { extractText } from '../services/text-extractor.js';

const router = express.Router();
router.use(authenticateToken);

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

// POST /api/upload/universal
router.post('/', universalUpload.array('files', 20), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, error: 'No files uploaded' });
  }

  const { jobId, notes } = req.body;
  const userId = req.user?.id || 'anonymous';
  const results = [];

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
        // Create vision project record
        db.prepare(`
          INSERT INTO vision_projects (id, name, originalFile, storedFile, fileType, size, userId, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(projectId, file.originalname, file.originalname, file.filename, ext.slice(1), file.size, userId, new Date().toISOString());

        // Generate tiles in background
        await visionService.generateTiles(file.path, projectId);
        visionProjectId = projectId;
      } catch (err) {
        console.error(`Vision pipeline failed for ${fileId}:`, err.message);
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
        console.error(`DocVault pipeline failed for ${fileId}:`, err.message);
      }
    }

    // Update file record with pipeline results
    db.prepare(`
      UPDATE files SET pipeline_status = 'complete', vision_project_id = ?, docvault_id = ?, updated_at = ? WHERE id = ?
    `).run(visionProjectId, docvaultId, new Date().toISOString(), fileId);

  } catch (err) {
    console.error(`Pipeline processing failed for ${fileId}:`, err.message);
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
  res.json({ success: true, data: file });
});

// DELETE /api/upload/universal/files/:id
router.delete('/files/:id', async (req, res) => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  if (!file) return res.status(404).json({ success: false, error: 'File not found' });

  // Delete from job_files
  db.prepare('DELETE FROM job_files WHERE file_id = ?').run(req.params.id);
  // Delete file record
  db.prepare('DELETE FROM files WHERE id = ?').run(req.params.id);
  // Try to delete physical file
  try {
    const fs = await import('fs');
    if (fs.existsSync(file.stored_path)) {
      fs.unlinkSync(file.stored_path);
    }
  } catch (e) { /* ignore cleanup errors */ }

  res.json({ success: true, data: { deleted: req.params.id } });
});

// POST /api/upload/universal/link — link existing file to a job
router.post('/link', async (req, res) => {
  const { fileId, jobId, notes } = req.body;
  if (!fileId || !jobId) return res.status(400).json({ success: false, error: 'fileId and jobId required' });

  const linkId = randomUUID();
  db.prepare('INSERT OR IGNORE INTO job_files (id, job_id, file_id, notes, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(linkId, jobId, fileId, notes || null, new Date().toISOString());

  res.json({ success: true, data: { id: linkId } });
});

export default router;
```

**Step 2:** Mount in `backend/src/routes/index.js`. Find `router.use('/upload',` and add nearby:

```javascript
import universalUploadRoutes from './universal-upload.js';
// ...
router.use('/upload/universal', universalUploadRoutes);
```

**Step 3:** Verify — restart backend, test `POST /api/upload/universal` with curl or Postman.

**Step 4:** Commit: `feat: add universal upload API route with auto-routing pipelines`

---

## Task 4: Rate Limit — Remove for Authenticated Users

**Files:**
- Modify: `backend/src/middleware/security.js`
- Modify: `backend/src/routes/index.js`

**Step 1:** In `security.js`, modify the `uploadLimiter` to use a `skip` function that bypasses rate limiting for authenticated users:

```javascript
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { success: false, error: 'Too many uploads, please try again later' },
  skip: (req) => {
    // Authenticated users bypass upload rate limit
    return !!req.user;
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

Note: `req.user` is set by `authenticateToken` middleware. If upload routes apply `authenticateToken` before `uploadLimiter` in the chain, `req.user` will be present. Check the route registration order in `index.js` — if `uploadLimiter` is applied as a route middleware on the router.use line, ensure auth runs first. The universal upload route already has `router.use(authenticateToken)` at the top of the file, so this will work.

**Step 2:** Verify — authenticated uploads no longer rate-limited, guest uploads still limited.

**Step 3:** Commit: `feat: bypass upload rate limit for authenticated users`

---

## Task 5: Frontend API Client

**Files:**
- Create: `frontend/src/api/upload.js`

**Step 1:** Create the universal upload API client:

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 min for large files
});

// Auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export const uploadApi = {
  /**
   * Upload files to the universal endpoint
   * @param {File[]} files - Array of File objects
   * @param {Object} options
   * @param {string} [options.jobId] - Link uploads to a job
   * @param {string} [options.category] - Override auto-detection
   * @param {string} [options.notes] - Notes for the upload
   * @param {Function} [options.onProgress] - Progress callback (fileIndex, percent)
   */
  upload: (files, options = {}) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (options.jobId) formData.append('jobId', options.jobId);
    if (options.category) formData.append('category', options.category);
    if (options.notes) formData.append('notes', options.notes);

    return apiClient.post('/upload/universal', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000, // 5 min for bulk
      onUploadProgress: options.onProgress ? (evt) => {
        if (evt.total) {
          const percent = Math.round((evt.loaded / evt.total) * 100);
          options.onProgress(percent);
        }
      } : undefined,
    }).then(r => r.data?.data || r.data);
  },

  /** Get files, optionally filtered by job */
  getFiles: (params = {}) => {
    return apiClient.get('/upload/universal/files', { params })
      .then(r => r.data?.data || r.data);
  },

  /** Get single file status */
  getFile: (id) => {
    return apiClient.get(`/upload/universal/files/${id}`)
      .then(r => r.data?.data || r.data);
  },

  /** Delete a file */
  deleteFile: (id) => {
    return apiClient.delete(`/upload/universal/files/${id}`)
      .then(r => r.data?.data || r.data);
  },

  /** Link a file to a job */
  linkToJob: (fileId, jobId, notes) => {
    return apiClient.post('/upload/universal/link', { fileId, jobId, notes })
      .then(r => r.data?.data || r.data);
  },
};
```

**Step 2:** Commit: `feat: add universal upload API client`

---

## Task 6: useUniversalUpload Hook

**Files:**
- Create: `frontend/src/hooks/useUniversalUpload.js`

**Step 1:** Create the queue management hook:

```javascript
import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { uploadApi } from '../api/upload';

const MAX_CONCURRENT = 3;

const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'png', 'jpg', 'jpeg', 'tiff', 'tif', 'webp', 'dwg',
  'docx', 'doc', 'txt', 'md', 'csv', 'html', 'htm', 'json', 'xml',
  'xlsx', 'xls'
]);

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Category detection (mirrors backend)
function categorizeFile(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const imageExts = new Set(['png', 'jpg', 'jpeg', 'tiff', 'tif', 'webp']);
  const docExts = new Set(['docx', 'doc', 'txt', 'md', 'csv', 'html', 'htm', 'json', 'xml', 'xlsx', 'xls']);
  if (ext === 'pdf') return 'blueprint';
  if (imageExts.has(ext)) return 'image';
  if (ext === 'dwg') return 'blueprint';
  if (docExts.has(ext)) return 'document';
  return 'other';
}

function getFileIcon(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const imageExts = new Set(['png', 'jpg', 'jpeg', 'tiff', 'tif', 'webp']);
  if (ext === 'pdf') return 'pdf';
  if (imageExts.has(ext)) return 'image';
  if (['docx', 'doc'].includes(ext)) return 'word';
  if (['xlsx', 'xls', 'csv'].includes(ext)) return 'spreadsheet';
  if (ext === 'md') return 'markdown';
  return 'text';
}

function getPipelineLabel(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const imageExts = new Set(['png', 'jpg', 'jpeg', 'tiff', 'tif', 'webp']);
  const docExts = new Set(['docx', 'doc', 'txt', 'md', 'csv', 'html', 'htm', 'json', 'xml', 'xlsx', 'xls']);
  if (ext === 'pdf') return 'Vision + Text extraction';
  if (imageExts.has(ext)) return 'Vision tiles';
  if (ext === 'dwg') return 'Blueprint storage';
  if (docExts.has(ext)) return 'Text extraction';
  return 'Storage';
}

/**
 * Queue states: 'queued' | 'uploading' | 'processing' | 'complete' | 'error'
 */
export function useUniversalUpload({ jobId = null, onComplete } = {}) {
  const [queue, setQueue] = useState([]);
  const activeCount = useRef(0);
  const queryClient = useQueryClient();

  const validateFile = useCallback((file) => {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) return `Unsupported type: .${ext}`;
    if (file.size > MAX_FILE_SIZE) return 'File exceeds 100MB limit';
    return null;
  }, []);

  const processQueue = useCallback(() => {
    setQueue(prev => {
      const queued = prev.filter(f => f.status === 'queued');
      const slotsAvailable = MAX_CONCURRENT - activeCount.current;
      if (slotsAvailable <= 0 || queued.length === 0) return prev;

      const toStart = queued.slice(0, slotsAvailable);
      const updated = prev.map(f => {
        if (toStart.find(s => s.id === f.id)) {
          return { ...f, status: 'uploading', progress: 0 };
        }
        return f;
      });

      // Fire uploads for each file
      toStart.forEach(item => {
        activeCount.current++;
        uploadApi.upload([item.file], {
          jobId,
          onProgress: (percent) => {
            setQueue(q => q.map(f => f.id === item.id ? { ...f, progress: percent } : f));
          },
        })
        .then((result) => {
          const uploadResult = result?.uploads?.[0];
          setQueue(q => q.map(f => f.id === item.id ? {
            ...f,
            status: 'complete',
            progress: 100,
            serverId: uploadResult?.id,
          } : f));
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['universal-files'] });
          queryClient.invalidateQueries({ queryKey: ['vision-projects'] });
          queryClient.invalidateQueries({ queryKey: ['docvault-documents'] });
          if (jobId) queryClient.invalidateQueries({ queryKey: ['job-files', jobId] });
          onComplete?.();
        })
        .catch((err) => {
          setQueue(q => q.map(f => f.id === item.id ? {
            ...f,
            status: 'error',
            error: err?.response?.data?.error || err.message || 'Upload failed',
          } : f));
        })
        .finally(() => {
          activeCount.current--;
          // Trigger next batch
          setTimeout(() => processQueue(), 50);
        });
      });

      return updated;
    });
  }, [jobId, queryClient, onComplete]);

  const addFiles = useCallback((files) => {
    const newItems = Array.from(files).map(file => {
      const error = validateFile(file);
      return {
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        name: file.name,
        size: file.size,
        category: categorizeFile(file.name),
        icon: getFileIcon(file.name),
        pipeline: getPipelineLabel(file.name),
        status: error ? 'error' : 'queued',
        error: error || null,
        progress: 0,
        serverId: null,
      };
    });

    setQueue(prev => [...prev, ...newItems]);
    // Trigger processing after state update
    setTimeout(() => processQueue(), 50);
    return newItems;
  }, [validateFile, processQueue]);

  const removeFile = useCallback((id) => {
    setQueue(prev => prev.filter(f => f.id !== id));
  }, []);

  const retryFile = useCallback((id) => {
    setQueue(prev => prev.map(f =>
      f.id === id ? { ...f, status: 'queued', error: null, progress: 0 } : f
    ));
    setTimeout(() => processQueue(), 50);
  }, [processQueue]);

  const clearCompleted = useCallback(() => {
    setQueue(prev => prev.filter(f => f.status !== 'complete'));
  }, []);

  const clearAll = useCallback(() => {
    setQueue([]);
    activeCount.current = 0;
  }, []);

  const isUploading = queue.some(f => f.status === 'uploading');
  const hasQueued = queue.some(f => f.status === 'queued');
  const completedCount = queue.filter(f => f.status === 'complete').length;
  const errorCount = queue.filter(f => f.status === 'error').length;

  return {
    queue,
    addFiles,
    removeFile,
    retryFile,
    clearCompleted,
    clearAll,
    isUploading,
    hasQueued,
    completedCount,
    errorCount,
  };
}
```

**Step 2:** Commit: `feat: add useUniversalUpload queue hook`

---

## Task 7: UploadDropzone Component

**Files:**
- Create: `frontend/src/components/upload/UploadDropzone.jsx`

**Step 1:** Build a reusable inline dropzone (Dark Forge styled):

```jsx
import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Image, FileSpreadsheet, File } from 'lucide-react';

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.tiff,.tif,.webp,.dwg,.docx,.doc,.txt,.md,.csv,.html,.json,.xml,.xlsx,.xls';

export default function UploadDropzone({
  onFiles,
  compact = false,
  disabled = false,
  className = '',
  accept = ACCEPT,
  children,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef(null);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items?.length > 0) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (disabled) return;
    if (e.dataTransfer.files?.length > 0) {
      onFiles?.(e.dataTransfer.files);
    }
  }, [disabled, onFiles]);

  const handleClick = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  const handleFileInput = (e) => {
    if (e.target.files?.length > 0) {
      onFiles?.(e.target.files);
      e.target.value = ''; // Reset for re-select
    }
  };

  if (compact) {
    return (
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          flex items-center gap-3 p-3 rounded-xl border-2 border-dashed cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-[#3B82F6] bg-[#3B82F6]/5'
            : 'border-[#2D3548] hover:border-[#3B82F6]/40 bg-[#0F1117]'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        <Upload className="w-5 h-5 text-[#64748B] shrink-0" />
        <div className="min-w-0">
          <p className="text-sm text-[#94A3B8]">
            {isDragging ? 'Drop files here' : 'Drop files or click to browse'}
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={handleFileInput}
        />
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`
        relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed
        cursor-pointer transition-all duration-200
        ${isDragging
          ? 'border-[#3B82F6] bg-[#3B82F6]/5 scale-[1.01]'
          : 'border-[#2D3548] hover:border-[#3B82F6]/40 bg-[#0F1117]/50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {children || (
        <>
          <div className="w-12 h-12 rounded-xl bg-[#181C24] flex items-center justify-center mb-3">
            <Upload className="w-6 h-6 text-[#3B82F6]" />
          </div>
          <p className="text-sm font-medium text-[#F1F5F9] mb-1">
            {isDragging ? 'Drop files here' : 'Drop files or click to browse'}
          </p>
          <p className="text-xs text-[#64748B] text-center">
            PDF, Images, Docs, Spreadsheets — up to 100MB each
          </p>
          <div className="flex items-center gap-3 mt-3">
            <FileText className="w-4 h-4 text-[#EF4444]/60" />
            <Image className="w-4 h-4 text-[#3B82F6]/60" />
            <FileSpreadsheet className="w-4 h-4 text-[#10B981]/60" />
            <File className="w-4 h-4 text-[#8B5CF6]/60" />
          </div>
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
}
```

**Step 2:** Commit: `feat: add universal UploadDropzone component`

---

## Task 8: UploadModal Component

**Files:**
- Create: `frontend/src/components/upload/UploadModal.jsx`

**Step 1:** Build the full upload modal with queue management:

```jsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Upload, FileText, Image, FileSpreadsheet, File,
  CheckCircle2, AlertCircle, RotateCw, Trash2, Loader2,
  ChevronDown, Link2
} from 'lucide-react';
import { api } from '../../api/client';
import { useUniversalUpload } from '../../hooks/useUniversalUpload';
import UploadDropzone from './UploadDropzone';

// File type icon mapping
function FileIcon({ type, className = 'w-5 h-5' }) {
  switch (type) {
    case 'pdf': return <FileText className={`${className} text-[#EF4444]`} />;
    case 'image': return <Image className={`${className} text-[#3B82F6]`} />;
    case 'word': return <FileText className={`${className} text-[#3B82F6]`} />;
    case 'spreadsheet': return <FileSpreadsheet className={`${className} text-[#10B981]`} />;
    case 'markdown': return <FileText className={`${className} text-[#8B5CF6]`} />;
    default: return <File className={`${className} text-[#94A3B8]`} />;
  }
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function FileQueueItem({ item, onRemove, onRetry }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-[#0F1117] border border-[#1F2430]"
    >
      <FileIcon type={item.icon} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#F1F5F9] truncate">{item.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[#64748B]">{formatSize(item.size)}</span>
          <span className="text-xs text-[#475569]">·</span>
          <span className="text-xs text-[#64748B]">{item.pipeline}</span>
        </div>

        {/* Progress bar */}
        {item.status === 'uploading' && (
          <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden bg-[#181C24]">
            <motion.div
              className="h-full bg-[#3B82F6] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${item.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Error message */}
        {item.status === 'error' && (
          <p className="text-xs text-[#EF4444] mt-1">{item.error}</p>
        )}
      </div>

      {/* Status / Actions */}
      <div className="shrink-0 flex items-center gap-1">
        {item.status === 'queued' && (
          <span className="text-xs text-[#64748B]">Queued</span>
        )}
        {item.status === 'uploading' && (
          <span className="text-xs text-[#3B82F6] font-medium">{item.progress}%</span>
        )}
        {item.status === 'processing' && (
          <Loader2 className="w-4 h-4 text-[#F59E0B] animate-spin" />
        )}
        {item.status === 'complete' && (
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
        )}
        {item.status === 'error' && (
          <button
            onClick={() => onRetry(item.id)}
            className="p-1 rounded-md hover:bg-[#181C24] text-[#F59E0B] transition-colors"
            title="Retry"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onRemove(item.id)}
          className="p-1 rounded-md hover:bg-[#181C24] text-[#64748B] hover:text-[#EF4444] transition-colors"
          title="Remove"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

export default function UploadModal({ isOpen, onClose, jobId: initialJobId = null }) {
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);

  const {
    queue, addFiles, removeFile, retryFile, clearCompleted,
    isUploading, completedCount, errorCount
  } = useUniversalUpload({
    jobId: selectedJobId,
    onComplete: () => {},
  });

  // Fetch jobs for the linker dropdown
  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.projects.getAll(),
    enabled: isOpen,
  });

  // Update jobId when prop changes
  useEffect(() => {
    if (initialJobId) setSelectedJobId(initialJobId);
  }, [initialJobId]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-4 sm:inset-auto sm:top-[10%] sm:left-1/2 sm:-translate-x-1/2
                   sm:w-full sm:max-w-lg z-50
                   bg-[#111318] border border-[#1F2430] rounded-2xl shadow-2xl
                   flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F2430]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#F1F5F9]">Upload Files</h2>
              {queue.length > 0 && (
                <p className="text-xs text-[#64748B]">
                  {queue.length} file{queue.length !== 1 ? 's' : ''}
                  {completedCount > 0 && ` · ${completedCount} done`}
                  {errorCount > 0 && ` · ${errorCount} failed`}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#181C24] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Dropzone */}
          <UploadDropzone onFiles={addFiles} />

          {/* Job Linker */}
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[#64748B] shrink-0" />
            <select
              value={selectedJobId || ''}
              onChange={(e) => setSelectedJobId(e.target.value || null)}
              className="flex-1 px-3 py-2 rounded-lg text-sm bg-[#0F1117] border border-[#2D3548] text-[#F1F5F9] outline-none cursor-pointer"
            >
              <option value="">No job linked</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>{job.name}</option>
              ))}
            </select>
          </div>

          {/* File Queue */}
          {queue.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Queue ({queue.length})
                </p>
                {completedCount > 0 && (
                  <button
                    onClick={clearCompleted}
                    className="text-xs text-[#64748B] hover:text-[#F1F5F9] transition-colors"
                  >
                    Clear done
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {queue.map(item => (
                    <FileQueueItem
                      key={item.id}
                      item={item}
                      onRemove={removeFile}
                      onRetry={retryFile}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#1F2430] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#181C24] transition-colors"
          >
            {isUploading ? 'Minimize' : 'Close'}
          </button>
          <div className="flex items-center gap-2">
            {isUploading && (
              <span className="text-xs text-[#3B82F6] flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Uploading...
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
```

**Step 2:** Commit: `feat: add UploadModal with file queue and job linking`

---

## Task 9: UploadFAB Component

**Files:**
- Create: `frontend/src/components/upload/UploadFAB.jsx`
- Modify: `frontend/src/components/layout/Layout.jsx` (mount FAB)

**Step 1:** Create a minimal FAB that opens the UploadModal:

```jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload } from 'lucide-react';
import UploadModal from './UploadModal';

export default function UploadFAB() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setShowModal(true)}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-24 right-6 z-30 w-12 h-12 rounded-full
                   bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/25
                   flex items-center justify-center
                   hover:bg-[#2563EB] transition-colors"
        aria-label="Upload files"
      >
        <Upload className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {showModal && <UploadModal isOpen onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </>
  );
}
```

**Step 2:** In `Layout.jsx`, import and render `UploadFAB` alongside existing global components. Find where `QuickAddFAB` is rendered and add nearby:

```jsx
import UploadFAB from '../upload/UploadFAB';
// ...
<UploadFAB />
```

**Step 3:** Commit: `feat: add UploadFAB and mount in Layout`

---

## Task 10: Integrate into Documents Page

**Files:**
- Modify: `frontend/src/pages/Documents.jsx`

**Step 1:** Replace the existing upload mutation and inline upload UI in Documents.jsx with the universal uploader. Key changes:

1. Import `UploadModal` and `UploadDropzone` from `../components/upload/`
2. Add state `const [showUploadModal, setShowUploadModal] = useState(false)`
3. Replace the `uploadMutation` + `validateFile` + `handleUpload` with:
   ```jsx
   const handleUpload = (files) => setShowUploadModal(true);
   ```
4. Replace the `<input type="file" ... />` and upload button with a button that opens the modal
5. Add `<UploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} />` at the end
6. Keep the existing DocumentsLibrary drag-and-drop but wire it to open the modal with pre-added files

**Step 2:** In the TextIntelligence tab, replace `<DocUpload>` with `<UploadDropzone compact>` wired to the universal uploader.

**Step 3:** Verify — build passes, Documents page shows new upload modal.

**Step 4:** Commit: `feat: integrate universal upload into Documents page`

---

## Task 11: Integrate into Jobs — NewJobModal

**Files:**
- Modify: `frontend/src/components/jobs/NewJobModal.jsx`

**Step 1:** Add compact UploadDropzone below the notes textarea:

1. Import `UploadDropzone`
2. Add state for pending files: `const [pendingFiles, setPendingFiles] = useState([])`
3. After the notes field, add:
   ```jsx
   <div>
     <label className="label">Attachments</label>
     <UploadDropzone compact onFiles={(files) => setPendingFiles(prev => [...prev, ...Array.from(files)])} />
     {pendingFiles.length > 0 && (
       <div className="mt-2 space-y-1">
         {pendingFiles.map((f, i) => (
           <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0F1117] border border-[#1F2430]">
             <span className="text-sm text-[#F1F5F9] truncate">{f.name}</span>
             <button onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))} className="text-[#64748B] hover:text-[#EF4444]">
               <X className="w-4 h-4" />
             </button>
           </div>
         ))}
       </div>
     )}
   </div>
   ```
4. Modify the submit handler: after `createJobMutation.mutateAsync(jobData)` succeeds and returns `newJob`, upload pending files with `uploadApi.upload(pendingFiles, { jobId: newJob.id })`.

**Step 2:** Commit: `feat: add file attachments to New Job Modal`

---

## Task 12: Job Detail Page

**Files:**
- Create: `frontend/src/pages/JobDetail.jsx`
- Modify: `frontend/src/App.jsx` (add route)

**Step 1:** Create the job detail page:

```jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Building2, MapPin, Calendar, FileText, Trash2,
  Upload, Loader2, Image, FileSpreadsheet, File, Download
} from 'lucide-react';
import { api } from '../api/client';
import { uploadApi } from '../api/upload';
import { useUniversalUpload } from '../hooks/useUniversalUpload';
import UploadDropzone from '../components/upload/UploadDropzone';
import { useToast } from '../hooks/useToast';
import { ConfirmDialog } from '../components/shared';

// ... (full page component with job info header, attached files grid,
//      UploadDropzone for adding files, file preview on click, delete)
```

Key sections:
- Header with back button, job name, builder, phase badge
- Job info card (notes, dates, estimate)
- Attached Files section with `UploadDropzone` + file grid
- File grid shows: type icon, name, size, date, pipeline status, delete button
- Click file → if vision_project_id, open VisionCanvas; if docvault_id, open DocViewer

**Step 2:** Add route in `App.jsx`:

```jsx
import JobDetail from './pages/JobDetail';
// Inside the <Route path="/" element={<Layout />}> block:
<Route path="jobs/:id" element={<PageWrapper><JobDetail /></PageWrapper>} />
```

**Step 3:** Commit: `feat: add job detail page with file attachments`

---

## Task 13: Expandable Job Card

**Files:**
- Modify: `frontend/src/pages/Jobs.jsx` (or the OverviewDashboard component)

**Step 1:** In the jobs list, add expand/collapse behavior to job cards:

1. Add state: `const [expandedJobId, setExpandedJobId] = useState(null)`
2. On card click: toggle `expandedJobId`
3. When expanded, show below the card:
   - File count + small thumbnails
   - "View full details" link → `navigate(/jobs/${job.id})`
   - Compact `UploadDropzone` for quick file attachment
4. Query job files: `useQuery({ queryKey: ['job-files', expandedJobId], queryFn: () => uploadApi.getFiles({ jobId: expandedJobId }), enabled: !!expandedJobId })`

**Step 2:** Commit: `feat: add expandable job cards with file preview`

---

## Task 14: Final Cleanup and Build Verification

**Files:**
- Modify: `frontend/src/hooks/index.js` (export new hook)
- Modify: `frontend/src/components/upload/index.js` (export new components)

**Step 1:** Add exports:

```javascript
// hooks/index.js
export { useUniversalUpload } from './useUniversalUpload';

// components/upload/index.js (create if doesn't exist)
export { default as UploadDropzone } from './UploadDropzone';
export { default as UploadModal } from './UploadModal';
export { default as UploadFAB } from './UploadFAB';
```

**Step 2:** Run full build:

```bash
cd frontend && npx vite build
```

Expected: Build succeeds with no errors.

**Step 3:** Run backend:

```bash
cd backend && node src/index.js
```

Expected: Server starts, tables created, no crashes.

**Step 4:** Commit: `feat: universal upload system — complete integration`

---

## Execution Order Summary

| Task | What | Depends On |
|------|------|------------|
| 1 | DB tables | — |
| 2 | Multer middleware | — |
| 3 | Upload route | 1, 2 |
| 4 | Rate limit fix | — |
| 5 | API client | 3 |
| 6 | useUniversalUpload hook | 5 |
| 7 | UploadDropzone | — |
| 8 | UploadModal | 6, 7 |
| 9 | UploadFAB + Layout | 8 |
| 10 | Documents integration | 7, 8 |
| 11 | NewJobModal integration | 5, 7 |
| 12 | Job Detail page | 5, 6, 7 |
| 13 | Expandable job cards | 5 |
| 14 | Final cleanup + build | All |

**Parallelizable:** Tasks 1+2+4+7 can run in parallel. Tasks 5+6 are sequential. Tasks 10+11+12+13 can run in parallel after 8.
