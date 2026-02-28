/**
 * TypeScript definitions for useMemoizedCallback hooks
 */

import { DependencyList } from 'react';

/**
 * Creates a stable callback reference that doesn't change when dependencies change
 * @param callback - The callback function
 * @returns A stable callback reference
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T
): T;

/**
 * Similar to useMemoizedCallback but with better naming for event handlers
 * @param handler - The event handler
 * @returns Stable handler reference with latest closure
 */
export function useEventCallback<T extends (...args: any[]) => any>(
  handler: T
): T;

/**
 * Memoizes a value with deep equality checking
 * @param value - The value to memoize
 * @returns The memoized value
 */
export function useMemoizedValue<T>(value: T): T;

/**
 * Memoizes a selector function result (Redux-style)
 * @param selector - Function that extracts/computes values
 * @param deps - Dependencies that trigger recalculation
 * @returns The memoized selection result
 */
export function useMemoizedSelector<T, R>(
  selector: (deps: T) => R,
  deps: T
): R;

/**
 * Custom comparison function type for deep equality
 */
export type DeepEqualFn = (a: any, b: any) => boolean;

/**
 * Configuration options for memoization hooks
 */
export interface MemoizationOptions {
  /** Custom equality function */
  isEqual?: DeepEqualFn;
  /** Maximum cache size for LRU caching */
  maxSize?: number;
}
