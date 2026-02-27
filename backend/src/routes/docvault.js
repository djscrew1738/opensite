// DocVault API routes — Document upload, text extraction, AI analysis, and chat

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { randomUUID } from 'crypto';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { aiChatLimiter } from '../middleware/security.js';
import { db } from '../services/database.js';
import { docUpload, UPLOAD_DIR } from '../middleware/docUpload.js';
import { extractText } from '../services/text-extractor.js';
import { summarize, extractEntities, chat } from '../services/docvault-ai.js';
import logger from '../services/logger.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /upload — Upload a document and kick off text extraction
 */
router.post('/upload', docUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const { filename, originalname, mimetype, size, path: filePath } = req.file;

    db.prepare(`
      INSERT INTO text_documents (id, userId, filename, originalName, mimeType, fileSize, filePath, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'processing', ?, ?)
    `).run(id, req.user.id, filename, originalname, mimetype, size, filePath, now, now);

    // Fire-and-forget async text extraction with timeout handling
    (async () => {
      try {
        const result = await extractText(filePath, mimetype, id);
        const text = result.text || '';
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const pageCount = result.pageCount || null;

        db.prepare(`
          UPDATE text_documents
          SET extractedText = ?, wordCount = ?, pageCount = ?, status = 'ready', updatedAt = ?
          WHERE id = ?
        `).run(text, wordCount, pageCount, new Date().toISOString(), id);

        logger.info(`DocVault: Text extracted for document ${id}`, { wordCount, pageCount });
      } catch (err) {
        logger.error(`DocVault: Text extraction failed for document ${id}`, { error: err.message });
        db.prepare(`
          UPDATE text_documents
          SET status = 'error', errorMessage = ?, updatedAt = ?
          WHERE id = ?
        `).run(err.message, new Date().toISOString(), id);
      }
    })();

    return res.json({
      success: true,
      data: {
        id,
        filename,
        originalName: originalname,
        fileSize: size,
        status: 'processing',
        message: 'Document uploaded. Text extraction in progress.',
      },
    });
  } catch (err) {
    logger.error('DocVault: Upload failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

/**
 * GET / — List all documents for the authenticated user with pagination
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100
    const offset = parseInt(req.query.offset) || 0;
    const cursor = req.query.cursor; // For cursor-based pagination

    let rows;
    let nextCursor = null;

    if (cursor) {
      // Cursor-based pagination for better performance with large datasets
      const decodedCursor = Buffer.from(cursor, 'base64').toString('utf8');
      const [cursorDate, cursorId] = decodedCursor.split('|');
      
      rows = db.prepare(`
        SELECT id, originalName, mimeType, fileSize, pageCount, wordCount, status,
               summary IS NOT NULL as hasSummary,
               entities IS NOT NULL as hasEntities,
               createdAt, updatedAt
        FROM text_documents
        WHERE userId = ? AND (createdAt < ? OR (createdAt = ? AND id < ?))
        ORDER BY createdAt DESC, id DESC
        LIMIT ?
      `).all(req.user.id, cursorDate, cursorDate, cursorId, limit + 1);

      // Check if there are more results
      if (rows.length > limit) {
        const lastRow = rows[limit - 1];
        nextCursor = Buffer.from(`${lastRow.createdAt}|${lastRow.id}`).toString('base64');
        rows = rows.slice(0, limit);
      }
    } else {
      // Offset-based pagination (default)
      rows = db.prepare(`
        SELECT id, originalName, mimeType, fileSize, pageCount, wordCount, status,
               summary IS NOT NULL as hasSummary,
               entities IS NOT NULL as hasEntities,
               createdAt, updatedAt
        FROM text_documents
        WHERE userId = ?
        ORDER BY createdAt DESC
        LIMIT ? OFFSET ?
      `).all(req.user.id, limit, offset);

      // Check if there are more results
      const countResult = db.prepare(`
        SELECT COUNT(*) as total FROM text_documents WHERE userId = ?
      `).get(req.user.id);
      
      if (offset + rows.length < countResult.total) {
        nextCursor = Buffer.from(`${rows[rows.length - 1]?.createdAt || ''}|${rows[rows.length - 1]?.id || ''}`).toString('base64');
      }
    }

    return res.json({ 
      success: true, 
      data: rows,
      pagination: {
        limit,
        offset,
        hasMore: !!nextCursor,
        nextCursor,
        total: db.prepare('SELECT COUNT(*) as total FROM text_documents WHERE userId = ?').get(req.user.id)?.total || 0
      }
    });
  } catch (err) {
    logger.error('DocVault: List failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Failed to list documents' });
  }
});

/**
 * GET /:id — Get a single document with full content
 */
router.get('/:id', async (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM text_documents WHERE id = ?').get(req.params.id);

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    if (doc.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Parse entities from JSON string if present
    const data = { ...doc };
    if (data.entities) {
      try {
        data.entities = JSON.parse(data.entities);
      } catch {
        // Leave as string if parsing fails
      }
    }

    return res.json({ success: true, data });
  } catch (err) {
    logger.error('DocVault: Get document failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Failed to get document' });
  }
});

/**
 * DELETE /:id — Delete a document and its file from disk
 */
router.delete('/:id', async (req, res) => {
  try {
    const doc = db.prepare('SELECT id, userId, filePath FROM text_documents WHERE id = ?').get(req.params.id);

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    if (doc.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Delete from database
    db.prepare('DELETE FROM document_chat_messages WHERE documentId = ?').run(req.params.id);
    db.prepare('DELETE FROM text_documents WHERE id = ?').run(req.params.id);

    // Delete file from disk with proper error handling
    if (doc.filePath) {
      try {
        await fs.unlink(doc.filePath);
        logger.info(`Deleted physical file: ${doc.filePath}`);
      } catch (err) {
        // Log detailed error
        logger.error('File deletion failed', {
          fileId: doc.id,
          path: doc.filePath,
          error: err.message,
          code: err.code
        });
        
        // Mark as orphaned for cleanup job
        try {
          db.prepare(`
            INSERT INTO orphaned_files (id, original_path, file_id, reason, created_at)
            VALUES (?, ?, ?, ?, ?)
          `).run(randomUUID(), doc.filePath, doc.id, err.message, new Date().toISOString());
        } catch (dbErr) {
          // Table might not exist, just log
          logger.warn('Could not mark file as orphaned:', dbErr.message);
        }
      }
    }

    return res.json({ success: true, data: { message: 'Document deleted' } });
  } catch (err) {
    logger.error('DocVault: Delete failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Failed to delete document' });
  }
});

/**
 * POST /:id/summarize — Generate an AI summary of the document
 * Rate limited: 10 requests per minute
 */
router.post('/:id/summarize', aiChatLimiter, async (req, res) => {
  try {
    const doc = db.prepare('SELECT id, userId, status, extractedText FROM text_documents WHERE id = ?').get(req.params.id);

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    if (doc.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (doc.status !== 'ready') {
      return res.status(400).json({ success: false, error: 'Document is not ready for analysis' });
    }

    if (!doc.extractedText) {
      return res.status(400).json({ success: false, error: 'No extracted text available' });
    }

    const summary = await summarize(doc.extractedText);
    const now = new Date().toISOString();

    db.prepare('UPDATE text_documents SET summary = ?, updatedAt = ? WHERE id = ?').run(summary, now, doc.id);

    return res.json({ success: true, data: { summary } });
  } catch (err) {
    logger.error('DocVault: Summarize failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Failed to generate summary' });
  }
});

/**
 * POST /:id/extract — Extract named entities from the document
 * Rate limited: 10 requests per minute
 */
router.post('/:id/extract', aiChatLimiter, async (req, res) => {
  try {
    const doc = db.prepare('SELECT id, userId, status, extractedText FROM text_documents WHERE id = ?').get(req.params.id);

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    if (doc.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (doc.status !== 'ready') {
      return res.status(400).json({ success: false, error: 'Document is not ready for analysis' });
    }

    if (!doc.extractedText) {
      return res.status(400).json({ success: false, error: 'No extracted text available' });
    }

    const entities = await extractEntities(doc.extractedText);
    const entitiesJson = JSON.stringify(entities);
    const now = new Date().toISOString();

    db.prepare('UPDATE text_documents SET entities = ?, updatedAt = ? WHERE id = ?').run(entitiesJson, now, doc.id);

    return res.json({ success: true, data: { entities } });
  } catch (err) {
    logger.error('DocVault: Entity extraction failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Failed to extract entities' });
  }
});

/**
 * POST /:id/chat — Send a Q&A message about the document
 * Rate limited: 10 requests per minute
 */
router.post('/:id/chat', aiChatLimiter, async (req, res) => {
  try {
    const doc = db.prepare('SELECT id, userId, status, extractedText FROM text_documents WHERE id = ?').get(req.params.id);

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    if (doc.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (doc.status !== 'ready') {
      return res.status(400).json({ success: false, error: 'Document is not ready for chat' });
    }

    if (!doc.extractedText) {
      return res.status(400).json({ success: false, error: 'No extracted text available' });
    }

    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }

    // Get existing chat history
    const history = db.prepare(
      'SELECT role, content FROM document_chat_messages WHERE documentId = ? ORDER BY createdAt ASC'
    ).all(req.params.id);

    const now = new Date().toISOString();
    const userMsgId = uuidv4();

    // Insert user message
    db.prepare(
      'INSERT INTO document_chat_messages (id, documentId, role, content, createdAt) VALUES (?, ?, ?, ?, ?)'
    ).run(userMsgId, req.params.id, 'user', question, now);

    // Get AI response with contextually relevant passages
    const answer = await chat(doc.extractedText, question, history);

    const assistantMsgId = uuidv4();
    const assistantNow = new Date().toISOString();

    // Insert assistant message
    db.prepare(
      'INSERT INTO document_chat_messages (id, documentId, role, content, createdAt) VALUES (?, ?, ?, ?, ?)'
    ).run(assistantMsgId, req.params.id, 'assistant', answer, assistantNow);

    return res.json({ success: true, data: { answer, messageId: assistantMsgId } });
  } catch (err) {
    logger.error('DocVault: Chat failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Failed to process chat message' });
  }
});

/**
 * GET /:id/chat — Get chat history for a document
 */
router.get('/:id/chat', async (req, res) => {
  try {
    const doc = db.prepare('SELECT id, userId FROM text_documents WHERE id = ?').get(req.params.id);

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    if (doc.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const messages = db.prepare(
      'SELECT id, documentId, role, content, createdAt FROM document_chat_messages WHERE documentId = ? ORDER BY createdAt ASC'
    ).all(req.params.id);

    return res.json({ success: true, data: messages });
  } catch (err) {
    logger.error('DocVault: Get chat history failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Failed to get chat history' });
  }
});

/**
 * DELETE /:id/chat — Clear chat history for a document
 */
router.delete('/:id/chat', async (req, res) => {
  try {
    const doc = db.prepare('SELECT id, userId FROM text_documents WHERE id = ?').get(req.params.id);

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    if (doc.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    db.prepare('DELETE FROM document_chat_messages WHERE documentId = ?').run(req.params.id);

    return res.json({ success: true, data: { message: 'Chat history cleared' } });
  } catch (err) {
    logger.error('DocVault: Clear chat history failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Failed to clear chat history' });
  }
});

export default router;
