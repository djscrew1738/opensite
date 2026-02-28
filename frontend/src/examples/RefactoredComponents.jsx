/**
 * REFACTORED COMPONENTS
 * 
 * These are refactored versions of existing OpenSite components
 * using the new custom hooks for better performance and cleaner code.
 */

import { useState, useCallback } from 'react';
import { useDebounce, useDebouncedCallback, useDebouncedFetch } from '../hooks/useDebounce';
import { useVirtualizedList } from '../hooks/useVirtualizedList';
import { useHydration, ClientOnly } from '../hooks/useHydration';
import { useMemoizedCallback } from '../hooks/useMemoizedCallback';

// ═════════════════════════════════════════════════════════════════════════════
// REFACTORED: GlobalSearch using useDebouncedFetch
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Refactored GlobalSearch using useDebouncedFetch
 * 
 * BEFORE: Manual useRef + setTimeout for debouncing
 * AFTER: Clean useDebouncedFetch hook with auto-cancellation
 */
function GlobalSearchRefactored({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Use the new hook - handles debouncing, loading states, and cancellation
  const { 
    data: results, 
    loading: isSearching, 
    error, 
    execute: search 
  } = useDebouncedFetch(
    async (searchQuery, filter) => {
      if (!searchQuery.trim() || searchQuery.trim().length < 2) {
        return null;
      }
      return api.permits.search({
        q: searchQuery.trim(),
        type: filter === 'all' ? undefined : filter,
      });
    },
    300 // 300ms debounce
  );

  // Trigger search when query or filter changes
  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    search(value, typeFilter);
  };

  const handleFilterChange = (filter) => {
    setTypeFilter(filter);
    search(query, filter);
  };

  if (!isOpen) return null;

  return (
    <div className="global-search-modal">
      <input
        type="text"
        value={query}
        onChange={handleQueryChange}
        placeholder="Search across all data..."
      />
      
      {isSearching && <span className="loading">Searching...</span>}
      {error && <span className="error">Search failed</span>}
      
      <SearchResults results={results} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// REFACTORED: DocumentsLibrary using useVirtualizedList hook
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Refactored VirtualizedList using useVirtualizedList hook
 * 
 * BEFORE: Direct useVirtualizer with manual configuration
 * AFTER: Clean useVirtualizedList hook with simplified API
 */
function VirtualizedDocumentList({ projects, onSelectProject, onDelete }) {
  const {
    containerRef,
    virtualItems,
    totalHeight,
    scrollToIndex,
  } = useVirtualizedList({
    items: projects,
    itemHeight: 88,
    overscan: 8,
  });

  // Stable callbacks using useMemoizedCallback
  const createToggleHandler = useMemoizedCallback((id) => {
    return () => onToggleSelection(id);
  });

  const createSelectHandler = useMemoizedCallback((project) => {
    return () => onSelectProject(project);
  });

  const createDeleteHandler = useMemoizedCallback((id) => {
    return () => onDelete(id);
  });

  return (
    <div
      ref={containerRef}
      className="virtualized-list-container"
      style={{ height: 'calc(100vh - 260px)', overflow: 'auto' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map((virtualRow) => {
          const project = projects[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              className="virtualized-list-item"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <DocumentListItem
                project={project}
                onClick={createSelectHandler(project)}
                onDelete={createDeleteHandler(project.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// REFACTORED: Search input using useDebouncedState
// ═════════════════════════════════════════════════════════════════════════════

/**
 * SearchField using useDebouncedState
 * 
 * BEFORE: Manual useState + useEffect + setTimeout
 * AFTER: Single useDebouncedState hook
 */
function SearchField({ onSearch, placeholder = 'Search...' }) {
  // Gets both immediate value (for input) and debounced value (for search)
  const [inputValue, searchValue, setInputValue] = useDebouncedState('', 350);

  // Trigger search when debounced value changes
  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  // Call onSearch prop when debounced value changes
  useState(() => {
    onSearch?.(searchValue);
  }, [searchValue, onSearch]);

  return (
    <div className="search-field">
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
      />
      {inputValue !== searchValue && (
        <span className="typing-indicator">Typing...</span>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// REFACTORED: Client-only chart with hydration safety
// ═════════════════════════════════════════════════════════════════════════════

/**
 * AnalyticsChart using hydration safety
 * 
 * BEFORE: Potential hydration mismatches with chart libraries
 * AFTER: ClientOnly wrapper ensures no SSR issues
 */
function AnalyticsChart({ data }) {
  return (
    <ClientOnly fallback={<ChartSkeleton />}>
      <ChartLibrary
        data={data}
        options={{ responsive: true, animation: true }}
      />
    </ClientOnly>
  );
}

function ChartSkeleton() {
  return (
    <div className="chart-skeleton">
      <div className="skeleton-bar" style={{ height: '60%' }} />
      <div className="skeleton-bar" style={{ height: '80%' }} />
      <div className="skeleton-bar" style={{ height: '40%' }} />
      <div className="skeleton-bar" style={{ height: '90%' }} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// REFACTORED: Window resize handler with debouncing
// ═════════════════════════════════════════════════════════════════════════════

/**
 * ResponsivePanel using debounced resize
 * 
 * BEFORE: Resize handler firing on every pixel change
 * AFTER: Debounced handler for better performance
 */
import { useDebouncedCallback } from '../hooks/useDebounce';

function ResponsivePanel({ children }) {
  const [isCompact, setIsCompact] = useState(window.innerWidth < 768);

  // Debounced resize handler - only fires after resize stops
  const handleResize = useDebouncedCallback(
    () => {
      setIsCompact(window.innerWidth < 768);
    },
    150 // Wait 150ms after resize ends
  );

  useState(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return (
    <div className={`responsive-panel ${isCompact ? 'compact' : 'full'}`}>
      {children}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// REFACTORED: Infinite scroll list
// ═════════════════════════════════════════════════════════════════════════════

/**
 * InfiniteLeadList using useInfiniteVirtualizedList
 */
import { useInfiniteVirtualizedList } from '../hooks/useVirtualizedList';

function InfiniteLeadList({ leads, hasMore, onLoadMore }) {
  const {
    containerRef,
    virtualItems,
    totalHeight,
    checkLoadMore,
    isScrolling,
  } = useInfiniteVirtualizedList({
    items: leads,
    itemHeight: 80,
    hasMore,
    onLoadMore,
    loadMoreThreshold: 300,
    overscan: 5,
  });

  return (
    <div
      ref={containerRef}
      onScroll={checkLoadMore}
      className="infinite-list"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map((virtualItem) => (
          <LeadCard
            key={virtualItem.key}
            lead={leads[virtualItem.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          />
        ))}
      </div>
      
      {isScrolling && hasMore && (
        <div className="loading-more">Loading more...</div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// REFACTORED: Form with debounced validation
// ═════════════════════════════════════════════════════════════════════════════

/**
 * FormWithValidation using debounced validation
 */
function FormWithValidation({ onSubmit }) {
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  // Debounced validation - don't validate on every keystroke
  const validate = useDebouncedCallback(
    (fieldValues) => {
      const newErrors = {};
      
      if (fieldValues.email && !fieldValues.email.includes('@')) {
        newErrors.email = 'Invalid email';
      }
      
      if (fieldValues.password && fieldValues.password.length < 8) {
        newErrors.password = 'Password too short';
      }
      
      setErrors(newErrors);
    },
    500, // Validate 500ms after typing stops
    []
  );

  const handleChange = (field) => (e) => {
    const newValues = { ...values, [field]: e.target.value };
    setValues(newValues);
    validate(newValues);
  };

  return (
    <form onSubmit={onSubmit}>
      <input
        type="email"
        value={values.email}
        onChange={handleChange('email')}
        placeholder="Email"
      />
      {errors.email && <span className="error">{errors.email}</span>}
      
      <input
        type="password"
        value={values.password}
        onChange={handleChange('password')}
        placeholder="Password"
      />
      {errors.password && <span className="error">{errors.password}</span>}
    </form>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// BENEFITS COMPARISON
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Benefits of using the new hooks:
 * 
 * 1. LESS CODE
 *    - Before: ~30 lines for debounce logic
 *    - After: 1 hook call
 * 
 * 2. FEWER BUGS
 *    - Proper cleanup handled automatically
 *    - No memory leaks from forgotten timeouts
 *    - Request cancellation built-in
 * 
 * 3. BETTER PERFORMANCE
 *    - Optimized implementations
 *    - Consistent patterns across app
 *    - Less re-rendering
 * 
 * 4. EASIER MAINTENANCE
 *    - Clear, declarative API
 *    - TypeScript support
 *    - Well-documented
 * 
 * 5. CONSISTENCY
 *    - Same patterns everywhere
 *    - Easier code reviews
 *    - Better team collaboration
 */

// Placeholder components for examples
function DocumentListItem({ project, onClick, onDelete }) {
  return <div onClick={onClick}>{project.name}</div>;
}

function LeadCard({ lead, style }) {
  return <div style={style}>{lead.name}</div>;
}

function ChartLibrary({ data, options }) {
  return <div>Chart</div>;
}

function SearchResults({ results }) {
  return <div>Results: {results?.length || 0}</div>;
}

function onToggleSelection(id) {
  console.log('Toggle:', id);
}

// Mock API
const api = {
  permits: {
    search: async ({ q, type }) => {
      // Mock implementation
      return [{ id: 1, name: 'Result for ' + q }];
    },
  },
};

export {
  GlobalSearchRefactored,
  VirtualizedDocumentList,
  SearchField,
  AnalyticsChart,
  ResponsivePanel,
  InfiniteLeadList,
  FormWithValidation,
};
