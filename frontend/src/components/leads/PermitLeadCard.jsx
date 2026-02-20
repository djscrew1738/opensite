import { formatCurrency, formatDate } from '../../utils/format';
import { Building2, MapPin, Calendar, DollarSign, Home, ArrowUpRight, CheckCircle2, Clock, Phone, Mail } from 'lucide-react';
import StatusProgressBar from './StatusProgressBar';

const TIER_STYLES = {
  hot: {
    bg: 'bg-gradient-to-br from-red-50 to-rose-50',
    border: 'border-red-200',
    accent: 'border-l-red-500',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700 ring-red-200',
    icon: '🔥',
    label: 'Hot'
  },
  warm: {
    bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
    border: 'border-orange-200',
    accent: 'border-l-orange-500',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-700 ring-orange-200',
    icon: '☀️',
    label: 'Warm'
  },
  cold: {
    bg: 'bg-surface-50',
    border: 'border-surface-200',
    accent: 'border-l-surface-400',
    text: 'text-surface-600',
    badge: 'bg-surface-100 text-surface-600 ring-surface-200',
    icon: '❄️',
    label: 'Cold'
  },
  unscored: {
    bg: 'bg-surface-50',
    border: 'border-surface-200',
    accent: 'border-l-surface-300',
    text: 'text-surface-500',
    badge: 'bg-surface-100 text-surface-500',
    icon: '○',
    label: 'Unscored'
  }
};

const STATUS_ICONS = {
  new: Clock,
  contacted: Phone,
  quoted: DollarSign,
  won: CheckCircle2,
  lost: null
};

export default function PermitLeadCard({ permit, onStatusUpdate, onViewDetails, onViewBuilder }) {
  const tier = TIER_STYLES[permit.leadTier] || TIER_STYLES.unscored;
  const StatusIcon = STATUS_ICONS[permit.leadStatus];

  // Format permit type for display
  const formatPermitType = (type) => {
    if (!type) return 'Building Permit';
    return type
      .replace(/Permit/g, '')
      .replace(/Building/g, 'Bldg')
      .replace(/Residential/g, 'Res')
      .replace(/Commercial/g, 'Com')
      .trim();
  };

  return (
    <div className={`group relative overflow-hidden rounded-xl border ${tier.border} ${tier.accent} border-l-4 bg-white dark:bg-surface-800 shadow-sm hover:shadow-lg transition-all duration-300`}>
      {/* Top accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${tier.bg.replace('bg-gradient-to-br', '')}`} />
      
      <div className="p-4 space-y-3">
        {/* Header: Score + Tier */}
        <div className="flex items-start justify-between gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ring-1 ${tier.badge}`}>
            <span className="font-mono text-base">{permit.leadScore || '--'}</span>
            <span className="text-xs">{tier.label}</span>
          </div>
          
          {permit.leadStatus && permit.leadStatus !== 'new' && StatusIcon && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-100 text-surface-600 text-xs font-medium">
              <StatusIcon className="w-3.5 h-3.5" />
              <span className="capitalize">{permit.leadStatus}</span>
            </div>
          )}
        </div>

        {/* Contractor */}
        {permit.contractorName && (
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-surface-900 dark:text-surface-100 text-base truncate">
              {permit.contractorName}
            </span>
            {onViewBuilder && (
              <button
                onClick={(e) => { e.stopPropagation(); onViewBuilder(permit.contractorName); }}
                className="shrink-0 p-1.5 rounded-lg bg-steel-50 text-steel-600 hover:bg-steel-100 hover:text-steel-700 transition-colors"
                title="View builder profile"
              >
                <Building2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Permit Type & Number */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
            {formatPermitType(permit.permitType)}
          </span>
          {permit.permitNumber && (
            <span className="text-2xs text-surface-400 font-mono">
              #{permit.permitNumber}
            </span>
          )}
        </div>

        {/* Address */}
        {permit.address && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" />
            <span className="text-surface-600 dark:text-surface-400 line-clamp-2">
              {permit.address}
              {permit.city && `, ${permit.city}`}
              {permit.zipCode && ` ${permit.zipCode}`}
            </span>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-2">
          {permit.estimatedCost > 0 && (
            <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-2 text-center">
              <DollarSign className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <p className="text-xs font-bold text-surface-700 dark:text-surface-300">
                {formatCurrency(permit.estimatedCost)}
              </p>
              <p className="text-2xs text-surface-400">Est. Value</p>
            </div>
          )}
          
          {permit.units > 0 && (
            <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-2 text-center">
              <Home className="w-4 h-4 text-violet-500 mx-auto mb-1" />
              <p className="text-xs font-bold text-surface-700 dark:text-surface-300">
                {permit.units}
              </p>
              <p className="text-2xs text-surface-400">Units</p>
            </div>
          )}
          
          {permit.squareFootage > 0 && (
            <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-2 text-center">
              <div className="w-4 h-4 rounded bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-1 text-2xs font-bold">
                ft²
              </div>
              <p className="text-xs font-bold text-surface-700 dark:text-surface-300">
                {permit.squareFootage.toLocaleString()}
              </p>
              <p className="text-2xs text-surface-400">Sq Ft</p>
            </div>
          )}
        </div>

        {/* Description */}
        {permit.description && (
          <p className="text-xs text-surface-500 dark:text-surface-500 line-clamp-2 bg-surface-50 dark:bg-surface-700/30 rounded-lg p-2">
            {permit.description}
          </p>
        )}

        {/* Issue Date */}
        <div className="flex items-center gap-2 text-2xs text-surface-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>Issued {formatDate(permit.issuedDate)}</span>
        </div>

        {/* Status Progression */}
        <StatusProgressBar
          currentStatus={permit.leadStatus || 'new'}
          onStatusChange={(status) => onStatusUpdate?.(permit.id, status)}
        />

        {/* View Details Button */}
        <button
          onClick={() => onViewDetails?.(permit)}
          className="w-full btn-secondary text-sm justify-center group/btn"
        >
          <span>View Details</span>
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        </button>
      </div>
    </div>
  );
}
