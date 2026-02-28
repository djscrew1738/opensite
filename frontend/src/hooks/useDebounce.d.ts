/**
 * TypeScript definitions for useDebounce hooks
 */

import { DependencyList } from 'react';

/**
 * Options for useDebouncedFetch
 */
export interface UseDebouncedFetchOptions {
  /** Signal for request cancellation */
  signal?: AbortSignal;
}

/**
 * Return type for useDebouncedFetch
 */
export interface UseDebouncedFetchReturn<T> {
  /** Fetched data */
  data: T | null;
  /** Loading state */
  loading: boolean;
  /** Error if request failed */
  error: Error | null;
  /** Execute the fetch with given arguments */
  execute: (...args: any[]) => void;
  /** Cancel pending fetch */
  cancel: () => void;
}

/**
 * Debounces a value, returning the debounced version after specified delay
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns The debounced value
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 500);
 */
export function useDebounce<T>(value: T, delay?: number): T;

/**
 * Returns a debounced version of the provided callback
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @param deps - Dependencies array for the callback
 * @returns The debounced callback
 * 
 * @example
 * const debouncedSearch = useDebouncedCallback(
 *   async (query: string) => { ... },
 *   500
 * );
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay?: number,
  deps?: DependencyList
): T;

/**
 * Combined state and debounce hook
 * @param initialValue - Initial state value
 * @param delay - Delay in milliseconds (default: 300)
 * @returns [immediateValue, debouncedValue, setValue]
 * 
 * @example
 * const [searchInput, debouncedSearch, setSearch] = useDebouncedState('', 500);
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay?: number
): [T, T, React.Dispatch<React.SetStateAction<T>>];

/**
 * Hook for making debounced API requests with auto-cancellation
 * @param fetchFn - Async function that performs the fetch
 * @param delay - Delay in milliseconds (default: 300)
 * @returns Object with data, loading, error, execute, and cancel
 * 
 * @example
 * const { data, loading, error, execute } = useDebouncedFetch(
 *   async (query: string) => api.search(query),
 *   500
 * );
 */
export function useDebouncedFetch<T>(
  fetchFn: (query: string, options?: UseDebouncedFetchOptions) => Promise<T>,
  delay?: number
): UseDebouncedFetchReturn<T>;
