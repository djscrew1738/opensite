// Database Query Optimizations
// Batch operations, transactions, and optimized queries

import { db } from './database.js';
import { cache } from './cache.js';
import logger from './logger.js';

class DatabaseOptimizations {
  /**
   * Batch insert multiple records
   * @param {string} table - Table name
   * @param {Array} records - Array of records
   * @returns {Array} Inserted records
   */
  async batchInsert(table, records, columns) {
    if (!records || records.length === 0) {
      return [];
    }

    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

    if (db.db && db.db.transaction) {
      const stmt = db.db.prepare(sql);
      const transaction = db.db.transaction((recs) => {
        for (const record of recs) {
          stmt.run(...columns.map(col => record[col]));
        }
      });
      transaction(records);
    } else {
      // Async-native (Postgres)
      for (const record of records) {
        await db.run(sql, columns.map(col => record[col]));
      }
    }

    logger.info('Batch insert completed', { table, count: records.length });
    return records;
  }

  /**
   * Get with caching
   * @param {string} cacheKey - Cache key
   * @param {Function} queryFn - Query function
   * @param {number} ttl - Cache TTL
   * @returns {*} Query result
   */
  async getCached(cacheKey, queryFn, ttl = 60) {
    // Check cache first
    let result = cache.get(cacheKey);

    if (result !== undefined) {
      logger.debug('Cache hit', { key: cacheKey });
      return result;
    }

    // Query database
    result = await queryFn();

    // Store in cache
    if (result !== null && result !== undefined) {
      cache.set(cacheKey, result, ttl);
      logger.debug('Cache miss - stored', { key: cacheKey });
    }

    return result;
  }

  /**
   * Invalidate cache pattern
   * @param {string} pattern - Cache key pattern
   */
  invalidateCache(pattern) {
    cache.delPattern(pattern);
    logger.debug('Cache invalidated', { pattern });
  }

  /**
   * Execute in transaction
   * @param {Function} fn - Transaction function
   * @returns {*} Transaction result
   */
  async transaction(fn) {
    if (db.db && db.db.transaction) {
      const transaction = db.db.transaction(fn);
      return transaction();
    } else {
      // Basic async implementation for Postgres
      // In a real app, you'd want proper BEGIN/COMMIT/ROLLBACK here
      return await fn();
    }
  }

  /**
   * Get leads with relationships (optimized)
   * @param {object} filters - Query filters
   * @returns {Array} Leads with related data
   */
  async getLeadsWithEstimates(filters = {}) {
    const cacheKey = `leads:with-estimates:${JSON.stringify(filters)}`;

    return this.getCached(cacheKey, async () => {
      let sql = `
        SELECT
          l.*,
          COUNT(e.id) as estimateCount,
          MAX(e.createdAt) as lastEstimateDate
        FROM leads l
        LEFT JOIN estimates e ON e.leadId = l.id
        WHERE 1=1
      `;

      const params = [];

      if (filters.status) {
        sql += ' AND l.status = ?';
        params.push(filters.status);
      }

      if (filters.search) {
        sql += ' AND (l.name LIKE ? OR l.company LIKE ? OR l.location LIKE ?)';
        const search = `%${filters.search}%`;
        params.push(search, search, search);
      }

      sql += ' GROUP BY l.id ORDER BY l.updatedAt DESC';

      if (filters.limit) {
        sql += ' LIMIT ?';
        params.push(filters.limit);
      }

      return await db.all(sql, params);
    }, 30);
  }

