// AI Optimizer — Connection pooling, caching, and intelligent routing
// for Ollama, OpenClaw, and cloud providers

import { ollamaService } from './ollama.js';
import { openclawService } from './openclaw.js';
import { groqService } from './groq.js';
import { anthropicService } from './anthropic.js';
import { openaiService } from './openai.js';
import crypto from 'crypto';
import logger from './logger.js';

/**
 * Smart cache with TTL for AI responses and metadata
 */
class AIResponseCache {
  constructor() {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.evictions++;
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return item.value;
  }

  set(key, value, ttlMs = 300000) { // Default 5 min
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(1) : 0,
      size: this.cache.size,
    };
  }
}

/**
 * Connection pool manager for local AI services
 */
class ConnectionPool {
  constructor() {
    this.pools = new Map();
    this.maxConnections = 4;
    this.idleTimeout = 30000;
  }

  async acquire(serviceName, createFn) {
    let pool = this.pools.get(serviceName);
    if (!pool) {
      pool = { available: [], inUse: new Set(), waiting: [] };
      this.pools.set(serviceName, pool);
    }

    // Return available connection
    if (pool.available.length > 0) {
      const conn = pool.available.pop();
      pool.inUse.add(conn);
      return conn;
    }

    // Create new if under limit
    if (pool.inUse.size < this.maxConnections) {
      const conn = await createFn();
      pool.inUse.add(conn);
      return conn;
    }

    // Wait for available connection
    return new Promise((resolve) => {
      pool.waiting.push(resolve);
    });
  }

  release(serviceName, conn) {
    const pool = this.pools.get(serviceName);
    if (!pool) return;

    pool.inUse.delete(conn);

    // Give to waiting request
    if (pool.waiting.length > 0) {
      const resolve = pool.waiting.shift();
      pool.inUse.add(conn);
      resolve(conn);
      return;
    }

    // Return to pool
    pool.available.push(conn);

    // Cleanup idle connections after timeout
    setTimeout(() => {
      const idx = pool.available.indexOf(conn);
      if (idx > -1) {
        pool.available.splice(idx, 1);
        // Close connection if method exists
        if (conn.close) conn.close();
      }
    }, this.idleTimeout);
  }
}

/**
 * AI Service Optimizer — Main class
 */
class AIOptimizer {
  constructor() {
    this.cache = new AIResponseCache();
    this.connectionPool = new ConnectionPool();
    this.warmupInterval = null;
    this.healthCache = new Map();
    
    // Service registry
    this.services = {
      ollama: ollamaService,
      openclaw: openclawService,
      groq: groqService,
      anthropic: anthropicService,
      openai: openaiService,
    };

    // Priority order for fallback
    this.fallbackOrder = ['openclaw', 'groq', 'openai', 'anthropic', 'ollama'];
    
    this._startWarmupInterval();
  }

  /**
   * Start periodic warmup to keep connections alive
   */
  _startWarmupInterval() {
    // Warmup every 2 minutes to prevent connection timeouts
    this.warmupInterval = setInterval(() => {
      this._warmupConnections();
    }, 120000);
  }

  /**
   * Send lightweight ping to keep connections warm
   */
  async _warmupConnections() {
    for (const [name, service] of Object.entries(this.services)) {
      if (['groq', 'anthropic', 'openai'].includes(name)) continue; // Skip cloud
      
      try {
        // Lightweight health check
        await service.healthCheck();
        logger.debug(`[ai-optimizer] Warmed up ${name}`);
      } catch (err) {
        logger.warn(`[ai-optimizer] Warmup failed for ${name}:`, err.message);
      }
    }
  }

  /**
   * Get cached health status with TTL
   */
  async getCachedHealth(serviceName, maxAgeMs = 15000) {
    const cached = this.healthCache.get(serviceName);
    if (cached && Date.now() - cached.timestamp < maxAgeMs) {
      return cached.data;
    }

    const service = this.services[serviceName];
    if (!service) return { connected: false, error: 'Unknown service' };

    try {
      const health = await service.healthCheck();
      this.healthCache.set(serviceName, {
        data: health,
        timestamp: Date.now(),
      });
      return health;
    } catch (err) {
      return { connected: false, error: err.message };
    }
  }

  /**
   * Find best available provider with fallback chain
   */
  async findBestProvider(preferred = null) {
    const candidates = preferred 
      ? [preferred, ...this.fallbackOrder.filter(p => p !== preferred)]
      : this.fallbackOrder;

    for (const providerName of candidates) {
      const health = await this.getCachedHealth(providerName);
      if (health.connected) {
        return {
          name: providerName,
          service: this.services[providerName],
          health,
          isFallback: providerName !== preferred,
        };
      }
    }

    return null;
  }

  /**
   * Optimized generation with caching and fallback
   */
  async generate(prompt, options = {}) {
    const cacheKey = this._hashPrompt(prompt, options);
    
    // Check cache for non-streaming requests
    if (!options.stream && !options.skipCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logger.debug('[ai-optimizer] Cache hit');
        return { ...cached, cached: true };
      }
    }

