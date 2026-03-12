// Vision API routes — Upload, tile serving, project CRUD, AI analysis

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { db } from '../services/database.js';
import { visionService } from '../services/vision.js';
import { visionAIService } from '../services/vision-ai.js';
import { jobQueue } from '../services/jobQueuePersistent.js';
import { tryCatch } from '../utils/response.js';
import { uploadLimiter } from '../middleware/security.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import logger from '../services/logger.js';

const router = express.Router();

// Apply authentication to all vision routes
router.use(authenticateToken);

// Configure multer for vision uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, visionService.uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = randomUUID();
    cb(null, `vision-${uniqueId}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for high-res blueprints
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.png', '.jpg', '.jpeg', '.tiff', '.tif', '.webp', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Supported formats: PNG, JPG, TIFF, WebP, PDF'));
    }
  }
});

/**
 * Check if user has access to a project
 * Implements RBAC: owner, admin, or shared access
 * 
 * @param {string} userId 
 * @param {Object} project 
 * @returns {boolean}
 */
function checkProjectAccess(userId, project) {
  if (!project) return false;
  
  // Owner has full access
  if (project.userId === userId) return true;
  
  // Check if project is shared with user (future enhancement)
  // For now, company-wide access is restricted to admin role
  
  return false;
}

/**
 * Get available AI vision models based on configured API keys
 * GET /api/vision/models
 */
router.get('/models', tryCatch(async (req, res) => {
  const anthropicKey = await db.getSetting('anthropic_api_key');
  const groqKey = await db.getSetting('groq_api_key');
  const models = [];

  // Cloud models
  if (anthropicKey) {
    models.push(
      { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', provider: 'anthropic', speed: 'fast', quality: 'good', type: 'global' },
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'anthropic', speed: 'medium', quality: 'excellent', type: 'global' },
    );
  }
  if (groqKey) {
    models.push(
      { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout', provider: 'groq', speed: 'fast', quality: 'good', type: 'global' },
      { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick', provider: 'groq', speed: 'medium', quality: 'excellent', type: 'global' },
    );
  }

  // Local models via Ollama
  try {
    const { ollamaService } = await import('../services/ollama.js');
    const health = await ollamaService.healthCheck();
    if (health.connected) {
      const ollamaModels = await ollamaService.listAvailableModels();
      const visionModels = ollamaModels.models.filter(m => 
        m.name.toLowerCase().includes('llava') || 
        m.name.toLowerCase().includes('vision') ||
        m.name.toLowerCase().includes('moondream')
      );

      for (const m of visionModels) {
        // Add two modes for each local vision model
        models.push({
          id: `${m.id}:fixtures`,
          name: `${m.name} - Fixture Detection`,
          provider: 'ollama',
          speed: 'local',
          quality: 'tiled-deep',
          type: 'deep'
        });
        models.push({
          id: `${m.id}:trace`,
          name: `${m.name} - Pipe Tracing`,
          provider: 'ollama',
          speed: 'local',
          quality: 'tiled-deep',
          type: 'trace'
        });
      }
    }
  } catch (err) {
    logger.debug('Ollama not available for vision models');
  }

  res.success({ models, hasKeys: !!(anthropicKey || groqKey || models.some(m => m.provider === 'ollama')) });
}));

/**
 * Upload blueprint and generate DZI tiles
 * POST /api/vision/upload
 */
router.post('/upload', uploadLimiter, upload.single('file'), tryCatch(async (req, res) => {
  if (!req.file) {
    return res.error('No file uploaded', 'MISSING_FILE', null, 400);
  }

  const filePath = req.file.path;
  const fileName = req.file.originalname;
  const ext = path.extname(fileName).toLowerCase();
  const projectId = randomUUID();
  const projectName = req.body.name || fileName.replace(/\.[^.]+$/, '');
  const userId = req.user.id;

  let imagePath = filePath;
  let pageCount = 1;
  let fileType = ext.replace('.', '');

  // If PDF, convert first page to image
  if (ext === '.pdf') {
    const pdfResult = await visionService.convertPdfToImage(filePath, visionService.uploadsDir);
    if (!pdfResult.success) {
      fs.unlinkSync(filePath);
      return res.error(pdfResult.error, 'PDF_CONVERT_ERROR', null, 400);
    }
    imagePath = pdfResult.pages[0];
    pageCount = pdfResult.pageCount;
    fileType = 'pdf';
  }

  // Get metadata before tile generation
  const metadata = await visionService.getImageMetadata(imagePath);

  // Queue tile generation as a background job
  const jobHandler = async (jobData, progressCallback) => {
    progressCallback(5);

    // Generate tiles
    const tileResult = await visionService.generateTiles(imagePath, projectId, progressCallback);

    // Create thumbnail and analysis image
    await visionService.createThumbnail(imagePath, projectId);
    await visionService.saveAnalysisImage(imagePath, projectId);

    progressCallback(95);

    // Store project in database
    const now = new Date().toISOString();
    await db.run(`
      INSERT INTO vision_projects (id, userId, name, originalFile, fileType, width, height, tileDir, dziPath, pageCount, currentPage, metadata, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      projectId, userId, projectName, fileName, fileType,
      metadata.width, metadata.height,
      tileResult.tileDir, tileResult.dziPath,
      pageCount, 1,
      JSON.stringify({ format: metadata.format, size: metadata.size, channels: metadata.channels }),
      now, now
    ]);

    // Clean up original upload (keep the converted image if it's different)
    if (filePath !== imagePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    progressCallback(100);

    return {
      projectId,
      name: projectName,
      width: metadata.width,
      height: metadata.height,
      levels: tileResult.levels
    };
  };

  const jobId = await jobQueue.addJob('VISION_TILE_GENERATION', { projectId, fileName }, jobHandler);

  res.success({
    jobId,
    projectId,
    name: projectName,
    fileName,
    fileType,
    width: metadata.width,
    height: metadata.height,
    status: 'processing',
    pollUrl: `/api/jobs/${jobId}`
  }, 'Blueprint uploaded. Generating tiles...');
}));

