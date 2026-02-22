// Canvas API Routes - Visual Workspace Management
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as canvasDb from '../services/canvas-database.js';
import { db } from '../services/database.js';
// Auth not currently required for canvas routes
// import { requireAdmin } from '../middleware/auth.js';
import logger from '../services/logger.js';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Ensure canvas upload directory exists
const CANVAS_UPLOAD_DIR = process.env.CANVAS_UPLOAD_DIR || './data/canvas-uploads';

async function ensureUploadDir() {
  try {
    await fs.mkdir(CANVAS_UPLOAD_DIR, { recursive: true });
  } catch (err) {
    logger.error('Failed to create canvas upload directory', { error: err.message });
  }
}

ensureUploadDir();

// Initialize tables on module load
canvasDb.initCanvasTables();

// ============================================================================
// WORKSPACE ROUTES
// ============================================================================

// GET /api/canvas/workspaces - List all workspaces
router.get('/workspaces', async (req, res) => {
  try {
    const { project_id } = req.query;
    const workspaces = canvasDb.getWorkspaces(project_id);
    res.success(workspaces);
  } catch (err) {
    logger.error('Failed to list workspaces', { error: err.message });
    res.error('Failed to list workspaces', 'DATABASE_ERROR', null, 500);
  }
});

// POST /api/canvas/workspaces - Create new workspace
router.post('/workspaces', async (req, res) => {
  try {
    const { name, description, project_id, view_state } = req.body;
    
    if (!name) {
      return res.error('Workspace name is required', 'VALIDATION_ERROR', null, 400);
    }
    
    const workspace = canvasDb.createWorkspace({
      id: `ws_${uuidv4()}`,
      name,
      description,
      project_id,
      view_state: view_state || { x: 0, y: 0, zoom: 1 }
    });
    
    logger.info('Canvas workspace created', { workspaceId: workspace.id, name });
    res.success(workspace, 'Workspace created', 201);
  } catch (err) {
    logger.error('Failed to create workspace', { error: err.message });
    res.error('Failed to create workspace', 'DATABASE_ERROR', null, 500);
  }
});

// GET /api/canvas/workspaces/:id - Get workspace with full canvas state
router.get('/workspaces/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const canvas = canvasDb.getFullCanvas(id);
    
    if (!canvas) {
      return res.error('Workspace not found', 'NOT_FOUND', null, 404);
    }
    
    res.success(canvas);
  } catch (err) {
    logger.error('Failed to get workspace', { error: err.message, workspaceId: req.params.id });
    res.error('Failed to get workspace', 'DATABASE_ERROR', null, 500);
  }
});

// PUT /api/canvas/workspaces/:id - Update workspace
router.put('/workspaces/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, view_state } = req.body;
    
    const workspace = canvasDb.updateWorkspace(id, { name, description, view_state });
    
    if (!workspace) {
      return res.error('Workspace not found', 'NOT_FOUND', null, 404);
    }
    
    res.success(workspace);
  } catch (err) {
    logger.error('Failed to update workspace', { error: err.message, workspaceId: req.params.id });
    res.error('Failed to update workspace', 'DATABASE_ERROR', null, 500);
  }
});

// DELETE /api/canvas/workspaces/:id - Delete workspace
router.delete('/workspaces/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get all documents to clean up files
    const nodes = canvasDb.getNodesByWorkspace(id);
    for (const node of nodes) {
      if (node.type === 'document') {
        const doc = canvasDb.getDocumentByNode(node.id);
        if (doc) {
          try {
            await fs.unlink(doc.file_path);
            if (doc.thumbnail_path) {
              await fs.unlink(doc.thumbnail_path);
            }
          } catch (err) {
            logger.warn('Failed to delete file', { error: err.message, path: doc.file_path });
          }
        }
      }
    }
    
    canvasDb.deleteWorkspace(id);
    logger.info('Canvas workspace deleted', { workspaceId: id });
    res.success({ deleted: true });
  } catch (err) {
    logger.error('Failed to delete workspace', { error: err.message, workspaceId: req.params.id });
    res.error('Failed to delete workspace', 'DATABASE_ERROR', null, 500);
  }
});

