import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { X, Building2, MapPin, TrendingUp, Wrench, Calendar, DollarSign, FileText, Phone, Mail, Globe } from 'lucide-react';
import { formatCurrency, formatDate, formatRelativeTime } from '../../utils/format';

export default function BuilderProfileModal({ builderId, onClose, onViewPermit }) {
  const { data: builder, isLoading } = useQuery({
    queryKey: ['builder', builderId],
    queryFn: () => api.permits.getBuilder(builderId),
    enabled: !!builderId,
  });

  if (!builderId) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-surface-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-concrete-200 dark:border-surface-700 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="p-8 space-y-4">
            <div className="skeleton h-8 w-1/2" />
            <div className="skeleton h-4 w-1/3" />
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="skeleton h-20 rounded-xl" />
              <div className="skeleton h-20 rounded-xl" />
              <div className="skeleton h-20 rounded-xl" />
            </div>
          </div>
        ) : builder ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-steel-700 to-steel-900 p-6 rounded-t-2xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center ring-2 ring-white/20">
                    <Building2 className="w-7 h-7 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white">
                      {builder.name || builder.company || 'Unknown Builder'}
                    </h2>
                    {builder.company && builder.name && (
                      <p className="text-steel-200 text-sm font-medium mt-0.5">{builder.company}</p>
                    )}
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-concrete-50 dark:bg-surface-800 text-center">
                  <p className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 tabular-nums">{builder.totalPermits || 0}</p>
                  <p className="text-2xs font-bold uppercase tracking-wider text-gray-500">Total Permits</p>
                </div>
                <div className="p-3 rounded-xl bg-concrete-50 dark:bg-surface-800 text-center">
                  <p className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 tabular-nums">{builder.permitsLast30d || 0}</p>
                  <p className="text-2xs font-bold uppercase tracking-wider text-gray-500">Last 30 Days</p>
                </div>
                <div className="p-3 rounded-xl bg-concrete-50 dark:bg-surface-800 text-center">
                  <p className="text-2xl font-display font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                    {builder.avgProjectCost ? formatCurrency(builder.avgProjectCost) : 'N/A'}
                  </p>
                  <p className="text-2xs font-bold uppercase tracking-wider text-gray-500">Avg Cost</p>
                </div>
                <div className="p-3 rounded-xl bg-concrete-50 dark:bg-surface-800 text-center">
                  <p className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 capitalize">{builder.activityTrend || 'Unknown'}</p>
                  <p className="text-2xs font-bold uppercase tracking-wider text-gray-500">Trend</p>
                </div>
              </div>

              {/* Contact & Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {builder.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-concrete-50 dark:bg-surface-800">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{builder.phone}</span>
                  </div>
                )}
                {builder.email && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-concrete-50 dark:bg-surface-800">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{builder.email}</span>
                  </div>
                )}
                {builder.website && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-concrete-50 dark:bg-surface-800">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{builder.website}</span>
                  </div>
                )}
                {builder.licenseNumber && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-concrete-50 dark:bg-surface-800">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">License: {builder.licenseNumber}</span>
                  </div>
                )}
              </div>

              {/* Plumber Status */}
              <div className={`flex items-center gap-3 p-4 rounded-xl ${
                builder.hasPlumber
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-hot-50 dark:bg-hot-950/20 border border-hot-200 dark:border-hot-800'
              }`}>
                <Wrench className={`w-5 h-5 ${builder.hasPlumber ? 'text-emerald-600' : 'text-hot-600'}`} />
                <div>
                  <p className={`text-sm font-bold ${builder.hasPlumber ? 'text-emerald-700 dark:text-emerald-400' : 'text-hot-700 dark:text-hot-400'}`}>
                    {builder.hasPlumber ? 'Has Plumber on File' : 'No Plumber — Sales Opportunity'}
                  </p>
                  {builder.knownPlumber && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                      Known plumber: {builder.knownPlumber} ({Math.round((builder.plumberConfidence || 0) * 100)}% confidence)
                    </p>
                  )}
                </div>
              </div>

              {/* Primary Zip Codes */}
              {builder.primaryZipCodes?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Active Zip Codes</h3>
                  <div className="flex flex-wrap gap-2">
                    {builder.primaryZipCodes.map(zip => (
                      <span key={zip} className="px-3 py-1 rounded-lg bg-concrete-100 dark:bg-surface-800 text-xs font-mono font-bold text-gray-700 dark:text-gray-300">
                        {zip}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Permit History */}
              {builder.permits?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">
                    Permit History ({builder.permits.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {builder.permits.map(p => (
                      <button
                        key={p.id}
                        onClick={() => onViewPermit?.(p)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-concrete-50 dark:bg-surface-800 hover:bg-concrete-100 dark:hover:bg-surface-700 transition-colors text-left"
                      >
                        <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{p.address || p.permitType}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {p.city && `${p.city} · `}{formatDate(p.issuedDate)}{p.estimatedCost ? ` · ${formatCurrency(p.estimatedCost)}` : ''}
                          </p>
                        </div>
                        {p.leadScore > 0 && (
                          <span className="text-sm font-bold font-mono text-gray-600 dark:text-gray-300">{p.leadScore}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Close */}
              <div className="flex justify-end pt-2">
                <button onClick={onClose} className="btn-secondary">Close</button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">Builder not found</p>
          </div>
        )}
      </div>
    </div>
  );
}
