# UI/UX Optimization Guide for OpenSite

A comprehensive guide to optimizing React performance using the custom hooks and patterns provided in this project.

## Table of Contents

1. [Quick Start](#quick-start)
2. [The Four Core Patterns](#the-four-core-patterns)
3. [When to Use Each Pattern](#when-to-use-each-pattern)
4. [Common Pitfalls](#common-pitfalls)
5. [Performance Checklist](#performance-checklist)
6. [Real-World Examples](#real-world-examples)

---

## Quick Start

### Installation

These hooks are built-in - no installation needed!

```jsx
import { 
  useDebounce, 
  useVirtualizedList, 
  useHydration,
  useMemoizedCallback 
} from '../hooks';
```

### Quick Reference

| Pattern | Hook | One-Line Usage |
|---------|------|----------------|
| **Debouncing** | `useDebounce` | `const debouncedValue = useDebounce(value, 300);` |
| **Virtualization** | `useVirtualizedList` | `const { virtualItems } = useVirtualizedList({ items, itemHeight: 50 });` |
| **Memoization** | `useMemoizedCallback` | `const stableFn = useMemoizedCallback(fn);` |
| **Hydration** | `useHydration` | `const isReady = useHydration();` |

---

## The Four Core Patterns

### 1. Debouncing ⏱️

**Purpose:** Prevent functions from firing too frequently

**Use for:**
- Search inputs
- Window resize handlers
- Scroll event handlers
- Form validation

**Basic Example:**
```jsx
function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    // Only runs 300ms after user stops typing
    searchAPI(debouncedQuery);
  }, [debouncedQuery]);

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

**Impact:** Reduces API calls by 80-90% for search inputs

---

### 2. Virtualization 📜

**Purpose:** Only render items visible in the viewport

**Use for:**
- Lists with 50+ items
- Large data tables
- Chat messages
- Image galleries

**Basic Example:**
```jsx
function DocumentList({ documents }) {
  const { containerRef, virtualItems, totalHeight } = useVirtualizedList({
    items: documents,
    itemHeight: 72,
    overscan: 5,
  });

  return (
    <div ref={containerRef} style={{ height: '500px', overflow: 'auto' }}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {documents[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Impact:** Can handle 100,000+ items at 60 FPS

---

### 3. Memoization 💾

**Purpose:** Cache expensive computations and prevent unnecessary re-renders

**Use for:**
- Data filtering/sorting
- Component optimization
- Stable callback references

**Basic Example:**
```jsx
function FilteredList({ items, filterText }) {
  // Only recalculates when items or filterText changes
  const filtered = useMemo(() => {
    return items.filter(item => 
      item.name.includes(filterText)
    );
  }, [items, filterText]);

  return <List items={filtered} />;
}

// Prevent child re-renders
const ListItem = memo(function ListItem({ item, onSelect }) {
  return <div onClick={() => onSelect(item)}>{item.name}</div>;
});
```

**Impact:** Eliminates unnecessary renders, smoother UI

---

### 4. Hydration Safety 🌊

**Purpose:** Handle server-side rendering (SSR) safely

**Use for:**
- Client-only libraries (charts, maps)
- Browser APIs (window, document)
- localStorage/sessionStorage

**Basic Example:**
```jsx
function Dashboard() {
  return (
    <div>
      {/* Safe to render on server */}
      <Header />
      
      {/* Only render on client */}
      <ClientOnly fallback={<ChartSkeleton />}>
        <AnalyticsChart />
      </ClientOnly>
    </div>
  );
}
```

**Impact:** Eliminates hydration mismatches, faster time-to-interactive

---

## When to Use Each Pattern

### Decision Tree

```
Is your component slow?
│
├─ Yes → Are you rendering many items?
│  │
│  ├─ Yes (50+) → Use VIRTUALIZATION
│  │
│  └─ No → Is it re-rendering too often?
│     │
│     ├─ Yes → Use MEMOIZATION
│     │
│     └─ No → Is it doing expensive work?
│        │
│        ├─ Yes → Use MEMOIZATION (useMemo)
│        │
│        └─ No → Profile to find the issue
│
└─ No → Is user input triggering too many actions?
   │
   ├─ Yes → Use DEBOUNCING
   │
   └─ No → Is there a hydration error?
      │
      └─ Yes → Use HYDRATION SAFETY
```

### By Use Case

| Scenario | Recommended Pattern |
|----------|---------------------|
| Search input firing API on every keystroke | Debouncing |
| Large list (100+ items) scrolling slowly | Virtualization |
| Component re-rendering when props haven't changed | Memoization |
| Hydration mismatch error | Hydration Safety |
| Form validation running on every keystroke | Debouncing |
| Data table with sorting/filtering | Memoization + Virtualization |
| Chart library causing SSR errors | Hydration Safety |
| Window resize handler causing jank | Debouncing |

---

## Common Pitfalls

### ❌ Debouncing Mistakes

```jsx
// WRONG: Debouncing the render instead of the API call
const debouncedQuery = useDebounce(query, 300);
return <input value={debouncedQuery} />; // Input feels laggy!

// RIGHT: Debounce only the expensive operation
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 300);
useEffect(() => searchAPI(debouncedQuery), [debouncedQuery]);
return <input value={query} onChange={e => setQuery(e.target.value)} />;
```

### ❌ Virtualization Mistakes

```jsx
// WRONG: Not providing fixed container height
<div ref={containerRef}> {/* No height! */}
  <div style={{ height: totalHeight }}>...</div>
</div>

// RIGHT: Container must have defined height
<div ref={containerRef} style={{ height: '500px', overflow: 'auto' }}>
  <div style={{ height: totalHeight, position: 'relative' }}>...</div>
</div>
```

### ❌ Memoization Mistakes

```jsx
// WRONG: Memoizing everything (over-optimization)
const value = useMemo(() => 2 + 2, []); // Simple values don't need memo!

// WRONG: Forgetting dependencies
const filtered = useMemo(() => items.filter(...), []); // Missing 'items'!

// RIGHT: Only memoize expensive computations
const filtered = useMemo(() => 
  expensiveFilter(items, query),
  [items, query]
);
```

### ❌ Hydration Mistakes

```jsx
// WRONG: Accessing window during render
const width = window.innerWidth; // Crash during SSR!

// WRONG: Generating random values during render
const id = Math.random(); // Mismatch between server and client!

// RIGHT: Use hydration-safe patterns
const width = useHydrationSafe(() => window.innerWidth, 1024);
const [id] = useState(() => Math.random()); // Consistent between renders
```

---

## Performance Checklist

Before submitting a PR, check these items:

### For Lists/Tables
- [ ] Using virtualization if > 50 items?
- [ ] Items have stable keys?
- [ ] Not re-rendering entire list on single item change?

### For Search/Filter
- [ ] API calls debounced (300ms+)?
- [ ] Expensive filtering memoized?
- [ ] Loading states shown?

### For Forms
- [ ] Validation debounced?
- [ ] Not validating on every keystroke?
- [ ] Submit handler stable (useCallback)?

### For Heavy Components
- [ ] Using React.memo?
- [ ] Stable callback references (useCallback)?
- [ ] Expensive computations cached (useMemo)?

### For SSR/Hydration
- [ ] No `window`/`document` during render?
- [ ] No random values during render?
- [ ] Client-only libs wrapped in ClientOnly?

---

## Real-World Examples

### Example 1: Search Page

```jsx
function SearchPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  
  const { data, loading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchAPI(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  return (
    <div>
      <input 
        value={query} 
        onChange={e => setQuery(e.target.value)}
        placeholder="Search..."
      />
      {loading && <Spinner />}
      <VirtualizedResults items={data || []} />
    </div>
  );
}

const VirtualizedResults = memo(function VirtualizedResults({ items }) {
  const { containerRef, virtualItems, totalHeight } = useVirtualizedList({
    items,
    itemHeight: 80,
  });

  return (
    <div ref={containerRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map(v => (
          <ResultCard 
            key={v.key}
            item={items[v.index]}
            style={{
              position: 'absolute',
              transform: `translateY(${v.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
});
```

### Example 2: Data Table with Sort/Filter

```jsx
function DataTable({ data, columns }) {
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  
  const debouncedFilter = useDebounce(filter, 200);

  // Memoize expensive filtering/sorting
  const processed = useMemo(() => {
    let result = [...data];
    
    if (debouncedFilter) {
      result = result.filter(row => 
        row.name.toLowerCase().includes(debouncedFilter.toLowerCase())
      );
    }
    
    if (sort.key) {
      result.sort((a, b) => 
        sort.dir === 'asc' 
          ? a[sort.key] - b[sort.key]
          : b[sort.key] - a[sort.key]
      );
    }
    
    return result;
  }, [data, debouncedFilter, sort]);

  const { virtualItems, containerRef, totalHeight } = useVirtualizedList({
    items: processed,
    itemHeight: 48,
  });

  return (
    <div>
      <input 
        value={filter} 
        onChange={e => setFilter(e.target.value)}
        placeholder="Filter..."
      />
      <div ref={containerRef} style={{ height: '500px', overflow: 'auto' }}>
        {/* Virtualized rows */}
      </div>
    </div>
  );
}
```

### Example 3: Dashboard with Charts

```jsx
function Dashboard() {
  return (
    <div className="dashboard">
      <StatsCards />
      
      <ClientOnly fallback={<ChartSkeleton />}>
        <RevenueChart />
      </ClientOnly>
      
      <ClientOnly fallback={<MapSkeleton />}>
        <ServiceAreaMap />
      </ClientOnly>
    </div>
  );
}
```

---

## Additional Resources

- **Examples Folder**: See `examples/` for working demos
- **Custom Hooks**: See `hooks/` for implementation details
- **React Docs**: https://react.dev/reference/react
- **TanStack Virtual**: https://tanstack.com/virtual (for advanced virtualization)

---

## Need Help?

If you're unsure which pattern to use:

1. Run the Performance Comparison demo: `examples/PerformanceComparison.jsx`
2. Check the decision tree above
3. When in doubt, profile first! Use React DevTools Profiler

Remember: **Premature optimization is the root of all evil.** Only optimize what you've measured as slow!
