// Cache Service using node-cache
// In-memory caching with TTL and automatic cleanup

import NodeCache from 'node-cache';
import logger from './logger.js';

class CacheService {
  constructor() {
    // Main cache - 15 minute TTL, check every 3 minutes
    this.cache = new NodeCache({
      stdTTL: 900,
      checkperiod: 180,
      useClones: false,
      maxKeys: 5000
    });

    // Short-term cache for API responses - 2 minute TTL
    this.apiCache = new NodeCache({
      stdTTL: 120,
      checkperiod: 60,
      useClones: false,
      maxKeys: 2000
    });

    // Long-term cache for static data - 2 hour TTL
    this.staticCache = new NodeCache({
      stdTTL: 7200,
      checkperiod: 900,
      useClones: false,
      maxKeys: 1000
    });

    // Setup event listeners
    this.cache.on('expired', (key, value) => {
      logger.debug(`Cache key expired: ${key}`);
    });

    this.cache.on('del', (key, value) => {
      logger.debug(`Cache key deleted: ${key}`);
    });

    logger.info('✅ Cache service initialized');
  }

  // Main cache operations
  get(key) {
    const value = this.cache.get(key);
    if (value !== undefined) {
      logger.debug(`Cache hit: ${key}`);
    } else {
      logger.debug(`Cache miss: ${key}`);
    }
    return value;
  }

  set(key, value, ttl = null) {
    const success = ttl ? this.cache.set(key, value, ttl) : this.cache.set(key, value);
    if (success) {
      logger.debug(`Cache set: ${key}`);
    }
    return success;
  }

  del(key) {
    const count = this.cache.del(key);
    if (count > 0) {
      logger.debug(`Cache deleted: ${key}`);
    }
    return count;
  }

  // API cache operations (short TTL)
  getApi(key) {
    return this.apiCache.get(key);
  }

  setApi(key, value, ttl = null) {
    return ttl ? this.apiCache.set(key, value, ttl) : this.apiCache.set(key, value);
  }

  delApi(key) {
    return this.apiCache.del(key);
  }

  // Static cache operations (long TTL)
  getStatic(key) {
    return this.staticCache.get(key);
  }

  setStatic(key, value, ttl = null) {
    return ttl ? this.staticCache.set(key, value, ttl) : this.staticCache.set(key, value);
  }

  delStatic(key) {
    return this.staticCache.del(key);
  }

  // Flush operations
  flush() {
    this.cache.flushAll();
    this.apiCache.flushAll();
    this.staticCache.flushAll();
    logger.info('All caches flushed');
  }

  flushMain() {
    this.cache.flushAll();
    logger.info('Main cache flushed');
  }

  flushApi() {
    this.apiCache.flushAll();
    logger.info('API cache flushed');
  }

  flushStatic() {
    this.staticCache.flushAll();
    logger.info('Static cache flushed');
  }

  // Pattern-based deletion
  delPattern(pattern) {
    const regex = new RegExp(pattern);
    const keys = this.cache.keys();
    let deleted = 0;

    keys.forEach(key => {
      if (regex.test(key)) {
        this.cache.del(key);
        deleted++;
      }
    });

    logger.info(`Deleted ${deleted} keys matching pattern: ${pattern}`);
    return deleted;
  }

  // Get cache statistics
  getStats() {
    return {
      main: this.cache.getStats(),
      api: this.apiCache.getStats(),
      static: this.staticCache.getStats()
    };
  }

  // Get all keys
  getKeys() {
    return {
      main: this.cache.keys(),
      api: this.apiCache.keys(),
      static: this.staticCache.keys()
    };
  }

  // Cache middleware for Express
  middleware(ttl = 60) {
    return (req, res, next) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      const key = `api:${req.originalUrl || req.url}`;
      const cachedResponse = this.getApi(key);

      if (cachedResponse) {
        logger.debug(`Serving cached response for: ${key}`);
        return res.json(cachedResponse);
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = (body) => {
        this.setApi(key, body, ttl);
        return originalJson(body);
      };

      next();
    };
  }
}

// Singleton instance
export const cache = new CacheService();
export default cache;
