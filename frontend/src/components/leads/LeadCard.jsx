import { Mail, Phone, MapPin, TrendingUp } from 'lucide-react';
import { useLeadScoring } from '../../hooks/useLeadScoring';

export default function LeadCard({ lead, onEdit }) {
  const scoreLead = useLeadScoring();

  const getScoreColor = (score) => {
    if (!score) return 'gray';
    if (score >= 80) return 'hot';
    if (score >= 50) return 'warm';
    return 'cold';
  };

  const getStatusColor = (status) => {
    if (status === 'hot') return 'bg-hot-100 text-hot-700';
    if (status === 'warm') return 'bg-warm-100 text-warm-700';
    return 'bg-cold-100 text-cold-700';
  };

  const color = getScoreColor(lead.score);

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{lead.name}</h3>
          <p className="text-sm text-gray-600">{lead.company}</p>
        </div>
        {lead.score !== null && (
          <div className="text-right">
            <div className={`text-2xl font-bold text-${color}-600`}>
              {lead.score}
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(lead.status)}`}>
              {lead.status?.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {lead.email && (
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="w-4 h-4 mr-2" />
            <span>{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-4 h-4 mr-2" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.location && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{lead.location}</span>
          </div>
        )}
      </div>

      {lead.projectType && (
        <div className="mb-3">
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
            {lead.projectType}
          </span>
        </div>
      )}

      {lead.value > 0 && (
        <div className="text-sm text-gray-600 mb-3">
          Value: <span className="font-semibold">${lead.value.toLocaleString()}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => scoreLead.mutate(lead.id)}
          disabled={scoreLead.isPending}
          className="btn-primary text-sm flex items-center gap-1"
        >
          <TrendingUp className="w-4 h-4" />
          {scoreLead.isPending ? 'Scoring...' : 'AI Score'}
        </button>
        {onEdit && (
          <button
            onClick={() => onEdit(lead)}
            className="btn-secondary text-sm"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
