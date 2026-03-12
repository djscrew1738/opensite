// Canvas API Routes - Visual Workspace Management
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/database.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { tryCatch } from '../utils/response.js';
import logger from '../services/logger.js';
import path from 'path';
import fs from 'fs/promises';
import { classifyDocument, runOCR } from '../services/document-ai.js';

const router = express.Router();

// Apply authentication to all canvas routes
router.use(authenticateToken);

// Ensure canvas upload directory exists
const CANVAS_UPLOAD_DIR = process.env.CANVAS_UPLOAD_DIR || './data/canvas-uploads';

async function ensureUploadDir() {
  try {
    await fs.mkdir(CANVAS_UPLOAD_DIR, { recursive: true });
  } catch (err) {
    logger.error('Failed to create canvas upload directory', { error: err.message });
  }
}

// Initial table setup (now part of DB service)
db.initializeCanvasTables();
ensureUploadDir();

// ============================================================================
// WORKSPACE ROUTES
// ============================================================================

/**
 * GET /api/canvas/workspaces - List all workspaces
 */
router.get('/workspaces', tryCatch(async (req, res) => {
  const { project_id } = req.query;
  const workspaces = await db.getWorkspaces(project_id, req.user.id);
  res.success(workspaces);
}));

/**
 * POST /api/canvas/workspaces - Create new workspace
 */
router.post('/workspaces', tryCatch(async (req, res) => {
  const { name, description, project_id, view_state } = req.body;
  
  if (!name) {
    return res.error('Workspace name is required', 'VALIDATION_ERROR', null, 400);
  }
  
  const workspace = await db.createWorkspace({
    userId: req.user.id,
    name,
    description,
    project_id,
    view_state: view_state || { x: 0, y: 0, zoom: 1 }
  });
  
  logger.info('Canvas workspace created', { workspaceId: workspace.id, name, userId: req.user.id });
  res.status(201).success(workspace, 'Workspace created');
}));

/**
 * GET /api/canvas/workspaces/:id - Get workspace with full state
 */
router.get('/workspaces/:id', tryCatch(async (req, res) => {
  const { id } = req.params;
  const canvas = await db.getFullCanvas(id);
  
  if (!canvas) {
    return res.error('Workspace not found', 'NOT_FOUND', null, 404);
  }
  
  res.success(canvas);
}));

/**
 * PUT /api/canvas/workspaces/:id - Update workspace
 */
router.put('/workspaces/:id', tryCatch(async (req, res) => {
  const { id } = req.params;
  const workspace = await db.updateWorkspace(id, req.body);
  
  if (!workspace) {
    return res.error('Workspace not found', 'NOT_FOUND', null, 404);
  }
  
  res.success(workspace);
}));

/**
 * DELETE /api/canvas/workspaces/:id - Delete workspace
 */
router.delete('/workspaces/:id', tryCatch(async (req, res) => {
  const { id } = req.params;
  const canvas = await db.getWorkspace(id);
  
  if (!canvas) {
    return res.error('Workspace not found', 'NOT_FOUND', null, 404);
  }

  // Clean up documents in this workspace
  const nodes = await db.getNodesByWorkspace(id);
  for (const node of nodes) {
    if (node.type === 'document') {
      const doc = await db.getDocumentByNode(node.id);
      if (doc && doc.file_path) {
        try {
          await fs.unlink(doc.file_path);
          if (doc.thumbnail_path) await fs.unlink(doc.thumbnail_path);
        } catch (e) {}
      }
    }
  }
  
  await db.deleteWorkspace(id);
  logger.info('Canvas workspace deleted', { workspaceId: id });
  res.success({ id }, 'Workspace deleted');
}));

// ============================================================================
// NODE ROUTES
// ============================================================================

/**
 * POST /api/canvas/workspaces/:id/nodes - Add node
 */
router.post('/workspaces/:id/nodes', tryCatch(async (req, res) => {
  const node = await db.createNode({
    ...req.body,
    workspace_id: req.params.id
  });
  res.status(201).success(node);
}));

/**
 * PUT /api/canvas/nodes/:id - Update node
 */
router.put('/nodes/:id', tryCatch(async (req, res) => {
  const node = await db.updateNode(req.params.id, req.body);
  if (!node) return res.error('Node not found', 'NOT_FOUND', null, 404);
  res.success(node);
}));

