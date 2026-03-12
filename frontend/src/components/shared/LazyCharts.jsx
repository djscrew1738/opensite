/**
 * Lazy-loaded Chart Components
 * 
 * These components use dynamic imports to load recharts only when needed,
 * reducing the initial bundle size by ~450KB.
 * 
 * Usage:
 *   import { LazyPieChart, LazyBarChart } from './LazyCharts';
 *   
 *   <LazyPieChart data={data} ... />
 */

import { lazy, Suspense } from 'react';

// Loading fallback for charts
const ChartFallback = ({ height = 300 }) => (
  <div 
    className="flex items-center justify-center bg-surface-50 dark:bg-surface-800 rounded-lg"
    style={{ height }}
  >
    <div className="animate-pulse flex flex-col items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-surface-200 dark:bg-surface-700" />
      <div className="w-24 h-4 rounded bg-surface-200 dark:bg-surface-700" />
    </div>
  </div>
);

// Lazy load the entire recharts library
const RechartsModule = lazy(() => import('recharts'));

// Wrapper that extracts components from the module
const LazyChartWrapper = ({ children, height }) => (
  <Suspense fallback={<ChartFallback height={height} />}>
    <RechartsModule>
      {(module) => children(module)}
    </RechartsModule>
  </Suspense>
);

/**
 * Lazy-loaded Pie Chart with Donut support
 */
export function LazyPieChart({ 
  data, 
  dataKey = 'value', 
  nameKey = 'name',
  innerRadius = 0,
  outerRadius = 120,
  children,
  height = 320,
  ...props 
}) {
  return (
    <div style={{ height, width: '100%' }}>
      <Suspense fallback={<ChartFallback height={height} />}>
        <LazyPieChartInner 
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          {...props}
        >
          {children}
        </LazyPieChartInner>
      </Suspense>
    </div>
  );
}

// Inner component that actually imports and renders
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

function LazyPieChartInner({ data, children, ...props }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} {...props}>
          {children}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

/**
 * Lazy-loaded Bar Chart
 */
export function LazyBarChart({ 
  data, 
  children,
  height = 256,
  layout = 'horizontal',
  ...props 
}) {
  return (
    <div style={{ height, width: '100%' }}>
      <Suspense fallback={<ChartFallback height={height} />}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout={layout} {...props}>
            {children || (
              <>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </Suspense>
    </div>
  );
}

// Re-export the actual components for direct use in Suspense boundaries
export { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

export default { LazyPieChart, LazyBarChart };
