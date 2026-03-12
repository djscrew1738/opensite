import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, Legend 
} from 'recharts';
import { QUALIFYING_FIXTURES, FIXTURE_PRICE, PHASE_CONFIG } from './constants';

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Custom tooltip for Recharts
 */
const CustomTooltip = memo(function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  
  return (
    <div className="bg-surface-800 shadow-xl rounded-lg px-3 py-2 border border-surface-700 text-sm">
      <p className="font-semibold text-surface-100">{data.name}</p>
      {data.count != null && (
        <p className="text-surface-400">{data.count} fixtures</p>
      )}
      <p className="font-bold text-surface-100">
        ${(data.value || data.amount || 0).toLocaleString()}
      </p>
    </div>
  );
});

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
      
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
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
const PhaseBreakdownChart = memo(function PhaseBreakdownChart({ data }) {
  const totalAmount = useMemo(() => 
    data.reduce((sum, p) => sum + p.amount, 0),
    [data]
  );

  if (totalAmount === 0) {
    return <EmptyChartState message="Add fixtures to see phase breakdown" />;
  }

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-surface-100 uppercase tracking-wider mb-4">
        Phase Breakdown
      </h3>
      
      <ResponsiveContainer width="100%" height={220}>
        <BarChart 
          data={data} 
          layout="vertical" 
          margin={{ left: 0, right: 20, top: 5, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={70} 
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={28}>
            {data.map((entry, index) => (
              <Cell key={`phase-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
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
 * PricingDashboard - Visual charts for estimate breakdown
 * 
 * Displays:
 * - Donut chart: Fixture distribution by type
 * - Bar chart: Phase breakdown (rough-in, top-out, trim)
 * 
 * @param {Object} props
 * @param {Object} props.fixtures - Current fixture counts
 * @param {number} props.totalPrice - Total estimate price
 */
function PricingDashboard({ fixtures, totalPrice }) {
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

  // Show empty state if no fixtures
  const hasData = totalPrice > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FixtureDistributionChart data={donutData} />
      <PhaseBreakdownChart data={phaseData} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PropTypes
// ═══════════════════════════════════════════════════════════════

PricingDashboard.propTypes = {
  fixtures: PropTypes.objectOf(PropTypes.number).isRequired,
  totalPrice: PropTypes.number.isRequired,
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
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
};

export default memo(PricingDashboard);
