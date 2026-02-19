import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Search, Building2, TrendingUp, Wrench, AlertCircle, Users } from 'lucide-react';
import BuilderCard from './BuilderCard';
import BuilderProfileModal from './BuilderProfileModal';

export default function BuilderIntelligenceTab({ onViewPermit }) {
  const [builderSearch, setBuilderSearch] = useState('');
  const [trendFilter, setTrendFilter] = useState('');
  const [plumberFilter, setPlumberFilter] = useState('');
  const [selectedBuilderId, setSelectedBuilderId] = useState(null);

  const { data: builders = [], isLoading } = useQuery({
    queryKey: ['builders', { search: builderSearch, activityTrend: trendFilter, hasPlumber: plumberFilter }],
    queryFn: () => api.permits.getBuilders({
      search: builderSearch || undefined,
      activityTrend: trendFilter || undefined,
      hasPlumber: plumberFilter === '' ? undefined : plumberFilter === 'true',
    }),
  });

  const { data: prospects = [] } = useQuery({
    queryKey: ['builder-prospects'],
    queryFn: () => api.permits.getProspects(10),
  });

  const stats = {
    total: builders.length,
    rising: builders.filter(b => b.activityTrend === 'rising').length,
    noPlumber: builders.filter(b => !b.hasPlumber).length,
  };

  const filters = [
    { key: '', label: 'All Builders' },
    { key: 'rising', label: 'Rising', icon: TrendingUp },
  ];

  const plumberFilters = [
    { key: '', label: 'Any' },
    { key: 'false', label: 'No Plumber', icon: AlertCircle },
    { key: 'true', label: 'Has Plumber', icon: Wrench },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card">
          <div className="card-body p-4 text-center">
            <Users className="w-5 h-5 text-steel-500 mx-auto mb-1" />
            <p className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 tabular-nums">{stats.total}</p>
            <p className="text-2xs font-bold uppercase tracking-wider text-gray-500">Builders</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body p-4 text-center">
            <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{stats.rising}</p>
            <p className="text-2xs font-bold uppercase tracking-wider text-gray-500">Rising</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body p-4 text-center">
            <AlertCircle className="w-5 h-5 text-hot-500 mx-auto mb-1" />
            <p className="text-2xl font-display font-bold text-hot-600 dark:text-hot-400 tabular-nums">{stats.noPlumber}</p>
            <p className="text-2xs font-bold uppercase tracking-wider text-gray-500">No Plumber</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card">
        <div className="card-body p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={builderSearch}
              onChange={(e) => setBuilderSearch(e.target.value)}
              placeholder="Search builders by name or company..."
              className="input pl-12"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Trend filters */}
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setTrendFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  trendFilter === f.key
                    ? 'bg-copper-100 dark:bg-copper-950/30 text-copper-700 dark:text-copper-400'
                    : 'bg-concrete-100 dark:bg-surface-800 text-gray-500 dark:text-gray-400 hover:bg-concrete-200 dark:hover:bg-surface-700'
                }`}
              >
                {f.label}
              </button>
            ))}

            <div className="w-px h-6 bg-concrete-200 dark:bg-surface-700 self-center mx-1" />

            {/* Plumber filters */}
            {plumberFilters.map(f => (
              <button
                key={f.key}
                onClick={() => setPlumberFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  plumberFilter === f.key
                    ? 'bg-copper-100 dark:bg-copper-950/30 text-copper-700 dark:text-copper-400'
                    : 'bg-concrete-100 dark:bg-surface-800 text-gray-500 dark:text-gray-400 hover:bg-concrete-200 dark:hover:bg-surface-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prospects Banner */}
      {prospects.length > 0 && !builderSearch && !trendFilter && plumberFilter !== 'true' && (
        <div className="card border-l-4 border-l-copper-500">
          <div className="card-body p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-copper-600 dark:text-copper-400 mb-3">
              Top Prospects — Builders Without Plumbers
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {prospects.slice(0, 5).map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedBuilderId(p.id)}
                  className="shrink-0 px-3 py-2 rounded-xl bg-copper-50 dark:bg-copper-950/20 hover:bg-copper-100 dark:hover:bg-copper-950/30 transition-colors text-left"
                >
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">{p.name || p.company}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.totalPermits || 0} permits · {p.activityTrend}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Builder Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card">
              <div className="card-body space-y-3">
                <div className="flex gap-3">
                  <div className="skeleton w-11 h-11 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="skeleton h-14 rounded-lg" />
                  <div className="skeleton h-14 rounded-lg" />
                  <div className="skeleton h-14 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : builders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {builders.map(builder => (
            <BuilderCard
              key={builder.id}
              builder={builder}
              onClick={() => setSelectedBuilderId(builder.id)}
            />
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-steel-100 to-steel-200 dark:from-steel-900 dark:to-steel-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-10 h-10 text-steel-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100 mb-2">No builders found</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-md mx-auto">
              {builderSearch ? 'Try adjusting your search' : 'Builder profiles are generated from permit data. Ingest permits first.'}
            </p>
          </div>
        </div>
      )}

      {/* Builder Profile Modal */}
      {selectedBuilderId && (
        <BuilderProfileModal
          builderId={selectedBuilderId}
          onClose={() => setSelectedBuilderId(null)}
          onViewPermit={onViewPermit}
        />
      )}
    </div>
  );
}
