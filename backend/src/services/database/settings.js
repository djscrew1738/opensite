// Settings Operations Module
// Adds settings key-value operations to DatabaseService

/**
 * Settings operations mixin
 * Adds settings-related methods to DatabaseService
 */
export function addSettingsOperations(DatabaseService) {
  // Initialize settings table
  DatabaseService.prototype.initializeSettingsTable = async function() {
    await this.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);
  };

  // Get a setting value
  DatabaseService.prototype.getSetting = async function(key) {
    const row = await this.get('SELECT value FROM settings WHERE key = ?', [key]);
    return row ? row.value : null;
  };

  // Set a setting value
  DatabaseService.prototype.setSetting = async function(key, value) {
    const now = new Date().toISOString();
    
    // Use proper ON CONFLICT for SQLite, will need adjustment or separate method for Postgres
    // but run() handles ? placeholders.
    await this.run(`
      INSERT INTO settings (key, value, updatedAt)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updatedAt = excluded.updatedAt
    `, [key, String(value), now]);
    
    return value;
  };

  // Get all settings as an object
  DatabaseService.prototype.getAllSettings = async function() {
    const rows = await this.all('SELECT key, value FROM settings');
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  };

  // Set multiple settings at once
  DatabaseService.prototype.setSettings = async function(updates) {
    const now = new Date().toISOString();
    
    if (this.db && this.db.transaction) {
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
    } else {
      // PostgreSQL or other async-native implementation
      for (const [key, value] of Object.entries(updates)) {
        await this.setSetting(key, value);
      }
    }
  };
}

export default addSettingsOperations;
