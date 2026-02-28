import { useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

/**
 * useVirtualizedList - Hook for efficiently rendering large lists
 * 
 * Only renders items visible in the viewport, dramatically improving performance
 * for lists with hundreds or thousands of items.
 * 
 * @param {Object} options - Configuration options
 * @param {Array} options.items - Array of items to render
 * @param {number} options.itemHeight - Height of each item in pixels
 * @param {number} options.overscan - Number of items to render outside viewport (default: 5)
 * @param {string|number} options.scrollElementId - ID of scrollable container (default: window)
 * @returns {Object} Virtualization utilities and state
 * 
 * @example
 * function LargeList({ items }) {
 *   const { 
 *     containerRef, 
 *     virtualItems, 
 *     totalHeight,
 *     isScrolling 
 *   } = useVirtualizedList({ 
 *     items, 
 *     itemHeight: 60,
 *     overscan: 10 
 *   });
 * 
 *   return (
 *     <div ref={containerRef} style={{ height: '400px', overflow: 'auto' }}>
 *       <div style={{ height: totalHeight, position: 'relative' }}>
 *         {virtualItems.map((virtualItem) => (
 *           <div
 *             key={virtualItem.key}
 *             style={{
 *               position: 'absolute',
 *               top: 0,
 *               left: 0,
 *               width: '100%',
 *               height: `${virtualItem.size}px`,
 *               transform: `translateY(${virtualItem.start}px)`,
 *             }}
 *           >
 *             {items[virtualItem.index].name}
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * }
 */
export function useVirtualizedList(options) {
  const {
    items,
    itemHeight,
    overscan = 5,
    scrollElementId,
  } = options;

  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => {
      if (scrollElementId) {
        return document.getElementById(scrollElementId);
      }
      return parentRef.current;
    },
    estimateSize: () => itemHeight,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  const scrollToIndex = useCallback((index, options = {}) => {
    virtualizer.scrollToIndex(index, {
      align: 'auto',
      ...options,
    });
  }, [virtualizer]);

  const scrollToOffset = useCallback((offset, options = {}) => {
    virtualizer.scrollToOffset(offset, options);
  }, [virtualizer]);

  const measureElement = useCallback((element) => {
    virtualizer.measureElement(element);
  }, [virtualizer]);

  return useMemo(() => ({
    // Refs
    containerRef: parentRef,
    
    // Virtual items to render
    virtualItems,
    
    // Total height of all items (for spacer)
    totalHeight: totalSize,
    totalSize,
    
    // Scrolling state
    isScrolling: virtualizer.isScrolling,
    scrollOffset: virtualizer.scrollOffset,
    
    // Measurement
    measureElement,
    
    // Navigation
    scrollToIndex,
    scrollToOffset,
    
    // Raw virtualizer (for advanced use cases)
    virtualizer,
  }), [
    virtualItems,
    totalSize,
    virtualizer.isScrolling,
    virtualizer.scrollOffset,
    measureElement,
    scrollToIndex,
    scrollToOffset,
    virtualizer,
  ]);
}

/**
 * useVirtualizedGrid - Hook for efficiently rendering large grids
 * 
 * Virtualizes both rows and columns for grid layouts.
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.rowCount - Number of rows
 * @param {number} options.columnCount - Number of columns
 * @param {number} options.rowHeight - Height of each row
 * @param {number} options.columnWidth - Width of each column
 * @param {number} options.overscan - Number of items to render outside viewport (default: 2)
 * @returns {Object} Grid virtualization utilities
 * 
 * @example
 * function VirtualGrid({ data, columns }) {
 *   const { containerRef, virtualRows, virtualColumns, totalHeight, totalWidth } = 
 *     useVirtualizedGrid({
 *       rowCount: data.length,
 *       columnCount: columns.length,
 *       rowHeight: 50,
 *       columnWidth: 150,
 *     });
 * 
 *   return (
 *     <div ref={containerRef} style={{ height: '500px', overflow: 'auto' }}>
 *       <div style={{ height: totalHeight, width: totalWidth, position: 'relative' }}>
 *         {virtualRows.map(virtualRow =>
 *           virtualColumns.map(virtualColumn => {
 *             const item = data[virtualRow.index][columns[virtualColumn.index].key];
 *             return (
 *               <div
 *                 key={`${virtualRow.key}-${virtualColumn.key}`}
 *                 style={{
 *                   position: 'absolute',
 *                   top: 0,
 *                   left: 0,
 *                   height: virtualRow.size,
 *                   width: virtualColumn.size,
 *                   transform: `translate(${virtualColumn.start}px, ${virtualRow.start}px)`,
 *                 }}
 *               >
 *                 {item}
 *               </div>
 *             );
 *           })
 *         )}
 *       </div>
 *     </div>
 *   );
 * }
 */
export function useVirtualizedGrid(options) {
  const {
    rowCount,
    columnCount,
    rowHeight,
    columnWidth,
    overscan = 2,
  } = options;

  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  const columnVirtualizer = useVirtualizer({
    count: columnCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => columnWidth,
    horizontal: true,
    overscan,
  });

  return useMemo(() => ({
    containerRef: parentRef,
    virtualRows: rowVirtualizer.getVirtualItems(),
    virtualColumns: columnVirtualizer.getVirtualItems(),
    totalHeight: rowVirtualizer.getTotalSize(),
    totalWidth: columnVirtualizer.getTotalSize(),
    rowVirtualizer,
    columnVirtualizer,
  }), [
    rowVirtualizer,
    columnVirtualizer,
  ]);
}

/**
 * useDynamicVirtualizedList - Hook for lists with variable item heights
 * 
 * Similar to useVirtualizedList but measures each item's actual height
 * instead of using a fixed estimate.
 * 
 * @param {Object} options - Configuration options
 * @param {Array} options.items - Array of items to render
 * @param {number} options.estimateHeight - Estimated height for initial calculation
 * @param {number} options.overscan - Number of items to render outside viewport (default: 5)
 * @returns {Object} Virtualization utilities for dynamic heights
 * 
 * @example
 * function ChatList({ messages }) {
 *   const { containerRef, virtualItems, totalHeight, measureElement } = 
 *     useDynamicVirtualizedList({
 *       items: messages,
 *       estimateHeight: 60,
 *     });
 * 
 *   return (
 *     <div ref={containerRef} style={{ height: '500px', overflow: 'auto' }}>
 *       <div style={{ height: totalHeight, position: 'relative' }}>
 *         {virtualItems.map((virtualItem) => (
 *           <div
 *             key={virtualItem.key}
 *             ref={measureElement}
 *             data-index={virtualItem.index}
 *             style={{
 *               position: 'absolute',
 *               top: 0,
 *               left: 0,
 *               width: '100%',
 *               transform: `translateY(${virtualItem.start}px)`,
 *             }}
 *           >
 *             <ChatMessage message={messages[virtualItem.index]} />
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * }
 */
export function useDynamicVirtualizedList(options) {
  const {
    items,
    estimateHeight,
    overscan = 5,
  } = options;

  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateHeight,
    overscan,
    measureElement: (element) => {
      // Use the actual measured height
      return element.getBoundingClientRect().height;
    },
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  const measureElement = useCallback((element) => {
    if (element) {
      virtualizer.measureElement(element);
    }
  }, [virtualizer]);

  const scrollToIndex = useCallback((index, options = {}) => {
    virtualizer.scrollToIndex(index, {
      align: 'auto',
      ...options,
    });
  }, [virtualizer]);

  return useMemo(() => ({
    containerRef: parentRef,
    virtualItems,
    totalHeight: totalSize,
    totalSize,
    measureElement,
    scrollToIndex,
    scrollOffset: virtualizer.scrollOffset,
    isScrolling: virtualizer.isScrolling,
    virtualizer,
  }), [
    virtualItems,
    totalSize,
    measureElement,
    scrollToIndex,
    virtualizer.scrollOffset,
    virtualizer.isScrolling,
    virtualizer,
  ]);
}

/**
 * useInfiniteVirtualizedList - Combines virtualization with infinite scrolling
 * 
 * @param {Object} options - Configuration options
 * @param {Array} options.items - Current items
 * @param {number} options.itemHeight - Height of each item
 * @param {boolean} options.hasMore - Whether there are more items to load
 * @param {Function} options.onLoadMore - Callback when more items should be loaded
 * @param {number} options.loadMoreThreshold - Pixels from bottom to trigger load (default: 200)
 * @returns {Object} Virtualization + infinite scroll utilities
 */
export function useInfiniteVirtualizedList(options) {
  const {
    items,
    itemHeight,
    hasMore,
    onLoadMore,
    loadMoreThreshold = 200,
    overscan = 5,
  } = options;

  const {
    containerRef,
    virtualItems,
    totalHeight,
    scrollOffset,
    isScrolling,
    scrollToIndex,
  } = useVirtualizedList({
    items,
    itemHeight,
    overscan,
  });

  // Trigger load more when scrolling near the end
  const prevLoadingRef = useRef(false);
  
  const checkLoadMore = useCallback(() => {
    if (!hasMore || prevLoadingRef.current) return;
    
    const scrollElement = containerRef.current;
    if (!scrollElement) return;

    const { scrollHeight, clientHeight, scrollTop } = scrollElement;
    const scrollBottom = scrollTop + clientHeight;
    const threshold = scrollHeight - loadMoreThreshold;

    if (scrollBottom >= threshold) {
      prevLoadingRef.current = true;
      onLoadMore?.();
      // Reset after a delay to prevent multiple triggers
      setTimeout(() => {
        prevLoadingRef.current = false;
      }, 500);
    }
  }, [hasMore, onLoadMore, loadMoreThreshold, containerRef]);

  return useMemo(() => ({
    containerRef,
    virtualItems,
    totalHeight,
    scrollOffset,
    isScrolling,
    scrollToIndex,
    checkLoadMore,
  }), [
    containerRef,
    virtualItems,
    totalHeight,
    scrollOffset,
    isScrolling,
    scrollToIndex,
    checkLoadMore,
  ]);
}
