import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
  trendValue,
  color = 'primary',
  onClick,
  edgeBar = false
}) {
  const colorClasses = {
    primary: {
      bg: 'from-primary-50 to-primary-100/50',
      icon: 'bg-gradient-to-br from-primary-500 to-primary-600',
      iconColor: 'text-white',
      border: 'border-primary-200/50 dark:border-primary-800/30',
      edge: 'bg-primary-500'
    },
    accent: {
      bg: 'from-accent-50 to-accent-100/50',
      icon: 'bg-gradient-to-br from-accent-500 to-accent-600',
      iconColor: 'text-white',
      border: 'border-accent-200/50 dark:border-accent-800/30',
      edge: 'bg-accent-500'
    },
    hot: {
      bg: 'from-hot-50 to-hot-100/50',
      icon: 'bg-gradient-to-br from-hot-500 to-hot-600',
      iconColor: 'text-white',
      border: 'border-hot-200/50 dark:border-hot-900/30',
      edge: 'bg-hot-500'
    },
    warm: {
      bg: 'from-warm-50 to-warm-100/50',
      icon: 'bg-gradient-to-br from-warm-500 to-warm-600',
      iconColor: 'text-white',
      border: 'border-warm-200/50 dark:border-warm-900/30',
      edge: 'bg-warm-500'
    },
    emerald: {
      bg: 'from-emerald-50 to-emerald-100/50',
      icon: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      iconColor: 'text-white',
      border: 'border-emerald-200/50 dark:border-emerald-900/30',
      edge: 'bg-emerald-500'
    },
    blue: {
      bg: 'from-blue-50 to-blue-100/50',
      icon: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconColor: 'text-white',
      border: 'border-blue-200/50 dark:border-blue-900/30',
      edge: 'bg-blue-500'
    },
    purple: {
      bg: 'from-purple-50 to-purple-100/50',
      icon: 'bg-gradient-to-br from-purple-500 to-purple-600',
      iconColor: 'text-white',
      border: 'border-purple-200/50 dark:border-purple-900/30',
      edge: 'bg-purple-500'
    }
  };

  const colors = colorClasses[color] || colorClasses.primary;

  return (
    <div
      onClick={onClick}
      className={`card-body group relative overflow-hidden transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:shadow-elevation-2 hover:-translate-y-1' : ''
      }`}
    >
      {/* Optional left-edge color bar */}
      {edgeBar && (
        <div className={`stat-edge-bar ${colors.edge}`} />
      )}

      {/* Decorative background gradient — reduced opacity */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.bg} rounded-full transform translate-x-12 -translate-y-12 opacity-30 transition-all duration-500 group-hover:scale-150 group-hover:opacity-50`} />

      <div className="relative space-y-4">
        {/* Icon and Trend */}
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 ${colors.icon} rounded-xl flex items-center justify-center shadow-lg border ${colors.border} transition-transform duration-300 group-hover:scale-105`}>
            <Icon className={`w-6 h-6 ${colors.iconColor}`} strokeWidth={2.5} />
          </div>

          {trend && trendValue && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
              trend === 'up'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                : 'bg-hot-100 text-hot-700 dark:bg-hot-900/40 dark:text-hot-400'
            }`}>
              {trend === 'up' ? (
                <TrendingUp className="w-3.5 h-3.5" strokeWidth={3} />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" strokeWidth={3} />
              )}
              <span>{trendValue}%</span>
            </div>
          )}
        </div>

        {/* Label */}
        <div>
          <p className="text-sm font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-wide">
            {label}
          </p>
        </div>

        {/* Value */}
        <div>
          <p className="text-3xl font-display font-bold text-surface-900 dark:text-surface-100 tracking-tight tabular-nums">
            {value}
          </p>
          {subtext && (
            <p className="text-sm text-surface-500 dark:text-surface-500 mt-1 font-medium">
              {subtext}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
