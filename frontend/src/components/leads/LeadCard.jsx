import { Mail, Phone, MapPin, TrendingUp, Sparkles, Edit2, Trash2 } from 'lucide-react';
import { useLeadScoring } from '../../hooks/useLeadScoring';

export default function LeadCard({ lead, onEdit, onDelete }) {
  const scoreLead = useLeadScoring();

  const getScoreStyles = (score) => {
    if (!score) return {
      color: 'text-surface-600',
      bg: 'from-surface-100 to-surface-200',
      badge: 'badge-cool'
    };
    if (score >= 80) return {
      color: 'text-hot-600',
      bg: 'from-hot-500 to-hot-600',
      badge: 'badge-hot'
    };
    if (score >= 50) return {
      color: 'text-warm-600',
      bg: 'from-warm-500 to-warm-600',
      badge: 'badge-warm'
    };
    return {
      color: 'text-cool-600',
      bg: 'from-cool-500 to-cool-600',
      badge: 'badge-cool'
    };
  };

  const styles = getScoreStyles(lead.score);

  return (
    <div className="card-hover group">
      <div className="card-body space-y-4">
        {/* Header with Score */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-display font-bold text-surface-900 dark:text-surface-100 truncate group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
              {lead.name}
            </h3>
            <p className="text-sm text-surface-600 dark:text-surface-400 truncate font-medium">{lead.company || 'No company'}</p>
          </div>
          {lead.score !== null && (
            <div className="text-right shrink-0">
              <div className={`text-2xl font-display font-bold ${styles.color}`}>
                {lead.score}
              </div>
              <span className={`${styles.badge} text-2xs`}>
                {lead.status?.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Contact Info */}
        {(lead.email || lead.phone || lead.location) && (
          <div className="space-y-2 py-3 border-y border-surface-200 dark:border-surface-700">
            {lead.email && (
              <div className="flex items-center text-sm text-surface-600 dark:text-surface-400 group/item">
                <div className="w-7 h-7 bg-primary-50 dark:bg-primary-950/30 rounded-md flex items-center justify-center mr-2 group-hover/item:bg-primary-100 dark:group-hover/item:bg-primary-900/30 transition-colors">
                  <Mail className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" strokeWidth={2} />
                </div>
                <span className="truncate font-medium">{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center text-sm text-surface-600 dark:text-surface-400 group/item">
                <div className="w-7 h-7 bg-emerald-50 dark:bg-emerald-950/30 rounded-md flex items-center justify-center mr-2 group-hover/item:bg-emerald-100 dark:group-hover/item:bg-emerald-900/30 transition-colors">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                </div>
                <span className="font-medium">{lead.phone}</span>
              </div>
            )}
            {lead.location && (
              <div className="flex items-center text-sm text-surface-600 dark:text-surface-400 group/item">
                <div className="w-7 h-7 bg-blue-50 dark:bg-blue-950/30 rounded-md flex items-center justify-center mr-2 group-hover/item:bg-blue-100 dark:group-hover/item:bg-blue-900/30 transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                </div>
                <span className="truncate font-medium">{lead.location}</span>
              </div>
            )}
          </div>
        )}

        {/* Project Type & Value */}
        <div className="flex items-center gap-2 flex-wrap">
          {lead.projectType && (
            <span className="badge bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 ring-1 ring-surface-200 dark:ring-surface-600">
              {lead.projectType}
            </span>
          )}
          {lead.value > 0 && (
            <span className="badge bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg">
              ${lead.value.toLocaleString()}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <button
            onClick={() => scoreLead.mutate(lead.id)}
            disabled={scoreLead.isPending}
            className="btn-primary text-xs justify-center"
          >
            {scoreLead.isPending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Scoring...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>AI Score</span>
              </>
            )}
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(lead)}
              className="btn-secondary text-xs justify-center"
            >
              <Edit2 className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span>Edit</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(lead.id)}
              className="btn-ghost text-xs justify-center text-hot-500 hover:bg-hot-50 dark:hover:bg-hot-950/20"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
