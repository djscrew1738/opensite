/**
 * Lazy-loaded PricingDashboard component
 * Delays loading of recharts until needed
 */

import { lazy, Suspense } from 'react';

const PricingDashboardSkeleton = () => (
  <div className="space-y-4">
    <div className="h-8 w-48 bg-gray-200 dark:bg-surface-700 rounded animate-pulse" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="h-64 bg-gray-100 dark:bg-surface-700 rounded-lg animate-pulse" />
      <div className="h-64 bg-gray-100 dark:bg-surface-700 rounded-lg animate-pulse" />
    </div>
  </div>
);

const PricingDashboard = lazy(() => import('./PricingDashboard'));

export default function LazyPricingDashboard(props) {
  return (
    <Suspense fallback={<PricingDashboardSkeleton />}>
      <PricingDashboard {...props} />
    </Suspense>
  );
}
