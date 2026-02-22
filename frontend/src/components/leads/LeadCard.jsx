import { Mail, Phone, MapPin, Sparkles, Edit2, Trash2, MoreHorizontal, Copy, Check, TrendingUp, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { useLeadScoring } from '../../hooks/useLeadScoring';
import { LeadCardSkeleton } from '../shared/LoadingStates';

const TIER_CONFIG = {
  hot: {
    gradient: 'from-red-500 to-orange-500',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700 ring-red-200',
    label: 'Hot Lead'
  },
  warm: {
    gradient: 'from-orange-400 to-amber-400',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700 ring-orange-200',
    label: 'Warm Lead'
  },
  cold: {
    gradient: 'from-slate-400 to-gray-400',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-600 ring-slate-200',
    label: 'Cold Lead'
  },
  unscored: {
    gradient: 'from-surface-300 to-surface-400',
    bg: 'bg-surface-50',
    text: 'text-surface-500',
    border: 'border-surface-200',
    badge: 'bg-surface-100 text-surface-500',
    label: 'Unscored'
  }
};

export default function LeadCard({ lead, onEdit, onDelete, isSelected, onSelect, selectionMode, isLoading = false }) {
  // Show skeleton during loading
  if (isLoading) {
    return <LeadCardSkeleton count={1} />;
  }
  
  const scoreLead = useLeadScoring();
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const tier = TIER_CONFIG[lead.status] || TIER_CONFIG.unscored;
  const hasScore = lead.score !== null && lead.score !== undefined;

  const handleCopyEmail = (e) => {
    e.stopPropagation();
    if (lead.email) {
      navigator.clipboard.writeText(lead.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCardClick = () => {
    if (selectionMode) {
      onSelect?.(lead.id);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`group relative overflow-hidden rounded-xl border ${tier.border} bg-surface-50 dark:bg-surface-800 shadow-sm hover:shadow-lg transition-all duration-300 ${selectionMode ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-accent-500 ring-offset-2' : ''}`}
    >
      {/* Selection checkbox overlay */}
      {selectionMode && (
        <div className={`absolute top-3 left-3 z-10 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-accent-500 border-accent-500' : 'bg-white/90 border-surface-300'}`}>
          {isSelected && (
            <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
            </svg>
          )}
        </div>
      )}

      {/* Score gradient header */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${hasScore ? tier.gradient : 'from-surface-300 to-surface-400'}`} />
      
      <div className={`p-4 space-y-4 ${selectionMode ? 'pl-12' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-surface-900 dark:text-surface-100 truncate group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
              {lead.name}
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 truncate font-medium">
              {lead.company || 'No company'}
            </p>
          </div>
          
          {/* Score display */}
          {hasScore && (
            <div className="text-right shrink-0">
              <div className={`text-2xl font-mono font-bold tabular-nums ${tier.text}`}>
                {lead.score}
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ring-1 ${tier.badge}`}>
                {tier.label}
              </span>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-2">
          {lead.email && (
            <div className="flex items-center gap-2 group/email">
              <div className="w-7 h-7 rounded-md bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center shrink-0">
                <Mail className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              </div>
              <span className="text-sm text-surface-600 dark:text-surface-400 truncate font-medium flex-1">
                {lead.email}
              </span>
              <button
                onClick={handleCopyEmail}
                className="opacity-0 group-hover/email:opacity-100 transition-opacity p-1 rounded hover:bg-surface-100"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-surface-400" />}
              </button>
            </div>
          )}
          
          {lead.phone && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
                <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm text-surface-600 dark:text-surface-400 font-medium">
                {lead.phone}
              </span>
            </div>
          )}
          
          {lead.location && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm text-surface-600 dark:text-surface-400 truncate font-medium">
                {lead.location}
              </span>
            </div>
          )}
        </div>

        {/* Project Info */}
        <div className="flex items-center gap-2 flex-wrap">
          {lead.projectType && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 ring-1 ring-surface-200 dark:ring-surface-600">
              {lead.projectType}
            </span>
          )}
          {lead.value > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-sm">
              <DollarSign className="w-3 h-3" />
              {lead.value.toLocaleString()}
            </span>
          )}
        </div>

        {/* Actions */}
        {!selectionMode && (
          <div className="flex items-center gap-2 pt-2 border-t border-surface-100 dark:border-surface-700">
            <button
              onClick={() => scoreLead.mutate(lead.id)}
              disabled={scoreLead.isPending}
              className="flex-1 btn-primary text-xs justify-center py-2"
            >
              {scoreLead.isPending ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Score</span>
                </>
              )}
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="btn-secondary text-xs p-2"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              
              {showActions && (
                <div className="absolute right-0 bottom-full mb-2 w-40 bg-white dark:bg-surface-800 rounded-lg shadow-xl border border-surface-200 dark:border-surface-700 py-1 z-20">
                  <button
                    onClick={() => { onEdit?.(lead); setShowActions(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Lead
                  </button>
                  <button
                    onClick={() => { onDelete?.(lead.id); setShowActions(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-hot-600 hover:bg-hot-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
