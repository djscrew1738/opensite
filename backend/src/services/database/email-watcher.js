// Email Watcher Database Operations
// Adds email watcher related methods to DatabaseService

/**
 * Email Watcher operations mixin
 * Adds email watcher related methods to DatabaseService
 */
export function addEmailWatcherOperations(DatabaseService) {
  // ==================== Email Accounts ====================
  
  // Get all email watcher accounts
  DatabaseService.prototype.getAllEmailWatcherAccounts = async function() {
    return await this.all(`
      SELECT * FROM email_accounts ORDER BY createdAt DESC
    `);
  };

  // Get active email watcher accounts
  DatabaseService.prototype.getActiveEmailWatcherAccounts = async function() {
    return await this.all(`
      SELECT * FROM email_accounts WHERE isActive = 1 ORDER BY createdAt DESC
    `);
  };

  // Get email account by ID
  DatabaseService.prototype.getEmailWatcherAccount = async function(id) {
    return await this.get('SELECT * FROM email_accounts WHERE id = ?', [id]);
  };

  // Create email account
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
      data.access_token || null,
      data.refresh_token || null,
      data.token_expires_at || null,
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
      now,
      now
    ]);
    
    return await this.getEmailWatcherAccount(id);
  };

  // Update email account
  DatabaseService.prototype.updateEmailWatcherAccount = async function(id, data) {
    const now = new Date().toISOString();
    const sets = [];
    const values = [];

    if (data.email_address !== undefined) { sets.push('email_address = ?'); values.push(data.email_address); }
    if (data.provider !== undefined) { sets.push('provider = ?'); values.push(data.provider); }
    if (data.access_token !== undefined) { sets.push('access_token = ?'); values.push(data.access_token); }
    if (data.refresh_token !== undefined) { sets.push('refresh_token = ?'); values.push(data.refresh_token); }
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
}

export default addEmailWatcherOperations;
