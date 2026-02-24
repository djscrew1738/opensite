import { memo, useEffect, useState } from 'react';

/**
 * StatCard - Reusable metric card component with optional animation
 * Follows industrial control room aesthetic with monospace numerals
 */
const StatCard = memo(function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  animated = true,
  className = '',
  color = 'copper',
  delay = 0
}) {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Stagger animation
    const visibilityTimer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(visibilityTimer);
  }, [delay]);

  useEffect(() => {
    if (!animated || typeof value !== 'number') {
      setDisplayValue(value);
      return;
    }

    const duration = 1000;
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
    if (trend === 'up') return 'text-emerald-600 dark:text-emerald-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-surface-500 dark:text-surface-400';
  };

  const getColorClasses = () => {
    const colors = {
      copper: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return colors[color] || colors.copper;
  };

  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div 
      className={`
        card p-5 hover:shadow-md transition-all duration-300 
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        ${className}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-xs uppercase tracking-wider font-semibold text-surface-500 dark:text-surface-400 mb-2">
            {title}
          </p>
          
          {/* Value */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-2xl font-mono font-bold tabular-nums text-surface-900 dark:text-surface-100">
              {formatValue(displayValue)}
            </p>
            {subtitle && (
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Trend */}
          {trend && (
            <p className={`text-xs mt-2 uppercase tracking-wide font-medium ${getTrendColor()}`}>
              {trend === 'up' && '↑ '}
              {trend === 'down' && '↓ '}
              {trend}
            </p>
          )}
        </div>
        
        {/* Icon */}
        {Icon && (
          <div className={`flex-shrink-0 p-2.5 rounded-xl ${getColorClasses()}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
});

export default StatCard;
