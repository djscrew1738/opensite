// SQLite Database Service
// Backward-compatible re-export of the modular database service
// 
// NOTE: This file is kept for backward compatibility.
// New code should import from './database/index.js' or specific modules:
//   import { db } from './database/index.js';
//   // or
//   import { db } from './database/core.js';

import db from './database/index.js';

// Re-export the database singleton
export { db };
export { DatabaseService } from './database/core.js';

// Default export for backward compatibility
export default db;
