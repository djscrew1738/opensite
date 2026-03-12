/**
 * Vector Store Manager
 * 
 * Unified interface for multiple vector storage backends.
 * Automatically selects the best available store:
 * 1. Pinecone (cloud, serverless)
 * 2. pgvector (PostgreSQL extension)
 * 3. SQLite fallback (in-memory JS similarity)
 * 
 * Provides:
 * - Automatic store selection
 * - Failover between stores
 * - Unified query interface
 * - Health monitoring
 */

import { pineconeVectorStore } from './PineconeVectorStore.js';
import { pgVectorStore } from './PGVectorStore.js';
import { sqliteVectorStore } from './SQLiteVectorStore.js';
import { vectorEmbeddingService } from './VectorEmbeddingService.js';
import logger from '../logger.js';

class VectorStoreManager {
  constructor() {
    this.stores = {
      pinecone: pineconeVectorStore,
      pgvector: pgVectorStore,
      sqlite: sqliteVectorStore
    };
    
    this.preferredStore = process.env.PREFERRED_VECTOR_STORE || 'auto';
    this.activeStore = null;
    this._initialized = false;
  }

  /**
   * Initialize and detect best available store
   */
  async initialize() {
    if (this._initialized) return;

    logger.info('[VectorStoreManager] Initializing vector stores...');

    // Check preferred store first
    if (this.preferredStore !== 'auto') {
      const store = this.stores[this.preferredStore];
      if (store && await this._checkStore(store)) {
        this.activeStore = store;
        logger.info(`[VectorStoreManager] Using preferred store: ${this.preferredStore}`);
        this._initialized = true;
        return;
      }
    }

    // Auto-detect best store
    const priority = ['pinecone', 'pgvector', 'sqlite'];
    
    for (const name of priority) {
      const store = this.stores[name];
      if (await this._checkStore(store)) {
        this.activeStore = store;
        logger.info(`[VectorStoreManager] Auto-selected store: ${name}`);
        this._initialized = true;
        return;
      }
    }

    logger.error('[VectorStoreManager] No vector store available!');
    throw new Error('No vector store available');
  }

  /**
   * Check if a store is available
   */
  async _checkStore(store) {
    try {
      if (store.isAvailable && !store.isAvailable()) {
        return false;
      }
      if (store.initialize) {
        return await store.initialize();
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current store info
   */
  getStoreInfo() {
    return {
      active: this.activeStore?.constructor?.name || 'none',
      preferred: this.preferredStore,
      available: Object.entries(this.stores).map(([name, store]) => ({
        name,
        available: store.isAvailable ? store.isAvailable() : false
      }))
    };
  }

  /**
   * Upsert vectors with embeddings
   * @param {Array<{id, content, metadata, source, sourceType}>} items
   * @param {Object} options - { onProgress }
   */
  async upsert(items, options = {}) {
    await this.initialize();

    if (!items.length) return { stored: 0 };

    const { onProgress } = options;
    
    // Generate embeddings for content
    const contents = items.map(item => item.content);
    const embeddings = await vectorEmbeddingService.generateBatch(contents, {
      onProgress: (current, total) => {
        logger.debug(`[VectorStoreManager] Generated ${current}/${total} embeddings`);
      }
    });

    // Prepare vectors for storage
    const vectors = items.map((item, i) => ({
      id: item.id,
      values: embeddings[i],
      content: item.content,
      metadata: item.metadata || {},
      source: item.source,
      sourceType: item.sourceType
    }));

    // Store in active store
    await this.activeStore.upsert(vectors);

    return { stored: vectors.length };
  }

  /**
   * Search for similar content
   * @param {string} query - Search query
   * @param {Object} options - { topK, threshold, filter }
   * @returns {Promise<Array<{id, score, content, metadata}>>}
   */
  async search(query, options = {}) {
    await this.initialize();

    const { topK = 5, threshold = 0.7, filter = {} } = options;

    // Generate query embedding
    const queryVector = await vectorEmbeddingService.generate(query);

    // Query the store
    return await this.activeStore.query(queryVector, {
      topK,
      threshold,
      filter
    });
  }

  /**
   * Hybrid search (combines vector + keyword)
   * @param {string} query - Search query
   * @param {Object} options - { topK, keywordWeight }
   */
  async hybridSearch(query, options = {}) {
    await this.initialize();

    const { topK = 5, keywordWeight = 0.3 } = options;

    // Get vector results
    const vectorResults = await this.search(query, { topK: topK * 2 });

    // If pgvector, also do keyword search via SQL
    let keywordResults = [];
    if (this.activeStore === pgVectorStore) {
      const { db } = await import('../database/index.js');
      const keywordQuery = `%${query.toLowerCase()}%`;
      
      const sqlResults = await db.query(`
        SELECT external_id as id, content, metadata
        FROM vector_embeddings
        WHERE LOWER(content) LIKE $1
        LIMIT $2
      `, [keywordQuery, topK * 2]);

      keywordResults = sqlResults.map(r => ({
        id: r.id,
        content: r.content,
        metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
        isKeywordMatch: true
      }));
    }

    // Combine and deduplicate results
    const allResults = new Map();
    
    // Add vector results with scores
    vectorResults.forEach((r, i) => {
      const normalizedScore = r.score * (1 - keywordWeight);
      allResults.set(r.id, {
        ...r,
        vectorRank: i + 1,
        score: normalizedScore
      });
    });

    // Merge keyword results
    keywordResults.forEach((r, i) => {
      if (allResults.has(r.id)) {
        // Boost existing result
        const existing = allResults.get(r.id);
        const keywordScore = (1 - i / keywordResults.length) * keywordWeight;
        existing.score += keywordScore;
        existing.keywordRank = i + 1;
      } else {
        // Add new result
        const keywordScore = (1 - i / keywordResults.length) * keywordWeight;
        allResults.set(r.id, {
          ...r,
          score: keywordScore,
          keywordRank: i + 1
        });
      }
    });

    // Sort by combined score and return topK
    return Array.from(allResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Delete vectors by ID
   * @param {string[]} ids
   */
  async delete(ids) {
    await this.initialize();
    return await this.activeStore.delete(ids);
  }

  /**
   * Delete vectors by source
   * @param {string} source
   */
  async deleteBySource(source) {
    await this.initialize();
    
    if (this.activeStore.deleteBySource) {
      return await this.activeStore.deleteBySource(source);
    }
    
    logger.warn('[VectorStoreManager] deleteBySource not supported by active store');
    return 0;
  }

  /**
   * Get statistics
   */
  async getStats() {
    await this.initialize();
    
    if (this.activeStore.getStats) {
      return await this.activeStore.getStats();
    }
    
    const count = await this.activeStore.count();
    return { total: count };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      await this.initialize();
      const stats = await this.getStats();
      
      return {
        status: 'healthy',
        store: this.activeStore.constructor.name,
        vectors: stats?.total || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton
export const vectorStoreManager = new VectorStoreManager();
export default vectorStoreManager;
