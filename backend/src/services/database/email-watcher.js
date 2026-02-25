// Email Watcher Database Operations
// Adds email watcher related methods to DatabaseService

import { encrypt, decrypt, isEncrypted } from '../../utils/encryption.js';

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
  };
}

/**
 * Email Watcher operations mixin
 * Adds email watcher related methods to DatabaseService
 */
export function addEmailWatcherOperations(DatabaseService) {
  // ==================== Email Accounts ====================

  // Get all email watcher accounts (tokens decrypted)
  DatabaseService.prototype.getAllEmailWatcherAccounts = async function() {
    const rows = await this.all(`
      SELECT * FROM email_accounts ORDER BY createdAt DESC
    `);
    return rows.map(decryptAccountTokens);
  };

  // Get active email watcher accounts (tokens decrypted)
  DatabaseService.prototype.getActiveEmailWatcherAccounts = async function() {
    const rows = await this.all(`
      SELECT * FROM email_accounts WHERE isActive = 1 ORDER BY createdAt DESC
    `);
    return rows.map(decryptAccountTokens);
  };

  // Get email account by ID (tokens decrypted)
  DatabaseService.prototype.getEmailWatcherAccount = async function(id) {
    const row = await this.get('SELECT * FROM email_accounts WHERE id = ?', [id]);
    return decryptAccountTokens(row);
  };

  // Create email account (tokens encrypted before storage)
  DatabaseService.prototype.createEmailWatcherAccount = async function(data) {
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.run(`
      INSERT INTO email_accounts (
        id, email_address, provider, access_token, refresh_token,
        token_expires_at, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.email_address,
      data.provider,
      encryptToken(data.access_token) || null,
      encryptToken(data.refresh_token) || null,
      data.token_expires_at || null,
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
      now,
      now
    ]);

    return await this.getEmailWatcherAccount(id);
  };

  // Update email account (tokens encrypted if provided)
  DatabaseService.prototype.updateEmailWatcherAccount = async function(id, data) {
    const now = new Date().toISOString();
    const sets = [];
    const values = [];

    if (data.email_address !== undefined) { sets.push('email_address = ?'); values.push(data.email_address); }
    if (data.provider !== undefined) { sets.push('provider = ?'); values.push(data.provider); }
    if (data.access_token !== undefined) { sets.push('access_token = ?'); values.push(encryptToken(data.access_token)); }
    if (data.refresh_token !== undefined) { sets.push('refresh_token = ?'); values.push(encryptToken(data.refresh_token)); }
    if (data.token_expires_at !== undefined) { sets.push('token_expires_at = ?'); values.push(data.token_expires_at); }
    if (data.isActive !== undefined) { sets.push('isActive = ?'); values.push(data.isActive ? 1 : 0); }
    if (data.lastCheckedAt !== undefined) { sets.push('lastCheckedAt = ?'); values.push(data.lastCheckedAt); }
    if (data.lastError !== undefined) { sets.push('lastError = ?'); values.push(data.lastError); }

    if (sets.length === 0) return await this.getEmailWatcherAccount(id);

    sets.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await this.run(`UPDATE email_accounts SET ${sets.join(', ')} WHERE id = ?`, values);
    return await this.getEmailWatcherAccount(id);
  };

  // Update tokens specifically (called by outlookClient/gmailClient on refresh)
  DatabaseService.prototype.updateEmailWatcherAccountTokens = async function(id, data) {
    const now = new Date().toISOString();
    await this.run(`
      UPDATE email_accounts
      SET access_token = ?, refresh_token = ?, token_expires_at = ?, updatedAt = ?
      WHERE id = ?
    `, [
      encryptToken(data.access_token),
      encryptToken(data.refresh_token),
      data.expires_at || null,
      now,
      id,
    ]);
  };

  // Delete email account
  DatabaseService.prototype.deleteEmailWatcherAccount = async function(id) {
    const result = await this.run('DELETE FROM email_accounts WHERE id = ?', [id]);
    return result.changes > 0;
  };

  // ==================== Email Alert Rules ====================
  
  // Get all email alert rules
  DatabaseService.prototype.getAllEmailAlertRules = async function(activeOnly = false) {
    let query = 'SELECT * FROM email_alert_rules';
    if (activeOnly) {
      query += ' WHERE isActive = 1';
    }
    query += ' ORDER BY priority DESC, createdAt DESC';
    return await this.all(query);
  };

  // Get email alert rule by ID
  DatabaseService.prototype.getEmailAlertRule = async function(id) {
    return await this.get('SELECT * FROM email_alert_rules WHERE id = ?', [id]);
  };

  // Create email alert rule
  DatabaseService.prototype.createEmailAlertRule = async function(data) {
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await this.run(`
      INSERT INTO email_alert_rules (
        id, name, keywords, channels, priority, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.name,
      JSON.stringify(data.keywords || []),
      JSON.stringify(data.channels || ['email']),
      data.priority || 0,
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
      now,
      now
    ]);
    
    return await this.getEmailAlertRule(id);
  };

  // Update email alert rule
  DatabaseService.prototype.updateEmailAlertRule = async function(id, data) {
    const now = new Date().toISOString();
    const sets = [];
    const values = [];

    if (data.name !== undefined) { sets.push('name = ?'); values.push(data.name); }
    if (data.keywords !== undefined) { sets.push('keywords = ?'); values.push(JSON.stringify(data.keywords)); }
    if (data.channels !== undefined) { sets.push('channels = ?'); values.push(JSON.stringify(data.channels)); }
    if (data.priority !== undefined) { sets.push('priority = ?'); values.push(data.priority); }
    if (data.isActive !== undefined) { sets.push('isActive = ?'); values.push(data.isActive ? 1 : 0); }

    if (sets.length === 0) return await this.getEmailAlertRule(id);

    sets.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await this.run(`UPDATE email_alert_rules SET ${sets.join(', ')} WHERE id = ?`, values);
    return await this.getEmailAlertRule(id);
  };

  // Delete email alert rule
  DatabaseService.prototype.deleteEmailAlertRule = async function(id) {
    const result = await this.run('DELETE FROM email_alert_rules WHERE id = ?', [id]);
    return result.changes > 0;
  };

  // Toggle email alert rule
  DatabaseService.prototype.toggleEmailAlertRule = async function(id) {
    const rule = await this.getEmailAlertRule(id);
    if (!rule) return null;

    return await this.updateEmailAlertRule(id, { isActive: !rule.isActive });
  };

  // ==================== Alert Stats ====================

  // Get alert statistics for the past N days
  DatabaseService.prototype.getAlertStats = async function(days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const row = await this.get(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN smsSent = 1 THEN 1 ELSE 0 END) AS sent,
        0 AS failed
      FROM email_alerts
      WHERE receivedAt >= ?
    `, [since]);
    return { total: row?.total || 0, sent: row?.sent || 0, failed: row?.failed || 0, days };
  };

  // Get N most recently processed emails
  DatabaseService.prototype.getRecentProcessedEmails = async function(limit = 10) {
    return await this.all(`
      SELECT id, subject, fromAddress AS sender, messageId, smsSent, receivedAt
      FROM email_alerts
      ORDER BY receivedAt DESC
      LIMIT ?
    `, [limit]);
  };
}

export default addEmailWatcherOperations;
