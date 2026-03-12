/**
 * Pricing Dashboard Chart Components
 * 
 * This module contains the actual Recharts components and is lazy-loaded
 * to reduce the initial bundle size.
 */

import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer 
} from 'recharts';

/**
 * Custom tooltip for Recharts
 */
function CustomTooltip({ active, payload }) {
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
}

/**
 * Pie Chart Component
 */
function PieChartComponent({ data }) {
  return (
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
  );
}

/**
 * Bar Chart Component
 */
function BarChartComponent({ data }) {
  return (
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
  );
}

/**
 * Main export component that renders either pie or bar chart
 */
export default function PricingDashboardCharts({ type, data }) {
  if (type === 'pie') {
    return <PieChartComponent data={data} />;
  }
  if (type === 'bar') {
    return <BarChartComponent data={data} />;
  }
  return null;
}

// Also export individual components
export { PieChartComponent, BarChartComponent, CustomTooltip };
