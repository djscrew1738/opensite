// Settings Operations Module
// Adds settings key-value operations to DatabaseService
import logger from '../logger.js';

/**
 * Settings operations mixin
 * Adds settings-related methods to DatabaseService
 */
export function addSettingsOperations(DatabaseService) {
  /**
   * Initialize settings table
   */
  DatabaseService.prototype.initializeSettingsTable = async function() {
    try {
      await this.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);
    } catch (error) {
      logger.error('Failed to initialize settings table', { error: error.message });
    }
  };

  /**
   * Get a setting value
   * @param {string} key - Setting key
   * @param {*} defaultValue - Value to return if key not found
   * @returns {Promise<string|null>}
   */
  DatabaseService.prototype.getSetting = async function(key, defaultValue = null) {
    try {
      const row = await this.get('SELECT value FROM settings WHERE key = ?', [key]);
      return row ? row.value : defaultValue;
    } catch (error) {
      logger.error(`Error getting setting: ${key}`, { error: error.message });
      return defaultValue;
    }
  };

  /**
   * Get a setting value and parse as JSON
   * @param {string} key - Setting key
   * @param {*} defaultValue - Value to return if key not found or invalid JSON
   */
  DatabaseService.prototype.getSettingJson = async function(key, defaultValue = null) {
    const value = await this.getSetting(key);
    if (value === null) return defaultValue;
    try {
      return JSON.parse(value);
    } catch (e) {
      return value; // Return as string if not valid JSON
    }
  };

  /**
   * Set a setting value
   * @param {string} key - Setting key
   * @param {*} value - Setting value (will be stringified)
   */
  DatabaseService.prototype.setSetting = async function(key, value) {
    const now = new Date().toISOString();
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    try {
      await this.run(`
        INSERT INTO settings (key, value, updatedAt)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updatedAt = excluded.updatedAt
      `, [key, stringValue, now]);
      
      return value;
    } catch (error) {
      logger.error(`Error setting setting: ${key}`, { error: error.message });
      throw error;
    }
  };

  /**
   * Get all settings as an object
   * @returns {Promise<Object>}
   */
  DatabaseService.prototype.getAllSettings = async function() {
    try {
      const rows = await this.all('SELECT key, value FROM settings');
      const settings = {};
      for (const row of rows) {
        // Try to parse as JSON if it looks like it, otherwise keep as string
        const val = row.value;
        if (val === 'true') settings[row.key] = true;
        else if (val === 'false') settings[row.key] = false;
        else if (!isNaN(val) && val.trim() !== '' && !val.includes('-')) {
          // Only parse numbers that don't look like IDs or phone numbers
          const num = Number(val);
          if (val.length < 10) settings[row.key] = num;
          else settings[row.key] = val;
        }
        else if ((val.startsWith('{') && val.endsWith('}')) || (val.startsWith('[') && val.endsWith(']'))) {
          try {
            settings[row.key] = JSON.parse(val);
          } catch (e) {
            settings[row.key] = val;
          }
        } else {
          settings[row.key] = val;
        }
      }
      return settings;
    } catch (error) {
      logger.error('Error getting all settings', { error: error.message });
      return {};
    }
  };

  /**
   * Set multiple settings at once
   * @param {Object} updates - Key-value pairs of settings to update
   */
  DatabaseService.prototype.setSettings = async function(updates) {
    if (!updates || Object.keys(updates).length === 0) return;
    
    const now = new Date().toISOString();
    const entries = Object.entries(updates);
    
    try {
      if (this.db && typeof this.db.transaction === 'function') {
        // SQLite optimized transaction
        const stmt = this.db.prepare(`
          INSERT INTO settings (key, value, updatedAt)
          VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updatedAt = excluded.updatedAt
        `);
        
        const setMany = this.db.transaction((items) => {
          for (const [key, value] of items) {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            stmt.run(key, stringValue, now);
          }
        });
        
        setMany(entries);
      } else {
        // Fallback for PostgreSQL or other implementations
        for (const [key, value] of entries) {
          await this.setSetting(key, value);
        }
      }
    } catch (error) {
      logger.error('Error setting multiple settings', { error: error.message });
      throw error;
    }
  };

  /**
   * Delete a setting
   * @param {string} key - Setting key
   */
  DatabaseService.prototype.deleteSetting = async function(key) {
    try {
      await this.run('DELETE FROM settings WHERE key = ?', [key]);
      return true;
    } catch (error) {
      logger.error(`Error deleting setting: ${key}`, { error: error.message });
      return false;
    }
  };
}

export default addSettingsOperations;
