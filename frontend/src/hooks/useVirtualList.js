import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

/**
 * Simple virtual list hook for rendering large lists efficiently
 * Only renders items visible in the viewport + buffer
 * 
 * @param {Array} items - Full list of items to virtualize
 * @param {Object} options - Configuration options
 * @param {number} options.itemHeight - Height of each item in pixels
 * @param {number} options.overscan - Number of items to render outside viewport (default: 5)
 * @param {number} options.containerHeight - Height of the scroll container
 * @returns {Object} Virtual list state and helpers
 */
export function useVirtualList(items, options = {}) {
  const { 
    itemHeight = 80, 
    overscan = 5, 
    containerHeight = 400 
  } = options || {};
  
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  
  // Calculate visible range
  const virtualItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
    const endIndex = Math.min(items.length, startIndex + visibleCount);
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      style: {
        position: 'absolute',
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        left: 0,
        right: 0,
      },
    }));
  }, [items, scrollTop, itemHeight, overscan, containerHeight]);
  
  // Total height of the scrollable area
  const totalHeight = useMemo(() => 
    (items?.length || 0) * itemHeight,
    [items, itemHeight]
  );
  
  // Scroll handler with RAF throttling
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);
  
  // Scroll to index helper
  const scrollToIndex = useCallback((index) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = index * itemHeight;
    }
  }, [itemHeight]);
  
  // Auto-scroll to selected item when items change
  useEffect(() => {
    // This can be used to scroll to a selected item
  }, [items]);
  
  return {
    containerRef,
    virtualItems,
    totalHeight,
    handleScroll,
    scrollToIndex,
    scrollTop,
  };
}

/**
 * Window virtual list - uses window as scroll container
 * Good for full-page lists
 */
export function useWindowVirtualList(items, options = {}) {
  const { itemHeight = 80, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  
  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    const handleScroll = () => setScrollTop(window.scrollY);
    
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  const virtualItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(windowHeight / itemHeight) + overscan * 2;
    const endIndex = Math.min(items.length, startIndex + visibleCount);
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      style: {
        position: 'absolute',
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        left: 0,
        right: 0,
      },
    }));
  }, [items, scrollTop, itemHeight, overscan, windowHeight]);
  
  const totalHeight = useMemo(() => 
    (items?.length || 0) * itemHeight,
    [items, itemHeight]
  );
  
  return {
    virtualItems,
    totalHeight,
  };
}

export default useVirtualList;