/**
 * List all vision projects
 * GET /api/vision/projects
 */
router.get('/projects', tryCatch(async (req, res) => {
  const { q, type, limit = 50, offset = 0, sort = 'date' } = req.query;
  const projects = await db.searchDocuments({
    query: q,
    type,
    userId: req.user.id,
    limit: Number(limit),
    offset: Number(offset),
    sort,
  });

  // Add thumbnail URLs
  const result = projects.map(p => ({
    ...p,
    thumbnailUrl: `/api/vision/tiles/${p.id}/thumbnail.jpeg`
  }));

  res.success(result);
}));

/**
 * Get document summary stats
 * GET /api/vision/summary
 */
router.get('/summary', tryCatch(async (req, res) => {
  const summary = await db.getDocumentSummary(req.user.id);
  res.success(summary);
}));

/**
 * Get project details with layers
 * GET /api/vision/projects/:id
 */
router.get('/projects/:id', tryCatch(async (req, res) => {
  const project = await db.get('SELECT * FROM vision_projects WHERE id = ?', [req.params.id]);
  if (!project) {
    return res.error('Project not found', 'NOT_FOUND', null, 404);
  }

  // Security check - RBAC implementation
  if (!checkProjectAccess(req.user.id, project)) {
    return res.error('Access denied', 'FORBIDDEN', null, 403);
  }

  project.metadata = JSON.parse(project.metadata || '{}');

  // Get layers
  const layers = await db.all(
    'SELECT * FROM vision_layers WHERE projectId = ? ORDER BY createdAt',
    [req.params.id]
  );

  layers.forEach(layer => {
    layer.data = JSON.parse(layer.data || '[]');
    layer.style = JSON.parse(layer.style || '{}');
  });

  // Get analyses
  const analyses = await db.all(
    'SELECT id, passType, model, status, createdAt FROM vision_analyses WHERE projectId = ? ORDER BY createdAt DESC',
    [req.params.id]
  );

  res.success({ ...project, layers, analyses });
}));

// DZI tiles, individual tiles, and thumbnails are served as static files
// via express.static(visionService.tilesDir) in server.js

/**
 * Trigger AI vision analysis
 * POST /api/vision/projects/:id/analyze
 */
