# UI/UX Performance Examples

This folder contains complete, working examples of essential UI/UX optimization patterns for React applications.

## Table of Contents

1. [Hydration](#1-hydration)
2. [Memoization](#2-memoization)
3. [Virtualization](#3-virtualization)
4. [Debouncing](#4-debouncing)

---

## 1. Hydration

**Prompt:** *"My React app is loading fast, but it's taking 3 seconds for the buttons to become clickable. Can you help me debug the hydration phase?"*

### What is Hydration?

Hydration is the process where React attaches event listeners to server-rendered HTML, making it interactive. Slow hydration can cause buttons and other interactive elements to be unresponsive.

### Files

- `HydrationDebugExample.jsx` - Complete hydration debugging solution

### Key Features

- **Hydration Metrics Tracking** - Measure how long hydration takes
- **Progressive Buttons** - Buttons that indicate when they're ready
- **Staggered Hydration** - Gradually reveal content to reduce load
- **Lazy Hydration** - Defer non-critical component hydration
- **Client-Only Components** - Prevent hydration mismatches

### Quick Usage

```jsx
import { useHydration, ProgressiveButton, ClientOnly } from '../hooks/useHydration';

function MyComponent() {
  const isHydrated = useHydration();
  
  return (
    <div>
      {/* Button is disabled during hydration */}
      <ProgressiveButton onClick={handleClick}>
        Click Me
      </ProgressiveButton>
      
      {/* Only renders on client */}
      <ClientOnly fallback={<Loading />}>
        <Chart data={data} />
      </ClientOnly>
    </div>
  );
}
```

---

## 2. Memoization

**Prompt:** *"Can you show me how to use useMemo for memoization on this heavy data-filtering function to stop unnecessary re-renders?"*

### What is Memoization?

Memoization caches the results of expensive function calls and returns the cached result when the same inputs occur again, preventing unnecessary re-renders and computations.

### Files

- `MemoizationExample.jsx` - Complete memoization patterns

### Key Features

- **useMemo for Data Filtering** - Cache expensive filter/sort operations
- **useCallback for Stable References** - Prevent child re-renders
- **React.memo for Components** - Skip re-rending unchanged components
- **Custom Hooks** - `useExpensiveComputation`, `useDataPipeline`
- **Render Profiling** - Track and debug re-renders

### Quick Usage

```jsx
import { useMemo, useCallback, memo } from 'react';

// Memoize expensive filtering
const filteredItems = useMemo(() => {
  return items
    .filter(item => item.score > minScore)
    .sort((a, b) => b.score - a.score);
}, [items, minScore]);

// Stable callback reference
const handleSelect = useCallback((id) => {
  onSelect(id);
}, [onSelect]);

// Memoized child component
const ListItem = memo(function ListItem({ item, onSelect }) {
  return <div onClick={() => onSelect(item.id)}>{item.name}</div>;
});
```

---

## 3. Virtualization

**Prompt:** *"Can you implement virtualization for my DocumentList.jsx so it only renders the 10 rows visible in the viewport?"*

### What is Virtualization?

Virtualization (or windowing) only renders the items currently visible in the viewport, plus a small buffer. This allows lists with thousands of items to perform smoothly.

### Files

- `VirtualizationExample.jsx` - Complete virtualization implementations

### Key Features

- **Fixed Height Lists** - Simple virtualization with uniform row heights
- **Dynamic Height Lists** - Variable row heights for content like chat messages
- **Virtualized Grid** - 2D virtualization for card layouts
- **Infinite Scroll** - Load more data as user scrolls
- **Custom Hooks** - `useVirtualizedList`, `useDynamicVirtualizedList`

### Quick Usage

```jsx
import { useVirtualizedList } from '../hooks/useVirtualizedList';

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

---

## 4. Debouncing

**Prompt:** *"Can you add debouncing to my search input so it doesn't fire an API call on every single keystroke?"*

### What is Debouncing?

Debouncing delays a function's execution until a certain amount of time has passed since the last time it was invoked. It's essential for search inputs, resize handlers, and scroll events.

### Files

- `DebouncingExample.jsx` - Complete debouncing implementations

### Key Features

- **useDebounce Hook** - Debounce a value
- **useDebouncedCallback** - Debounce a function
- **useDebouncedState** - Combined state + debounce
- **useDebouncedFetch** - Auto-cancelling debounced API calls
- **Event Debouncing** - Window resize, scroll handlers

### Quick Usage

```jsx
import { useDebounce, useDebouncedCallback, useDebouncedFetch } from '../hooks/useDebounce';

// Debounce a value
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 300);

useEffect(() => {
  // Only runs 300ms after user stops typing
  searchAPI(debouncedQuery);
}, [debouncedQuery]);

// Debounce a callback
const debouncedSearch = useDebouncedCallback(
  async (q) => {
    const results = await api.search(q);
    setResults(results);
  },
  500
);

// Debounced fetch with auto-cancellation
const { data, loading, execute } = useDebouncedFetch(
  async (q) => api.search(q),
  400
);
```

---

## Running the Examples

Each example file exports a demo component you can add to your routes:

```jsx
import { VirtualizationDemo } from './examples';

// Add to your router
<Route path="/examples/virtualization" element={<VirtualizationDemo />} />
```

---

## Best Practices Summary

| Pattern | When to Use | Benefit |
|---------|-------------|---------|
| **Hydration** | SSR apps, slow interactivity | Faster time-to-interactive |
| **Memoization** | Expensive computations, child re-renders | Reduced CPU usage |
| **Virtualization** | Lists > 50 items, large tables | Smooth scrolling, less memory |
| **Debouncing** | Search inputs, resize/scroll handlers | Fewer API calls, better performance |

---

## Related Custom Hooks

All examples use hooks from `../hooks/`:

- `useHydration.js` - Hydration detection utilities
- `useMemoizedCallback.js` - Memoization utilities
- `useVirtualizedList.js` - Virtualization hooks
- `useDebounce.js` - Debouncing hooks
