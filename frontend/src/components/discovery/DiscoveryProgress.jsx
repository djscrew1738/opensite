import { Loader2, CheckCircle2, MapPin, Globe, Brain, Mail } from 'lucide-react';
import { memo } from 'react';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const STAGES = [
  { key: 'scraping', label: 'Scraping Maps', icon: MapPin },
  { key: 'enriching', label: 'Enriching Websites', icon: Globe },
  { key: 'scoring', label: 'AI Scoring', icon: Brain },
  { key: 'complete', label: 'Generating Outreach', icon: Mail },
];

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Progress bar with percentage
 */
const ProgressBar = memo(function ProgressBar({ progress, isComplete, isFailed }) {
  const getBarColor = () => {
    if (isFailed) return 'bg-red-500';
    if (isComplete) return 'bg-green-500';
    return 'bg-accent-500';
  };

  const getLabel = () => {
    if (isComplete) return 'Pipeline Complete';
    if (isFailed) return 'Pipeline Failed';
    return 'Processing...';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-gray-700">
          {getLabel()}
        </span>
        <span className="text-sm font-mono font-bold text-accent-600">{progress}%</span>
      </div>
      <div className="w-full h-3 bg-concrete-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor()}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
});

/**
 * Individual stage indicator
 */
const StageIndicator = memo(function StageIndicator({ 
  stage, 
  isDone, 
  isActive 
}) {
  const Icon = stage.icon;

  const getStyles = () => {
    if (isDone) {
      return 'bg-green-50 text-green-700 border border-green-200';
    }
    if (isActive) {
      return 'bg-accent-50 text-accent-700 border border-accent-200';
    }
    return 'bg-concrete-50 text-gray-400 border border-concrete-200';
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${getStyles()}`}>
      {isDone ? (
        <CheckCircle2 className="w-4 h-4 shrink-0" />
      ) : isActive ? (
        <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
      ) : (
        <Icon className="w-4 h-4 shrink-0" />
      )}
      <span className="truncate">{stage.label}</span>
    </div>
  );
});

/**
 * Stage indicators grid
 */
const StageIndicators = memo(function StageIndicators({ 
  stages, 
  currentStageIndex, 
  isComplete 
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

/**
 * Stats row showing counts
 */
const StatsRow = memo(function StatsRow({ totalFound, enriched, scored }) {
  if (!totalFound && !enriched && !scored) return null;

  return (
    <div className="flex gap-4 text-sm">
      {totalFound > 0 && (
        <span className="text-gray-600">
          <strong className="text-gray-900">{totalFound}</strong> found
        </span>
      )}
      {enriched > 0 && (
        <span className="text-gray-600">
          <strong className="text-gray-900">{enriched}</strong> enriched
        </span>
      )}
      {scored > 0 && (
        <span className="text-gray-600">
          <strong className="text-gray-900">{scored}</strong> scored
        </span>
      )}
    </div>
  );
});

/**
 * Error message display
 */
const ErrorMessage = memo(function ErrorMessage({ error }) {
  if (!error) return null;

  return (
    <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
      {error}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export default function DiscoveryProgress({ run }) {
  if (!run) return null;

  const { stage, progress, status, totalFound, enriched, scored, error } = run;
  const isComplete = status === 'completed';
  const isFailed = status === 'failed';

  const currentStageIndex = STAGES.findIndex(s => s.key === stage);

  return (
    <div className="card">
      <div className="card-body p-4 space-y-4">
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
