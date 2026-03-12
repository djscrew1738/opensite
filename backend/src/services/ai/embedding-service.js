/**
 * AI Embedding Service
 * Generates vector embeddings for text chunks using local or cloud models.
 */

import axios from 'axios';
import { db } from '../database.js';
import logger from '../logger.js';

class EmbeddingService {
  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.defaultModel = 'nomic-embed-text';
    this.dimension = 768; // Standard for nomic-embed-text
  }

  /**
   * Generates an embedding for a piece of text
   * @param {string} text 
   * @param {string} model 
   * @returns {Promise<Array<number>>}
   */
  async generate(text, model = this.defaultModel) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/embeddings`, {
        model,
        prompt: text
      });

      if (response.data && response.data.embedding) {
        return response.data.embedding;
      }
      
      throw new Error('No embedding returned from provider');
    } catch (err) {
      logger.error('[EmbeddingService] Generation failed:', err.message);
      
      // Fallback: If nomic-embed-text isn't pulled, try llama3.1 (slower but usually present)
      if (model !== 'llama3.1' && err.message.includes('not found')) {
        logger.info('[EmbeddingService] Retrying with llama3.1...');
        return this.generate(text, 'llama3.1');
      }
      
      throw err;
    }
  }

  /**
   * Batch generate embeddings (with concurrency limit)
   */
  async generateBatch(texts, model = this.defaultModel) {
    const results = [];
    // Process in small batches to avoid overloading local Ollama
    const batchSize = 4;
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const promises = batch.map(text => this.generate(text, model));
      const embeddings = await Promise.all(promises);
      results.push(...embeddings);
    }
    
    return results;
  }
}

export const embeddingService = new EmbeddingService();
export default embeddingService;
