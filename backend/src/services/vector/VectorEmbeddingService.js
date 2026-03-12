/**
 * Vector Embedding Service
 * 
 * Generates vector embeddings using multiple providers:
 * - OpenAI (text-embedding-3-small, text-embedding-3-large)
 * - HuggingFace (sentence-transformers)
 * - Ollama (local models like nomic-embed-text)
 * 
 * Supports multiple vector stores:
 * - Pinecone (cloud vector DB)
 * - pgvector (PostgreSQL extension)
 * - SQLite + custom vector table (fallback)
 */

import axios from 'axios';
import { db } from '../database/index.js';
import logger from '../logger.js';
import { AppError } from '../../utils/errors.js';

class VectorEmbeddingService {
  constructor() {
    this.provider = process.env.EMBEDDING_PROVIDER || 'ollama';
    this.dimensions = parseInt(process.env.EMBEDDING_DIMENSIONS) || 768;
    
    // Provider configurations
    this.config = {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: 'https://api.openai.com/v1',
        models: {
          small: 'text-embedding-3-small',    // 1536 dims
          large: 'text-embedding-3-large',    // 3072 dims
          ada: 'text-embedding-ada-002'       // 1536 dims
        },
        batchSize: 100
      },
      huggingface: {
        apiKey: process.env.HUGGINGFACE_API_KEY,
        baseUrl: 'https://api-inference.huggingface.co/pipeline/feature-extraction',
        models: {
          minilm: 'sentence-transformers/all-MiniLM-L6-v2',     // 384 dims
          mpnet: 'sentence-transformers/all-mpnet-base-v2',     // 768 dims
          e5: 'intfloat/e5-large-v2'                             // 1024 dims
        },
        batchSize: 32
      },
      ollama: {
        baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
        models: {
          nomic: 'nomic-embed-text',      // 768 dims
          llama: 'llama3.1'                // 4096 dims (fallback)
        },
        batchSize: 4
      }
    };

    this.defaultModel = this._getDefaultModel();
    logger.info(`[VectorEmbeddingService] Initialized with provider: ${this.provider}, model: ${this.defaultModel}`);
  }

  /**
   * Get default model for current provider
   */
  _getDefaultModel() {
    const cfg = this.config[this.provider];
    switch (this.provider) {
      case 'openai':
        return cfg.models.small;
      case 'huggingface':
        return cfg.models.mpnet;
      case 'ollama':
      default:
        return cfg.models.nomic;
    }
  }

  /**
   * Generate embedding for single text
   * @param {string} text - Text to embed
   * @param {string} model - Model to use (optional)
   * @returns {Promise<number[]>} Embedding vector
   */
  async generate(text, model = null) {
    if (!text || typeof text !== 'string') {
      throw new AppError('Text is required for embedding generation', 400, 'VALIDATION_ERROR');
    }

    // Truncate if too long (most models have ~8192 token limit)
    const truncatedText = text.slice(0, 30000);

    try {
      switch (this.provider) {
        case 'openai':
          return await this._generateOpenAI(truncatedText, model);
        case 'huggingface':
          return await this._generateHuggingFace(truncatedText, model);
        case 'ollama':
        default:
          return await this._generateOllama(truncatedText, model);
      }
    } catch (error) {
      logger.error(`[VectorEmbeddingService] Generation failed:`, error.message);
      
      // Fallback to Ollama if cloud provider fails
      if (this.provider !== 'ollama') {
        logger.info('[VectorEmbeddingService] Falling back to Ollama...');
        return this._generateOllama(truncatedText, 'nomic-embed-text');
      }
      
      throw new AppError(
        'Failed to generate embedding',
        500,
        'EMBEDDING_ERROR',
        { originalError: error.message }
      );
    }
  }

  /**
   * OpenAI embedding generation
   */
  async _generateOpenAI(text, model = null) {
    const cfg = this.config.openai;
    const response = await axios.post(
      `${cfg.baseUrl}/embeddings`,
      {
        model: model || cfg.models.small,
        input: text,
        encoding_format: 'float'
      },
      {
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    if (response.data?.data?.[0]?.embedding) {
      return response.data.data[0].embedding;
    }
    
    throw new Error('Invalid response from OpenAI');
  }

  /**
   * HuggingFace embedding generation
   */
  async _generateHuggingFace(text, model = null) {
    const cfg = this.config.huggingface;
    const response = await axios.post(
      cfg.baseUrl,
      {
        inputs: text,
        options: { wait_for_model: true }
      },
      {
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: { model: model || cfg.models.mpnet },
        timeout: 60000
      }
    );

    if (Array.isArray(response.data)) {
      // HF returns array of embeddings, we want the first one
      return response.data[0];
    }
    
    throw new Error('Invalid response from HuggingFace');
  }

  /**
   * Ollama embedding generation
   */
  async _generateOllama(text, model = null) {
    const cfg = this.config.ollama;
    const response = await axios.post(
      `${cfg.baseUrl}/api/embeddings`,
      {
        model: model || cfg.models.nomic,
        prompt: text
      },
      { timeout: 60000 }
    );

    if (response.data?.embedding) {
      return response.data.embedding;
    }
    
    throw new Error('Invalid response from Ollama');
  }

  /**
   * Generate embeddings for multiple texts in batches
   * @param {string[]} texts - Array of texts
   * @param {Object} options - { model, batchSize, onProgress }
   * @returns {Promise<number[][]>} Array of embeddings
   */
  async generateBatch(texts, options = {}) {
    const { model, onProgress } = options;
    const batchSize = options.batchSize || this.config[this.provider].batchSize;
    
    const results = [];
    const total = texts.length;
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      try {
        // Process batch in parallel
        const embeddings = await Promise.all(
          batch.map(text => this.generate(text, model))
        );
        results.push(...embeddings);
        
        if (onProgress) {
          onProgress(Math.min(i + batchSize, total), total);
        }
        
        // Rate limiting for cloud providers
        if (this.provider !== 'ollama' && i + batchSize < texts.length) {
          await new Promise(r => setTimeout(r, 100));
        }
      } catch (error) {
        logger.error(`[VectorEmbeddingService] Batch failed at index ${i}:`, error.message);
        throw error;
      }
    }
    
    return results;
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {number[]} vecA - First vector
   * @param {number[]} vecB - Second vector
   * @returns {number} Similarity score (-1 to 1)
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.max(-1, Math.min(1, similarity)); // Clamp to [-1, 1]
  }

  /**
   * Find similar vectors using cosine similarity
   * @param {number[]} queryVector - Query embedding
   * @param {Array<{id, vector, metadata}>} candidates - Candidate vectors
   * @param {Object} options - { topK, threshold }
   * @returns {Array<{id, score, metadata}>} Top matches
   */
  findSimilar(queryVector, candidates, options = {}) {
    const { topK = 5, threshold = 0.7 } = options;

    const scored = candidates.map(candidate => ({
      id: candidate.id,
      score: this.cosineSimilarity(queryVector, candidate.vector),
      metadata: candidate.metadata
    }));

    return scored
      .filter(c => c.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Get vector statistics
   * @returns {Object} Provider info and capabilities
   */
  getInfo() {
    return {
      provider: this.provider,
      model: this.defaultModel,
      dimensions: this.dimensions,
      batchSize: this.config[this.provider].batchSize,
      supportsBatching: true,
      availableProviders: Object.keys(this.config)
    };
  }
}

// Export singleton
export const vectorEmbeddingService = new VectorEmbeddingService();
export default vectorEmbeddingService;
