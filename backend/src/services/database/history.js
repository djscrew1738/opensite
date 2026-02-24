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
  DatabaseService.prototype.getAllConversations = async function(filters = {}) {
    const { search, userId } = filters;
    let query = 'SELECT * FROM conversations WHERE 1=1';
    const params = [];
    
    if (userId) {
      query += ' AND userId = ?';
      params.push(userId);
    }

    if (search) {
      query += ' AND messages LIKE ?';
      params.push(`%${search}%`);
    }
    
    query += ' ORDER BY updatedAt DESC';
    
    return await this.all(query, params);
  };

  // Get single conversation
  DatabaseService.prototype.getConversation = async function(id) {
    const conv = await this.get('SELECT * FROM conversations WHERE id = ?', [id]);
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
  DatabaseService.prototype.createConversation = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await this.run(`
      INSERT INTO conversations (id, userId, messages, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `, [
      id,
      data.userId || null,
      JSON.stringify(data.messages || []),
      now,
      now
    ]);
    
    return await this.getConversation(id);
  };

  // Update conversation
  DatabaseService.prototype.updateConversation = async function(id, data) {
    const now = new Date().toISOString();
    const sets = [];
    const values = [];
    
    if (data.messages) {
      sets.push('messages = ?');
      values.push(JSON.stringify(data.messages));
    }
    
    if (data.title) {
      sets.push('title = ?');
      values.push(data.title);
    }
    
    if (sets.length === 0) return await this.getConversation(id);
    
    sets.push('updatedAt = ?');
    values.push(now);
    values.push(id);
    
    await this.run(`
      UPDATE conversations SET
        ${sets.join(', ')}
      WHERE id = ?
    `, values);
    
    return await this.getConversation(id);
  };

  // Save a single message to a conversation (creates if doesn't exist)
  DatabaseService.prototype.saveMessage = async function(data) {
    const { conversationId, userId, role, content, title } = data;
    const now = new Date().toISOString();
    
    // Check if conversation exists
    const existing = await this.getConversation(conversationId);
    
    if (existing) {
      // Append to existing
      const messages = existing.messages || [];
      messages.push({ role, content, timestamp: now });
      
      const sets = ['messages = ?', 'updatedAt = ?'];
      const values = [JSON.stringify(messages), now];
      
      if (title) {
        sets.push('title = ?');
        values.push(title);
      }
      
      values.push(conversationId);
      
      await this.run(`
        UPDATE conversations SET
          ${sets.join(', ')}
        WHERE id = ?
      `, values);
    } else {
      // Create new with first message
      const messages = [{ role, content, timestamp: now }];
      
      await this.run(`
        INSERT INTO conversations (id, userId, messages, title, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [conversationId, userId || null, JSON.stringify(messages), title || null, now, now]);
    }
    
    return await this.getConversation(conversationId);
  };

  // Delete conversation
  DatabaseService.prototype.deleteConversation = async function(id) {
    const result = await this.run('DELETE FROM conversations WHERE id = ?', [id]);
    return result.changes > 0;
  };

  // ==================== Email Alert Operations ====================
  
  // Get all email alerts
  DatabaseService.prototype.getAllEmailAlerts = async function(limit = 100) {
    return await this.all('SELECT * FROM email_alerts ORDER BY receivedAt DESC LIMIT ?', [limit]);
  };

  // Get email alert by ID
  DatabaseService.prototype.getEmailAlert = async function(id) {
    return await this.get('SELECT * FROM email_alerts WHERE id = ?', [id]);
  };

  // Create email alert
  DatabaseService.prototype.createEmailAlert = async function(data) {
    const id = uuidv4();
    
    await this.run(`
      INSERT INTO email_alerts (
        id, messageId, fromAddress, fromName, subject,
        matchedKeywords, snippet, smsSent, smsExternalId, receivedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
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
    ]);
    
    return await this.getEmailAlert(id);
  };

  // Check if email alert exists by message ID
  DatabaseService.prototype.emailAlertExists = async function(messageId) {
    const result = await this.get('SELECT 1 as exists_flag FROM email_alerts WHERE messageId = ?', [messageId]);
    return !!result;
  };

  // Get email alert stats
  DatabaseService.prototype.getEmailAlertStats = async function() {
    return await this.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN smsSent = 1 THEN 1 ELSE 0 END) as smsSentCount,
        MAX(receivedAt) as lastCheck
      FROM email_alerts
    `);
  };

  // Get recent email alerts
  DatabaseService.prototype.getRecentEmailAlerts = async function(limit = 20, offset = 0) {
    return await this.all(`
      SELECT * FROM email_alerts 
      ORDER BY receivedAt DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);
  };
}

export default addHistoryOperations;
