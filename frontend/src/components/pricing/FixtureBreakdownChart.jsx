import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900">{payload[0].payload.name}</p>
        <p className="text-2xl font-bold text-primary-600">{payload[0].value}</p>
        <p className="text-xs text-gray-500">Click to filter</p>
      </div>
    );
  }
  return null;
};

/**
 * FixtureBreakdownChart - Interactive bar chart showing fixture counts
 * @param {object} extractedData - Data extracted from blueprint
 */
export default function FixtureBreakdownChart({ extractedData }) {
  const [selectedFixture, setSelectedFixture] = useState(null);

  if (!extractedData) {
    return null;
  }

  // Map fixture data to chart format
  const fixtureMapping = [
    { key: 'toilets', label: 'Toilets', color: '#3b82f6' },
    { key: 'lavatories', label: 'Lavatories', color: '#8b5cf6' },
    { key: 'tubs', label: 'Tubs', color: '#06b6d4' },
    { key: 'showerBases', label: 'Shower Bases', color: '#10b981' },
    { key: 'kitchenFaucets', label: 'Kitchen Faucets', color: '#f59e0b' },
    { key: 'washingMachines', label: 'Washing Machines', color: '#ec4899' },
    { key: 'barSinks', label: 'Bar Sinks', color: '#6366f1' },
    { key: 'mudPans', label: 'Mud Pans', color: '#14b8a6' },
    { key: 'waterSoftenerPreplumb', label: 'Water Softener', color: '#a855f7' }
  ];

  const chartData = fixtureMapping
    .map(({ key, label, color }) => ({
      name: label,
      count: extractedData[key] || 0,
      color
    }))
    .filter(item => item.count > 0);

  if (chartData.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fixture Breakdown</h3>
        <p className="text-gray-500 text-center py-8">No fixture data available</p>
      </div>
    );
  }

  const handleBarClick = (data) => {
    setSelectedFixture(selectedFixture === data.name ? null : data.name);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Fixture Breakdown</h3>
        {selectedFixture && (
          <button
            onClick={() => setSelectedFixture(null)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar
              dataKey="count"
              name="Count"
              radius={[8, 8, 0, 0]}
              onClick={handleBarClick}
              cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    selectedFixture && selectedFixture !== entry.name
                      ? '#d1d5db'
                      : entry.color
                  }
                  opacity={selectedFixture && selectedFixture !== entry.name ? 0.3 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-gray-600">Total Fixtures</p>
          <p className="text-2xl font-bold text-gray-900">
            {chartData.reduce((sum, item) => sum + item.count, 0)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Fixture Types</p>
          <p className="text-2xl font-bold text-gray-900">{chartData.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Most Common</p>
          <p className="text-lg font-semibold text-gray-900">
            {chartData.reduce((max, item) => (item.count > max.count ? item : max), chartData[0])?.name}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Per Unit Avg</p>
          <p className="text-2xl font-bold text-gray-900">
            {extractedData.units
              ? Math.round(chartData.reduce((sum, item) => sum + item.count, 0) / extractedData.units)
              : '-'}
          </p>
        </div>
      </div>
    </div>
  );
}