// ============================================================================
// NODE ROUTES
// ============================================================================

// POST /api/canvas/workspaces/:id/nodes - Create node
router.post('/workspaces/:id/nodes', async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const nodeData = req.body;
    
    const node = canvasDb.createNode({
      ...nodeData,
      workspace_id: workspaceId,
      id: `node_${uuidv4()}`
    });
    
    res.success(node, 'Node created', 201);
  } catch (err) {
    logger.error('Failed to create node', { error: err.message, workspaceId: req.params.id });
    res.error('Failed to create node', 'DATABASE_ERROR', null, 500);
  }
});

// PUT /api/canvas/nodes/:id - Update node
router.put('/nodes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const node = canvasDb.updateNode(id, req.body);
    
    if (!node) {
      return res.error('Node not found', 'NOT_FOUND', null, 404);
    }
    
    res.success(node);
  } catch (err) {
    logger.error('Failed to update node', { error: err.message, nodeId: req.params.id });
    res.error('Failed to update node', 'DATABASE_ERROR', null, 500);
  }
});

// POST /api/canvas/workspaces/:id/nodes/positions - Batch update node positions
router.post('/workspaces/:id/nodes/positions', async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const { nodes } = req.body;
    
    if (!Array.isArray(nodes)) {
      return res.error('Nodes array required', 'VALIDATION_ERROR', null, 400);
    }
    
    canvasDb.updateNodePositions(workspaceId, nodes);
    res.success({ updated: true });
  } catch (err) {
    logger.error('Failed to update node positions', { error: err.message, workspaceId: req.params.id });
    res.error('Failed to update node positions', 'DATABASE_ERROR', null, 500);
  }
});

// DELETE /api/canvas/nodes/:id - Delete node
router.delete('/nodes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Clean up associated document files
    const doc = canvasDb.getDocumentByNode(id);
    if (doc) {
      try {
        await fs.unlink(doc.file_path);
        if (doc.thumbnail_path) {
          await fs.unlink(doc.thumbnail_path);
        }
      } catch (err) {
        logger.warn('Failed to delete file', { error: err.message });
      }
    }
    
    canvasDb.deleteNode(id);
    res.success({ deleted: true });
  } catch (err) {
    logger.error('Failed to delete node', { error: err.message, nodeId: req.params.id });
    res.error('Failed to delete node', 'DATABASE_ERROR', null, 500);
  }
});

// ============================================================================
// EDGE ROUTES
// ============================================================================

// POST /api/canvas/workspaces/:id/edges - Create edge
router.post('/workspaces/:id/edges', async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const edgeData = req.body;
    
    const edge = canvasDb.createEdge({
      ...edgeData,
      workspace_id: workspaceId,
      id: `edge_${uuidv4()}`
    });
    
    res.success(edge, 'Edge created', 201);
  } catch (err) {
    logger.error('Failed to create edge', { error: err.message, workspaceId: req.params.id });
    res.error('Failed to create edge', 'DATABASE_ERROR', null, 500);
  }
});

// PUT /api/canvas/edges/:id - Update edge
router.put('/edges/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const edge = canvasDb.updateEdge(id, req.body);
    
    if (!edge) {
      return res.error('Edge not found', 'NOT_FOUND', null, 404);
    }
    
    res.success(edge);
  } catch (err) {
    logger.error('Failed to update edge', { error: err.message, edgeId: req.params.id });
    res.error('Failed to update edge', 'DATABASE_ERROR', null, 500);
  }
});

// DELETE /api/canvas/edges/:id - Delete edge
router.delete('/edges/:id', async (req, res) => {
  try {
    const { id } = req.params;
    canvasDb.deleteEdge(id);
    res.success({ deleted: true });
  } catch (err) {
    logger.error('Failed to delete edge', { error: err.message, edgeId: req.params.id });
    res.error('Failed to delete edge', 'DATABASE_ERROR', null, 500);
  }
});