    const preferred = options.provider || options.model;
    const provider = await this.findBestProvider(preferred);
    
    if (!provider) {
      return {
        success: false,
        error: 'No AI providers available. Please check your configuration.',
      };
    }

    if (provider.isFallback) {
      logger.info(`[ai-optimizer] Fallback to ${provider.name}`);
    }

    try {
      const result = await provider.service.generate(prompt, {
        ...options,
        model: options.model || provider.service.defaultModel,
      });

      // Cache successful non-streaming responses
      if (result.success && !options.stream && !options.skipCache) {
        this.cache.set(cacheKey, result, options.cacheTtl || 300000);
      }

      return {
        ...result,
        provider: provider.name,
        isFallback: provider.isFallback,
      };
    } catch (err) {
      logger.error(`[ai-optimizer] Generation failed:`, err.message);
      return {
        success: false,
        error: err.message,
        provider: provider.name,
      };
    }
  }

  /**
   * Streaming generation with provider fallback
   */
  async *generateStream(prompt, options = {}) {
    const preferred = options.provider || options.model;
    const provider = await this.findBestProvider(preferred);

    if (!provider) {
      yield 'Error: No AI providers available.';
      return;
    }

    try {
      const stream = provider.service.generateStream(prompt, {
        ...options,
        model: options.model || provider.service.defaultModel,
      });

      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (err) {
      logger.error(`[ai-optimizer] Stream failed:`, err.message);
      yield `Error: ${err.message}`;
    }
  }

  /**
   * Optimized chat with conversation caching
   */
  async generateChat(message, history = [], options = {}) {
    // Simple cache key for chats (last 3 messages)
    const recentHistory = history.slice(-3);
    const cacheKey = this._hashPrompt(message, { recentHistory, options });

    if (!options.stream && !options.skipCache) {
      const cached = this.cache.get(`chat:${cacheKey}`);
      if (cached) {
        return { ...cached, cached: true };
      }
    }

    const provider = await this.findBestProvider(options.provider);
    if (!provider) {
      return {
        success: false,
        error: 'No AI providers available.',
      };
    }

    try {
      let result;
      
      // Use native chat if available
      if (typeof provider.service.generateChat === 'function') {
        result = await provider.service.generateChat(message, history, options);
      } else {
        // Fallback to prompt-based
        const prompt = provider.service.getChatPrompt(message, history);
        result = await provider.service.generate(prompt, options);
      }

      if (result.success && !options.stream && !options.skipCache) {
        this.cache.set(`chat:${cacheKey}`, result, 60000); // 1 min for chats
      }

      return {
        ...result,
        provider: provider.name,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        provider: provider.name,
      };
    }
  }

  /**
   * Batch scoring for multiple leads (parallel processing)
   */
  async batchScoreLeads(leads, options = {}) {
    const provider = await this.findBestProvider(options.provider);
    if (!provider) {
      return leads.map(lead => ({
        leadId: lead.id,
        success: false,
        error: 'No AI provider available',
      }));
    }

    // Process in batches of 5 to avoid overwhelming the service
    const batchSize = 5;
    const results = [];

    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      const batchPromises = batch.map(lead => 
        provider.service.scoreLead(lead, options.model)
          .then(score => ({ leadId: lead.id, success: true, ...score }))
          .catch(err => ({ leadId: lead.id, success: false, error: err.message }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Preload/warm specific model
   */
  async preloadModel(modelName, providerName = 'ollama') {
    const service = this.services[providerName];
    if (!service) return { success: false, error: 'Unknown provider' };

    try {
      // Send a lightweight request to load model into memory
      const result = await service.generate('Hi', {
        model: modelName,
        num_predict: 1,
      });

      return {
        success: result.success,
        model: modelName,
        provider: providerName,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        model: modelName,
        provider: providerName,
      };
    }
  }

  /**
   * Get optimizer statistics
   */
  getStats() {
    return {
      cache: this.cache.getStats(),
      healthCache: {
        size: this.healthCache.size,
        entries: Array.from(this.healthCache.keys()),
      },
      services: Object.keys(this.services),
    };
  }

  /**
   * Clear all caches
   */
  clearCaches() {
    this.cache = new AIResponseCache();
    this.healthCache.clear();
    logger.info('[ai-optimizer] All caches cleared');
  }

  /**
   * Create hash key for prompt caching
   */
  _hashPrompt(prompt, options) {
    const data = JSON.stringify({ prompt, options });
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * Cleanup on shutdown
   */
  dispose() {
    if (this.warmupInterval) {
      clearInterval(this.warmupInterval);
    }
    this.clearCaches();
  }
}

// Singleton instance
export const aiOptimizer = new AIOptimizer();

// Graceful shutdown
process.on('SIGTERM', () => aiOptimizer.dispose());
process.on('SIGINT', () => aiOptimizer.dispose());
