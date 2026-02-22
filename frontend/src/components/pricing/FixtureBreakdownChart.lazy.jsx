/**
 * Lazy-loaded FixtureBreakdownChart component
 * Delays loading of recharts until needed
 */

import { lazy, Suspense } from 'react';

const FixtureBreakdownSkeleton = () => (
  <div className="h-64 bg-gray-100 dark:bg-surface-700 rounded-lg animate-pulse" />
);

const FixtureBreakdownChart = lazy(() => import('./FixtureBreakdownChart'));

export default function LazyFixtureBreakdownChart(props) {
  return (
    <Suspense fallback={<FixtureBreakdownSkeleton />}>
      <FixtureBreakdownChart {...props} />
    </Suspense>
  );
}
