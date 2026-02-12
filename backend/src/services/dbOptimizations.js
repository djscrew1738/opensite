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
  batchInsert(table, records, columns) {
    if (!records || records.length === 0) {
      return [];
    }

    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

    const stmt = db.db.prepare(sql);

    const transaction = db.db.transaction((recs) => {
      for (const record of recs) {
        stmt.run(...columns.map(col => record[col]));
      }
    });

    transaction(records);
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
  transaction(fn) {
    const transaction = db.db.transaction(fn);
    return transaction();
  }

  /**
   * Get leads with relationships (optimized)
   * @param {object} filters - Query filters
   * @returns {Array} Leads with related data
   */
  getLeadsWithEstimates(filters = {}) {
    const cacheKey = `leads:with-estimates:${JSON.stringify(filters)}`;

    return this.getCached(cacheKey, () => {
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

      const stmt = db.db.prepare(sql);
      return stmt.all(...params);
    }, 30);
  }

  /**
   * Get dashboard stats (optimized single query)
   * @returns {object} Dashboard statistics
   */
  getDashboardStatsOptimized() {
    const cacheKey = 'dashboard:stats:optimized';

    return this.getCached(cacheKey, () => {
      // Single query to get all stats
      const stats = db.db.prepare(`
        SELECT
          (SELECT COUNT(*) FROM leads) as totalLeads,
          (SELECT COUNT(*) FROM leads WHERE status = 'hot') as hotLeadsCount,
          (SELECT COALESCE(SUM(value), 0) FROM leads WHERE status = 'hot') as pipelineValue,
          (SELECT COUNT(*) FROM projects WHERE status = 'active') as activeProjectsCount
      `).get();

      // Get top leads
      const hotLeads = db.db.prepare(`
        SELECT * FROM leads WHERE status = 'hot' ORDER BY score DESC LIMIT 3
      `).all();

      // Get active projects
      const activeProjects = db.db.prepare(`
        SELECT * FROM projects WHERE status = 'active' ORDER BY updatedAt DESC LIMIT 5
      `).all();

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
  globalSearch(query) {
    const searchPattern = `%${query}%`;

    const results = {
      leads: db.db.prepare(`
        SELECT id, name, company, location, 'lead' as type
        FROM leads
        WHERE name LIKE ? OR company LIKE ? OR location LIKE ?
        LIMIT 10
      `).all(searchPattern, searchPattern, searchPattern),

      projects: db.db.prepare(`
        SELECT id, name, status, 'project' as type
        FROM projects
        WHERE name LIKE ?
        LIMIT 10
      `).all(searchPattern)
    };

    return results;
  }

  /**
   * Bulk update
   * @param {string} table - Table name
   * @param {Array} updates - Array of {id, data} objects
   */
  bulkUpdate(table, updates) {
    if (!updates || updates.length === 0) {
      return;
    }

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
    logger.info('Bulk update completed', { table, count: updates.length });
  }

  /**
   * Get table statistics
   * @param {string} table - Table name
   * @returns {object} Table stats
   */
  getTableStats(table) {
    const stats = db.db.prepare(`
      SELECT
        COUNT(*) as count,
        MIN(createdAt) as oldestRecord,
        MAX(createdAt) as newestRecord
      FROM ${table}
    `).get();

    return stats;
  }

  /**
   * Vacuum database (optimize)
   */
  vacuum() {
    logger.info('Vacuuming database...');
    db.db.exec('VACUUM');
    logger.info('Database vacuumed');
  }

  /**
   * Analyze database (update stats)
   */
  analyze() {
    logger.info('Analyzing database...');
    db.db.exec('ANALYZE');
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
