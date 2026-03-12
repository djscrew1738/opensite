// DocVault Operations Module
// Adds text document and document chat operations to DatabaseService

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger.js';

/**
 * DocVault operations mixin
 */
export function addDocVaultOperations(DatabaseService) {
  // ==================== Text Document Operations ====================

  /**
   * Create a new text document record
   */
  DatabaseService.prototype.createTextDocument = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
      await this.run(`
        INSERT INTO text_documents (
          id, userId, filename, originalName, mimeType, fileSize, filePath, status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        data.userId,
        data.filename,
        data.originalName,
        data.mimeType,
        data.fileSize,
        data.filePath,
        data.status || 'processing',
        now,
        now
      ]);
      
      return await this.getTextDocument(id);
    } catch (error) {
      logger.error('Failed to create text document', { error: error.message, fileName: data.originalName });
      throw error;
    }
  };

  /**
   * Get single text document
   */
  DatabaseService.prototype.getTextDocument = async function(id) {
    try {
      const doc = await this.get('SELECT * FROM text_documents WHERE id = ?', [id]);
      if (doc && doc.entities) {
        try { doc.entities = JSON.parse(doc.entities); } catch (e) {}
      }
      return doc;
    } catch (error) {
      return null;
    }
  };

  /**
   * Update text document
   */
  DatabaseService.prototype.updateTextDocument = async function(id, data) {
    const fields = [];
    const params = [];
    const now = new Date().toISOString();

    const allowed = ['status', 'extractedText', 'wordCount', 'pageCount', 'summary', 'entities', 'errorMessage'];
    
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        if (key === 'entities' && typeof data[key] === 'object') {
          params.push(JSON.stringify(data[key]));
        } else {
          params.push(data[key]);
        }
      }
    }

    if (fields.length === 0) return await this.getTextDocument(id);

    fields.push('updatedAt = ?');
    params.push(now);
    params.push(id);

    try {
      const result = await this.run(`UPDATE text_documents SET ${fields.join(', ')} WHERE id = ?`, params);
      if (result.changes === 0) return null;
      return await this.getTextDocument(id);
    } catch (error) {
      logger.error(`Failed to update text document: ${id}`, { error: error.message });
      throw error;
    }
  };

  /**
   * List all text documents for a user
   */
  DatabaseService.prototype.getAllTextDocuments = async function(filters = {}) {
    const { userId, limit = 50, offset = 0 } = filters;
    let query = 'SELECT id, originalName, mimeType, fileSize, pageCount, wordCount, status, summary IS NOT NULL as hasSummary, entities IS NOT NULL as hasEntities, createdAt, updatedAt FROM text_documents WHERE 1=1';
    const params = [];

    if (userId) {
      query += ' AND userId = ?';
      params.push(userId);
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    try {
      return await this.all(query, params);
    } catch (error) {
      return [];
    }
  };

  /**
   * Count all text documents for a user
   */
  DatabaseService.prototype.countTextDocuments = async function(userId) {
    try {
      const row = await this.get('SELECT COUNT(*) as total FROM text_documents WHERE userId = ?', [userId]);
      return row?.total || 0;
    } catch (error) {
      return 0;
    }
  };

  /**
   * Delete text document
   */
  DatabaseService.prototype.deleteTextDocument = async function(id) {
    try {
      // Cleanup chat messages first (manual cascading if no DB cascade)
      await this.run('DELETE FROM document_chat_messages WHERE documentId = ?', [id]);
      const result = await this.run('DELETE FROM text_documents WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      return false;
    }
  };

  // ==================== Document Chat Operations ====================

  /**
   * Add a chat message to a document
   */
  DatabaseService.prototype.createDocumentChatMessage = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
      await this.run(`
        INSERT INTO document_chat_messages (id, documentId, role, content, createdAt)
        VALUES (?, ?, ?, ?, ?)
      `, [id, data.documentId, data.role, data.content, now]);
      
      return { id, ...data, createdAt: now };
    } catch (error) {
      logger.error('Failed to create document chat message', { error: error.message });
      throw error;
    }
  };

  /**
   * Get chat history for a document
   */
  DatabaseService.prototype.getDocumentChatHistory = async function(documentId) {
    try {
      return await this.all(`
        SELECT id, documentId, role, content, createdAt 
        FROM document_chat_messages 
        WHERE documentId = ? 
        ORDER BY createdAt ASC
      `, [documentId]);
    } catch (error) {
      return [];
    }
  };

  /**
   * Clear chat history for a document
   */
  DatabaseService.prototype.clearDocumentChatHistory = async function(documentId) {
    try {
      const result = await this.run('DELETE FROM document_chat_messages WHERE documentId = ?', [documentId]);
      return result.changes;
    } catch (error) {
      return 0;
    }
  };
}

export default addDocVaultOperations;
