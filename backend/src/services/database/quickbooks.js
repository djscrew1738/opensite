// QuickBooks Operations Module
// Adds quickbooks account and mapping operations to DatabaseService

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
    accessToken: decryptToken(account.accessToken),
    refreshToken: decryptToken(account.refreshToken),
    isActive: Boolean(account.isActive)
  };
}

/**
 * QuickBooks operations mixin
 */
export function addQuickBooksOperations(DatabaseService) {
  /**
   * Create or update QuickBooks account
   */
  DatabaseService.prototype.upsertQuickBooksAccount = async function(data) {
    const now = new Date().toISOString();
    
    try {
      const existing = await this.get('SELECT id, companyName FROM quickbooks_accounts WHERE realmId = ?', [data.realmId]);
      
      const accessToken = encryptToken(data.accessToken);
      const refreshToken = encryptToken(data.refreshToken);

      if (existing) {
        await this.run(`
          UPDATE quickbooks_accounts SET
            accessToken = ?,
            refreshToken = ?,
            tokenExpiresAt = ?,
            refreshExpiresAt = ?,
            companyName = ?,
            isActive = 1,
            updatedAt = ?
          WHERE realmId = ?
        `, [
          accessToken,
          refreshToken,
          data.tokenExpiresAt,
          data.refreshExpiresAt,
          data.companyName || existing.companyName,
          now,
          data.realmId
        ]);
        return await this.getQuickBooksAccount(existing.id);
      } else {
        const id = uuidv4();
        // Deactivate other accounts to ensure only one active
        await this.run('UPDATE quickbooks_accounts SET isActive = 0');
        
        await this.run(`
          INSERT INTO quickbooks_accounts (
            id, realmId, accessToken, refreshToken, tokenExpiresAt, refreshExpiresAt, companyName, isActive, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `, [
          id,
          data.realmId,
          accessToken,
          refreshToken,
          data.tokenExpiresAt,
          data.refreshExpiresAt,
          data.companyName || 'QuickBooks Account',
          now,
          now
        ]);
        return await this.getQuickBooksAccount(id);
      }
    } catch (error) {
      logger.error('QuickBooks account upsert failed', { error: error.message, realmId: data.realmId });
      throw error;
    }
  };

  /**
   * Get active account or specific account by ID
   */
  DatabaseService.prototype.getQuickBooksAccount = async function(id = null) {
    try {
      let row;
      if (id) {
        row = await this.get('SELECT * FROM quickbooks_accounts WHERE id = ?', [id]);
      } else {
        row = await this.get('SELECT * FROM quickbooks_accounts WHERE isActive = 1 LIMIT 1');
      }
      return decryptAccountTokens(row);
    } catch (error) {
      logger.error('Error getting QuickBooks account', { error: error.message });
      return null;
    }
  };

  /**
   * Deactivate all QuickBooks accounts
   */
  DatabaseService.prototype.deactivateQuickBooksAccounts = async function() {
    try {
      await this.run('UPDATE quickbooks_accounts SET isActive = 0');
      return true;
    } catch (error) {
      return false;
    }
  };

  /**
   * Delete account
   */
  DatabaseService.prototype.deleteQuickBooksAccount = async function(id) {
    try {
      const result = await this.run('DELETE FROM quickbooks_accounts WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      return false;
    }
  };

  /**
   * Store a mapping between local entity and QuickBooks entity
   */
  DatabaseService.prototype.setQuickBooksMapping = async function(localId, qboId, type) {
    const now = new Date().toISOString();
    try {
      await this.run(`
        INSERT INTO quickbooks_mappings (localId, qboId, type, mappedAt)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(localId, type) DO UPDATE SET
          qboId = excluded.qboId,
          mappedAt = excluded.mappedAt
      `, [localId, qboId, type, now]);
    } catch (error) {
      logger.error('Failed to set QuickBooks mapping', { error: error.message, localId, type });
    }
  };

  /**
   * Get a mapping
   */
  DatabaseService.prototype.getQuickBooksMapping = async function(localId, type) {
    try {
      const row = await this.get('SELECT qboId FROM quickbooks_mappings WHERE localId = ? AND type = ?', [localId, type]);
      return row ? row.qboId : null;
    } catch (e) {
      return null;
    }
  };
}

export default addQuickBooksOperations;
