/**
 * MEMOIZATION EXAMPLE
 * 
 * Prompt: "Can you show me how to use useMemo for memoization on this heavy 
 * data-filtering function to stop unnecessary re-renders?"
 * 
 * This example shows:
 * 1. useMemo for expensive computations
 * 2. useCallback for stable function references
 * 3. React.memo for component memoization
 * 4. Custom comparison functions
 */

import { 
  useMemo, 
  useCallback, 
  memo, 
  useState, 
  useRef,
  useEffect 
} from 'react';
import { useMemoizedSelector } from '../hooks/useMemoizedCallback';

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: BASIC useMemo FOR EXPENSIVE COMPUTATIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * DataFilterComponent - Demonstrates useMemo for heavy filtering
 */
function DataFilterComponent({ items, filterText, sortBy, minScore }) {
  // BAD: This runs on every render, even if inputs haven't changed
  // const filteredItems = items
  //   .filter(item => item.name.toLowerCase().includes(filterText.toLowerCase()))
  //   .filter(item => item.score >= minScore)
  //   .sort((a, b) => sortBy === 'score' ? b.score - a.score : a.name.localeCompare(b.name));

  // GOOD: Only recalculates when dependencies actually change
  const filteredItems = useMemo(() => {
    console.log('[useMemo] Recalculating filtered items...');
    
    return items
      .filter(item => {
        const matchesText = item.name
          .toLowerCase()
          .includes(filterText.toLowerCase());
        const meetsScore = item.score >= minScore;
        return matchesText && meetsScore;
      })
      .sort((a, b) => {
        if (sortBy === 'score') {
          return b.score - a.score; // Descending by score
        }
        return a.name.localeCompare(b.name); // Ascending by name
      });
  }, [items, filterText, sortBy, minScore]);

  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item.id}>{item.name} (Score: {item.score})</li>
      ))}
    </ul>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: COMPLEX DATA TRANSFORMATION PIPELINE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * useDataPipeline - Custom hook for complex data transformations
 * Combines multiple expensive operations with memoization
 */
