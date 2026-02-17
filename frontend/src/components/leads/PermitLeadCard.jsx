import { formatCurrency, formatDate } from '../../utils/format';
import { Building2 } from 'lucide-react';
import StatusProgressBar from './StatusProgressBar';

export default function PermitLeadCard({ permit, onStatusUpdate, onViewDetails, onViewBuilder }) {
  const getTierStyle = (tier) => {
    switch (tier) {
      case 'hot':
        return { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400' };
      case 'warm':
        return { bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-400' };
      case 'cold':
        return { bg: 'bg-surface-50 dark:bg-surface-900', border: 'border-surface-200 dark:border-surface-700', text: 'text-surface-600 dark:text-surface-400' };
      default:
        return { bg: 'bg-surface-50 dark:bg-surface-900', border: 'border-surface-200 dark:border-surface-700', text: 'text-surface-500 dark:text-surface-500' };
    }
  };

  const tierStyle = getTierStyle(permit.leadTier);

  return (
    <div className={`${tierStyle.bg} ${tierStyle.border} border rounded-xl p-4 hover:shadow-industrial transition-all duration-200 space-y-3`}>
      {/* Header: Score and Tier */}
      <div className="flex items-start justify-between">
        <div className={`${tierStyle.text} font-bold text-2xl flex items-center gap-2`}>
          <span className="font-display tabular-nums">{permit.leadScore}</span>
          <span className="text-xs font-bold uppercase tracking-wider opacity-70">{permit.leadTier}</span>
        </div>
      </div>

      {/* Contractor */}
      {permit.contractorName && (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-surface-900 dark:text-surface-100 text-base truncate">
            {permit.contractorName}
          </span>
          {onViewBuilder && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewBuilder(permit.contractorName); }}
              className="shrink-0 p-1 rounded-lg hover:bg-steel-100 dark:hover:bg-steel-900/30 transition-colors"
              title="View builder profile"
            >
              <Building2 className="w-4 h-4 text-steel-500" strokeWidth={2} />
            </button>
          )}
        </div>
      )}

      {/* Permit Type */}
      <div className="text-surface-700 dark:text-surface-300 text-sm font-medium">
        {permit.permitType}
      </div>

      {/* Address */}
      <div className="text-surface-600 dark:text-surface-400 text-xs">
        {permit.address}{permit.city ? `, ${permit.city}` : ''} {permit.zipCode || ''}
      </div>

      {/* Key Metrics */}
      <div className="flex items-center gap-3 text-xs text-surface-600 dark:text-surface-400">
        {permit.estimatedCost > 0 && (
          <span className="font-semibold">{formatCurrency(permit.estimatedCost)}</span>
        )}
        {permit.units > 0 && (
          <span>{permit.units} unit{permit.units > 1 ? 's' : ''}</span>
        )}
        {permit.squareFootage > 0 && (
          <span>{permit.squareFootage.toLocaleString()} sqft</span>
        )}
      </div>

      {/* Description (truncated) */}
      {permit.description && (
        <p className="text-xs text-surface-500 dark:text-surface-500 line-clamp-2">{permit.description}</p>
      )}

      {/* Issue Date */}
      <div className="text-2xs text-surface-400">
        Issued: {formatDate(permit.issuedDate)} · #{permit.permitNumber}
      </div>

      {/* Status Progression */}
      <StatusProgressBar
        currentStatus={permit.leadStatus || 'new'}
        onStatusChange={(status) => onStatusUpdate?.(permit.id, status)}
      />

      {/* View Details */}
      <button
        onClick={() => onViewDetails?.(permit)}
        className="btn-secondary w-full text-sm justify-center"
      >
        View Details
      </button>
    </div>
  );
}
