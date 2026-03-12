import { memo, useMemo, lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { QUALIFYING_FIXTURES, FIXTURE_PRICE, PHASE_CONFIG } from './constants';

// Lazy load recharts components
const RechartsComponents = lazy(() => import('./PricingDashboardCharts'));

// ═══════════════════════════════════════════════════════════════
// Loading Fallback
// ═══════════════════════════════════════════════════════════════

const ChartFallback = memo(function ChartFallback() {
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-5 animate-pulse">
      <div className="h-4 w-32 bg-surface-700 rounded mb-4" />
      <div className="h-[220px] bg-surface-700/50 rounded" />
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Empty state placeholder
 */
const EmptyChartState = memo(function EmptyChartState({ message }) {
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-6 flex items-center justify-center min-h-[200px]">
      <p className="text-sm text-surface-500">{message}</p>
    </div>
  );
});

/**
 * Donut chart showing fixture distribution
 */
const FixtureDistributionChart = memo(function FixtureDistributionChart({ data }) {
  if (data.length === 0) {
    return <EmptyChartState message="Add fixtures to see distribution" />;
  }

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-surface-100 uppercase tracking-wider mb-4">
        Fixture Distribution
      </h3>
      
      <Suspense fallback={<ChartFallback />}>
        <RechartsComponents type="pie" data={data} />
      </Suspense>
      
      {/* Custom Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 justify-center">
        {data.map(d => (
          <span 
            key={d.name} 
            className="flex items-center gap-1.5 text-xs text-surface-400"
          >
            <span 
              className="w-2 h-2 rounded-full flex-shrink-0" 
              style={{ backgroundColor: d.color }} 
            />
            <span className="truncate max-w-[120px]" title={d.name}>
              {d.name}
            </span>
            <span className="text-surface-500">({d.count})</span>
          </span>
        ))}
      </div>
    </div>
  );
});

/**
 * Bar chart showing phase breakdown
 */
const PhaseBreakdownChart = memo(function PhaseBreakdownChart({ data, totalAmount }) {
  if (totalAmount === 0) {
    return <EmptyChartState message="Add fixtures to see phase breakdown" />;
  }

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-surface-100 uppercase tracking-wider mb-4">
        Phase Breakdown
      </h3>
      
      <Suspense fallback={<ChartFallback />}>
        <RechartsComponents type="bar" data={data} />
      </Suspense>
      
      {/* Phase Amount Labels */}
      <div className="flex justify-between mt-3 px-1">
        {data.map(p => (
          <div key={p.name} className="text-center flex-1">
            <p className="text-xs font-semibold text-surface-100">
              ${p.amount.toLocaleString()}
            </p>
            <p className="text-xs text-surface-500">
              {((p.amount / totalAmount) * 100).toFixed(0)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * PricingDashboard - Visual charts for estimate breakdown (LAZY LOADED)
 * 
 * Charts are loaded on-demand to reduce initial bundle size by ~110KB
 * 
 * @param {Object} props
 * @param {Object} props.fixtures - Current fixture counts
 * @param {number} props.totalPrice - Total estimate price
 */
function PricingDashboardLazy({ fixtures, totalPrice }) {
  // Donut chart data: fixture distribution
  const donutData = useMemo(() => 
    QUALIFYING_FIXTURES
      .filter(f => (fixtures[f.key] || 0) > 0)
      .map(f => ({
        name: f.label,
        value: (fixtures[f.key] || 0) * FIXTURE_PRICE,
        count: fixtures[f.key] || 0,
        color: f.color,
      })),
    [fixtures]
  );

  // Phase bar chart data
  const phaseData = useMemo(() => 
    PHASE_CONFIG.map(p => ({
      name: p.label,
      amount: Math.round(totalPrice * p.pct / 100),
      fill: p.color,
    })),
    [totalPrice]
  );

  const totalAmount = useMemo(() => 
    phaseData.reduce((sum, p) => sum + p.amount, 0),
    [phaseData]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FixtureDistributionChart data={donutData} />
      <PhaseBreakdownChart data={phaseData} totalAmount={totalAmount} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PropTypes
// ═══════════════════════════════════════════════════════════════

PricingDashboardLazy.propTypes = {
  fixtures: PropTypes.objectOf(PropTypes.number).isRequired,
  totalPrice: PropTypes.number.isRequired,
};

EmptyChartState.propTypes = {
  message: PropTypes.string.isRequired,
};

FixtureDistributionChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired,
    color: PropTypes.string.isRequired,
  })).isRequired,
};

PhaseBreakdownChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    fill: PropTypes.string.isRequired,
  })).isRequired,
  totalAmount: PropTypes.number.isRequired,
};

export default memo(PricingDashboardLazy);
