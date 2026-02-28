/**
 * ADVANCED UI/UX PATTERNS
 * 
 * Sophisticated patterns combining multiple optimization techniques
 * for complex scenarios.
 */

import { 
  useState, 
  useCallback, 
  useMemo, 
  useRef, 
  useEffect,
  memo,
  useTransition,
  startTransition 
} from 'react';
import { useDebounce, useDebouncedCallback } from '../hooks/useDebounce';
import { useVirtualizedList } from '../hooks/useVirtualizedList';
import { useHydration } from '../hooks/useHydration';
import { useMemoizedCallback, useEventCallback } from '../hooks/useMemoizedCallback';

// ═════════════════════════════════════════════════════════════════════════════
// PATTERN 1: COMBINING useTransition WITH DEBOUNCING
// ═════════════════════════════════════════════════════════════════════════════

/**
 * SearchWithTransition - Combines React 18 useTransition with debouncing
 * for the ultimate smooth search experience
 * 
 * Benefits:
 * - Input stays responsive (useTransition keeps UI thread free)
 * - Search results update smoothly (no jank)
 * - API calls are debounced (fewer requests)
 */
function SearchWithTransition({ onSearch }) {
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // Debounce the actual API call
  const debouncedSearch = useDebouncedCallback(
    (query) => {
      onSearch?.(query);
    },
    300
  );

  const handleChange = (e) => {
    const value = e.target.value;
    
    // Update input immediately (urgent)
    setInputValue(value);
    
    // Transition the search query (non-urgent)
    startTransition(() => {
      setSearchQuery(value);
      debouncedSearch(value);
    });
  };

  return (
    <div>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="Search (with useTransition)..."
        style={{
          opacity: isPending ? 0.7 : 1,
        }}
      />
      {isPending && <span className="spinner" />}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PATTERN 2: VIRTUALIZED + FILTERED + SORTED LIST
// ═════════════════════════════════════════════════════════════════════════════

/**
 * SmartDataTable - Virtualized table with live filtering and sorting
 * Handles 100,000+ rows smoothly
 */
function SmartDataTable({ data, columns }) {
  const [filterText, setFilterText] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Debounce the filter text
  const debouncedFilter = useDebounce(filterText, 200);

  // Memoize the filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply filter
    if (debouncedFilter) {
      const query = debouncedFilter.toLowerCase();
      result = result.filter(row =>
        columns.some(col => 
          String(row[col.key]).toLowerCase().includes(query)
        )
      );
    }

    // Apply sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, debouncedFilter, sortConfig, columns]);

  // Virtualize the processed data
  const {
    containerRef,
    virtualItems,
    totalHeight,
  } = useVirtualizedList({
    items: processedData,
    itemHeight: 48,
    overscan: 10,
  });

  const handleSort = useCallback((key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' 
        ? 'desc' 
        : 'asc',
    }));
  }, []);

  return (
    <div className="smart-table">
      <input
        type="text"
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        placeholder="Filter all columns..."
      />
      
      <div className="table-stats">
        Showing {processedData.length} of {data.length} rows
      </div>

      {/* Header */}
      <div className="table-header">
        {columns.map(col => (
          <button
            key={col.key}
            onClick={() => handleSort(col.key)}
            className={sortConfig.key === col.key ? 'sorted' : ''}
          >
            {col.label}
            {sortConfig.key === col.key && (
              sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
            )}
          </button>
        ))}
      </div>

      {/* Virtualized body */}
      <div
        ref={containerRef}
        className="table-body"
        style={{ height: '500px', overflow: 'auto' }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {virtualItems.map((virtualRow) => {
            const row = processedData[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                className="table-row"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {columns.map(col => (
                  <div key={col.key} className="table-cell">
                    {row[col.key]}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PATTERN 3: INTERSECTION OBSERVER + LAZY LOADING + VIRTUALIZATION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LazyImageGrid - Virtualized grid with lazy image loading
 * Images only load when they enter the viewport
 */
function LazyImageGrid({ items }) {
  const containerRef = useRef(null);
  const imageRefs = useRef(new Map());

  // Set up intersection observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    imageRefs.current.forEach(img => observer.observe(img));

    return () => observer.disconnect();
  }, []);

  const {
    containerRef: virtualContainerRef,
    virtualItems,
    totalHeight,
  } = useVirtualizedList({
    items,
    itemHeight: 200,
    overscan: 3,
  });

  // Merge refs
  const setRefs = useCallback((element) => {
    containerRef.current = element;
    virtualContainerRef.current = element;
  }, [virtualContainerRef]);

  return (
    <div
      ref={setRefs}
      className="lazy-image-grid"
      style={{ height: '600px', overflow: 'auto' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              className="grid-item"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <img
                ref={(el) => {
                  if (el) imageRefs.current.set(item.id, el);
                }}
                data-src={item.imageUrl}
                alt={item.name}
                className="lazy-image"
              />
              <div className="item-name">{item.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PATTERN 4: REQUEST DEDUPLICATION WITH DEBOUNCING
// ═════════════════════════════════════════════════════════════════════════════

/**
 * useDedupedFetch - Hook that deduplicates identical concurrent requests
 * Combines debouncing with request deduplication for maximum efficiency
 */
function useDedupedFetch(fetchFn, delay = 300) {
  const pendingRequests = useRef(new Map());
  const debouncedFetch = useDebouncedCallback(
    async (key, ...args) => {
      // Check if identical request is already in flight
      if (pendingRequests.current.has(key)) {
        return pendingRequests.current.get(key);
      }

      // Create new request
      const promise = fetchFn(...args);
      pendingRequests.current.set(key, promise);

      try {
        const result = await promise;
        return result;
      } finally {
        pendingRequests.current.delete(key);
      }
    },
    delay
  );

  return debouncedFetch;
}

// Usage example
function SearchWithDeduping() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const dedupedSearch = useDedupedFetch(
    async (searchQuery) => {
      const response = await fetch(`/api/search?q=${searchQuery}`);
      return response.json();
    },
    300
  );

  const handleChange = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim()) {
      const data = await dedupedSearch(value, value);
      setResults(data);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search (with deduplication)..."
      />
      <ResultsList results={results} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PATTERN 5: PREFETCHING ON HOVER
// ═════════════════════════════════════════════════════════════════════════════

/**
 * PrefetchLink - Link that prefetches data on hover
 * Combines debouncing to avoid excessive prefetches
 */
function PrefetchLink({ href, children, prefetchData }) {
  const prefetchTimeout = useRef(null);

  // Debounced prefetch - only prefetch if user hovers for 100ms+
  const debouncedPrefetch = useDebouncedCallback(
    () => {
      console.log('[Prefetch] Loading:', href);
      prefetchData?.();
    },
    100
  );

  const handleMouseEnter = () => {
    debouncedPrefetch();
  };

  const handleMouseLeave = () => {
    // Cancel prefetch if user leaves before delay
    debouncedPrefetch.cancel?.();
  };

  return (
    <a
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="prefetch-link"
    >
      {children}
    </a>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PATTERN 6: OFFSCREEN CANVAS RENDERING
// ═════════════════════════════════════════════════════════════════════════════

/**
 * useOffscreenRender - Renders expensive content offscreen
 * Uses requestIdleCallback for non-critical rendering
 */
function useOffscreenRender(renderFn, deps) {
  const [rendered, setRendered] = useState(null);
  const isHydrated = useHydration();

  useEffect(() => {
    if (!isHydrated) return;

    let cancelled = false;

    const scheduleRender = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          if (!cancelled) {
            setRendered(renderFn());
          }
        }, { timeout: 2000 });
      } else {
        setTimeout(() => {
          if (!cancelled) {
            setRendered(renderFn());
          }
        }, 100);
      }
    };

    scheduleRender();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, ...deps]);

  return rendered;
}

// Usage
function ExpensiveChart({ data }) {
  const chartContent = useOffscreenRender(
    () => computeComplexChart(data),
    [data]
  );

  if (!chartContent) {
    return <ChartSkeleton />;
  }

  return <div className="chart">{chartContent}</div>;
}

// ═════════════════════════════════════════════════════════════════════════════
// PATTERN 7: WORKER OFFLOADING FOR HEAVY COMPUTATIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * useWorkerComputation - Offloads heavy work to Web Worker
 */
function useWorkerComputation(workerScript) {
  const workerRef = useRef(null);
  const callbacks = useRef(new Map());

  useEffect(() => {
    workerRef.current = new Worker(workerScript);
    
    workerRef.current.onmessage = (e) => {
      const { id, result, error } = e.data;
      const callback = callbacks.current.get(id);
      
      if (callback) {
        if (error) {
          callback.reject(new Error(error));
        } else {
          callback.resolve(result);
        }
        callbacks.current.delete(id);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [workerScript]);

  const compute = useCallback((data) => {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substr(2, 9);
      callbacks.current.set(id, { resolve, reject });
      workerRef.current?.postMessage({ id, data });
    });
  }, []);

  return compute;
}

// ═════════════════════════════════════════════════════════════════════════════
// PATTERN 8: VIRTUAL SCROLLING WITH STICKY HEADERS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GroupedVirtualList - Virtualized list with sticky section headers
 */
function GroupedVirtualList({ groups }) {
  // Flatten groups for virtualization while tracking section boundaries
  const { items, sectionBoundaries } = useMemo(() => {
    const flat = [];
    const boundaries = [];
    let index = 0;

    groups.forEach((group, groupIndex) => {
      boundaries.push({ index, title: group.title });
      
      // Add header
      flat.push({ type: 'header', title: group.title, groupIndex });
      index++;
      
      // Add items
      group.items.forEach(item => {
        flat.push({ type: 'item', data: item });
        index++;
      });
    });

    return { items: flat, sectionBoundaries: boundaries };
  }, [groups]);

  const {
    containerRef,
    virtualItems,
    totalHeight,
    scrollOffset,
  } = useVirtualizedList({
    items,
    itemHeight: 48,
    overscan: 5,
  });

  // Find current sticky header
  const stickyHeader = useMemo(() => {
    for (let i = sectionBoundaries.length - 1; i >= 0; i--) {
      const boundary = sectionBoundaries[i];
      const itemTop = boundary.index * 48;
      
      if (scrollOffset >= itemTop) {
        return boundary;
      }
    }
    return null;
  }, [scrollOffset, sectionBoundaries]);

  return (
    <div
      ref={containerRef}
      style={{ height: '500px', overflow: 'auto', position: 'relative' }}
    >
      {/* Sticky Header */}
      {stickyHeader && (
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: '#f3f4f6',
            padding: '12px 16px',
            fontWeight: 'bold',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          {stickyHeader.title}
        </div>
      )}

      {/* Virtual Items */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          
          if (item.type === 'header') {
            return null; // Skip headers, handled by sticky
          }

          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
                padding: '12px 16px',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              {item.data.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// UTILITY COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

function ResultsList({ results }) {
  return (
    <ul>
      {results.map((r, i) => (
        <li key={i}>{r.name || r}</li>
      ))}
    </ul>
  );
}

function ChartSkeleton() {
  return <div>Loading chart...</div>;
}

function computeComplexChart(data) {
  // Expensive computation simulation
  return `Chart with ${data.length} points`;
}

// Export all patterns
export {
  SearchWithTransition,
  SmartDataTable,
  LazyImageGrid,
  useDedupedFetch,
  SearchWithDeduping,
  PrefetchLink,
  useOffscreenRender,
  ExpensiveChart,
  useWorkerComputation,
  GroupedVirtualList,
};
