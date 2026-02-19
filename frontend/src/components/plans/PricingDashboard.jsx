import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { QUALIFYING_FIXTURES, FIXTURE_PRICE, PHASE_CONFIG } from './constants';

export default function PricingDashboard({ fixtures, totalPrice }) {
  // Donut chart data: fixture distribution
  const donutData = QUALIFYING_FIXTURES
    .filter(f => (fixtures[f.key] || 0) > 0)
    .map(f => ({
      name: f.label,
      value: (fixtures[f.key] || 0) * FIXTURE_PRICE,
      count: fixtures[f.key] || 0,
      color: f.color,
    }));

  // Phase bar chart data
  const phaseData = PHASE_CONFIG.map(p => ({
    name: p.label,
    amount: Math.round(totalPrice * p.pct / 100),
    fill: p.color,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white dark:bg-surface-800 shadow-lg rounded-lg px-3 py-2 border border-surface-200 dark:border-surface-700 text-sm">
        <p className="font-semibold text-surface-900 dark:text-surface-100">{d.name}</p>
        {d.count != null && <p className="text-surface-500 dark:text-surface-400">{d.count} fixtures</p>}
        <p className="font-bold text-surface-900 dark:text-surface-100">${(d.value || d.amount || 0).toLocaleString()}</p>
      </div>
    );
  };

  if (totalPrice === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6 flex items-center justify-center min-h-[200px]">
          <p className="text-sm text-surface-400 dark:text-surface-500">Add fixtures to see distribution</p>
        </div>
        <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6 flex items-center justify-center min-h-[200px]">
          <p className="text-sm text-surface-400 dark:text-surface-500">Add fixtures to see phase breakdown</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Donut Chart: Fixture Distribution */}
      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 uppercase tracking-wider mb-4">Fixture Distribution</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={donutData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
            >
              {donutData.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
          {donutData.map(d => (
            <span key={d.name} className="flex items-center gap-1.5 text-xs text-surface-600 dark:text-surface-400">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              {d.name} ({d.count})
            </span>
          ))}
        </div>
      </div>

      {/* Bar Chart: Phase Breakdown */}
      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 uppercase tracking-wider mb-4">Phase Breakdown</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={phaseData} layout="vertical" margin={{ left: 0, right: 20 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12, fill: '#6b7280' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={28}>
              {phaseData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Phase $ labels */}
        <div className="flex justify-between mt-2 px-1">
          {phaseData.map(p => (
            <div key={p.name} className="text-center">
              <p className="text-xs font-bold text-surface-900 dark:text-surface-100">${p.amount.toLocaleString()}</p>
              <p className="text-[10px] text-surface-500 dark:text-surface-400">{p.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
