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
import PropTypes from 'prop-types';
import { colors, shadows, radius } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/** @type {Record<string, React.ComponentType>} */
const STATUS_ICONS = {
  completed: CheckCircle2,
  failed: XCircle,
  running: Loader2,
  pending: Clock,
};

/** @type {Record<string, { color: string; animate?: boolean }>} */
const STATUS_STYLES = {
  completed: { color: colors.success.DEFAULT },
  failed: { color: colors.danger.DEFAULT },
  running: { color: colors.accent.DEFAULT, animate: true },
  pending: { color: colors.text.muted },
};

// ═══════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} DiscoveryRun
 * @property {string} id - Run identifier
 * @property {string} keyword - Search keyword
 * @property {string} city - Search city
 * @property {string} status - Run status (running/completed/failed/pending)
 * @property {string} createdAt - Creation timestamp
 * @property {number} [totalFound] - Total leads found
 * @property {number} [scored] - Number of scored leads
 */

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Status icon component
 * @param {Object} props
 * @param {string} props.status - Run status
 */
const StatusIcon = memo(function StatusIcon({ status }) {
  const Icon = STATUS_ICONS[status] || Clock;
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  
  return (
    <Icon 
      className={`w-4 h-4 shrink-0 ${style.animate ? 'animate-spin' : ''}`}
      style={{ color: style.color }}
      aria-hidden="true"
    />
  );
});

StatusIcon.displayName = 'StatusIcon';

StatusIcon.propTypes = {
  status: PropTypes.oneOf(['completed', 'failed', 'running', 'pending']).isRequired,
};

/**
 * Delete button for run
 * @param {Object} props
 * @param {(id: string) => void} props.onDelete - Delete handler
 * @param {string} props.runId - Run identifier
 */
const DeleteButton = memo(function DeleteButton({ onDelete, runId }) {
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    onDelete(runId);
  }, [onDelete, runId]);

  return (
    <button
      onClick={handleClick}
      className="p-1 transition-colors rounded"
      style={{ color: colors.text.muted }}
      onMouseEnter={(e) => e.currentTarget.style.color = colors.danger.DEFAULT}
      onMouseLeave={(e) => e.currentTarget.style.color = colors.text.muted}
      aria-label="Delete run"
    >
      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
    </button>
  );
});

DeleteButton.displayName = 'DeleteButton';

DeleteButton.propTypes = {
  onDelete: PropTypes.func.isRequired,
  runId: PropTypes.string.isRequired,
};

/**
 * Individual run item
 * @param {Object} props
 * @param {DiscoveryRun} props.run - Run data
 * @param {boolean} props.isActive - Whether this run is currently selected
 * @param {(id: string) => void} props.onSelect - Select handler
 * @param {(id: string) => void} [props.onDelete] - Delete handler
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

  const getContainerStyles = useCallback(() => {
    if (isActive) {
      return {
        backgroundColor: colors.accent.muted,
        borderColor: colors.accent.border,
      };
    }
    return {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    };
  }, [isActive]);

  const getMetaText = useCallback(() => {
    const parts = [formatRelativeTime(run.createdAt)];
    if (run.totalFound > 0) parts.push(`${run.totalFound} found`);
    if (run.scored > 0) parts.push(`${run.scored} scored`);
    return parts.join(' · ');
  }, [run.createdAt, run.totalFound, run.scored]);

  const containerStyles = getContainerStyles();

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors border"
      style={containerStyles}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = colors.surface.elevated;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-label={`${run.keyword} in ${run.city}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <StatusIcon status={run.status} />
      
      <div className="min-w-0 flex-1">
        <p 
          className="text-sm font-bold truncate"
          style={{ color: colors.text.primary }}
        >
          {run.keyword} — {run.city}
        </p>
        <p 
          className="text-xs"
          style={{ color: colors.text.muted }}
        >
          {getMetaText()}
        </p>
      </div>
      
      <div className="flex items-center gap-1 shrink-0">
        {onDelete && run.status !== 'running' && (
          <DeleteButton onDelete={onDelete} runId={run.id} />
        )}
        <ChevronRight 
          className="w-4 h-4" 
          style={{ color: colors.text.muted }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
});

RunItem.displayName = 'RunItem';

RunItem.propTypes = {
  run: PropTypes.shape({
    id: PropTypes.string.isRequired,
    keyword: PropTypes.string.isRequired,
    city: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['completed', 'failed', 'running', 'pending']).isRequired,
    createdAt: PropTypes.string.isRequired,
    totalFound: PropTypes.number,
    scored: PropTypes.number,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
};

RunItem.defaultProps = {
  onDelete: null,
};

/**
 * Empty state when no runs
 */
const EmptyState = memo(function EmptyState() {
  return null;
});

EmptyState.displayName = 'EmptyState';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * DiscoveryRunHistory - Displays list of past discovery runs
 * @param {Object} props
 * @param {DiscoveryRun[]} props.runs - List of discovery runs
 * @param {(id: string) => void} props.onSelectRun - Run selection handler
 * @param {string | null} [props.activeRunId] - Currently selected run ID
 * @param {(id: string) => void} [props.onDeleteRun] - Run deletion handler
 */
function DiscoveryRunHistory({ 
  runs, 
  onSelectRun, 
  activeRunId, 
  onDeleteRun 
}) {
  if (!runs?.length) {
    return <EmptyState />;
  }

  return (
    <div 
      className="card"
      style={{ 
        backgroundColor: colors.surface.card,
        borderRadius: radius.card,
        boxShadow: shadows.card
      }}
    >
      <div className="p-4">
        <h3 
          className="text-sm font-bold uppercase tracking-wide mb-3"
          style={{ color: colors.text.primary }}
        >
          Past Runs
        </h3>
        
        <div 
          className="space-y-2 overflow-y-auto"
          style={{ maxHeight: '16rem' }}
          role="list"
          aria-label="Discovery run history"
        >
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

DiscoveryRunHistory.displayName = 'DiscoveryRunHistory';

DiscoveryRunHistory.propTypes = {
  runs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    keyword: PropTypes.string.isRequired,
    city: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['completed', 'failed', 'running', 'pending']).isRequired,
    createdAt: PropTypes.string.isRequired,
    totalFound: PropTypes.number,
    scored: PropTypes.number,
  })).isRequired,
  onSelectRun: PropTypes.func.isRequired,
  activeRunId: PropTypes.string,
  onDeleteRun: PropTypes.func,
};

DiscoveryRunHistory.defaultProps = {
  activeRunId: null,
  onDeleteRun: null,
};

export default DiscoveryRunHistory;
