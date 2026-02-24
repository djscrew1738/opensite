// Database Service - Modular Export
// Switches between SQLite and PostgreSQL based on environment

import { DatabaseService as SQLiteService } from './core.js';
import addLeadOperations from './leads.js';
import addProjectOperations from './projects.js';
import addEstimateOperations from './estimates.js';
import addTakeoffOperations from './takeoff.js';
import addSettingsOperations from './settings.js';
import addPermitOperations from './permits.js';
import addHistoryOperations from './history.js';
import addUserOperations from './users.js';
import addEmailWatcherOperations from './email-watcher.js';
import addQuickBooksOperations from './quickbooks.js';
import addJobOperations from './jobs.js';
import addDocumentOperations from './documents.js';

// Determine which service to use
const isPostgres = !!process.env.DATABASE_URL;



// Dynamically import PostgreSQL service only when needed
let DatabaseService = SQLiteService;

if (isPostgres) {
  console.log('🚀 Using PostgreSQL database engine');
  // Dynamic import to avoid loading pg when not needed
  const { DatabaseService: PostgresService } = await import('./postgres-core.js');
  DatabaseService = PostgresService;
} else {
  console.log('📦 Using SQLite database engine');
}

// Apply all mixins to the selected DatabaseService prototype
addLeadOperations(DatabaseService);
addProjectOperations(DatabaseService);
addEstimateOperations(DatabaseService);
addTakeoffOperations(DatabaseService);
addSettingsOperations(DatabaseService);
addPermitOperations(DatabaseService);
addHistoryOperations(DatabaseService);
addUserOperations(DatabaseService);
addEmailWatcherOperations(DatabaseService);
addQuickBooksOperations(DatabaseService);
addJobOperations(DatabaseService);
addDocumentOperations(DatabaseService);

// Create and export singleton instance
export const db = new DatabaseService();

// Also export the class for testing
export { DatabaseService };

// Default export for backward compatibility
export default db;
