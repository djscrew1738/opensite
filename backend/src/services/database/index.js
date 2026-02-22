// SQLite Database Service - Modular Export
// Re-exports the DatabaseService with all mixins applied

import { DatabaseService } from './core.js';
import addLeadOperations from './leads.js';
import addProjectOperations from './projects.js';
import addEstimateOperations from './estimates.js';
import addTakeoffOperations from './takeoff.js';
import addSettingsOperations from './settings.js';
import addPermitOperations from './permits.js';
import addHistoryOperations from './history.js';

// Apply all mixins to DatabaseService
addLeadOperations(DatabaseService);
addProjectOperations(DatabaseService);
addEstimateOperations(DatabaseService);
addTakeoffOperations(DatabaseService);
addSettingsOperations(DatabaseService);
addPermitOperations(DatabaseService);
addHistoryOperations(DatabaseService);

// Create and export singleton instance
export const db = new DatabaseService();

// Also export the class for testing
export { DatabaseService };

// Default export for backward compatibility
export default db;