/**
 * POST /api/canvas/workspaces/:id/nodes/positions - Batch move
 */
router.post('/workspaces/:id/nodes/positions', tryCatch(async (req, res) => {
  const { nodes } = req.body;
  if (!Array.isArray(nodes)) {
    return res.error('Nodes array required', 'VALIDATION_ERROR', null, 400);
  }
  await db.updateNodePositions(req.params.id, nodes);
  res.success({ updated: true });
}));

/**
 * DELETE /api/canvas/nodes/:id - Remove node
 */
router.delete('/nodes/:id', tryCatch(async (req, res) => {
  const { id } = req.params;
  const doc = await db.getDocumentByNode(id);
  
  if (doc && doc.file_path) {
    try {
      await fs.unlink(doc.file_path);
      if (doc.thumbnail_path) await fs.unlink(doc.thumbnail_path);
    } catch (e) {}
  }
  
  await db.deleteNode(id);
  res.success({ id }, 'Node deleted');
}));

// ============================================================================
// EDGE ROUTES
// ============================================================================

router.post('/workspaces/:id/edges', tryCatch(async (req, res) => {
  const edge = await db.createEdge({ ...req.body, workspace_id: req.params.id });
  res.status(201).success(edge);
}));

router.delete('/edges/:id', tryCatch(async (req, res) => {
  await db.deleteEdge(req.params.id);
  res.success({ id: req.params.id });
}));

// ============================================================================
// FINDING ROUTES
// ============================================================================

router.get('/workspaces/:id/findings', tryCatch(async (req, res) => {
  const findings = await db.getFindingsByWorkspace(req.params.id);
  res.success(findings);
}));

router.post('/workspaces/:id/findings', tryCatch(async (req, res) => {
  const finding = await db.createFinding({ ...req.body, workspace_id: req.params.id });
  res.status(201).success(finding);
}));

router.put('/findings/:id', tryCatch(async (req, res) => {
  const finding = await db.updateFinding(req.params.id, req.body);
  if (!finding) return res.error('Finding not found', 'NOT_FOUND', null, 404);
  res.success(finding);
}));

router.delete('/findings/:id', tryCatch(async (req, res) => {
  await db.deleteFinding(req.params.id);
  res.success({ id: req.params.id });
}));

// ============================================================================
// DOCUMENT UPLOAD & AI
// ============================================================================

router.post('/workspaces/:id/documents', tryCatch(async (req, res) => {
  const { id: workspaceId } = req.params;
  
  if (!req.files || !req.files.file) {
    return res.error('No file uploaded', 'VALIDATION_ERROR', null, 400);
  }
  
  const file = req.files.file;
  const fileId = `doc_${uuidv4()}`;
  const ext = path.extname(file.name).toLowerCase();
  const filePath = path.join(CANVAS_UPLOAD_DIR, `${fileId}${ext}`);
  
  await file.mv(filePath);
  
  // AI Classification
  const classification = await classifyDocument(filePath, ext);
  
  // Create node + document record
  const position = req.body.position ? JSON.parse(req.body.position) : { x: 100, y: 100 };
  const node = await db.createNode({
    workspace_id: workspaceId,
    type: 'document',
    position,
    data: { 
      label: file.name, 
      category: classification.category, 
      confidence: classification.confidence 
    }
  });
  
  const document = await db.createDocument({
    node_id: node.id,
    workspace_id: workspaceId,
    filename: file.name,
    file_path: filePath,
    file_type: ext.replace('.', ''),
    file_size: file.size,
    category: classification.category,
    ai_classification_confidence: classification.confidence
  });
  
  res.status(201).success({ node, document });
}));

router.get('/documents/:id', tryCatch(async (req, res) => {
  const doc = await db.getDocument(req.params.id);
  if (!doc) return res.error('Document not found', 'NOT_FOUND', null, 404);
  res.success(doc);
}));

router.post('/documents/:id/ocr', tryCatch(async (req, res) => {
  const doc = await db.getDocument(req.params.id);
  if (!doc) return res.error('Document not found', 'NOT_FOUND', null, 404);
  
  const ocrResult = await runOCR(doc.file_path, doc.file_type);
  await db.updateDocument(req.params.id, { ocr_text: ocrResult.text });
  
  res.success({ text: ocrResult.text, pages: ocrResult.pages });
}));

export default router;
