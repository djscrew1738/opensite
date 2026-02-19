import { Building2, TrendingUp, TrendingDown, Minus, Wrench, AlertCircle } from 'lucide-react';

export default function BuilderCard({ builder, onClick }) {
  const trendIcon = {
    rising: { icon: TrendingUp, color: 'text-emerald-500', label: 'Rising' },
    declining: { icon: TrendingDown, color: 'text-hot-500', label: 'Declining' },
    stable: { icon: Minus, color: 'text-gray-400', label: 'Stable' },
  };

  const trend = trendIcon[builder.activityTrend] || trendIcon.stable;
  const TrendIcon = trend.icon;

  return (
    <div
      onClick={onClick}
      className="card-hover group cursor-pointer"
    >
      <div className="card-body space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-steel-500 to-steel-700 flex items-center justify-center shrink-0 shadow-md ring-2 ring-steel-200 dark:ring-steel-800 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                {builder.name || builder.company || 'Unknown'}
              </h3>
              {builder.company && builder.name && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{builder.company}</p>
              )}
            </div>
          </div>

          {/* Trend */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${trend.color} bg-concrete-50 dark:bg-surface-800`}>
            <TrendIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span className="hidden sm:inline">{trend.label}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-concrete-50 dark:bg-surface-800">
            <p className="text-lg font-display font-bold text-gray-900 dark:text-gray-100 tabular-nums">{builder.totalPermits || 0}</p>
            <p className="text-2xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-concrete-50 dark:bg-surface-800">
            <p className="text-lg font-display font-bold text-gray-900 dark:text-gray-100 tabular-nums">{builder.permitsLast30d || 0}</p>
            <p className="text-2xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">30d</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-concrete-50 dark:bg-surface-800">
            <p className="text-lg font-display font-bold text-gray-900 dark:text-gray-100 tabular-nums">{builder.permitsLast90d || 0}</p>
            <p className="text-2xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">90d</p>
          </div>
        </div>

        {/* Plumber Status */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold ${
          builder.hasPlumber
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
            : 'bg-hot-50 dark:bg-hot-950/20 text-hot-600 dark:text-hot-400'
        }`}>
          {builder.hasPlumber ? (
            <>
              <Wrench className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span>Has Plumber{builder.knownPlumber ? `: ${builder.knownPlumber}` : ''}</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span>NO PLUMBER — OPPORTUNITY</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
