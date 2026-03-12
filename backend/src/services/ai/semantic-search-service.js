/**
 * Semantic Search Service
 * 
 * Advanced semantic search combining:
 * - Dense vector search (embeddings)
 * - Sparse keyword search (BM25/TF-IDF)
 * - Hybrid ranking (Reciprocal Rank Fusion)
 * - Reranking with cross-encoders
 * - Faceted filtering
 */

import { vectorStoreManager } from '../vector/VectorStoreManager.js';
import { vectorEmbeddingService } from '../vector/VectorEmbeddingService.js';
import { db } from '../database/index.js';
import logger from '../logger.js';

class SemanticSearchService {
  constructor() {
    this.rerankEnabled = process.env.RERANK_ENABLED === 'true';
    this.rerankModel = process.env.RERANK_MODEL || 'cross-encoder/ms-marco-MiniLM-L-6-v2';
  }

  /**
   * Semantic search with optional hybrid and reranking
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<SearchResults>}
   */
  async search(query, options = {}) {
    const startTime = Date.now();
    
    const {
      topK = 10,
      threshold = 0.6,
      useHybrid = true,
      rerank = false,
      filters = {},
      sources = [],
      includeContent = true
    } = options;

    try {
      // Build filter for sources
      const vectorFilter = { ...filters };
      if (sources.length > 0) {
        vectorFilter.source = sources;
      }

      let results;

      if (useHybrid) {
        // Hybrid search: combine vector + keyword
        results = await this._hybridSearch(query, {
          topK: rerank ? topK * 3 : topK,
          threshold,
          filter: vectorFilter
        });
      } else {
        // Pure semantic search
        results = await vectorStoreManager.search(query, {
          topK: rerank ? topK * 3 : topK,
          threshold,
          filter: vectorFilter
        });
      }

      // Rerank results if enabled
      if (rerank && results.length > 0) {
        results = await this._rerank(query, results, topK);
      }

      const duration = Date.now() - startTime;
      
      logger.info(`[SemanticSearch] Query "${query.slice(0, 50)}..." returned ${results.length} results in ${duration}ms`);

      return {
        query,
        results: includeContent ? results : results.map(r => ({ ...r, content: undefined })),
        total: results.length,
        duration,
        method: useHybrid ? 'hybrid' : 'semantic'
      };
    } catch (error) {
      logger.error('[SemanticSearch] Search failed:', error.message);
      throw error;
    }
  }

  /**
   * Hybrid search combining vector and keyword results
   * Uses Reciprocal Rank Fusion (RRF) for combining rankings
   * @private
   */
  async _hybridSearch(query, options) {
    const { topK = 10, threshold = 0.6, filter = {} } = options;
    const k = 60; // RRF constant

    // Parallel vector and keyword search
    const [vectorResults, keywordResults] = await Promise.all([
      vectorStoreManager.search(query, { topK: topK * 2, threshold, filter }),
      this._keywordSearch(query, { topK: topK * 2, filter })
    ]);

    // Build score map using RRF
    const scores = new Map();

    // Add vector scores (rank-based)
    vectorResults.forEach((result, rank) => {
      const id = result.id;
      const rrfScore = 1 / (k + rank + 1);
      scores.set(id, {
        id,
        vectorScore: result.score,
        keywordScore: 0,
        rrfScore,
        vectorRank: rank + 1,
        data: result
      });
    });

    // Add keyword scores
    keywordResults.forEach((result, rank) => {
      const id = result.id;
      const rrfScore = 1 / (k + rank + 1);
      
      if (scores.has(id)) {
        const existing = scores.get(id);
        existing.keywordScore = result.score;
        existing.rrfScore += rrfScore;
        existing.keywordRank = rank + 1;
      } else {
        scores.set(id, {
          id,
          vectorScore: 0,
          keywordScore: result.score,
          rrfScore,
          keywordRank: rank + 1,
          data: result
        });
      }
    });

    // Convert to array, sort by RRF score, and return
    return Array.from(scores.values())
      .sort((a, b) => b.rrfScore - a.rrfScore)
      .slice(0, topK)
      .map(item => ({
        ...item.data,
        score: item.rrfScore,
        vectorScore: item.vectorScore,
        keywordScore: item.keywordScore,
        vectorRank: item.vectorRank,
        keywordRank: item.keywordRank
      }));
  }