router.post('/projects/:id/analyze', tryCatch(async (req, res) => {
  const project = await db.get('SELECT * FROM vision_projects WHERE id = ?', [req.params.id]);
  if (!project) {
    return res.error('Project not found', 'NOT_FOUND', null, 404);
  }

  // Security check - RBAC implementation
  if (!checkProjectAccess(req.user.id, project)) {
    return res.error('Access denied', 'FORBIDDEN', null, 403);
  }

  const analysisId = randomUUID();
  const now = new Date().toISOString();
  let model = req.body.model || null;
  let passType = req.body.type || 'global'; // 'global', 'deep', or 'trace'

  // If model has a task suffix, split it
  if (model && model.includes(':')) {
    const [actualModel, task] = model.split(':');
    model = actualModel;
    if (task === 'trace') passType = 'trace';
    if (task === 'fixtures') passType = 'deep';
  }

  // Create analysis record
  await db.run(
    'INSERT INTO vision_analyses (id, projectId, passType, model, result, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [analysisId, req.params.id, passType, model || 'auto', '{}', 'pending', now]
  );

  // For global scan, use analysis image (2048px). For deep scan/trace, use original file if available
  let imagePath = visionService.getAnalysisImagePath(req.params.id);
  if (passType === 'deep' || passType === 'trace') {
    const uploadPath = path.join(visionService.uploadsDir, project.originalFile);
    if (fs.existsSync(uploadPath)) {
      imagePath = uploadPath;
    }
  }

  if (!fs.existsSync(imagePath)) {
    imagePath = path.join(visionService.tilesDir, req.params.id, 'thumbnail.jpeg');
  }
  if (!fs.existsSync(imagePath)) {
    return res.error('No image available for analysis. Try re-uploading the blueprint.', 'NO_IMAGE', null, 400);
  }

  // Queue analysis job
  const jobHandler = async (jobData, progressCallback) => {
    progressCallback(5);

    let result;
    if (passType === 'deep') {
      result = await visionAIService.deepScan(imagePath, { model }, progressCallback);
    } else if (passType === 'trace') {
      result = await visionAIService.traceRuns(imagePath, { model }, progressCallback);
    } else {
      result = await visionAIService.analyzeBlueprint(imagePath, { model }, progressCallback);
    }

    progressCallback(85);

    // Save analysis result
    await db.run(
      'UPDATE vision_analyses SET result = ?, model = ?, status = ?, lastError = ? WHERE id = ?',
      [
        JSON.stringify(result.data || {}), 
        result.model, 
        result.success ? 'completed' : 'failed', 
        result.success ? null : result.error,
        analysisId
      ]
    );

    if (result.success) {
      await db.run(
        'UPDATE vision_projects SET lastAnalyzedAt = ?, updatedAt = ? WHERE id = ?',
        [new Date().toISOString(), new Date().toISOString(), req.params.id]
      );
    }

    // Auto-create layers from analysis
    if (result.success && result.data) {
      const layers = visionAIService.analysisToLayers(result.data);
      for (const layer of layers) {
        const layerId = randomUUID();
        await db.run(
          'INSERT INTO vision_layers (id, projectId, name, type, visible, minZoom, maxZoom, data, style, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            layerId, req.params.id, 
            `${layer.name} (${passType === 'deep' ? 'Deep' : passType === 'trace' ? 'Trace' : 'Global'})`, 
            layer.type,
            layer.visible ? 1 : 0, layer.minZoom, layer.maxZoom,
            JSON.stringify(layer.data), JSON.stringify(layer.style), now
          ]
        );
      }
    }

    progressCallback(100);
    return result;
  };

  const jobId = await jobQueue.addJob('VISION_ANALYSIS', { analysisId, projectId: req.params.id }, jobHandler);

  res.success({
    jobId,
    analysisId,
    status: 'processing',
    pollUrl: `/api/jobs/${jobId}`
  }, `AI ${passType} analysis started`);
}));

/**
 * Convert AI analysis to Takeoff
 * POST /api/vision/projects/:id/analyses/:analysisId/convert
 */
