/**
 * PGVector Store
 * 
 * PostgreSQL extension for vector similarity search.
 * Features:
 * - Native SQL queries
 * - ACID transactions
 * - Metadata filtering
 * - Multiple distance metrics (cosine, euclidean, inner product)
 */

import { db } from '../database/index.js';
import logger from '../logger.js';
import { AppError } from '../../utils/errors.js';

class PGVectorStore {
  constructor() {
    this.tableName = process.env.PGVECTOR_TABLE || 'vector_embeddings';
    this.dimensions = parseInt(process.env.EMBEDDING_DIMENSIONS) || 768;
    this.distanceMetric = process.env.PGVECTOR_METRIC || 'cosine'; // cosine, l2, inner
    
    this._initialized = false;
    this._initPromise = null;
  }

  /**
   * Check if running on PostgreSQL
   */
  _isPostgreSQL() {
    // Check if db is using PostgreSQL driver
    return db.constructor.name.includes('Postgres') || 
           (db.pool && db.pool.constructor.name.includes('Postgres'));
  }

  /**
   * Initialize pgvector extension and table
   */
  async initialize() {
    if (this._initialized) return true;
    if (!this._isPostgreSQL()) {
      logger.warn('[PGVectorStore] Not running on PostgreSQL, store disabled');
      return false;
    }

    // Prevent concurrent initialization
    if (this._initPromise) return this._initPromise;

    this._initPromise = this._doInitialize();
    return this._initPromise;
  }

