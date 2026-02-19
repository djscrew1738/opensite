import { X, MapPin, DollarSign, Calendar, Hash, Building2, FileText, Phone, Mail } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/format';
import StatusProgressBar from './StatusProgressBar';

export default function PermitDetailModal({ permit, onClose, onStatusUpdate }) {
  if (!permit) return null;

  const tierColors = {
    hot: 'from-hot-500 to-hot-600',
    warm: 'from-warm-500 to-warm-600',
    cold: 'from-gray-400 to-gray-500'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-surface-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-concrete-200 dark:border-surface-700 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with score */}
        <div className={`bg-gradient-to-r ${tierColors[permit.leadTier] || tierColors.cold} p-6 rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium uppercase tracking-wide">{permit.leadTier} Lead</p>
              <p className="text-white text-4xl font-display font-bold">{permit.leadScore}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Contractor */}
          {permit.contractorName && (
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-blue-500" />
                {permit.contractorName}
              </h2>
            </div>
          )}

          {/* Permit Type */}
          <div>
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{permit.permitType}</p>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-concrete-50 dark:bg-surface-800 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                <MapPin className="w-3.5 h-3.5" /> Address
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {permit.address}{permit.city ? `, ${permit.city}` : ''} {permit.zipCode || ''}
              </p>
            </div>

            {permit.estimatedCost && (
              <div className="p-3 bg-concrete-50 dark:bg-surface-800 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  <DollarSign className="w-3.5 h-3.5" /> Est. Cost
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(permit.estimatedCost)}</p>
              </div>
            )}

            {permit.issuedDate && (
              <div className="p-3 bg-concrete-50 dark:bg-surface-800 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Issued
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(permit.issuedDate)}</p>
              </div>
            )}

            {permit.permitNumber && (
              <div className="p-3 bg-concrete-50 dark:bg-surface-800 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  <Hash className="w-3.5 h-3.5" /> Permit #
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono">{permit.permitNumber}</p>
              </div>
            )}
          </div>

          {/* Metrics row */}
          {(permit.units || permit.squareFootage) && (
            <div className="flex gap-4">
              {permit.units && (
                <div className="flex-1 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl text-center">
                  <p className="text-2xl font-display font-bold text-blue-700 dark:text-blue-400">{permit.units}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 font-medium">Units</p>
                </div>
              )}
              {permit.squareFootage && (
                <div className="flex-1 p-3 bg-accent-50 dark:bg-accent-950/20 rounded-xl text-center">
                  <p className="text-2xl font-display font-bold text-accent-700 dark:text-accent-400">{permit.squareFootage.toLocaleString()}</p>
                  <p className="text-xs text-accent-600 dark:text-accent-500 font-medium">Sq. Ft.</p>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {permit.description && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{permit.description}</p>
            </div>
          )}

          {/* Contact info */}
          {(permit.contractorPhone || permit.contractorEmail) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Contact</p>
              {permit.contractorPhone && (
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {permit.contractorPhone}
                </div>
              )}
              {permit.contractorEmail && (
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {permit.contractorEmail}
                </div>
              )}
            </div>
          )}

          {/* Status Progression */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Status</p>
            <StatusProgressBar
              currentStatus={permit.leadStatus || 'new'}
              onStatusChange={(status) => {
                onStatusUpdate?.(permit.id, status);
                onClose();
              }}
            />
          </div>

          {/* Close */}
          <div className="flex justify-end pt-2">
            <button onClick={onClose} className="btn-secondary">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
