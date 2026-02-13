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

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900">{data.name || data.payload.name}</p>
        <p className="text-2xl font-bold text-primary-600">
          ${data.value?.toLocaleString()}
        </p>
        {data.payload.percentage && (
          <p className="text-sm text-gray-500">{data.payload.percentage}% of total</p>
        )}
      </div>
    );
  }
  return null;
};

/**
 * CostVisualization - Donut chart and stacked bar charts for cost breakdown
 * @param {object} estimate - Pricing estimate with breakdown
 */
export default function CostVisualization({ estimate }) {
  if (!estimate || !estimate.breakdown) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
        <p className="text-gray-500 text-center py-8">No cost data available</p>
      </div>
    );
  }

  // Phase breakdown colors
  const PHASE_COLORS = {
    roughIn: '#f97316', // orange
    topOut: '#a855f7', // purple
    trim: '#06b6d4' // cyan
  };

  // Prepare phase breakdown data
  const phaseData = Object.entries(estimate.breakdown).map(([key, phase]) => ({
    name: phase.name,
    value: phase.amount,
    percentage: phase.percentage,
    color: PHASE_COLORS[key]
  }));

  // Prepare materials breakdown data
  const materialsData = estimate.materials
    ? [
        { name: 'Pipes', value: estimate.materials.pipes, color: '#3b82f6' },
        { name: 'Fixtures', value: estimate.materials.fixtures, color: '#8b5cf6' },
        { name: 'Valves', value: estimate.materials.valves || 0, color: '#10b981' },
        { name: 'Other', value: estimate.materials.other || 0, color: '#6b7280' }
      ].filter(item => item.value > 0)
    : [];

  // Prepare labor breakdown data
  const laborData = estimate.labor
    ? [
        { category: 'Rough-in', labor: estimate.labor.roughIn, materials: 0, color: PHASE_COLORS.roughIn },
        { category: 'Top-out', labor: estimate.labor.topOut, materials: 0, color: PHASE_COLORS.topOut },
        { category: 'Trim', labor: estimate.labor.trim, materials: 0, color: PHASE_COLORS.trim }
      ]
    : [];

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    if (percent < 0.05) return null; // Hide labels for very small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      {/* Phase Breakdown - Donut Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Phase Breakdown</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={phaseData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={120}
                innerRadius={70}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {phaseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry) => (
                  <span className="text-sm">
                    {value} - ${entry.payload.value.toLocaleString()}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Phase Details */}
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          {phaseData.map((phase, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: phase.color }}
                />
                <span className="text-sm text-gray-700">{phase.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">{phase.percentage}%</span>
                <span className="text-sm font-semibold text-gray-900">
                  ${phase.value.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Materials Breakdown */}
      {materialsData.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Materials Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={materialsData} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Cost" radius={[0, 8, 8, 0]}>
                  {materialsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Total Materials</span>
              <span className="text-lg font-bold text-gray-900">
                ${materialsData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Labor vs Materials by Phase */}
      {laborData.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Labor by Phase</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={laborData} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="labor" name="Labor Cost" stackId="a" radius={[8, 8, 0, 0]}>
                  {laborData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
