import { FileText, User, Building2, MapPin, TrendingUp, HardHat, Calculator } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

const typeConfig = {
  permit: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', label: 'Permit' },
  lead: { icon: User, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', label: 'Lead' },
  builder: { icon: Building2, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30', label: 'Builder' },
  job: { icon: HardHat, color: 'text-accent-blue', bg: 'bg-accent-blue/10', label: 'Job' },
  estimate: { icon: Calculator, color: 'text-accent-amber', bg: 'bg-accent-amber/10', label: 'Estimate' },
};

export default function SearchResultRow({ result, type, isHighlighted, onClick }) {
  const config = typeConfig[type] || typeConfig.permit;
  const Icon = config.icon;

  const getName = () => {
    if (type === 'permit') return result.contractorName || result.address || 'Unknown Permit';
    if (type === 'lead') return result.name || result.company || 'Unknown Lead';
    if (type === 'builder') return result.name || result.company || 'Unknown Builder';
    if (type === 'job') return result.address || result.id || 'Unknown Job';
    if (type === 'estimate') return result.name || result.address || 'Unknown Estimate';
    return 'Unknown';
  };

  const getSubtext = () => {
    if (type === 'permit') {
      const parts = [];
      if (result.permitType) parts.push(result.permitType);
      if (result.city) parts.push(result.city);
      if (result.estimatedCost) parts.push(formatCurrency(result.estimatedCost));
      return parts.join(' · ');
    }
    if (type === 'lead') {
      const parts = [];
      if (result.company) parts.push(result.company);
      if (result.location) parts.push(result.location);
      return parts.join(' · ');
    }
    if (type === 'builder') {
      const parts = [];
      if (result.company) parts.push(result.company);
      if (result.totalPermits) parts.push(`${result.totalPermits} permits`);
      if (result.activityTrend === 'rising') parts.push('Rising');
      return parts.join(' · ');
    }
    if (type === 'job') {
      const parts = [];
      if (result.builder) parts.push(result.builder);
      if (result.phase) parts.push(result.phase);
      if (result.city) parts.push(result.city);
      return parts.join(' · ');
    }
    if (type === 'estimate') {
      const parts = [];
      if (result.total !== undefined) parts.push(formatCurrency(result.total));
      if (result.status) parts.push(result.status);
      return parts.join(' · ');
    }
    return '';
  };

  const getScore = () => {
    if (type === 'permit') return result.leadScore;
    if (type === 'lead') return result.score;
    if (type === 'builder') return result.totalPermits;
    if (type === 'job') return result.daysInPhase;
    if (type === 'estimate') return result.total;
    return null;
  };

  const score = getScore();

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-100 ${
        isHighlighted
          ? 'bg-blue-50 dark:bg-copper-950/20'
          : 'hover:bg-concrete-50 dark:hover:bg-gray-800/50'
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}>
        <Icon className={`w-4.5 h-4.5 ${config.color}`} strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
          {getName()}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {getSubtext()}
        </p>
      </div>

      {score != null && (
        <div className="shrink-0 text-right">
          <span className="text-sm font-bold font-mono text-gray-700 dark:text-gray-300">{score}</span>
        </div>
      )}

      <span className={`text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${config.bg} ${config.color}`}>
        {config.label}
      </span>
    </button>
  );
}