  async _doInitialize() {
    try {
      // Enable pgvector extension
      await db.query('CREATE EXTENSION IF NOT EXISTS vector');
      
      // Create table for embeddings
      await db.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id SERIAL PRIMARY KEY,
          external_id VARCHAR(255) UNIQUE NOT NULL,
          embedding VECTOR(${this.dimensions}),
          content TEXT,
          metadata JSONB DEFAULT '{}',
          source VARCHAR(255),
          source_type VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_embedding 
        ON ${this.tableName} 
        USING ivfflat (embedding ${this._getIndexOpclass()})
        WITH (lists = 100)
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_metadata 
        ON ${this.tableName} USING GIN (metadata)
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_source 
        ON ${this.tableName} (source)
      `);

      // Create updated_at trigger
      await db.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_${this.tableName}_updated_at 
        ON ${this.tableName};
        
        CREATE TRIGGER update_${this.tableName}_updated_at
        BEFORE UPDATE ON ${this.tableName}
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);

      this._initialized = true;
      logger.info('[PGVectorStore] Initialized successfully');
      return true;
    } catch (error) {
      logger.error('[PGVectorStore] Initialization failed:', error.message);
      return false;
    }
  }

  /**
   * Get index operator class based on distance metric
   */
  _getIndexOpclass() {
    switch (this.distanceMetric) {
      case 'l2':
      case 'euclidean':
        return 'vector_l2_ops';
      case 'inner':
      case 'ip':
        return 'vector_ip_ops';
      case 'cosine':
      default:
        return 'vector_cosine_ops';
    }
  }

  /**
   * Get distance operator based on metric
   */
  _getDistanceOperator() {
    switch (this.distanceMetric) {
      case 'l2':
      case 'euclidean':
        return '<->';
      case 'inner':
      case 'ip':
        return '<#>';
      case 'cosine':
      default:
        return '<=>';
    }
  }

  /**
   * Check if store is available
   */
  async isAvailable() {
    if (!this._initialized) {
      await this.initialize();
    }
    return this._initialized;
  }

  /**
   * Upsert vectors
   * @param {Array<{id, values, content, metadata, source, sourceType}>} vectors
   */
  async upsert(vectors) {
    if (!(await this.isAvailable())) {
      throw new AppError('PGVector not initialized', 503, 'VECTOR_STORE_ERROR');
    }

    const operator = this._getDistanceOperator();
    
    try {
      for (const vector of vectors) {
        const embeddingStr = `[${vector.values.join(',')}]`;
        
        await db.query(`
          INSERT INTO ${this.tableName} 
            (external_id, embedding, content, metadata, source, source_type)
          VALUES 
            ($1, $2::vector, $3, $4, $5, $6)
          ON CONFLICT (external_id) 
          DO UPDATE SET
            embedding = EXCLUDED.embedding,
            content = EXCLUDED.content,
            metadata = EXCLUDED.metadata,
            updated_at = CURRENT_TIMESTAMP
        `, [
          vector.id,
          embeddingStr,
          vector.content || null,
          JSON.stringify(vector.metadata || {}),
          vector.source || null,
          vector.sourceType || null
        ]);
      }
      
      logger.info(`[PGVectorStore] Upserted ${vectors.length} vectors`);
    } catch (error) {
      logger.error('[PGVectorStore] Upsert failed:', error.message);
      throw new AppError('Failed to store vectors', 500, 'VECTOR_STORE_ERROR');
    }
  }

  /**
   * Query similar vectors
   * @param {number[]} vector - Query vector
   * @param {Object} options - { topK, threshold, filter }
   * @returns {Promise<Array<{id, score, content, metadata}>>}
   */
  async query(vector, options = {}) {
    if (!(await this.isAvailable())) {
      throw new AppError('PGVector not initialized', 503, 'VECTOR_STORE_ERROR');
    }

    const {
      topK = 5,
      threshold = 0.7,
      filter = {}
    } = options;

    const operator = this._getDistanceOperator();
    const embeddingStr = `[${vector.join(',')}]`;

    try {
      let query = `
        SELECT 
          external_id as id,
          1 - (embedding ${operator} $1::vector) as score,
          content,
          metadata,
          source,
          source_type
        FROM ${this.tableName}
        WHERE 1 - (embedding ${operator} $1::vector) >= $2
      `;

      const params = [embeddingStr, threshold];
      let paramIdx = 3;

      // Add metadata filters
      if (filter.source) {
        query += ` AND source = $${paramIdx++}`;
        params.push(filter.source);
      }
      if (filter.sourceType) {
        query += ` AND source_type = $${paramIdx++}`;
        params.push(filter.sourceType);
      }
      if (filter.metadata) {
        Object.entries(filter.metadata).forEach(([key, value]) => {
          query += ` AND metadata->>$${paramIdx++} = $${paramIdx++}`;
          params.push(key, String(value));
        });
      }

      query += ` ORDER BY score DESC LIMIT $${paramIdx}`;
      params.push(topK);

      const results = await db.query(query, params);
      
      return results.map(row => ({
        id: row.id,
        score: parseFloat(row.score),
        content: row.content,
        metadata: typeof row.metadata === 'string' 
          ? JSON.parse(row.metadata) 
          : row.metadata,
        source: row.source,
        sourceType: row.source_type
      }));
    } catch (error) {
      logger.error('[PGVectorStore] Query failed:', error.message);
      throw new AppError('Vector search failed', 500, 'VECTOR_STORE_ERROR');
    }
  }

  /**
   * Delete vectors by external ID
   * @param {string[]} ids - IDs to delete
   */
  async delete(ids) {
    if (!(await this.isAvailable())) {
      throw new AppError('PGVector not initialized', 503, 'VECTOR_STORE_ERROR');
    }

    try {
      await db.query(
        `DELETE FROM ${this.tableName} WHERE external_id = ANY($1)`,
        [ids]
      );
      logger.info(`[PGVectorStore] Deleted ${ids.length} vectors`);
    } catch (error) {
      logger.error('[PGVectorStore] Delete failed:', error.message);
      throw new AppError('Failed to delete vectors', 500, 'VECTOR_STORE_ERROR');
    }
  }

  /**
   * Delete vectors by source
   * @param {string} source - Source identifier
   */
  async deleteBySource(source) {
    if (!(await this.isAvailable())) {
      throw new AppError('PGVector not initialized', 503, 'VECTOR_STORE_ERROR');
    }

    try {
      const result = await db.query(
        `DELETE FROM ${this.tableName} WHERE source = $1`,
        [source]
    );
      logger.info(`[PGVectorStore] Deleted vectors for source: ${source}`);
      return result.rowCount || 0;
    } catch (error) {
      logger.error('[PGVectorStore] Delete by source failed:', error.message);
      throw new AppError('Failed to delete vectors', 500, 'VECTOR_STORE_ERROR');
    }
  }

  /**
   * Get total count
   * @param {Object} filter - Optional filter
   */
  async count(filter = {}) {
    if (!(await this.isAvailable())) {
      return 0;
    }

    try {
      let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      const params = [];
      
      if (filter.source) {
        query += ' WHERE source = $1';
        params.push(filter.source);
      }
      
      const result = await db.query(query, params);
      return parseInt(result[0]?.count || 0);
    } catch (error) {
      logger.error('[PGVectorStore] Count failed:', error.message);
      return 0;
    }
  }

  /**
   * Get statistics
   */
  async getStats() {
    if (!(await this.isAvailable())) {
      return null;
    }

    try {
      const [totalCount, sourceStats] = await Promise.all([
        db.query(`SELECT COUNT(*) as count FROM ${this.tableName}`),
        db.query(`
          SELECT source, source_type, COUNT(*) as count 
          FROM ${this.tableName} 
          GROUP BY source, source_type
        `)
      ]);

      return {
        total: parseInt(totalCount[0]?.count || 0),
        bySource: sourceStats.map(row => ({
          source: row.source,
          sourceType: row.source_type,
          count: parseInt(row.count)
        }))
      };
    } catch (error) {
      logger.error('[PGVectorStore] Stats failed:', error.message);
      return null;
    }
  }
}

// Export singleton
export const pgVectorStore = new PGVectorStore();
export default pgVectorStore;
