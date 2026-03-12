// Email Watcher Database Operations
// Adds email watcher, account, and alert rule methods to DatabaseService

import { v4 as uuidv4 } from 'uuid';
import { encrypt, decrypt, isEncrypted } from '../../utils/encryption.js';
import logger from '../logger.js';

// Encrypt an OAuth token before storing in DB
function encryptToken(token) {
  if (!token) return null;
  return isEncrypted(token) ? token : encrypt(token);
}

// Decrypt an OAuth token after reading from DB
function decryptToken(token) {
  if (!token) return null;
  try {
    return decrypt(token) || token;
  } catch {
    return token; // Legacy plaintext — return as-is
  }
}

// Decrypt all token fields on an account row
function decryptAccountTokens(account) {
  if (!account) return account;
  return {
    ...account,
    access_token: decryptToken(account.access_token),
    refresh_token: decryptToken(account.refresh_token),
    isActive: Boolean(account.isActive)
  };
}

/**
 * Email Watcher operations mixin
 */
export function addEmailWatcherOperations(DatabaseService) {
  // ==================== Email Accounts ====================

  /**
   * Get all email watcher accounts
   */
  DatabaseService.prototype.getAllEmailWatcherAccounts = async function() {
    try {
      const rows = await this.all('SELECT * FROM email_accounts ORDER BY createdAt DESC');
      return rows.map(decryptAccountTokens);
    } catch (error) {
      logger.error('Error getting all email watcher accounts', { error: error.message });
      return [];
    }
  };

  /**
   * Get active email watcher accounts
   */
  DatabaseService.prototype.getActiveEmailWatcherAccounts = async function() {
    try {
      const rows = await this.all('SELECT * FROM email_accounts WHERE isActive = 1 ORDER BY createdAt DESC');
      return rows.map(decryptAccountTokens);
    } catch (error) {
      return [];
    }
  };

  /**
   * Get email account by ID
   */
  DatabaseService.prototype.getEmailWatcherAccount = async function(id) {
    try {
      const row = await this.get('SELECT * FROM email_accounts WHERE id = ?', [id]);
      return decryptAccountTokens(row);
    } catch (error) {
      return null;
    }
  };

  /**
   * Create email account
   */
  DatabaseService.prototype.createEmailWatcherAccount = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();

    try {
      await this.run(`
        INSERT INTO email_accounts (
          id, email_address, provider, access_token, refresh_token,
          token_expires_at, isActive, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        data.email_address,
        data.provider,
        encryptToken(data.access_token),
        encryptToken(data.refresh_token),
        data.token_expires_at || null,
        data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
        now,
        now
      ]);

      return await this.getEmailWatcherAccount(id);
    } catch (error) {
      logger.error('Failed to create email watcher account', { error: error.message, email: data.email_address });
      throw error;
    }
  };

  /**
   * Update email account
   */
  DatabaseService.prototype.updateEmailWatcherAccount = async function(id, data) {
    const fields = [];
    const params = [];
    const now = new Date().toISOString();

    const allowed = ['email_address', 'provider', 'access_token', 'refresh_token', 'token_expires_at', 'isActive', 'lastCheckedAt', 'lastError'];
    
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        if (key === 'access_token' || key === 'refresh_token') {
          params.push(encryptToken(data[key]));
        } else if (key === 'isActive') {
          params.push(data[key] ? 1 : 0);
        } else {
          params.push(data[key]);
        }
      }
    }

    if (fields.length === 0) return await this.getEmailWatcherAccount(id);

    fields.push('updatedAt = ?');
    params.push(now);
    params.push(id);

    try {
      const result = await this.run(`UPDATE email_accounts SET ${fields.join(', ')} WHERE id = ?`, params);
      if (result.changes === 0) return null;
      return await this.getEmailWatcherAccount(id);
    } catch (error) {
      logger.error(`Failed to update email account: ${id}`, { error: error.message });
      throw error;
    }
  };

  /**
   * Delete email account
   */
  DatabaseService.prototype.deleteEmailWatcherAccount = async function(id) {
    try {
      const result = await this.run('DELETE FROM email_accounts WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      return false;
    }
  };

  // ==================== Email Alert Rules ====================
  
  /**
   * Get all email alert rules
   */
  DatabaseService.prototype.getAllEmailAlertRules = async function(activeOnly = false) {
    let query = 'SELECT * FROM email_alert_rules';
    if (activeOnly) query += ' WHERE isActive = 1';
    query += ' ORDER BY priority DESC, createdAt DESC';
    
    try {
      const rows = await this.all(query);
      return rows.map(r => ({ ...r, isActive: Boolean(r.isActive) }));
    } catch (error) {
      return [];
    }
  };

  /**
   * Get single rule
   */
  DatabaseService.prototype.getEmailAlertRule = async function(id) {
    try {
      const row = await this.get('SELECT * FROM email_alert_rules WHERE id = ?', [id]);
      if (row) row.isActive = Boolean(row.isActive);
      return row;
    } catch (error) {
      return null;
    }
  };

  /**
   * Create email alert rule
   */
  DatabaseService.prototype.createEmailAlertRule = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
      // Ensure columns match what's in core.js or what the route expects
      // Route sends: name, keyword, secondary_keyword, match_type, priority, alert_channels, active
      // core.js defines: id, name, keywords, channels, priority, isActive, createdAt, updatedAt
      
      await this.run(`
        INSERT INTO email_alert_rules (
          id, name, keywords, channels, priority, isActive, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        data.name,
        data.keyword || data.keywords || '', // Support both formats
        data.alert_channels || data.channels || 'both',
        data.priority || 'medium',
        data.isActive !== undefined ? (data.isActive ? 1 : 0) : (data.active !== undefined ? (data.active ? 1 : 0) : 1),
        now,
        now
      ]);
      
      return await this.getEmailAlertRule(id);
    } catch (error) {
      logger.error('Failed to create alert rule', { error: error.message, name: data.name });
      throw error;
    }
  };

  /**
   * Update email alert rule
   */
  DatabaseService.prototype.updateEmailAlertRule = async function(id, data) {
    const fields = [];
    const params = [];
    const now = new Date().toISOString();

    const fieldMap = {
      name: 'name',
      keyword: 'keywords',
      keywords: 'keywords',
      channels: 'channels',
      alert_channels: 'channels',
      priority: 'priority',
      isActive: 'isActive',
      active: 'isActive'
    };

    for (const [inputKey, dbKey] of Object.entries(fieldMap)) {
      if (data[inputKey] !== undefined) {
        fields.push(`${dbKey} = ?`);
        if (dbKey === 'isActive') {
          params.push(data[inputKey] ? 1 : 0);
        } else {
          params.push(data[inputKey]);
        }
      }
    }

    if (fields.length === 0) return await this.getEmailAlertRule(id);

    fields.push('updatedAt = ?');
    params.push(now);
    params.push(id);

    try {
      await this.run(`UPDATE email_alert_rules SET ${fields.join(', ')} WHERE id = ?`, params);
      return await this.getEmailAlertRule(id);
    } catch (error) {
      logger.error(`Failed to update alert rule: ${id}`, { error: error.message });
      throw error;
    }
  };

  /**
   * Delete rule
   */
  DatabaseService.prototype.deleteEmailAlertRule = async function(id) {
    try {
      const result = await this.run('DELETE FROM email_alert_rules WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      return false;
    }
  };

  // ==================== Alert Logs/Stats ====================

  /**
   * Get alert stats
   */
  DatabaseService.prototype.getAlertStats = async function(days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    try {
      const row = await this.get(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN smsSent = 1 THEN 1 ELSE 0 END) AS sent
        FROM email_alerts
        WHERE receivedAt >= ?
      `, [since]);
      return { total: row?.total || 0, sent: row?.sent || 0, days };
    } catch (error) {
      return { total: 0, sent: 0, days };
    }
  };

  /**
   * Get recent processed emails
   */
  DatabaseService.prototype.getRecentProcessedEmails = async function(limit = 10) {
    try {
      return await this.all(`
        SELECT id, subject, fromAddress AS sender, messageId, smsSent, receivedAt
        FROM email_alerts
        ORDER BY receivedAt DESC
        LIMIT ?
      `, [limit]);
    } catch (error) {
      return [];
    }
  };
}

export default addEmailWatcherOperations;
