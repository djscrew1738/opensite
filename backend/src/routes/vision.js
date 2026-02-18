// Vision API routes — Upload, tile serving, project CRUD, AI analysis

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { db } from '../services/database.js';
import { visionService } from '../services/vision.js';
import { visionAIService } from '../services/vision-ai.js';
import { jobQueue } from '../services/jobQueue.js';
import { tryCatch } from '../utils/response.js';
import { uploadLimiter } from '../middleware/security.js';
import logger from '../services/logger.js';

const router = express.Router();

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

    // Create thumbnail
    await visionService.createThumbnail(imagePath, projectId);

    progressCallback(95);

    // Store project in database
    const now = new Date().toISOString();
    db.db.prepare(`
      INSERT INTO vision_projects (id, name, originalFile, fileType, width, height, tileDir, dziPath, pageCount, currentPage, metadata, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      projectId, projectName, fileName, fileType,
      metadata.width, metadata.height,
      tileResult.tileDir, tileResult.dziPath,
      pageCount, 1,
      JSON.stringify({ format: metadata.format, size: metadata.size, channels: metadata.channels }),
      now, now
    );

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
  const projects = db.db.prepare(
    'SELECT id, name, originalFile, fileType, width, height, pageCount, createdAt, updatedAt FROM vision_projects ORDER BY updatedAt DESC'
  ).all();

  // Add thumbnail URLs
  const result = projects.map(p => ({
    ...p,
    thumbnailUrl: `/api/vision/tiles/${p.id}/thumbnail.jpeg`
  }));

  res.success(result);
}));

/**
 * Get project details with layers
 * GET /api/vision/projects/:id
 */
router.get('/projects/:id', tryCatch(async (req, res) => {
  const project = db.db.prepare('SELECT * FROM vision_projects WHERE id = ?').get(req.params.id);
  if (!project) {
    return res.error('Project not found', 'NOT_FOUND', null, 404);
  }

  project.metadata = JSON.parse(project.metadata || '{}');

  // Get layers
  const layers = db.db.prepare(
    'SELECT * FROM vision_layers WHERE projectId = ? ORDER BY createdAt'
  ).all(req.params.id);

  layers.forEach(layer => {
    layer.data = JSON.parse(layer.data || '[]');
    layer.style = JSON.parse(layer.style || '{}');
  });

  // Get analyses
  const analyses = db.db.prepare(
    'SELECT id, passType, model, status, createdAt FROM vision_analyses WHERE projectId = ? ORDER BY createdAt DESC'
  ).all(req.params.id);

  res.success({ ...project, layers, analyses });
}));

// DZI tiles, individual tiles, and thumbnails are served as static files
// via express.static(visionService.tilesDir) in server.js

/**
 * Trigger AI vision analysis
 * POST /api/vision/projects/:id/analyze
 */
router.post('/projects/:id/analyze', tryCatch(async (req, res) => {
  const project = db.db.prepare('SELECT * FROM vision_projects WHERE id = ?').get(req.params.id);
  if (!project) {
    return res.error('Project not found', 'NOT_FOUND', null, 404);
  }

  const analysisId = randomUUID();
  const now = new Date().toISOString();
  const model = req.body.model || null;

  // Create analysis record
  db.db.prepare(
    'INSERT INTO vision_analyses (id, projectId, passType, model, result, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(analysisId, req.params.id, 'global', model || 'auto', '{}', 'pending', now);

  // Find the original image — we need to reconstruct or use the thumbnail for analysis
  // For AI analysis, we'll use the thumbnail since original is deleted after tile gen
  const thumbPath = path.join(visionService.tilesDir, req.params.id, 'thumbnail.jpeg');

  // Actually, let's use a mid-level tile to get decent resolution
  // Find the highest-level tiles directory
  const filesDir = path.join(visionService.tilesDir, req.params.id, `${req.params.id}_files`);
  let analysisImagePath = thumbPath;

  if (fs.existsSync(filesDir)) {
    const levels = fs.readdirSync(filesDir).filter(d => /^\d+$/.test(d)).sort((a, b) => Number(b) - Number(a));
    if (levels.length > 0) {
      // Use a mid-high level for analysis (not highest to keep file size reasonable)
      const analyzeLevel = levels[Math.min(1, levels.length - 1)];
      const levelDir = path.join(filesDir, analyzeLevel);
      const tiles = fs.readdirSync(levelDir).filter(f => f.endsWith('.jpeg'));
      if (tiles.length === 1) {
        // Single tile at this level — use it directly
        analysisImagePath = path.join(levelDir, tiles[0]);
      }
    }
  }

  if (!fs.existsSync(analysisImagePath)) {
    return res.error('No image available for analysis', 'NO_IMAGE', null, 400);
  }

  // Queue analysis job
  const jobHandler = async (jobData, progressCallback) => {
    progressCallback(5);

    const result = await visionAIService.analyzeBlueprint(analysisImagePath, { model }, progressCallback);

    progressCallback(85);

    // Save analysis result
    db.db.prepare(
      'UPDATE vision_analyses SET result = ?, model = ?, status = ? WHERE id = ?'
    ).run(JSON.stringify(result.data || {}), result.model, result.success ? 'completed' : 'failed', analysisId);

    // Auto-create layers from analysis
    if (result.success && result.data) {
      const layers = visionAIService.analysisToLayers(result.data);
      for (const layer of layers) {
        const layerId = randomUUID();
        db.db.prepare(
          'INSERT INTO vision_layers (id, projectId, name, type, visible, minZoom, maxZoom, data, style, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(
          layerId, req.params.id, layer.name, layer.type,
          layer.visible ? 1 : 0, layer.minZoom, layer.maxZoom,
          JSON.stringify(layer.data), JSON.stringify(layer.style), now
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
  }, 'AI analysis started');
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

  const layerId = randomUUID();
  const now = new Date().toISOString();

  db.db.prepare(
    'INSERT INTO vision_layers (id, projectId, name, type, visible, minZoom, maxZoom, data, style, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    layerId, req.params.id, name, type || 'annotation',
    visible !== false ? 1 : 0,
    minZoom || 0, maxZoom || 20,
    JSON.stringify(data || []),
    JSON.stringify(style || {}),
    now
  );

  const layer = db.db.prepare('SELECT * FROM vision_layers WHERE id = ?').get(layerId);
  layer.data = JSON.parse(layer.data);
  layer.style = JSON.parse(layer.style);

  res.success(layer, 'Layer created');
}));

/**
 * Update a layer
 * PUT /api/vision/projects/:projectId/layers/:layerId
 */
router.put('/projects/:projectId/layers/:layerId', tryCatch(async (req, res) => {
  const { layerId } = req.params;
  const existing = db.db.prepare('SELECT * FROM vision_layers WHERE id = ?').get(layerId);
  if (!existing) {
    return res.error('Layer not found', 'NOT_FOUND', null, 404);
  }

  const updates = [];
  const params = [];

  if (req.body.name !== undefined) { updates.push('name = ?'); params.push(req.body.name); }
  if (req.body.visible !== undefined) { updates.push('visible = ?'); params.push(req.body.visible ? 1 : 0); }
  if (req.body.minZoom !== undefined) { updates.push('minZoom = ?'); params.push(req.body.minZoom); }
  if (req.body.maxZoom !== undefined) { updates.push('maxZoom = ?'); params.push(req.body.maxZoom); }
  if (req.body.data !== undefined) { updates.push('data = ?'); params.push(JSON.stringify(req.body.data)); }
  if (req.body.style !== undefined) { updates.push('style = ?'); params.push(JSON.stringify(req.body.style)); }

  if (updates.length > 0) {
    params.push(layerId);
    db.db.prepare(`UPDATE vision_layers SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const layer = db.db.prepare('SELECT * FROM vision_layers WHERE id = ?').get(layerId);
  layer.data = JSON.parse(layer.data);
  layer.style = JSON.parse(layer.style);

  res.success(layer, 'Layer updated');
}));

/**
 * Delete a layer
 * DELETE /api/vision/projects/:projectId/layers/:layerId
 */
router.delete('/projects/:projectId/layers/:layerId', tryCatch(async (req, res) => {
  const result = db.db.prepare('DELETE FROM vision_layers WHERE id = ?').run(req.params.layerId);
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
  const project = db.db.prepare('SELECT * FROM vision_projects WHERE id = ?').get(req.params.id);
  if (!project) {
    return res.error('Project not found', 'NOT_FOUND', null, 404);
  }

  // Delete tiles from disk
  visionService.deleteProjectTiles(req.params.id);

  // Delete from database (layers and analyses cascade)
  db.db.prepare('DELETE FROM vision_layers WHERE projectId = ?').run(req.params.id);
  db.db.prepare('DELETE FROM vision_analyses WHERE projectId = ?').run(req.params.id);
  db.db.prepare('DELETE FROM vision_projects WHERE id = ?').run(req.params.id);

  res.success({ deleted: true }, 'Project deleted');
}));

export default router;