router.post('/projects/:id/analyses/:analysisId/convert', tryCatch(async (req, res) => {
  const { id, analysisId } = req.params;
  
  // Verify project access before conversion
  const project = await db.get('SELECT * FROM vision_projects WHERE id = ?', [id]);
  if (!project) {
    return res.error('Project not found', 'NOT_FOUND', null, 404);
  }
  if (!checkProjectAccess(req.user.id, project)) {
    return res.error('Access denied', 'FORBIDDEN', null, 403);
  }
  
  const takeoff = await db.convertAnalysisToTakeoff(id, analysisId, req.user.id);
  
  res.success(takeoff, 'AI analysis converted to takeoff successfully');
}));

/**
 * Update project scale
 * PUT /api/vision/projects/:id/scale
 */
router.put('/projects/:id/scale', tryCatch(async (req, res) => {
  const { scale } = req.body;
  if (scale === undefined) return res.error('Scale is required', 'VALIDATION_ERROR', null, 400);
  
  // Verify ownership
  const project = await db.get('SELECT userId FROM vision_projects WHERE id = ?', [req.params.id]);
  if (!project) return res.error('Project not found', 'NOT_FOUND', null, 404);
  if (!checkProjectAccess(req.user.id, project)) {
    return res.error('Access denied', 'FORBIDDEN', null, 403);
  }
  
  await db.updateVisionProject(req.params.id, { scale });
  res.success({ scale }, 'Scale updated');
}));

/**
 * Update project name
 * PATCH /api/vision/projects/:id
 */
router.patch('/projects/:id', tryCatch(async (req, res) => {
  const { name } = req.body;
  if (!name) return res.error('Name is required', 'VALIDATION_ERROR', null, 400);
  
  // Verify ownership
  const project = await db.get('SELECT userId FROM vision_projects WHERE id = ?', [req.params.id]);
  if (!project) return res.error('Project not found', 'NOT_FOUND', null, 404);
  if (!checkProjectAccess(req.user.id, project)) {
    return res.error('Access denied', 'FORBIDDEN', null, 403);
  }
  
  const updated = await db.updateVisionProject(req.params.id, { name });
  res.success(updated, 'Project name updated');
}));

/**
 * Save/update annotation layers
 * POST /api/vision/projects/:id/layers
 */
router.post('/projects/:id/layers', tryCatch(async (req, res) => {
  const { name, type, visible, minZoom, maxZoom, data, style } = req.body;

  if (!name) {
    return res.error('Layer name is required', 'VALIDATION_ERROR', null, 400);
  }

  // Verify project access
  const project = await db.get('SELECT userId FROM vision_projects WHERE id = ?', [req.params.id]);
  if (!project) return res.error('Project not found', 'NOT_FOUND', null, 404);
  if (!checkProjectAccess(req.user.id, project)) {
    return res.error('Access denied', 'FORBIDDEN', null, 403);
  }

  const layerId = randomUUID();
  const now = new Date().toISOString();

  await db.run(
    'INSERT INTO vision_layers (id, projectId, name, type, visible, minZoom, maxZoom, data, style, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      layerId, req.params.id, name, type || 'annotation',
      visible !== false ? 1 : 0,
      minZoom || 0, maxZoom || 20,
      JSON.stringify(data || []),
      JSON.stringify(style || {}),
      now
    ]
  );

  const layer = await db.get('SELECT * FROM vision_layers WHERE id = ?', [layerId]);
  layer.data = JSON.parse(layer.data);
  layer.style = JSON.parse(layer.style);

  res.success(layer, 'Layer created');
}));

/**
 * Update a layer
 * PUT /api/vision/projects/:projectId/layers/:layerId
 * 
 * Uses parameterized queries with column whitelist to prevent SQL injection
 */
