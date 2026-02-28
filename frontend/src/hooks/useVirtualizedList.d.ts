/**
 * TypeScript definitions for useVirtualizedList hooks
 */

import { RefObject } from 'react';
import { VirtualItem, Virtualizer } from '@tanstack/react-virtual';

/**
 * Options for useVirtualizedList
 */
export interface UseVirtualizedListOptions<T> {
  /** Array of items to virtualize */
  items: T[];
  /** Height of each item in pixels */
  itemHeight: number;
  /** Number of items to render outside viewport (default: 5) */
  overscan?: number;
  /** ID of scrollable container (default: uses containerRef) */
  scrollElementId?: string;
}

/**
 * Return type for useVirtualizedList
 */
export interface UseVirtualizedListReturn<T> {
  /** Ref for the scroll container */
  containerRef: RefObject<HTMLDivElement>;
  /** Virtual items to render */
  virtualItems: VirtualItem[];
  /** Total height of all items */
  totalHeight: number;
  /** Alias for totalHeight */
  totalSize: number;
  /** Whether the user is scrolling */
  isScrolling: boolean;
  /** Current scroll offset */
  scrollOffset: number;
  /** Measure an element (for dynamic heights) */
  measureElement: (element: HTMLElement | null) => void;
  /** Scroll to specific index */
  scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' }) => void;
  /** Scroll to specific offset */
  scrollToOffset: (offset: number, options?: { align?: 'start' | 'center' | 'end' }) => void;
  /** Raw virtualizer instance (for advanced use) */
  virtualizer: Virtualizer<HTMLDivElement, HTMLElement>;
}

/**
 * Options for useDynamicVirtualizedList
 */
export interface UseDynamicVirtualizedListOptions<T> {
  /** Array of items to virtualize */
  items: T[];
  /** Estimated height for initial calculation */
  estimateHeight: number;
  /** Number of items to render outside viewport (default: 5) */
  overscan?: number;
}

/**
 * Return type for useDynamicVirtualizedList
 */
export interface UseDynamicVirtualizedListReturn<T> 
  extends UseVirtualizedListReturn<T> {
  /** Measure an element's actual height */
  measureElement: (element: HTMLElement | null) => void;
}

/**
 * Options for useInfiniteVirtualizedList
 */
export interface UseInfiniteVirtualizedListOptions<T> {
  /** Array of items */
  items: T[];
  /** Height of each item */
  itemHeight: number;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Callback to load more items */
  onLoadMore: () => void;
  /** Pixels from bottom to trigger load (default: 200) */
  loadMoreThreshold?: number;
  /** Number of items to render outside viewport (default: 5) */
  overscan?: number;
}

/**
 * Return type for useInfiniteVirtualizedList
 */
export interface UseInfiniteVirtualizedListReturn<T> 
  extends UseVirtualizedListReturn<T> {
  /** Check if should load more (call in scroll handler) */
  checkLoadMore: () => void;
}

/**
 * Options for useVirtualizedGrid
 */
export interface UseVirtualizedGridOptions {
  /** Number of rows */
  rowCount: number;
  /** Number of columns */
  columnCount: number;
  /** Height of each row */
  rowHeight: number;
  /** Width of each column */
  columnWidth: number;
  /** Number of items to render outside viewport (default: 2) */
  overscan?: number;
}

/**
 * Return type for useVirtualizedGrid
 */
export interface UseVirtualizedGridReturn {
  /** Ref for the scroll container */
  containerRef: RefObject<HTMLDivElement>;
  /** Virtual rows */
  virtualRows: VirtualItem[];
  /** Virtual columns */
  virtualColumns: VirtualItem[];
  /** Total height */
  totalHeight: number;
  /** Total width */
  totalWidth: number;
}

/**
 * Hook for virtualizing a list with fixed item heights
 * Renders only visible items + overscan buffer
 */
export function useVirtualizedList<T>(
  options: UseVirtualizedListOptions<T>
): UseVirtualizedListReturn<T>;

/**
 * Hook for virtualizing a grid (2D virtualization)
 */
export function useVirtualizedGrid(
  options: UseVirtualizedGridOptions
): UseVirtualizedGridReturn;

/**
 * Hook for virtualizing a list with dynamic item heights
 */
export function useDynamicVirtualizedList<T>(
  options: UseDynamicVirtualizedListOptions<T>
): UseDynamicVirtualizedListReturn<T>;

/**
 * Hook combining virtualization with infinite scroll
 */
export function useInfiniteVirtualizedList<T>(
  options: UseInfiniteVirtualizedListOptions<T>
): UseInfiniteVirtualizedListReturn<T>;
