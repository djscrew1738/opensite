// DocVault API routes — Document upload, text extraction, AI analysis, and chat

import express from 'express';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { aiChatLimiter } from '../middleware/security.js';
import { db } from '../services/database.js';
import { docUpload } from '../middleware/docUpload.js';
import { extractText } from '../services/text-extractor.js';
import { summarize, extractEntities, chat } from '../services/docvault-ai.js';
import { tryCatch, parsePagination, paginationMeta } from '../utils/response.js';
import { validateId } from '../middleware/validation.js';
import logger from '../services/logger.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/docvault/upload — Upload a document and kick off text extraction
 */
router.post('/upload', docUpload.single('file'), tryCatch(async (req, res) => {
  if (!req.file) {
    return res.error('No file uploaded', 'VALIDATION_ERROR', null, 400);
  }

  const { filename, originalname, mimetype, size, path: filePath } = req.file;

  const doc = await db.createTextDocument({
    userId: req.user.id,
    filename,
    originalName: originalname,
    mimeType: mimetype,
    fileSize: size,
    filePath,
    status: 'processing'
  });

  // Background text extraction
  (async () => {
    try {
      const result = await extractText(filePath, mimetype, doc.id);
      const text = result.text || '';
      const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
      
      await db.updateTextDocument(doc.id, {
        extractedText: text,
        wordCount,
        pageCount: result.pageCount || 1,
        status: 'ready'
      });

      logger.info(`DocVault: Text extracted for document ${doc.id}`, { wordCount });
    } catch (err) {
      logger.error(`DocVault: Text extraction failed for document ${doc.id}`, { error: err.message });
      await db.updateTextDocument(doc.id, {
        status: 'error',
        errorMessage: err.message
      });
    }
  })();

  res.status(201).success({
    doc,
    message: 'Document uploaded. Text extraction in progress.'
  });
}));

/**
 * GET /api/docvault — List documents
 */
router.get('/', tryCatch(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  
  const documents = await db.getAllTextDocuments({
    userId: req.user.id,
    limit,
    offset
  });

  const total = await db.countTextDocuments(req.user.id);

  res.success({
    documents,
    total
  }, null, paginationMeta(page, limit, total));
}));

/**
 * GET /api/docvault/:id — Get document details
 */
router.get('/:id', validateId, tryCatch(async (req, res) => {
  const doc = await db.getTextDocument(req.params.id);

  if (!doc) return res.error('Document not found', 'NOT_FOUND', null, 404);
  if (doc.userId !== req.user.id && req.user.role !== 'admin') {
    return res.error('Access denied', 'FORBIDDEN', null, 403);
  }

  res.success(doc);
}));

/**
 * DELETE /api/docvault/:id — Delete document
 */
router.delete('/:id', validateId, tryCatch(async (req, res) => {
  const doc = await db.getTextDocument(req.params.id);

  if (!doc) return res.error('Document not found', 'NOT_FOUND', null, 404);
  if (doc.userId !== req.user.id && req.user.role !== 'admin') {
    return res.error('Access denied', 'FORBIDDEN', null, 403);
  }

  // Delete from disk
  if (doc.filePath) {
    try {
      await fs.unlink(doc.filePath);
    } catch (e) {
      logger.warn(`Could not delete file: ${doc.filePath}`, { error: e.message });
    }
  }

  await db.deleteTextDocument(req.params.id);
  res.success({ id: req.params.id }, 'Document deleted successfully');
}));

/**
 * POST /api/docvault/:id/summarize — Generate AI summary
 */
router.post('/:id/summarize', validateId, aiChatLimiter, tryCatch(async (req, res) => {
  const doc = await db.getTextDocument(req.params.id);
  const { model } = req.body;

  if (!doc) return res.error('Document not found', 'NOT_FOUND', null, 404);
  if (doc.status !== 'ready') return res.error('Document not ready', 'INVALID_STATE', null, 400);

  const summary = await summarize(doc.extractedText, model);
  await db.updateTextDocument(req.params.id, { summary });

  res.success({ summary });
}));

/**
 * POST /api/docvault/:id/extract — Entity extraction
 */
router.post('/:id/extract', validateId, aiChatLimiter, tryCatch(async (req, res) => {
  const doc = await db.getTextDocument(req.params.id);
  const { model } = req.body;

  if (!doc) return res.error('Document not found', 'NOT_FOUND', null, 404);
  if (doc.status !== 'ready') return res.error('Document not ready', 'INVALID_STATE', null, 400);

  const entities = await extractEntities(doc.extractedText, model);
  await db.updateTextDocument(req.params.id, { entities });

  res.success({ entities });
}));

/**
 * POST /api/docvault/:id/chat — Chat with document
 */
router.post('/:id/chat', validateId, aiChatLimiter, tryCatch(async (req, res) => {
  const doc = await db.getTextDocument(req.params.id);
  const { question, model } = req.body;

  if (!doc) return res.error('Document not found', 'NOT_FOUND', null, 404);
  if (doc.status !== 'ready') return res.error('Document not ready', 'INVALID_STATE', null, 400);

  if (!question) return res.error('Question is required', 'VALIDATION_ERROR', null, 400);

  const history = await db.getDocumentChatHistory(req.params.id);
  
  // Save user message
  await db.createDocumentChatMessage({
    documentId: req.params.id,
    role: 'user',
    content: question
  });

  const answer = await chat(doc.extractedText, question, history.map(m => ({ role: m.role, content: m.content })), model);

  // Save assistant message
  const assistantMsg = await db.createDocumentChatMessage({
    documentId: req.params.id,
    role: 'assistant',
    content: answer
  });

  res.success({ answer, messageId: assistantMsg.id });
}));

/**
 * GET /api/docvault/:id/chat — Get history
 */
router.get('/:id/chat', validateId, tryCatch(async (req, res) => {
  const history = await db.getDocumentChatHistory(req.params.id);
  res.success(history);
}));

/**
 * DELETE /api/docvault/:id/chat — Clear history
 */
router.delete('/:id/chat', validateId, tryCatch(async (req, res) => {
  await db.clearDocumentChatHistory(req.params.id);
  res.success({ cleared: true });
}));

export default router;
