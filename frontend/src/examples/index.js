/**
 * OpenSite - UI/UX Performance Examples
 * 
 * This folder contains complete, working examples of key UI/UX optimization patterns:
 * 
 * 1. Hydration - Debugging and fixing hydration issues
 * 2. Memoization - Using useMemo, useCallback, and React.memo effectively
 * 3. Virtualization - Rendering large lists efficiently
 * 4. Debouncing - Preventing excessive function calls
 * 
 * Each example includes:
 * - Detailed comments explaining the pattern
 * - Before/after comparisons where applicable
 * - Production-ready code you can copy and adapt
 * - Interactive demos for testing
 */

// Hydration examples
export { 
  SlowHydrationDebug, 
  ProgressiveButton, 
  ClientOnly, 
  StaggeredHydration,
  LazyHydrate,
  AppWithHydrationDebug 
} from './HydrationDebugExample';

// Memoization examples
export { 
  MemoizationDemo,
  RenderProfiler 
} from './MemoizationExample';

// Virtualization examples
export { 
  VirtualizationDemo 
} from './VirtualizationExample';

// Debouncing examples
export { 
  DebouncingDemo 
} from './DebouncingExample';

// Refactored components
export {
  GlobalSearchRefactored,
  VirtualizedDocumentList,
  SearchField,
  AnalyticsChart,
  ResponsivePanel,
  InfiniteLeadList,
  FormWithValidation,
} from './RefactoredComponents';

// Advanced patterns
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
} from './AdvancedPatterns';

// Performance comparison
export {
  PerformanceComparisonDemo,
} from './PerformanceComparison';