router.put('/projects/:projectId/layers/:layerId', tryCatch(async (req, res) => {
  const { layerId } = req.params;
  const existing = await db.get('SELECT * FROM vision_layers WHERE id = ?', [layerId]);
  if (!existing) {
    return res.error('Layer not found', 'NOT_FOUND', null, 404);
  }

  // Verify project access
  const project = await db.get('SELECT userId FROM vision_projects WHERE id = ?', [req.params.projectId]);
  if (!project) return res.error('Project not found', 'NOT_FOUND', null, 404);
  if (!checkProjectAccess(req.user.id, project)) {
    return res.error('Access denied', 'FORBIDDEN', null, 403);
  }

  // Whitelist of allowed columns for update
  const ALLOWED_COLUMNS = {
    name: { type: 'string', column: 'name' },
    color: { type: 'string', column: 'color' },
    visible: { type: 'boolean', column: 'visible' },
    opacity: { type: 'number', column: 'opacity' },
    minZoom: { type: 'number', column: 'minZoom' },
    maxZoom: { type: 'number', column: 'maxZoom' },
    data: { type: 'json', column: 'data' },
    style: { type: 'json', column: 'style' }
  };

  const updates = [];
  const params = [];

  // Validate and build update from whitelist only
  for (const [key, value] of Object.entries(req.body)) {
    const columnDef = ALLOWED_COLUMNS[key];
    if (!columnDef) {
      // Reject unknown fields
      return res.error(
        `Invalid field: "${key}". Allowed fields: ${Object.keys(ALLOWED_COLUMNS).join(', ')}`,
        'VALIDATION_ERROR',
        null,
        400
      );
    }

    // Validate and transform value based on type
    let processedValue;
    switch (columnDef.type) {
      case 'boolean':
        processedValue = value ? 1 : 0;
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return res.error(
            `Field "${key}" must be a number`,
            'VALIDATION_ERROR',
            null,
            400
          );
        }
        processedValue = value;
        break;
      case 'json':
        try {
          processedValue = JSON.stringify(value);
        } catch (e) {
          return res.error(
            `Field "${key}" must be valid JSON`,
            'VALIDATION_ERROR',
            null,
            400
          );
        }
        break;
      case 'string':
      default:
        if (typeof value !== 'string') {
          return res.error(
            `Field "${key}" must be a string`,
            'VALIDATION_ERROR',
            null,
            400
          );
        }
        processedValue = value;
    }

    // Use parameterized placeholders - column name from whitelist is safe
    updates.push(`${columnDef.column} = ?`);
    params.push(processedValue);
  }

  if (updates.length > 0) {
    params.push(layerId);
    // Build query with whitelist-verified column names only
    const query = `UPDATE vision_layers SET ${updates.join(', ')} WHERE id = ?`;
    await db.run(query, params);
  }

  const layer = await db.get('SELECT * FROM vision_layers WHERE id = ?', [layerId]);
  layer.data = JSON.parse(layer.data);
  layer.style = JSON.parse(layer.style);

  res.success(layer, 'Layer updated');
}));

/**
 * Delete a layer
 * DELETE /api/vision/projects/:projectId/layers/:layerId
 */
router.delete('/projects/:projectId/layers/:layerId', tryCatch(async (req, res) => {
  // Verify project access
  const project = await db.get('SELECT userId FROM vision_projects WHERE id = ?', [req.params.projectId]);
  if (!project) return res.error('Project not found', 'NOT_FOUND', null, 404);
  if (!checkProjectAccess(req.user.id, project)) {
    return res.error('Access denied', 'FORBIDDEN', null, 403);
  }

  const result = await db.run('DELETE FROM vision_layers WHERE id = ?', [req.params.layerId]);
  if (result.changes === 0) {
    return res.error('Layer not found', 'NOT_FOUND', null, 404);
  }
  res.success({ deleted: true }, 'Layer deleted');
}));

/**
 * Delete a vision project
 * DELETE /api/vision/projects/:id
 */
router.delete('/projects/:id', tryCatch(async (req, res) => {
  const project = await db.get('SELECT * FROM vision_projects WHERE id = ?', [req.params.id]);
  if (!project) {
    return res.error('Project not found', 'NOT_FOUND', null, 404);
  }

  // Verify ownership before delete
  if (!checkProjectAccess(req.user.id, project)) {
    return res.error('Access denied', 'FORBIDDEN', null, 403);
  }

  // Delete tiles from disk
  visionService.deleteProjectTiles(req.params.id);

  // Delete from database (layers and analyses cascade)
  await db.run('DELETE FROM vision_layers WHERE projectId = ?', [req.params.id]);
  await db.run('DELETE FROM vision_analyses WHERE projectId = ?', [req.params.id]);
  await db.run('DELETE FROM vision_projects WHERE id = ?', [req.params.id]);

  res.success({ deleted: true }, 'Project deleted');
}));

export default router;
