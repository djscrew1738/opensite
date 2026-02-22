/**
 * Lazy-loaded CostVisualization component
 * Delays loading of recharts (~450KB) until needed
 */

import { lazy, Suspense } from 'react';

// Loading fallback matching the component's expected dimensions
const CostVisualizationSkeleton = () => (
  <div className="space-y-6">
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
      <div className="h-80 bg-gray-100 dark:bg-surface-700 rounded-lg animate-pulse" />
    </div>
  </div>
);

// Lazy load the actual component
const CostVisualization = lazy(() => import('./CostVisualization'));

export default function LazyCostVisualization(props) {
  return (
    <Suspense fallback={<CostVisualizationSkeleton />}>
      <CostVisualization {...props} />
    </Suspense>
  );
}
