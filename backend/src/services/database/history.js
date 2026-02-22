// History/Conversation Operations Module
// Adds conversation and history operations to DatabaseService

import { v4 as uuidv4 } from 'uuid';

/**
 * History operations mixin
 * Adds conversation and history-related methods to DatabaseService
 */
export function addHistoryOperations(DatabaseService) {
  // ==================== Conversation Operations ====================
  
  // Get all conversations with optional search
  DatabaseService.prototype.getAllConversations = function(search) {
    let query = 'SELECT * FROM conversations WHERE 1=1';
    const params = [];
    
    if (search) {
      query += ' AND messages LIKE ?';
      params.push(`%${search}%`);
    }
    
    query += ' ORDER BY updatedAt DESC';
    
    return this.db.prepare(query).all(...params);
  };

  // Get single conversation
  DatabaseService.prototype.getConversation = function(id) {
    const conv = this.db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
    if (conv && conv.messages) {
      try {
        conv.messages = JSON.parse(conv.messages);
      } catch (e) {
        conv.messages = [];
      }
    }
    return conv;
  };

  // Create conversation
  DatabaseService.prototype.createConversation = function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO conversations (id, messages, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
    `).run(
      id,
      JSON.stringify(data.messages || []),
      now,
      now
    );
    
    return this.getConversation(id);
  };

  // Update conversation
  DatabaseService.prototype.updateConversation = function(id, data) {
    const now = new Date().toISOString();
    
    this.db.prepare(`
      UPDATE conversations SET
        messages = COALESCE(?, messages),
        updatedAt = ?
      WHERE id = ?
    `).run(
      data.messages ? JSON.stringify(data.messages) : null,
      now,
      id
    );
    
    return this.getConversation(id);
  };

  // Delete conversation
  DatabaseService.prototype.deleteConversation = function(id) {
    const result = this.db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
    return result.changes > 0;
  };

  // ==================== Email Alert Operations ====================
  
  // Get all email alerts
  DatabaseService.prototype.getAllEmailAlerts = function(limit = 100) {
    return this.db.prepare('SELECT * FROM email_alerts ORDER BY receivedAt DESC LIMIT ?').all(limit);
  };

  // Get email alert by ID
  DatabaseService.prototype.getEmailAlert = function(id) {
    return this.db.prepare('SELECT * FROM email_alerts WHERE id = ?').get(id);
  };

  // Create email alert
  DatabaseService.prototype.createEmailAlert = function(data) {
    const id = uuidv4();
    
    this.db.prepare(`
      INSERT INTO email_alerts (
        id, messageId, fromAddress, fromName, subject,
        matchedKeywords, snippet, smsSent, smsExternalId, receivedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.messageId || null,
      data.fromAddress || null,
      data.fromName || null,
      data.subject || null,
      data.matchedKeywords || null,
      data.snippet || null,
      data.smsSent ? 1 : 0,
      data.smsExternalId || null,
      data.receivedAt || new Date().toISOString()
    );
    
    return this.getEmailAlert(id);
  };

  // Check if email alert exists by message ID
  DatabaseService.prototype.emailAlertExists = function(messageId) {
    const result = this.db.prepare('SELECT 1 as exists_flag FROM email_alerts WHERE messageId = ?').get(messageId);
    return !!result;
  };

  // Get email alert stats
  DatabaseService.prototype.getEmailAlertStats = function() {
    return this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN smsSent = 1 THEN 1 ELSE 0 END) as smsSentCount,
        MAX(receivedAt) as lastCheck
      FROM email_alerts
    `).get();
  };

  // Get recent email alerts
  DatabaseService.prototype.getRecentEmailAlerts = function(limit = 20, offset = 0) {
    return this.db.prepare(`
      SELECT * FROM email_alerts 
      ORDER BY receivedAt DESC 
      LIMIT ? OFFSET ?
    `).all(limit, offset);
  };
}

export default addHistoryOperations;
