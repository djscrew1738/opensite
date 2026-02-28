import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useDebounce - Delays updating a value until after a specified delay
 * 
 * Useful for search inputs, form validation, and any scenario where you want
 * to wait for user input to settle before triggering expensive operations.
 * 
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {any} The debounced value
 * 
 * @example
 * // Search input with debouncing
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   // This only runs 500ms after the user stops typing
 *   fetchSearchResults(debouncedSearch);
 * }, [debouncedSearch]);
 * 
 * <input 
 *   value={searchTerm} 
 *   onChange={(e) => setSearchTerm(e.target.value)} 
 * />
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedCallback - Returns a debounced version of the provided callback
 * 
 * Useful when you need to debounce a function directly rather than a value.
 * The callback will only execute after the specified delay has passed since
 * the last call.
 * 
 * @param {Function} callback - The function to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @param {Array} deps - Dependencies array for the callback
 * @returns {Function} The debounced callback
 * 
 * @example
 * // API call with debouncing
 * const debouncedSearch = useDebouncedCallback(
 *   async (query) => {
 *     const results = await api.search(query);
 *     setResults(results);
 *   },
 *   500,
 *   [setResults]
 * );
 * 
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 */
export function useDebouncedCallback(callback, delay = 300, deps = []) {
  const timeoutRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [delay, ...deps]
  );
}

/**
 * useDebouncedState - Like useState but with built-in debouncing
 * 
 * Combines useState and useDebounce for a simpler API when you need both
 * the immediate value and the debounced value.
 * 
 * @param {any} initialValue - Initial state value
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {[any, any, Function]} [immediateValue, debouncedValue, setValue]
 * 
 * @example
 * const [searchInput, debouncedSearch, setSearch] = useDebouncedState('', 500);
 * 
 * // Use searchInput for controlled input (updates immediately)
 * <input value={searchInput} onChange={(e) => setSearch(e.target.value)} />
 * 
 * // Use debouncedSearch for API calls (updates after delay)
 * useEffect(() => {
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebouncedState(initialValue, delay = 300) {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, delay);

  return [value, debouncedValue, setValue];
}

/**
 * useDebouncedFetch - Hook for making debounced API requests
 * 
 * Automatically handles loading states, error handling, and request cancellation.
 * New requests cancel pending ones to prevent race conditions.
 * 
 * @param {Function} fetchFn - Async function that performs the fetch
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {Object} { data, loading, error, execute, cancel }
 * 
 * @example
 * const { data, loading, error, execute } = useDebouncedFetch(
 *   async (query) => api.searchPermits(query),
 *   500
 * );
 * 
 * // Trigger search
 * execute('search term');
 * 
 * // In render
 * {loading && <Spinner />}
 * {data && <Results items={data} />}
 * {error && <Error message={error.message} />}
 */
export function useDebouncedFetch(fetchFn, delay = 300) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);

  const execute = useCallback(
    (...args) => {
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Set loading state immediately for better UX
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Debounce the actual request
      timeoutRef.current = setTimeout(async () => {
        abortControllerRef.current = new AbortController();

        try {
          const result = await fetchFn(...args, {
            signal: abortControllerRef.current.signal,
          });
          setState({ data: result, loading: false, error: null });
        } catch (err) {
          if (err.name !== 'AbortError') {
            setState(prev => ({ ...prev, loading: false, error: err }));
          }
        }
      }, delay);
    },
    [fetchFn, delay]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(prev => ({ ...prev, loading: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    ...state,
    execute,
    cancel,
  };
}
