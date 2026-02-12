import { useEffect, useState } from 'react';

/**
 * StatCard - Reusable metric card component with optional animation
 * @param {string} title - Card title
 * @param {number|string} value - Main value to display
 * @param {string} subtitle - Optional subtitle text
 * @param {string} icon - Optional Lucide icon component
 * @param {string} trend - Optional trend indicator (up/down/neutral)
 * @param {boolean} animated - Whether to animate the number counting
 * @param {string} className - Additional CSS classes
 */
export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  animated = true,
  className = ''
}) {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);

  useEffect(() => {
    if (!animated || typeof value !== 'number') {
      setDisplayValue(value);
      return;
    }

    // Simple animation - counts up to the target value
    const duration = 1000; // 1 second
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;

      if (step >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, animated]);

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div className={`card hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">
              {formatValue(displayValue)}
            </p>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          {trend && (
            <p className={`text-xs mt-1 ${getTrendColor()}`}>
              {trend === 'up' && '↑ '}
              {trend === 'down' && '↓ '}
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className="ml-4 p-3 bg-primary-50 rounded-lg">
            <Icon className="w-6 h-6 text-primary-600" />
          </div>
        )}
      </div>
    </div>
  );
}
