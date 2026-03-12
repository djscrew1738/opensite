/**
 * SQLite Vector Store (Fallback)
 * 
 * Local SQLite-based vector storage with JavaScript similarity computation.
 * Used when Pinecone and pgvector are unavailable.
 * 
 * Features:
 * - No external dependencies
 * - JSON storage of embeddings
 * - Efficient indexing by source
 * - Suitable for small-to-medium datasets (< 100k vectors)
 */

import { db } from '../database/index.js';
import logger from '../logger.js';
import { AppError } from '../../utils/errors.js';

class SQLiteVectorStore {
  constructor() {
    this.tableName = 'vector_embeddings';
    this.dimensions = parseInt(process.env.EMBEDDING_DIMENSIONS) || 768;
    this._initialized = false;
  }

  /**
   * Check if store is available (always true for SQLite)
   */
  isAvailable() {
    return true;
  }

  /**
   * Initialize SQLite table
   */
  async initialize() {
    if (this._initialized) return true;

    try {
      // Create table for embeddings
      db.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          external_id TEXT UNIQUE NOT NULL,
          embedding TEXT NOT NULL, -- JSON array
          content TEXT,
          metadata TEXT DEFAULT '{}', -- JSON
          source TEXT,
          source_type TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes
      db.query(`
        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_source 
        ON ${this.tableName} (source)
      `);

      db.query(`
        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_external_id 
        ON ${this.tableName} (external_id)
      `);

      this._initialized = true;
      logger.info('[SQLiteVectorStore] Initialized successfully');
      return true;
    } catch (error) {
      logger.error('[SQLiteVectorStore] Initialization failed:', error.message);
      return false;
    }
  }

  /**
   * Upsert vectors
   * @param {Array<{id, values, content, metadata, source, sourceType}>} vectors
   */
  async upsert(vectors) {
    if (!this._initialized) {
      await this.initialize();
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO ${this.tableName} 
          (external_id, embedding, content, metadata, source, source_type)
        VALUES 
          (?, ?, ?, ?, ?, ?)
        ON CONFLICT (external_id) 
        DO UPDATE SET
          embedding = excluded.embedding,
          content = excluded.content,
          metadata = excluded.metadata,
          updated_at = CURRENT_TIMESTAMP
      `);

      for (const vector of vectors) {
        stmt.run(
          vector.id,
          JSON.stringify(vector.values),
          vector.content || null,
          JSON.stringify(vector.metadata || {}),
          vector.source || null,
          vector.sourceType || null
        );
      }

      logger.info(`[SQLiteVectorStore] Upserted ${vectors.length} vectors`);
    } catch (error) {
      logger.error('[SQLiteVectorStore] Upsert failed:', error.message);
      throw new AppError('Failed to store vectors', 500, 'VECTOR_STORE_ERROR');
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  _cosineSimilarity(vecA, vecB) {
    if (!Array.isArray(vecA) || !Array.isArray(vecB)) return 0;
    if (vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Query similar vectors using brute-force similarity
   * @param {number[]} vector - Query vector
   * @param {Object} options - { topK, threshold, filter }
   * @returns {Promise<Array<{id, score, content, metadata}>>}
   */
  async query(vector, options = {}) {
    if (!this._initialized) {
      await this.initialize();
    }

    const {
      topK = 5,
      threshold = 0.7,
      filter = {}
    } = options;

    try {
      // Build query with filters
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (filter.source) {
        whereClause += ' AND source = ?';
        params.push(filter.source);
      }
      if (filter.sourceType) {
        whereClause += ' AND source_type = ?';
        params.push(filter.sourceType);
      }

      // Fetch all matching vectors (with limit for performance)
      const rows = db.query(
        `SELECT external_id, embedding, content, metadata, source, source_type
         FROM ${this.tableName} ${whereClause}
         LIMIT 10000`,
        params
      );

      // Calculate similarity for each
      const scored = rows.map(row => {
        const embedding = JSON.parse(row.embedding);
        const score = this._cosineSimilarity(vector, embedding);

        return {
          id: row.external_id,
          score,
          content: row.content,
          metadata: JSON.parse(row.metadata || '{}'),
          source: row.source,
          sourceType: row.source_type
        };
      });

      // Filter, sort, and return topK
      return scored
        .filter(r => r.score >= threshold)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    } catch (error) {
      logger.error('[SQLiteVectorStore] Query failed:', error.message);
      throw new AppError('Vector search failed', 500, 'VECTOR_STORE_ERROR');
    }
  }

  /**
   * Delete vectors by external ID
   * @param {string[]} ids
   */
  async delete(ids) {
    if (!this._initialized) {
      await this.initialize();
    }

    try {
      const placeholders = ids.map(() => '?').join(',');
      db.query(
        `DELETE FROM ${this.tableName} WHERE external_id IN (${placeholders})`,
        ids
      );
      logger.info(`[SQLiteVectorStore] Deleted ${ids.length} vectors`);
    } catch (error) {
      logger.error('[SQLiteVectorStore] Delete failed:', error.message);
      throw new AppError('Failed to delete vectors', 500, 'VECTOR_STORE_ERROR');
    }
  }

  /**
   * Delete vectors by source
   * @param {string} source
   */
  async deleteBySource(source) {
    if (!this._initialized) {
      await this.initialize();
    }

    try {
      const result = db.query(
        `DELETE FROM ${this.tableName} WHERE source = ?`,
        [source]
      );
      logger.info(`[SQLiteVectorStore] Deleted vectors for source: ${source}`);
      return result.changes || 0;
    } catch (error) {
      logger.error('[SQLiteVectorStore] Delete by source failed:', error.message);
      throw new AppError('Failed to delete vectors', 500, 'VECTOR_STORE_ERROR');
    }
  }

  /**
   * Get total count
   * @param {Object} filter - Optional filter
   */
  async count(filter = {}) {
    if (!this._initialized) {
      await this.initialize();
    }

    try {
      let whereClause = '';
      const params = [];

      if (filter.source) {
        whereClause = 'WHERE source = ?';
        params.push(filter.source);
      }

      const result = db.query(
        `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`,
        params
      );

      return result[0]?.count || 0;
    } catch (error) {
      logger.error('[SQLiteVectorStore] Count failed:', error.message);
      return 0;
    }
  }

  /**
   * Get statistics
   */
  async getStats() {
    if (!this._initialized) {
      await this.initialize();
    }

    try {
      const total = await this.count();
      
      const sourceStats = db.query(`
        SELECT source, source_type, COUNT(*) as count 
        FROM ${this.tableName} 
        GROUP BY source, source_type
      `);

      return {
        total,
        bySource: sourceStats.map(row => ({
          source: row.source,
          sourceType: row.source_type,
          count: row.count
        }))
      };
    } catch (error) {
      logger.error('[SQLiteVectorStore] Stats failed:', error.message);
      return null;
    }
  }
}

// Export singleton
export const sqliteVectorStore = new SQLiteVectorStore();
export default sqliteVectorStore;