  /**
   * Keyword search using SQLite FTS or LIKE
   * @private
   */
  async _keywordSearch(query, options) {
    const { topK = 10, filter = {} } = options;
    
    // Extract keywords (remove common words)
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
    const keywords = query.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    if (keywords.length === 0) {
      return [];
    }

    try {
      let sql = `
        SELECT external_id as id, content, metadata, source
        FROM vector_embeddings
        WHERE (
      `;
      
      const conditions = keywords.map(() => 'LOWER(content) LIKE ?').join(' OR ');
      sql += conditions + ')';
      
      const params = keywords.map(k => `%${k}%`);

      // Add source filter
      if (filter.source) {
        if (Array.isArray(filter.source)) {
          sql += ` AND source IN (${filter.source.map(() => '?').join(',')})`;
          params.push(...filter.source);
        } else {
          sql += ' AND source = ?';
          params.push(filter.source);
        }
      }

      sql += ` LIMIT ?`;
      params.push(topK * 2);

      const rows = await db.query(sql, params);

      // Score based on keyword frequency
      return rows.map(row => {
        const content = (row.content || '').toLowerCase();
        const keywordMatches = keywords.filter(k => content.includes(k)).length;
        const score = keywordMatches / keywords.length;

        return {
          id: row.id,
          score,
          content: row.content,
          metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
          source: row.source
        };
      }).filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    } catch (error) {
      logger.error('[SemanticSearch] Keyword search failed:', error.message);
      return [];
    }
  }

  /**
   * Rerank results using cross-encoder (simplified version)
   * In production, this would call an external service or model
   * @private
   */
  async _rerank(query, results, topK) {
    // Simplified reranking based on query term overlap
    // In production, use a proper cross-encoder model
    
    const queryTerms = new Set(query.toLowerCase().split(/\s+/));
    
    const reranked = results.map(result => {
      const contentTerms = new Set((result.content || '').toLowerCase().split(/\s+/));
      const overlap = [...queryTerms].filter(t => contentTerms.has(t)).length;
      const termOverlapScore = overlap / queryTerms.size;
      
      // Combine original score with term overlap
      const finalScore = (result.score * 0.7) + (termOverlapScore * 0.3);
      
      return {
        ...result,
        score: finalScore,
        reranked: true
      };
    });

    return reranked
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Get faceted search results grouped by source
   * @param {string} query - Search query
   * @param {Object} options - Search options
   */
  async facetedSearch(query, options = {}) {
    const { sources = [] } = options;
    
    // Get all available sources
    const stats = await vectorStoreManager.getStats();
    const availableSources = stats?.bySource?.map(s => s.source) || [];

    // Search within each source
    const facets = await Promise.all(
      availableSources.map(async source => {
        const results = await this.search(query, {
          ...options,
          sources: [source],
          topK: 5
        });
        
        return {
          source,
          count: results.total,
          topResults: results.results.slice(0, 3)
        };
      })
    );

    return {
      query,
      facets: facets.filter(f => f.count > 0),
      totalFacets: facets.filter(f => f.count > 0).length
    };
  }

  /**
   * Suggest related queries based on search results
   * @param {string} query - Original query
   * @param {Array} results - Search results
   */
  async suggestQueries(query, results) {
    // Extract common terms from top results
    const content = results.slice(0, 3).map(r => r.content).join(' ');
    const words = content.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 4)
      .filter(w => !query.toLowerCase().includes(w));

    // Get unique words
    const uniqueWords = [...new Set(words)];
    
    // Generate suggestions
    const suggestions = [
      `${query} examples`,
      `${query} tutorial`,
      `${query} best practices`,
      ...uniqueWords.slice(0, 3).map(w => `${query} ${w}`)
    ].slice(0, 5);

    return suggestions;
  }
}

// Export singleton
export const semanticSearchService = new SemanticSearchService();
export default semanticSearchService;