function useDataPipeline(data, options) {
  const { searchQuery, filters, sortConfig, page, pageSize } = options;

  // Step 1: Filter by search (expensive string matching)
  const searchResults = useMemo(() => {
    if (!searchQuery) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter(item => 
      Object.values(item).some(value => 
        String(value).toLowerCase().includes(query)
      )
    );
  }, [data, searchQuery]);

  // Step 2: Apply filters (multiple conditions)
  const filteredData = useMemo(() => {
    return searchResults.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === null || value === undefined) return true;
        if (Array.isArray(value)) return value.includes(item[key]);
        if (typeof value === 'object') {
          // Range filter { min, max }
          const num = Number(item[key]);
          if (value.min !== undefined && num < value.min) return false;
          if (value.max !== undefined && num > value.max) return false;
          return true;
        }
        return item[key] === value;
      });
    });
  }, [searchResults, filters]);

  // Step 3: Sort (stable sort)
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Step 4: Paginate
  const paginatedData = useMemo(() => {
    const start = page * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  // Derived stats (also memoized)
  const stats = useMemo(() => ({
    total: data.length,
    filtered: sortedData.length,
    pages: Math.ceil(sortedData.length / pageSize),
    currentPage: page,
  }), [data.length, sortedData.length, pageSize, page]);

  return {
    data: paginatedData,
    stats,
    allFiltered: sortedData, // For export, etc.
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: useCallback FOR STABLE FUNCTION REFERENCES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * ListWithCallbacks - Demonstrates proper useCallback usage
 */
function ListWithCallbacks({ items, onItemSelect, onItemDelete }) {
  // BAD: New function created every render, causing child re-renders
  // const handleSelect = (id) => onItemSelect(id);

  // GOOD: Stable function reference
  const handleSelect = useCallback((id) => {
    onItemSelect(id);
  }, [onItemSelect]);

  // GOOD: Curried callback with stable reference
  const createDeleteHandler = useCallback((id) => {
    return () => onItemDelete(id);
  }, [onItemDelete]);

  return (
    <ul>
      {items.map(item => (
        <MemoizedListItem
          key={item.id}
          item={item}
          onSelect={handleSelect}
          onDelete={createDeleteHandler(item.id)}
        />
      ))}
    </ul>
  );
}

// Memoized child component - only re-renders when props change
const MemoizedListItem = memo(function ListItem({ item, onSelect, onDelete }) {
  console.log(`[Render] ListItem ${item.id}`);
  
  return (
    <li>
      <span onClick={() => onSelect(item.id)}>{item.name}</span>
      <button onClick={onDelete}>Delete</button>
    </li>
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: ADVANCED MEMOIZATION PATTERNS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * useExpensiveComputation - Custom hook for expensive calculations
 * Includes computation time tracking and caching
 */
function useExpensiveComputation(input, computeFn) {
  const computeCount = useRef(0);
  const totalComputeTime = useRef(0);

  const result = useMemo(() => {
    const startTime = performance.now();
    computeCount.current++;
    
    const output = computeFn(input);
    
    const duration = performance.now() - startTime;
    totalComputeTime.current += duration;
    
    console.log(`[Computation #${computeCount.current}] took ${duration.toFixed(2)}ms`);
    
    return output;
  }, [input, computeFn]);

  const metrics = useMemo(() => ({
    computeCount: computeCount.current,
    averageTime: computeCount.current > 0 
      ? (totalComputeTime.current / computeCount.current).toFixed(2)
      : 0,
  }), []);

  return { result, metrics };
}

/**
 * GroupedList - Memoizes grouped data structure
 */
function GroupedList({ items, groupBy }) {
  // Group items with memoization
  const grouped = useMemo(() => {
    return items.reduce((acc, item) => {
      const key = item[groupBy];
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [items, groupBy]);

  // Memoize sorted group keys
  const sortedKeys = useMemo(() => {
    return Object.keys(grouped).sort();
  }, [grouped]);

  return (
    <div>
      {sortedKeys.map(key => (
        <div key={key}>
          <h3>{key}</h3>
          <ul>
            {grouped[key].map(item => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: SELECTOR PATTERN (REDUX-STYLE)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * useFilteredLeads - Real-world example for lead filtering
 */
function useFilteredLeads(leads, filters) {
  return useMemo(() => {
    console.log('[useFilteredLeads] Recalculating...');

    return leads.filter(lead => {
      // Status filter
      if (filters.status?.length && !filters.status.includes(lead.status)) {
        return false;
      }

      // Score filter
      if (filters.minScore !== undefined && lead.score < filters.minScore) {
        return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const leadDate = new Date(lead.createdAt);
        if (filters.dateRange.start && leadDate < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange.end && leadDate > filters.dateRange.end) {
          return false;
        }
      }

      // City filter (multi-select)
      if (filters.cities?.length && !filters.cities.includes(lead.city)) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Default sort by score descending
      return (b.score || 0) - (a.score || 0);
    });
  }, [leads, filters]);
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPLETE WORKING EXAMPLE
// ═════════════════════════════════════════════════════════════════════════════

export function MemoizationDemo() {
  const [items] = useState(() => 
    Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      score: Math.floor(Math.random() * 100),
      category: ['A', 'B', 'C'][i % 3],
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 30),
    }))
  );

  const [filterText, setFilterText] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState('score');
  const [selectedId, setSelectedId] = useState(null);

  // Use our custom filtered leads hook
  const filteredLeads = useFilteredLeads(items, {
    minScore,
    cities: [], // Could add city filter
  });

  // Further filter by search text
  const searchFiltered = useMemo(() => {
    if (!filterText) return filteredLeads;
    const query = filterText.toLowerCase();
    return filteredLeads.filter(item => 
      item.name.toLowerCase().includes(query)
    );
  }, [filteredLeads, filterText]);

  // Sort
  const displayItems = useMemo(() => {
    return [...searchFiltered].sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [searchFiltered, sortBy]);

  // Stable callbacks
  const handleSelect = useCallback((id) => {
    setSelectedId(id);
  }, []);

  const handleDelete = useCallback((id) => {
    console.log('Delete item:', id);
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Memoization Demo</h2>
      
      {/* Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Search..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        <input
          type="number"
          placeholder="Min score"
          value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="score">Sort by Score</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Stats */}
      <div style={{ marginBottom: '20px' }}>
        <p>Total: {items.length} | Filtered: {displayItems.length} | Selected: {selectedId}</p>
      </div>

      {/* List with memoized callbacks */}
      <ListWithCallbacks
        items={displayItems.slice(0, 20)}
        onItemSelect={handleSelect}
        onItemDelete={handleDelete}
      />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PERFORMANCE MONITORING
// ═════════════════════════════════════════════════════════════════════════════

/**
 * useRenderCount - Track component re-renders
 */
function useRenderCount(componentName) {
  const count = useRef(0);
  count.current++;

  useEffect(() => {
    console.log(`[${componentName}] Render #${count.current}`);
  });

  return count.current;
}

/**
 * RenderProfiler - Wrapper to measure render performance
 */
export function RenderProfiler({ children, name }) {
  const renderCount = useRenderCount(name);
  const startTime = useRef(performance.now());

  useEffect(() => {
    const duration = performance.now() - startTime.current;
    if (duration > 16) { // Longer than one frame (60fps)
      console.warn(`[${name}] Slow render: ${duration.toFixed(2)}ms`);
    }
    startTime.current = performance.now();
  });

  return (
    <div data-render-count={renderCount}>
      {children}
    </div>
  );
}

export default MemoizationDemo;
