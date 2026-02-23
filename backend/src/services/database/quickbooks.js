// QuickBooks Operations Module
// Adds quickbooks account and mapping operations to DatabaseService

import { v4 as uuidv4 } from 'uuid';

/**
 * QuickBooks operations mixin
 */
export function addQuickBooksOperations(DatabaseService) {
  // Create or update account
  DatabaseService.prototype.upsertQuickBooksAccount = async function(data) {
    const now = new Date().toISOString();
    const existing = await this.get('SELECT id FROM quickbooks_accounts WHERE realmId = ?', [data.realmId]);
    
    if (existing) {
      await this.run(`
        UPDATE quickbooks_accounts SET
          accessToken = ?,
          refreshToken = ?,
          tokenExpiresAt = ?,
          refreshExpiresAt = ?,
          companyName = ?,
          updatedAt = ?
        WHERE realmId = ?
      `, [
        data.accessToken,
        data.refreshToken,
        data.tokenExpiresAt,
        data.refreshExpiresAt,
        data.companyName || existing.companyName,
        now,
        data.realmId
      ]);
      return await this.getQuickBooksAccount(existing.id);
    } else {
      const id = uuidv4();
      await this.run(`
        INSERT INTO quickbooks_accounts (
          id, realmId, accessToken, refreshToken, tokenExpiresAt, refreshExpiresAt, companyName, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        data.realmId,
        data.accessToken,
        data.refreshToken,
        data.tokenExpiresAt,
        data.refreshExpiresAt,
        data.companyName || 'QuickBooks Account',
        now,
        now
      ]);
      return await this.getQuickBooksAccount(id);
    }
  };

  // Get active account
  DatabaseService.prototype.getQuickBooksAccount = async function(id = null) {
    if (id) {
      return await this.get('SELECT * FROM quickbooks_accounts WHERE id = ?', [id]);
    }
    return await this.get('SELECT * FROM quickbooks_accounts WHERE isActive = 1 LIMIT 1');
  };

  // Delete account
  DatabaseService.prototype.deleteQuickBooksAccount = async function(id) {
    const result = await this.run('DELETE FROM quickbooks_accounts WHERE id = ?', [id]);
    return result.changes > 0;
  };

  // Mapping functions
  DatabaseService.prototype.setQuickBooksMapping = async function(localId, qboId, type) {
    // Check if table exists, if not create it (safeAddColumn style or separate init)
    await this.exec(`
      CREATE TABLE IF NOT EXISTS quickbooks_mappings (
        localId TEXT NOT NULL,
        qboId TEXT NOT NULL,
        type TEXT NOT NULL, -- 'customer', 'item', 'invoice', 'estimate'
        mappedAt TEXT NOT NULL,
        PRIMARY KEY (localId, type)
      )
    `);

    const now = new Date().toISOString();
    await this.run(`
      INSERT INTO quickbooks_mappings (localId, qboId, type, mappedAt)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(localId, type) DO UPDATE SET
        qboId = excluded.qboId,
        mappedAt = excluded.mappedAt
    `, [localId, qboId, type, now]);
  };

  DatabaseService.prototype.getQuickBooksMapping = async function(localId, type) {
    try {
      return await this.get('SELECT qboId FROM quickbooks_mappings WHERE localId = ? AND type = ?', [localId, type]);
    } catch (e) {
      return null;
    }
  };
}

export default addQuickBooksOperations;