// ============================================================================
// FINDING ROUTES
// ============================================================================

// GET /api/canvas/workspaces/:id/findings - List findings
router.get('/workspaces/:id/findings', async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const findings = canvasDb.getFindingsByWorkspace(workspaceId);
    res.success(findings);
  } catch (err) {
    logger.error('Failed to list findings', { error: err.message, workspaceId: req.params.id });
    res.error('Failed to list findings', 'DATABASE_ERROR', null, 500);
  }
});

// POST /api/canvas/workspaces/:id/findings - Create finding
router.post('/workspaces/:id/findings', async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const { type, title, description, position, node_id } = req.body;
    
    if (!type || !title) {
      return res.error('Type and title are required', 'VALIDATION_ERROR', null, 400);
    }
    
    const finding = canvasDb.createFinding({
      workspace_id: workspaceId,
      node_id,
      type,
      title,
      description,
      position
    });
    
    res.success(finding, 'Finding created', 201);
  } catch (err) {
    logger.error('Failed to create finding', { error: err.message, workspaceId: req.params.id });
    res.error('Failed to create finding', 'DATABASE_ERROR', null, 500);
  }
});

// PUT /api/canvas/findings/:id - Update finding
router.put('/findings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const finding = canvasDb.updateFinding(id, req.body);
    
    if (!finding) {
      return res.error('Finding not found', 'NOT_FOUND', null, 404);
    }
    
    res.success(finding);
  } catch (err) {
    logger.error('Failed to update finding', { error: err.message, findingId: req.params.id });
    res.error('Failed to update finding', 'DATABASE_ERROR', null, 500);
  }
});

// DELETE /api/canvas/findings/:id - Delete finding
router.delete('/findings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    canvasDb.deleteFinding(id);
    res.success({ deleted: true });
  } catch (err) {
    logger.error('Failed to delete finding', { error: err.message, findingId: req.params.id });
    res.error('Failed to delete finding', 'DATABASE_ERROR', null, 500);
  }
});

// ============================================================================
// DOCUMENT UPLOAD & AI CLASSIFICATION
// ============================================================================

// POST /api/canvas/workspaces/:id/documents - Upload and classify document
router.post('/workspaces/:id/documents', async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    
    if (!req.files || !req.files.file) {
      return res.error('No file uploaded', 'VALIDATION_ERROR', null, 400);
    }
    
    const file = req.files.file;
    const fileId = `doc_${uuidv4()}`;
    const ext = path.extname(file.name).toLowerCase();
    const filename = `${fileId}${ext}`;
    const filePath = path.join(CANVAS_UPLOAD_DIR, filename);
    
    // Validate file type
    const allowedTypes = ['.pdf', '.png', '.jpg', '.jpeg'];
    if (!allowedTypes.includes(ext)) {
      return res.error('Invalid file type. Allowed: PDF, PNG, JPG', 'VALIDATION_ERROR', null, 400);
    }
    
    // Save file
    await file.mv(filePath);
    
    // AI Classification (placeholder - integrate with your AI service)
    const classification = await classifyDocument(filePath, ext);
    
    // Create document node at drop position
    const position = req.body.position ? JSON.parse(req.body.position) : { x: 100, y: 100 };
    const node = canvasDb.createNode({
      workspace_id: workspaceId,
      type: 'document',
      position,
      width: 240,
      height: 160,
      data: {
        label: file.name,
        fileType: ext.replace('.', ''),
        category: classification.category,
        confidence: classification.confidence
      }
    });
    
    // Create document record
    const document = canvasDb.createDocument({
      node_id: node.id,
      workspace_id: workspaceId,
      filename: file.name,
      file_path: filePath,
      file_type: ext.replace('.', ''),
      file_size: file.size,
      category: classification.category,
      ai_classification_confidence: classification.confidence
    });
    
    logger.info('Document uploaded and classified', { 
      documentId: document.id, 
      workspaceId, 
      category: classification.category,
      confidence: classification.confidence
    });
    
    res.success({ node, document }, 'Document uploaded', 201);
  } catch (err) {
    logger.error('Failed to upload document', { error: err.message, workspaceId: req.params.id });
    res.error('Failed to upload document', 'UPLOAD_ERROR', null, 500);
  }
});

