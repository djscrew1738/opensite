import { memo, useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const COLOR_CLASSES = {
  copper: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const TREND_COLORS = {
  up: 'text-emerald-600 dark:text-emerald-400',
  down: 'text-red-600 dark:text-red-400',
  neutral: 'text-surface-500 dark:text-surface-400',
};

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Animated counter for numeric values
 */
const AnimatedCounter = memo(function AnimatedCounter({ value, duration = 1000 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof value !== 'number') return;

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
  }, [value, duration]);

  return <>{displayValue.toLocaleString()}</>;
});

AnimatedCounter.propTypes = {
  value: PropTypes.number.isRequired,
  duration: PropTypes.number,
};

AnimatedCounter.defaultProps = {
  duration: 1000,
};

/**
 * Icon container with color scheme
 */
const IconContainer = memo(function IconContainer({ icon: Icon, color }) {
  const colorClasses = COLOR_CLASSES[color] || COLOR_CLASSES.copper;
  
  return (
    <div className={`flex-shrink-0 p-2.5 rounded-xl ${colorClasses}`}>
      <Icon className="w-5 h-5" />
    </div>
  );
});

IconContainer.propTypes = {
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.oneOf(Object.keys(COLOR_CLASSES)).isRequired,
};

/**
 * Trend indicator
 */
const TrendIndicator = memo(function TrendIndicator({ trend }) {
  const colorClass = TREND_COLORS[trend] || TREND_COLORS.neutral;
  const arrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <p className={`text-xs mt-2 uppercase tracking-wide font-medium ${colorClass}`}>
      {arrow} {trend}
    </p>
  );
});

TrendIndicator.propTypes = {
  trend: PropTypes.oneOf(['up', 'down', 'neutral']).isRequired,
};

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const visibilityTimer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(visibilityTimer);
  }, [delay]);

  const formattedValue = useMemo(() => {
    if (typeof value === 'number') {
      return animated ? (
        <AnimatedCounter value={value} />
      ) : (
        value.toLocaleString()
      );
    }
    return value;
  }, [value, animated]);

  const colorClasses = COLOR_CLASSES[color] || COLOR_CLASSES.copper;

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
              {formattedValue}
            </p>
            {subtitle && (
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Trend */}
          {trend && <TrendIndicator trend={trend} />}
        </div>
        
        {/* Icon */}
        {Icon && <IconContainer icon={Icon} color={color} />}
      </div>
    </div>
  );
});

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  trend: PropTypes.oneOf(['up', 'down', 'neutral']),
  animated: PropTypes.bool,
  className: PropTypes.string,
  color: PropTypes.oneOf(Object.keys(COLOR_CLASSES)),
  delay: PropTypes.number,
};

StatCard.defaultProps = {
  subtitle: null,
  icon: null,
  trend: null,
  animated: true,
  className: '',
  color: 'copper',
  delay: 0,
};

export default StatCard;
