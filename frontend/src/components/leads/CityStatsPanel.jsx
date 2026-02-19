import { formatCurrency, formatDate } from '../../utils/format';
import { MapPin, Calendar, DollarSign, FileText, Building2 } from 'lucide-react';

export default function CityStatsPanel({ stats, onViewBuilder, onViewPermit }) {
  if (!stats) return null;

  const tierColors = {
    hot: 'bg-hot-500',
    warm: 'bg-warm-500',
    cold: 'bg-cool-400',
    unscored: 'bg-gray-300 dark:bg-gray-600',
  };

  const totalTier = stats.byTier?.reduce((sum, t) => sum + t.count, 0) || 1;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* City Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-copper-500 to-copper-600 flex items-center justify-center shadow-md">
          <MapPin className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">{stats.city}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">City Intelligence</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card">
          <div className="card-body p-4 text-center">
            <FileText className="w-5 h-5 text-steel-500 mx-auto mb-1" />
            <p className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 tabular-nums">{stats.totalPermits}</p>
            <p className="text-2xs font-bold uppercase tracking-wider text-gray-500">Total Permits</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body p-4 text-center">
            <Calendar className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{stats.permitsThisWeek}</p>
            <p className="text-2xs font-bold uppercase tracking-wider text-gray-500">This Week</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body p-4 text-center">
            <DollarSign className="w-5 h-5 text-copper-500 mx-auto mb-1" />
            <p className="text-2xl font-display font-bold text-copper-600 dark:text-copper-400 tabular-nums">{formatCurrency(stats.avgCost)}</p>
            <p className="text-2xs font-bold uppercase tracking-wider text-gray-500">Avg Cost</p>
          </div>
        </div>
      </div>

      {/* Tier Breakdown */}
      {stats.byTier?.length > 0 && (
        <div className="card">
          <div className="card-body p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">Lead Tier Breakdown</h3>
            <div className="pipe-track h-3 flex overflow-hidden rounded-full mb-3">
              {stats.byTier.map(t => {
                const pct = (t.count / totalTier) * 100;
                return (
                  <div
                    key={t.leadTier}
                    className={`${tierColors[t.leadTier] || tierColors.unscored} transition-all first:rounded-l-full last:rounded-r-full`}
                    style={{ width: `${pct}%` }}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3">
              {stats.byTier.map(t => (
                <div key={t.leadTier} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${tierColors[t.leadTier] || tierColors.unscored}`} />
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 capitalize">{t.leadTier}</span>
                  <span className="text-xs font-bold font-mono text-gray-900 dark:text-gray-200 tabular-nums">{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Builders */}
      {stats.topBuilders?.length > 0 && (
        <div className="card">
          <div className="card-body p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">Top Builders</h3>
            <div className="space-y-2">
              {stats.topBuilders.map((b, idx) => (
                <button
                  key={b.contractorName}
                  onClick={() => onViewBuilder?.(b.contractorName)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-concrete-50 dark:bg-surface-800 hover:bg-concrete-100 dark:hover:bg-surface-700 transition-colors text-left"
                >
                  <span className="w-6 h-6 rounded-lg bg-steel-100 dark:bg-steel-900 flex items-center justify-center text-xs font-bold text-steel-600 dark:text-steel-400 tabular-nums">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {b.contractorName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">{b.permitCount}</p>
                    <p className="text-2xs text-gray-500">permits</p>
                  </div>
                  {b.totalValue > 0 && (
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-copper-600 dark:text-copper-400 tabular-nums">{formatCurrency(b.totalValue)}</p>
                      <p className="text-2xs text-gray-500">value</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Permits */}
      {stats.recentPermits?.length > 0 && (
        <div className="card">
          <div className="card-body p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">Recent Permits</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.recentPermits.map(p => (
                <button
                  key={p.id}
                  onClick={() => onViewPermit?.(p)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-concrete-50 dark:bg-surface-800 hover:bg-concrete-100 dark:hover:bg-surface-700 transition-colors text-left"
                >
                  <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{p.contractorName || p.address}</p>
                    <p className="text-xs text-gray-500">{formatDate(p.issuedDate)}{p.estimatedCost ? ` · ${formatCurrency(p.estimatedCost)}` : ''}</p>
                  </div>
                  {p.leadScore > 0 && (
                    <span className={`text-sm font-bold font-mono ${
                      p.leadTier === 'hot' ? 'text-hot-500' : p.leadTier === 'warm' ? 'text-warm-500' : 'text-gray-400'
                    }`}>{p.leadScore}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
