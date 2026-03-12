import { Loader2, CheckCircle2, MapPin, Globe, Brain, Mail } from 'lucide-react';
import { useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { colors, shadows, radius } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/** @type {Array<{ key: string; label: string; icon: React.ComponentType }>} */
const STAGES = [
  { key: 'scraping', label: 'Scraping Maps', icon: MapPin },
  { key: 'enriching', label: 'Enriching Websites', icon: Globe },
  { key: 'scoring', label: 'AI Scoring', icon: Brain },
  { key: 'complete', label: 'Generating Outreach', icon: Mail },
];

// ═══════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} DiscoveryRun
 * @property {string} id - Run identifier
 * @property {string} stage - Current pipeline stage
 * @property {number} progress - Progress percentage (0-100)
 * @property {string} status - Run status (running/completed/failed/pending)
 * @property {number} [totalFound] - Total leads found
 * @property {number} [enriched] - Number of enriched leads
 * @property {number} [scored] - Number of scored leads
 * @property {string} [error] - Error message if failed
 */

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Progress bar with percentage
 * @param {Object} props
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {boolean} props.isComplete - Whether pipeline is complete
 * @param {boolean} props.isFailed - Whether pipeline failed
 */
const ProgressBar = memo(function ProgressBar({ progress, isComplete, isFailed }) {
  const getBarColor = useCallback(() => {
    if (isFailed) return colors.danger.DEFAULT;
    if (isComplete) return colors.success.DEFAULT;
    return colors.accent.DEFAULT;
  }, [isFailed, isComplete]);

  const getLabel = useCallback(() => {
    if (isComplete) return 'Pipeline Complete';
    if (isFailed) return 'Pipeline Failed';
    return 'Processing...';
  }, [isComplete, isFailed]);

  const barColor = getBarColor();

  return (
    <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={getLabel()}>
      <div className="flex items-center justify-between mb-2">
        <span 
          className="text-sm font-bold"
          style={{ color: colors.text.primary }}
        >
          {getLabel()}
        </span>
        <span 
          className="text-sm font-mono font-bold"
          style={{ color: colors.accent.DEFAULT }}
        >
          {progress}%
        </span>
      </div>
      <div 
        className="w-full h-3 rounded-full overflow-hidden"
        style={{ backgroundColor: colors.surface.elevated }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${progress}%`,
            backgroundColor: barColor
          }}
        />
      </div>
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

ProgressBar.propTypes = {
  progress: PropTypes.number.isRequired,
  isComplete: PropTypes.bool.isRequired,
  isFailed: PropTypes.bool.isRequired,
};

/**
 * Individual stage indicator
 * @param {Object} props
 * @param {{ key: string; label: string; icon: React.ComponentType }} props.stage - Stage configuration
 * @param {boolean} props.isDone - Whether stage is complete
 * @param {boolean} props.isActive - Whether stage is currently active
 */
const StageIndicator = memo(function StageIndicator({ 
  stage, 
  isDone, 
  isActive 
}) {
  const Icon = stage.icon;

  const getStyles = useCallback(() => {
    if (isDone) {
      return {
        backgroundColor: colors.success.muted,
        color: colors.success.DEFAULT,
        borderColor: colors.success.border,
      };
    }
    if (isActive) {
      return {
        backgroundColor: colors.accent.muted,
        color: colors.accent.DEFAULT,
        borderColor: colors.accent.border,
      };
    }
    return {
      backgroundColor: colors.surface.elevated,
      color: colors.text.muted,
      borderColor: colors.border.default,
    };
  }, [isDone, isActive]);

  const styles = getStyles();

  return (
    <div 
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all border"
      style={styles}
      role="status"
      aria-label={`${stage.label} ${isDone ? 'complete' : isActive ? 'in progress' : 'pending'}`}
    >
      {isDone ? (
        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
      ) : isActive ? (
        <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      )}
      <span className="truncate">{stage.label}</span>
    </div>
  );
});

StageIndicator.displayName = 'StageIndicator';

StageIndicator.propTypes = {
  stage: PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
  }).isRequired,
  isDone: PropTypes.bool.isRequired,
  isActive: PropTypes.bool.isRequired,
};

/**
 * Stage indicators grid
 * @param {Object} props
 * @param {Array<{ key: string; label: string; icon: React.ComponentType }>} props.stages - Stage configurations
 * @param {number} props.currentStageIndex - Index of current stage
 * @param {boolean} props.isComplete - Whether all stages are complete
 */
const StageIndicators = memo(function StageIndicators({ 
  stages, 
  currentStageIndex, 
  isComplete 
}) {
  return (
    <div 
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      role="list"
      aria-label="Pipeline stages"
    >
      {stages.map((stage, index) => {
        const isDone = isComplete || index < currentStageIndex;
        const isActive = !isComplete && index === currentStageIndex;

        return (
          <StageIndicator
            key={stage.key}
            stage={stage}
            isDone={isDone}
            isActive={isActive}
          />
        );
      })}
    </div>
  );
});

StageIndicators.displayName = 'StageIndicators';

StageIndicators.propTypes = {
  stages: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
  })).isRequired,
  currentStageIndex: PropTypes.number.isRequired,
  isComplete: PropTypes.bool.isRequired,
};

/**
 * Stats row showing counts
 * @param {Object} props
 * @param {number} [props.totalFound] - Total leads found
 * @param {number} [props.enriched] - Number of enriched leads
 * @param {number} [props.scored] - Number of scored leads
 */
const StatsRow = memo(function StatsRow({ totalFound, enriched, scored }) {
  if (!totalFound && !enriched && !scored) return null;

  return (
    <div className="flex gap-4 text-sm" role="status" aria-label="Pipeline statistics">
      {totalFound > 0 && (
        <span style={{ color: colors.text.secondary }}>
          <strong style={{ color: colors.text.primary }}>{totalFound}</strong> found
        </span>
      )}
      {enriched > 0 && (
        <span style={{ color: colors.text.secondary }}>
          <strong style={{ color: colors.text.primary }}>{enriched}</strong> enriched
        </span>
      )}
      {scored > 0 && (
        <span style={{ color: colors.text.secondary }}>
          <strong style={{ color: colors.text.primary }}>{scored}</strong> scored
        </span>
      )}
    </div>
  );
});

StatsRow.displayName = 'StatsRow';

StatsRow.propTypes = {
  totalFound: PropTypes.number,
  enriched: PropTypes.number,
  scored: PropTypes.number,
};

StatsRow.defaultProps = {
  totalFound: 0,
  enriched: 0,
  scored: 0,
};

/**
 * Error message display
 * @param {Object} props
 * @param {string} [props.error] - Error message
 */
const ErrorMessage = memo(function ErrorMessage({ error }) {
  if (!error) return null;

  return (
    <div 
      className="text-sm rounded-lg px-3 py-2"
      style={{ 
        color: colors.danger.DEFAULT, 
        backgroundColor: colors.danger.muted 
      }}
      role="alert"
      aria-live="assertive"
    >
      {error}
    </div>
  );
});

ErrorMessage.displayName = 'ErrorMessage';

ErrorMessage.propTypes = {
  error: PropTypes.string,
};

ErrorMessage.defaultProps = {
  error: null,
};

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * DiscoveryProgress - Displays discovery pipeline progress
 * @param {Object} props
 * @param {DiscoveryRun | null} props.run - Current discovery run
 */
function DiscoveryProgress({ run }) {
  if (!run) return null;

  const { stage, progress, status, totalFound, enriched, scored, error } = run;
  const isComplete = status === 'completed';
  const isFailed = status === 'failed';

  const currentStageIndex = STAGES.findIndex(s => s.key === stage);

  return (
    <div 
      className="card"
      style={{ 
        backgroundColor: colors.surface.card,
        borderRadius: radius.card,
        boxShadow: shadows.card
      }}
    >
      <div className="p-4 space-y-4">
        <ProgressBar 
          progress={progress} 
          isComplete={isComplete} 
          isFailed={isFailed} 
        />

        <StageIndicators 
          stages={STAGES}
          currentStageIndex={currentStageIndex}
          isComplete={isComplete}
        />

        <StatsRow 
          totalFound={totalFound}
          enriched={enriched}
          scored={scored}
        />

        <ErrorMessage error={isFailed ? error : null} />
      </div>
    </div>
  );
}

DiscoveryProgress.displayName = 'DiscoveryProgress';

DiscoveryProgress.propTypes = {
  run: PropTypes.shape({
    id: PropTypes.string.isRequired,
    stage: PropTypes.string.isRequired,
    progress: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    totalFound: PropTypes.number,
    enriched: PropTypes.number,
    scored: PropTypes.number,
    error: PropTypes.string,
  }),
};

DiscoveryProgress.defaultProps = {
  run: null,
};

export default DiscoveryProgress;
