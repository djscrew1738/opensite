/**
 * useSemanticSearch Hook
 * 
 * React hook for semantic search with the Knowledge Vault API.
 * Supports pure semantic search, hybrid search, and faceted search.
 * 
 * Features:
 * - Debounced query input
 * - Loading states
 * - Error handling
 * - Result caching
 * - Pagination support
 * 
 * @example
 * ```jsx
 * const { results, loading, error, search } = useSemanticSearch();
 * 
 * useEffect(() => {
 *   search('water heater installation', { topK: 10 });
 * }, []);
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDebounce } from './useDebounce.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v2';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * @typedef {Object} SearchResult
 * @property {string} id - Result ID
 * @property {number} score - Similarity score (0-1)
 * @property {string} content - Result content
 * @property {Object} metadata - Result metadata
 * @property {string} source - Source document ID
 */

/**
 * @typedef {Object} SearchOptions
 * @property {number} [topK=10] - Number of results to return
 * @property {number} [threshold=0.6] - Minimum similarity threshold
 * @property {boolean} [useHybrid=true] - Use hybrid (vector + keyword) search
 * @property {boolean} [rerank=false] - Apply reranking
 * @property {Object} [filters={}] - Metadata filters
 * @property {string[]} [sources=[]] - Filter by source IDs
 * @property {boolean} [facets=false] - Include facet breakdown
 */

/**
 * @typedef {Object} SearchState
 * @property {SearchResult[]} results - Search results
 * @property {boolean} loading - Whether search is in progress
 * @property {string|null} error - Error message if search failed
 * @property {Object|null} facets - Facet breakdown (if requested)
 * @property {number} duration - Search duration in ms
 */

export function useSemanticSearch() {
  const [state, setState] = useState({
    results: [],
    loading: false,
    error: null,
    facets: null,
    duration: 0
  });

  // Simple in-memory cache
  const cache = useRef(new Map());

  // Clear expired cache entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of cache.current.entries()) {
        if (now - entry.timestamp > CACHE_DURATION) {
          cache.current.delete(key);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  /**
   * Perform semantic search
   * @param {string} query - Search query
   * @param {SearchOptions} options - Search options
   * @returns {Promise<SearchResult[]>}
   */
  const search = useCallback(async (query, options = {}) => {
    if (!query || query.trim().length === 0) {
      setState(prev => ({ ...prev, results: [], error: null }));
      return [];
    }

    const {
      topK = 10,
      threshold = 0.6,
      useHybrid = true,
      rerank = false,
      filters = {},
      sources = [],
      facets = false,
      useCache = true
    } = options;

    // Build cache key
    const cacheKey = JSON.stringify({
      query: query.trim().toLowerCase(),
      topK,
      threshold,
      useHybrid,
      rerank,
      filters,
      sources,
      facets
    });

    // Check cache
    if (useCache && cache.current.has(cacheKey)) {
      const cached = cache.current.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        setState({
          results: cached.data.results,
          facets: cached.data.facets || null,
          loading: false,
          error: null,
          duration: 0 // Cached results are instant
        });
        return cached.data.results;
      }
      cache.current.delete(cacheKey);
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const startTime = performance.now();

    try {
      const endpoint = useHybrid ? '/knowledge/query' : '/knowledge/search';
      const url = `${API_BASE_URL}${endpoint}`;

      const body = useHybrid
        ? { query, topK, useHybrid, rerank, filters, sources, facets }
        : { query, topK, threshold, filters, sources };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Search failed: ${response.status}`);
      }

      const data = await response.json();
      const duration = Math.round(performance.now() - startTime);

      const results = data.data?.results || [];
      const facetsData = data.data?.facets || null;

      // Update cache
      if (useCache) {
        cache.current.set(cacheKey, {
          data: { results, facets: facetsData },
          timestamp: Date.now()
        });
      }

      setState({
        results,
        facets: facetsData,
        loading: false,
        error: null,
        duration
      });

      return results;
    } catch (err) {
      const duration = Math.round(performance.now() - startTime);
      
      setState({
        results: [],
        facets: null,
        loading: false,
        error: err.message,
        duration
      });

      throw err;
    }
  }, []);

  /**
   * Clear search results and cache
   */
  const clear = useCallback(() => {
    setState({
      results: [],
      loading: false,
      error: null,
      facets: null,
      duration: 0
    });
    cache.current.clear();
  }, []);

  /**
   * Clear specific cache entry
   * @param {string} query - Query to clear from cache
   */
  const clearCache = useCallback((query) => {
    if (query) {
      for (const [key] of cache.current.entries()) {
        if (key.includes(query.toLowerCase())) {
          cache.current.delete(key);
        }
      }
    } else {
      cache.current.clear();
    }
  }, []);

  return {
    ...state,
    search,
    clear,
    clearCache,
    hasResults: state.results.length > 0,
    isCached: (query, options) => {
      const key = JSON.stringify({
        query: query.trim().toLowerCase(),
        ...options
      });
      const cached = cache.current.get(key);
      return cached && (Date.now() - cached.timestamp < CACHE_DURATION);
    }
  };
}

/**
 * Hook for debounced semantic search
 * Automatically searches when query changes (with debounce)
 * 
 * @example
 * ```jsx
 * const { query, setQuery, results, loading } = useDebouncedSemanticSearch({
 *   delay: 300,
 *   minLength: 3
 * });
 * ```
 */
export function useDebouncedSemanticSearch(options = {}) {
  const { delay = 300, minLength = 3, ...searchOptions } = options;
  
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, delay);
  const { search, ...searchState } = useSemanticSearch();

  useEffect(() => {
    if (debouncedQuery.length >= minLength) {
      search(debouncedQuery, searchOptions);
    } else if (debouncedQuery.length === 0) {
      searchState.clear();
    }
  }, [debouncedQuery, minLength, searchOptions.topK, searchOptions.useHybrid]);

  return {
    query,
    setQuery,
    ...searchState
  };
}

/**
 * Hook for knowledge base management
 * CRUD operations for knowledge entries
 */
export function useKnowledgeBase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createEntry = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to create entry');
      }

      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEntry = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/knowledge/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to update entry');
      }

      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEntry = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/knowledge/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to delete entry');
      }

      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFile = useCallback(async (file, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('autoChunk', options.autoChunk ?? true);
      formData.append('generateMetadata', options.generateMetadata ?? true);

      const response = await fetch(`${API_BASE_URL}/knowledge/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to upload file');
      }

      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStats = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/knowledge/stats`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }

    const data = await response.json();
    return data.data;
  }, []);

  return {
    loading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    uploadFile,
    getStats
  };
}

export default useSemanticSearch;
