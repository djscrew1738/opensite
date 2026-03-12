/**
 * Pinecone Vector Store
 * 
 * Cloud-native vector database for production deployments.
 * Features:
 * - Serverless scaling
 * - Metadata filtering
 * - Hybrid search (dense + sparse vectors)
 * - Namespace isolation
 */

import { Pinecone } from '@pinecone-database/pinecone';
import logger from '../logger.js';
import { AppError } from '../../utils/errors.js';

class PineconeVectorStore {
  constructor() {
    this.apiKey = process.env.PINECONE_API_KEY;
    this.indexName = process.env.PINECONE_INDEX || 'opensite-knowledge';
    this.namespace = process.env.PINECONE_NAMESPACE || 'default';
    this.dimensions = parseInt(process.env.EMBEDDING_DIMENSIONS) || 768;
    
    this.client = null;
    this.index = null;
    
    if (this.apiKey) {
      this._initialize();
    } else {
      logger.warn('[PineconeVectorStore] No API key provided, store disabled');
    }
  }

  async _initialize() {
    try {
      this.client = new Pinecone({ apiKey: this.apiKey });
      
      // Check if index exists, create if not
      const indexes = await this.client.listIndexes();
      const exists = indexes.indexes?.some(idx => idx.name === this.indexName);
      
      if (!exists) {
        logger.info(`[PineconeVectorStore] Creating index: ${this.indexName}`);
        await this.client.createIndex({
          name: this.indexName,
          dimension: this.dimensions,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });
        
        // Wait for index to be ready
        await new Promise(r => setTimeout(r, 30000));
      }
      
      this.index = this.client.index(this.indexName);
      logger.info('[PineconeVectorStore] Initialized successfully');
    } catch (error) {
      logger.error('[PineconeVectorStore] Initialization failed:', error.message);
      this.client = null;
    }
  }

  /**
   * Check if store is available
   */
  isAvailable() {
    return !!this.index;
  }

  /**
   * Upsert vectors in batches
   * @param {Array<{id, values, metadata}>} vectors - Vectors to upsert
   * @param {string} namespace - Optional namespace
   */
  async upsert(vectors, namespace = null) {
    if (!this.isAvailable()) {
      throw new AppError('Pinecone not initialized', 503, 'VECTOR_STORE_ERROR');
    }

    const ns = namespace || this.namespace;
    const batchSize = 100;
    
    try {
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await this.index.namespace(ns).upsert(batch);
        
        logger.debug(`[PineconeVectorStore] Upserted batch ${i / batchSize + 1}`);
      }
      
      logger.info(`[PineconeVectorStore] Upserted ${vectors.length} vectors to namespace: ${ns}`);
    } catch (error) {
      logger.error('[PineconeVectorStore] Upsert failed:', error.message);
      throw new AppError('Failed to store vectors', 500, 'VECTOR_STORE_ERROR');
    }
  }

  /**
   * Query similar vectors
   * @param {number[]} vector - Query vector
   * @param {Object} options - { topK, namespace, filter, includeMetadata }
   * @returns {Promise<Array<{id, score, metadata}>>}
   */
  async query(vector, options = {}) {
    if (!this.isAvailable()) {
      throw new AppError('Pinecone not initialized', 503, 'VECTOR_STORE_ERROR');
    }

    const {
      topK = 5,
      namespace = this.namespace,
      filter = {},
      includeMetadata = true
    } = options;

    try {
      const response = await this.index.namespace(namespace).query({
        vector,
        topK,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        includeMetadata
      });

      return response.matches?.map(match => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata
      })) || [];
    } catch (error) {
      logger.error('[PineconeVectorStore] Query failed:', error.message);
      throw new AppError('Vector search failed', 500, 'VECTOR_STORE_ERROR');
    }
  }

  /**
   * Delete vectors by ID
   * @param {string[]} ids - Vector IDs to delete
   * @param {string} namespace - Optional namespace
   */
  async delete(ids, namespace = null) {
    if (!this.isAvailable()) {
      throw new AppError('Pinecone not initialized', 503, 'VECTOR_STORE_ERROR');
    }

    const ns = namespace || this.namespace;
    
    try {
      await this.index.namespace(ns).deleteMany(ids);
      logger.info(`[PineconeVectorStore] Deleted ${ids.length} vectors`);
    } catch (error) {
      logger.error('[PineconeVectorStore] Delete failed:', error.message);
      throw new AppError('Failed to delete vectors', 500, 'VECTOR_STORE_ERROR');
    }
  }

  /**
   * Delete all vectors in namespace
   * @param {string} namespace - Namespace to clear
   */
  async deleteAll(namespace = null) {
    if (!this.isAvailable()) {
      throw new AppError('Pinecone not initialized', 503, 'VECTOR_STORE_ERROR');
    }

    const ns = namespace || this.namespace;
    
    try {
      await this.index.namespace(ns).deleteAll();
      logger.info(`[PineconeVectorStore] Deleted all vectors in namespace: ${ns}`);
    } catch (error) {
      logger.error('[PineconeVectorStore] Delete all failed:', error.message);
      throw new AppError('Failed to clear namespace', 500, 'VECTOR_STORE_ERROR');
    }
  }

  /**
   * Get vector count in namespace
   * @param {string} namespace - Namespace to count
   * @returns {Promise<number>}
   */
  async count(namespace = null) {
    if (!this.isAvailable()) {
      return 0;
    }

    const ns = namespace || this.namespace;
    
    try {
      const stats = await this.index.describeIndexStats();
      return stats.namespaces?.[ns]?.recordCount || 0;
    } catch (error) {
      logger.error('[PineconeVectorStore] Count failed:', error.message);
      return 0;
    }
  }

  /**
   * Fetch vectors by ID
   * @param {string[]} ids - Vector IDs
   * @param {Object} options - { namespace, includeMetadata }
   */
  async fetch(ids, options = {}) {
    if (!this.isAvailable()) {
      throw new AppError('Pinecone not initialized', 503, 'VECTOR_STORE_ERROR');
    }

    const {
      namespace = this.namespace,
      includeMetadata = true
    } = options;

    try {
      const response = await this.index.namespace(namespace).fetch(ids, {
        includeMetadata
      });

      return Object.entries(response.records || {}).map(([id, record]) => ({
        id,
        values: record.values,
        metadata: record.metadata
      }));
    } catch (error) {
      logger.error('[PineconeVectorStore] Fetch failed:', error.message);
      throw new AppError('Failed to fetch vectors', 500, 'VECTOR_STORE_ERROR');
    }
  }
}

// Export singleton
export const pineconeVectorStore = new PineconeVectorStore();
export default pineconeVectorStore;
