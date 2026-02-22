// Settings Operations Module
// Adds settings key-value operations to DatabaseService

/**
 * Settings operations mixin
 * Adds settings-related methods to DatabaseService
 */
export function addSettingsOperations(DatabaseService) {
  // Initialize settings table
  DatabaseService.prototype.initializeSettingsTable = function() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);
  };

  // Get a setting value
  DatabaseService.prototype.getSetting = function(key) {
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : null;
  };

  // Set a setting value
  DatabaseService.prototype.setSetting = function(key, value) {
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO settings (key, value, updatedAt)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updatedAt = excluded.updatedAt
    `).run(key, String(value), now);
    
    return value;
  };

  // Get all settings as an object
  DatabaseService.prototype.getAllSettings = function() {
    const rows = this.db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  };

  // Set multiple settings at once
  DatabaseService.prototype.setSettings = function(updates) {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value, updatedAt)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updatedAt = excluded.updatedAt
    `);
    
    const setMany = this.db.transaction((items) => {
      for (const [key, value] of items) {
        stmt.run(key, String(value), now);
      }
    });
    
    setMany(Object.entries(updates));
  };
}

export default addSettingsOperations;