  /**
   * Get dashboard stats (optimized single query)
   * @returns {object} Dashboard statistics
   */
  async getDashboardStatsOptimized(userId = null) {
    const cacheKey = `dashboard:stats:optimized:${userId || 'global'}`;

    return this.getCached(cacheKey, async () => {
      // Include records owned by user OR unassigned (userId IS NULL or empty)
      const userFilter = userId ? 'WHERE (userId = ? OR userId IS NULL OR userId = \'\')' : '';
      const userFilterAnd = userId ? 'AND (userId = ? OR userId IS NULL OR userId = \'\')' : '';
      const params = userId ? [userId] : [];

      // Single query to get all stats
      const stats = await db.get(`
        SELECT
          (SELECT COUNT(*) FROM leads ${userFilter}) as totalLeads,
          (SELECT COUNT(*) FROM leads WHERE status = 'hot' ${userFilterAnd}) as hotLeadsCount,
          (SELECT COALESCE(SUM(value), 0) FROM leads WHERE status = 'hot' ${userFilterAnd}) as pipelineValue,
          (SELECT COUNT(*) FROM projects WHERE status = 'active' ${userFilterAnd}) as activeProjectsCount
      `, userId ? [userId, userId, userId, userId] : []);

      // Get top leads
      const hotLeads = await db.all(`
        SELECT * FROM leads WHERE status = 'hot' ${userFilterAnd} ORDER BY score DESC LIMIT 3
      `, params);

      // Get active projects
      const activeProjects = await db.all(`
        SELECT * FROM projects WHERE status = 'active' ${userFilterAnd} ORDER BY updatedAt DESC LIMIT 5
      `, params);

      return {
        ...stats,
        hotLeads,
        activeProjects
      };
    }, 30);
  }

  /**
   * Search across multiple tables
   * @param {string} query - Search query
   * @returns {object} Search results
   */
  async globalSearch(query) {
    const searchPattern = `%${query}%`;

    const results = {
      leads: await db.all(`
        SELECT id, name, company, location, 'lead' as type
        FROM leads
        WHERE name LIKE ? OR company LIKE ? OR location LIKE ?
        LIMIT 10
      `, [searchPattern, searchPattern, searchPattern]),

      projects: await db.all(`
        SELECT id, name, status, 'project' as type
        FROM projects
        WHERE name LIKE ?
        LIMIT 10
      `, [searchPattern])
    };

    return results;
  }

  /**
   * Bulk update
   * @param {string} table - Table name
   * @param {Array} updates - Array of {id, data} objects
   */
  async bulkUpdate(table, updates) {
    if (!updates || updates.length === 0) {
      return;
    }

    if (db.db && db.db.transaction) {
      const transaction = db.db.transaction((items) => {
        for (const item of items) {
          const keys = Object.keys(item.data);
          const values = Object.values(item.data);
          const setClause = keys.map(k => `${k} = ?`).join(', ');

          const stmt = db.db.prepare(`
            UPDATE ${table} SET ${setClause}, updatedAt = ? WHERE id = ?
          `);

          stmt.run(...values, new Date().toISOString(), item.id);
        }
      });
      transaction(updates);
    } else {
      // Async-native (Postgres)
      for (const item of updates) {
        const keys = Object.keys(item.data);
        const values = Object.values(item.data);
        const setClause = keys.map(k => `${k} = ?`).join(', ');
        await db.run(`UPDATE ${table} SET ${setClause}, updatedAt = ? WHERE id = ?`, [...values, new Date().toISOString(), item.id]);
      }
    }
    
    logger.info('Bulk update completed', { table, count: updates.length });
  }

  /**
   * Get table statistics
   * @param {string} table - Table name
   * @returns {object} Table stats
   */
  async getTableStats(table) {
    const stats = await db.get(`
      SELECT
        COUNT(*) as count,
        MIN(createdAt) as oldestRecord,
        MAX(createdAt) as newestRecord
      FROM ${table}
    `);

    return stats;
  }

  /**
   * Vacuum database (optimize)
   */
  async vacuum() {
    logger.info('Vacuuming database...');
    if (db.db && typeof db.db.exec === 'function') {
      await db.exec('VACUUM');
    } else {
      await db.exec('VACUUM FULL'); // Postgres equivalent or similar
    }
    logger.info('Database vacuumed');
  }

  /**
   * Analyze database (update stats)
   */
  async analyze() {
    logger.info('Analyzing database...');
    await db.exec('ANALYZE');
    logger.info('Database analyzed');
  }
}

// Singleton instance
export const dbOptimizations = new DatabaseOptimizations();

// Run maintenance periodically
setInterval(() => {
  dbOptimizations.analyze();
}, 86400000); // Daily

export default dbOptimizations;
