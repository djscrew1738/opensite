// Cache Service using node-cache
// In-memory caching with TTL — memory-bounded

import NodeCache from 'node-cache';
import logger from './logger.js';

class CacheService {
  constructor() {
    // Main cache — 10 min TTL, 500 max keys (was 5000)
    this.cache = new NodeCache({
      stdTTL: 600,
      checkperiod: 120,
      useClones: false,
      maxKeys: 500
    });

    // API response cache — 1 min TTL, 200 max keys (was 2000)
    this.apiCache = new NodeCache({
      stdTTL: 60,
      checkperiod: 30,
      useClones: false,
      maxKeys: 200
    });

    // Static cache — 1 hour TTL, 200 max keys (was 1000)
    this.staticCache = new NodeCache({
      stdTTL: 3600,
      checkperiod: 300,
      useClones: false,
      maxKeys: 200
    });

    logger.info('Cache service initialized (low-memory mode)');
  }

  // Main cache operations
  get(key) {
    return this.cache.get(key);
  }

  set(key, value, ttl = null) {
    return ttl ? this.cache.set(key, value, ttl) : this.cache.set(key, value);
  }

  del(key) {
    return this.cache.del(key);
  }

  // API cache operations
  getApi(key) {
    return this.apiCache.get(key);
  }

  setApi(key, value, ttl = null) {
    return ttl ? this.apiCache.set(key, value, ttl) : this.apiCache.set(key, value);
  }

  delApi(key) {
    return this.apiCache.del(key);
  }

  // Static cache operations
  getStatic(key) {
    return this.staticCache.get(key);
  }

  setStatic(key, value, ttl = null) {
    return ttl ? this.staticCache.set(key, value, ttl) : this.staticCache.set(key, value);
  }

  delStatic(key) {
    return this.staticCache.del(key);
  }

  // Flush
  flush() {
    this.cache.flushAll();
    this.apiCache.flushAll();
    this.staticCache.flushAll();
    logger.info('All caches flushed');
  }

  flushMain() { this.cache.flushAll(); }
  flushApi() { this.apiCache.flushAll(); }
  flushStatic() { this.staticCache.flushAll(); }

  // Pattern-based deletion
  delPattern(pattern) {
    const regex = new RegExp(pattern);
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) { this.cache.del(key); deleted++; }
    }
    return deleted;
  }

  // Stats
  getStats() {
    return {
      main: { ...this.cache.getStats(), keys: this.cache.keys().length },
      api: { ...this.apiCache.getStats(), keys: this.apiCache.keys().length },
      static: { ...this.staticCache.getStats(), keys: this.staticCache.keys().length }
    };
  }

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
      if (req.method !== 'GET') return next();

      const key = `api:${req.originalUrl || req.url}`;
      const cached = this.getApi(key);

      if (cached) {
        return res.json(cached);
      }

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        this.setApi(key, body, ttl);
        return originalJson(body);
      };

      next();
    };
  }
}

export const cache = new CacheService();
export default cache;
