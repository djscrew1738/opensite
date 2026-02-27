import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Trash2, 
  ChevronRight 
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/format';
import { useCallback, memo } from 'react';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const STATUS_ICONS = {
  completed: CheckCircle2,
  failed: XCircle,
  running: Loader2,
  pending: Clock,
};

const STATUS_STYLES = {
  completed: 'text-green-600',
  failed: 'text-red-600',
  running: 'text-accent-600 animate-spin',
  pending: 'text-gray-400',
};

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Status icon component
 */
const StatusIcon = memo(function StatusIcon({ status }) {
  const Icon = STATUS_ICONS[status] || Clock;
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  
  return <Icon className={`w-4 h-4 shrink-0 ${style}`} />;
});

/**
 * Delete button for run
 */
const DeleteButton = memo(function DeleteButton({ onDelete, runId }) {
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    onDelete(runId);
  }, [onDelete, runId]);

  return (
    <button
      onClick={handleClick}
      className="text-gray-400 hover:text-red-500 p-1 transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
});

/**
 * Individual run item
 */
const RunItem = memo(function RunItem({ 
  run, 
  isActive, 
  onSelect, 
  onDelete 
}) {
  const handleClick = useCallback(() => {
    onSelect(run.id);
  }, [onSelect, run.id]);

  const getContainerStyles = () => {
    if (isActive) {
      return 'bg-accent-50 dark:bg-accent-950/20 border border-accent-200 dark:border-accent-700';
    }
    return 'hover:bg-concrete-50 dark:hover:bg-gray-800 border border-transparent';
  };

  const getMetaText = () => {
    const parts = [formatRelativeTime(run.createdAt)];
    if (run.totalFound > 0) parts.push(`${run.totalFound} found`);
    if (run.scored > 0) parts.push(`${run.scored} scored`);
    return parts.join(' · ');
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${getContainerStyles()}`}
    >
      <StatusIcon status={run.status} />
      
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
          {run.keyword} — {run.city}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {getMetaText()}
        </p>
      </div>
      
      <div className="flex items-center gap-1 shrink-0">
        {onDelete && run.status !== 'running' && (
          <DeleteButton onDelete={onDelete} runId={run.id} />
        )}
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
});

/**
 * Empty state when no runs
 */
const EmptyState = memo(function EmptyState() {
  return null; // Component returns null when no runs, as per original
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export default function DiscoveryRunHistory({ 
  runs, 
  onSelectRun, 
  activeRunId, 
  onDeleteRun 
}) {
  if (!runs?.length) {
    return <EmptyState />;
  }

  return (
    <div className="card">
      <div className="card-body p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-3">
          Past Runs
        </h3>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {runs.map((run) => (
            <RunItem
              key={run.id}
              run={run}
              isActive={run.id === activeRunId}
              onSelect={onSelectRun}
              onDelete={onDeleteRun}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
