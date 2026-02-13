import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
  trendValue,
  color = 'primary',
  onClick
}) {
  const colorClasses = {
    primary: {
      bg: 'from-primary-50 to-primary-100/50',
      icon: 'bg-gradient-to-br from-primary-500 to-primary-600',
      iconColor: 'text-white',
      ring: 'ring-primary-200'
    },
    accent: {
      bg: 'from-accent-50 to-accent-100/50',
      icon: 'bg-gradient-to-br from-accent-500 to-accent-600',
      iconColor: 'text-white',
      ring: 'ring-accent-200'
    },
    hot: {
      bg: 'from-hot-50 to-hot-100/50',
      icon: 'bg-gradient-to-br from-hot-500 to-hot-600',
      iconColor: 'text-white',
      ring: 'ring-hot-200'
    },
    warm: {
      bg: 'from-warm-50 to-warm-100/50',
      icon: 'bg-gradient-to-br from-warm-500 to-warm-600',
      iconColor: 'text-white',
      ring: 'ring-warm-200'
    },
    emerald: {
      bg: 'from-emerald-50 to-emerald-100/50',
      icon: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      iconColor: 'text-white',
      ring: 'ring-emerald-200'
    },
    blue: {
      bg: 'from-blue-50 to-blue-100/50',
      icon: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconColor: 'text-white',
      ring: 'ring-blue-200'
    },
    purple: {
      bg: 'from-purple-50 to-purple-100/50',
      icon: 'bg-gradient-to-br from-purple-500 to-purple-600',
      iconColor: 'text-white',
      ring: 'ring-purple-200'
    }
  };

  const colors = colorClasses[color] || colorClasses.primary;

  return (
    <div
      onClick={onClick}
      className={`card-body group relative overflow-hidden transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:shadow-industrial-lg hover:-translate-y-1' : ''
      }`}
    >
      {/* Decorative background gradient */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.bg} rounded-full transform translate-x-12 -translate-y-12 opacity-50 transition-all duration-500 group-hover:scale-150 group-hover:opacity-70`} />

      <div className="relative space-y-4">
        {/* Icon and Trend */}
        <div className="flex items-start justify-between">
          <div className={`w-14 h-14 ${colors.icon} rounded-2xl flex items-center justify-center shadow-lg ring-4 ${colors.ring} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            <Icon className={`w-7 h-7 ${colors.iconColor}`} strokeWidth={2.5} />
          </div>

          {trend && trendValue && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
              trend === 'up'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-hot-100 text-hot-700'
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
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            {label}
          </p>
        </div>

        {/* Value */}
        <div>
          <p className="text-4xl font-display font-bold text-gray-900 tracking-tight">
            {value}
          </p>
          {subtext && (
            <p className="text-sm text-gray-500 mt-1 font-medium">
              {subtext}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