// GET /api/canvas/documents/:id - Get document details
router.get('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const document = canvasDb.getDocument(id);
    
    if (!document) {
      return res.error('Document not found', 'NOT_FOUND', null, 404);
    }
    
    res.success(document);
  } catch (err) {
    logger.error('Failed to get document', { error: err.message, documentId: req.params.id });
    res.error('Failed to get document', 'DATABASE_ERROR', null, 500);
  }
});

// GET /api/canvas/documents/:id/download - Download document file
router.get('/documents/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const document = canvasDb.getDocument(id);
    
    if (!document) {
      return res.error('Document not found', 'NOT_FOUND', null, 404);
    }
    
    res.download(document.file_path, document.filename);
  } catch (err) {
    logger.error('Failed to download document', { error: err.message, documentId: req.params.id });
    res.error('Failed to download document', 'DOWNLOAD_ERROR', null, 500);
  }
});

// POST /api/canvas/documents/:id/ocr - Run OCR on document
router.post('/documents/:id/ocr', async (req, res) => {
  try {
    const { id } = req.params;
    const document = canvasDb.getDocument(id);
    
    if (!document) {
      return res.error('Document not found', 'NOT_FOUND', null, 404);
    }
    
    // Placeholder for OCR integration
    // In production, integrate with Tesseract.js, AWS Textract, or similar
    const ocrResult = await runOCR(document.file_path, document.file_type);
    
    canvasDb.updateDocument(id, { ocr_text: ocrResult.text });
    
    res.success({ text: ocrResult.text, pages: ocrResult.pages });
  } catch (err) {
    logger.error('Failed to run OCR', { error: err.message, documentId: req.params.id });
    res.error('Failed to run OCR', 'OCR_ERROR', null, 500);
  }
});

// ============================================================================
// AI HELPERS (Placeholders - integrate with your AI service)
// ============================================================================

async function classifyDocument(filePath, ext) {
  try {
    // Placeholder for AI classification
    // In production, integrate with Ollama, OpenAI, or your document classification service
    
    // Simulate classification based on filename keywords
    const filename = path.basename(filePath).toLowerCase();
    
    const keywords = {
      blueprint: ['blueprint', 'plan', 'drawing', 'layout', 'site'],
      w9: ['w9', 'w-9', 'tax', 'ein'],
      receipt: ['receipt', 'invoice', 'bill', 'payment'],
      contract: ['contract', 'agreement', 'terms', 'proposal'],
      permit: ['permit', 'license', 'approval', 'inspection']
    };
    
    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(w => filename.includes(w))) {
        return { category, confidence: 0.85 + Math.random() * 0.1 };
      }
    }
    
    // Default classification based on file type
    if (ext === '.pdf') {
      return { category: 'document', confidence: 0.7 };
    }
    
    return { category: 'other', confidence: 0.6 };
  } catch (err) {
    logger.error('Document classification failed', { error: err.message });
    return { category: 'other', confidence: 0.5 };
  }
}

async function runOCR(filePath, fileType) {
  try {
    // Placeholder for OCR
    // In production, integrate with Tesseract.js, AWS Textract, Google Vision, etc.
    
    logger.info('Running OCR', { filePath, fileType });
    
    // Simulate OCR delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      text: `[OCR text would be extracted here for ${path.basename(filePath)}]`,
      pages: fileType === 'pdf' ? 1 : 1
    };
  } catch (err) {
    logger.error('OCR failed', { error: err.message });
    throw err;
  }
}

export default router;
