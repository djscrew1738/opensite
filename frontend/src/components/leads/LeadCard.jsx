import { Mail, Phone, MapPin, TrendingUp, Sparkles, Edit2 } from 'lucide-react';
import { useLeadScoring } from '../../hooks/useLeadScoring';

export default function LeadCard({ lead, onEdit }) {
  const scoreLead = useLeadScoring();

  const getScoreStyles = (score) => {
    if (!score) return {
      color: 'text-gray-600',
      bg: 'from-gray-100 to-gray-200',
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
            <h3 className="text-lg font-display font-bold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
              {lead.name}
            </h3>
            <p className="text-sm text-gray-600 truncate font-medium">{lead.company || 'No company'}</p>
          </div>
          {lead.score !== null && (
            <div className="text-right shrink-0">
              <div className={`text-3xl font-display font-bold ${styles.color}`}>
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
          <div className="space-y-2 py-3 border-y border-concrete-200">
            {lead.email && (
              <div className="flex items-center text-sm text-gray-600 group/item">
                <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center mr-2 group-hover/item:bg-primary-100 transition-colors">
                  <Mail className="w-4 h-4 text-primary-600" strokeWidth={2} />
                </div>
                <span className="truncate font-medium">{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center text-sm text-gray-600 group/item">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mr-2 group-hover/item:bg-emerald-100 transition-colors">
                  <Phone className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                </div>
                <span className="font-medium">{lead.phone}</span>
              </div>
            )}
            {lead.location && (
              <div className="flex items-center text-sm text-gray-600 group/item">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-2 group-hover/item:bg-blue-100 transition-colors">
                  <MapPin className="w-4 h-4 text-blue-600" strokeWidth={2} />
                </div>
                <span className="truncate font-medium">{lead.location}</span>
              </div>
            )}
          </div>
        )}

        {/* Project Type & Value */}
        <div className="flex items-center gap-2 flex-wrap">
          {lead.projectType && (
            <span className="badge bg-concrete-100 text-gray-700 ring-1 ring-concrete-200">
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
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => scoreLead.mutate(lead.id)}
            disabled={scoreLead.isPending}
            className="btn-primary text-sm justify-center"
          >
            {scoreLead.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Scoring...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" strokeWidth={2.5} />
                <span>AI Score</span>
              </>
            )}
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(lead)}
              className="btn-secondary text-sm justify-center"
            >
              <Edit2 className="w-4 h-4" strokeWidth={2.5} />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
