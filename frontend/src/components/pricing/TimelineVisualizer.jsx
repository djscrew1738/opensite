import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const PHASE_COLORS = {
  'rough-in': { bg: 'bg-orange-500', light: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  'roughin': { bg: 'bg-orange-500', light: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  'top-out': { bg: 'bg-accent-500', light: 'bg-accent-500/10', text: 'text-accent-400', border: 'border-accent-500/20' },
  'topout': { bg: 'bg-accent-500', light: 'bg-accent-500/10', text: 'text-accent-400', border: 'border-accent-500/20' },
  'trim': { bg: 'bg-cyan-500', light: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  'default': { bg: 'bg-surface-500', light: 'bg-surface-700', text: 'text-surface-400', border: 'border-surface-600' }
};

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Timeline header with title and duration badge
 */
const TimelineHeader = memo(function TimelineHeader({ estimatedDuration }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-accent-500/10">
          <Calendar className="w-5 h-5 text-accent-500" />
        </div>
        <h3 className="text-lg font-semibold text-surface-100">Project Timeline</h3>
      </div>
      
      {estimatedDuration && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-500/10 rounded-lg border border-accent-500/20">
          <Clock className="w-4 h-4 text-accent-500" />
          <span className="font-semibold text-accent-400 text-sm">
            {estimatedDuration}
          </span>
        </div>
      )}
    </div>
  );
});

/**
 * Gantt-style timeline bar showing phases
 */
const GanttTimeline = memo(function GanttTimeline({ phases, totalDays }) {
  const getPhaseColor = (phaseName) => {
    const key = phaseName.toLowerCase().replace(/[\s-]/g, '');
    return PHASE_COLORS[key] || PHASE_COLORS.default;
  };

  const getPhaseWidth = (duration) => {
    if (!totalDays) return '33.33%';
    const days = parseInt(duration) || 0;
    return `${(days / totalDays) * 100}%`;
  };

  return (
    <div className="relative">
      {/* Timeline bar */}
      <div className="flex w-full h-10 sm:h-12 rounded-lg overflow-hidden border border-surface-600">
        {phases.map((phase, index) => {
          const colors = getPhaseColor(phase.name);
          const width = getPhaseWidth(phase.duration);

          return (
            <div
              key={index}
              className={`relative ${colors.bg} flex items-center justify-center text-white font-medium text-xs sm:text-sm px-2 transition-all`}
              style={{ width }}
              title={`${phase.name}: ${phase.duration}`}
            >
              <span className="truncate">{phase.name}</span>
            </div>
          );
        })}
      </div>

      {/* Day markers */}
      {totalDays > 0 && (
        <div className="flex justify-between mt-2 text-xs text-surface-500">
          <span>Day 1</span>
          <span>Day {Math.ceil(totalDays / 2)}</span>
          <span>Day {totalDays}</span>
        </div>
      )}
    </div>
  );
});

/**
 * Individual phase detail card
 */
const PhaseDetailCard = memo(function PhaseDetailCard({ phase, labor }) {
  const getPhaseColor = (phaseName) => {
    const key = phaseName.toLowerCase().replace(/[\s-]/g, '');
    return PHASE_COLORS[key] || PHASE_COLORS.default;
  };

  const colors = getPhaseColor(phase.name);

  return (
    <div className={`${colors.light} border ${colors.border} rounded-lg p-4`}>
      <div className="flex items-start justify-between mb-3">
        <h4 className={`font-semibold ${colors.text}`}>{phase.name}</h4>
        <span className={`text-sm font-medium ${colors.text}`}>
          {phase.duration}
        </span>
      </div>

      {labor && (
        <div className="mb-3 pb-3 border-b border-surface-600/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-surface-400">Labor Hours</span>
            <span className="font-semibold text-surface-200">{labor.hours} hrs</span>
          </div>
        </div>
      )}

      {phase.tasks && phase.tasks.length > 0 && (
        <ul className="space-y-1">
          {phase.tasks.map((task, taskIndex) => (
            <li key={taskIndex} className="flex items-start gap-2 text-sm text-surface-300">
              <span className="text-surface-500 mt-0.5">•</span>
              <span>{task}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

/**
 * Grid of phase detail cards
 */
const PhaseDetailsGrid = memo(function PhaseDetailsGrid({ phases, laborEstimate }) {
  const getLaborForPhase = (phaseName) => {
    const laborKey = phaseName.toLowerCase().replace(/[\s-]/g, '');
    return laborEstimate?.[laborKey];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      {phases.map((phase, index) => (
        <PhaseDetailCard
          key={index}
          phase={phase}
          labor={getLaborForPhase(phase.name)}
        />
      ))}
    </div>
  );
});

/**
 * Critical path warning section
 */
const CriticalPathSection = memo(function CriticalPathSection({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-6 pt-6 border-t border-surface-700">
      <div className="flex items-start gap-3 p-4 bg-warning-500/10 border border-warning-500/20 rounded-lg">
        <AlertCircle className="w-5 h-5 text-warning-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-warning-400 mb-2">Critical Path Items</h4>
          <p className="text-sm text-surface-400 mb-3">
            These milestones are critical to project timeline. Delays here will impact overall completion.
          </p>
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-warning-500/10 text-warning-400 text-sm rounded-full font-medium border border-warning-500/20"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Labor summary fallback when no phases exist
 */
const LaborSummary = memo(function LaborSummary({ laborEstimate }) {
  const getPhaseColor = (phaseName) => {
    const key = phaseName.toLowerCase().replace(/[\s-]/g, '');
    return PHASE_COLORS[key] || PHASE_COLORS.default;
  };

  const formatPhaseName = (phase) => {
    return phase.charAt(0).toUpperCase() + phase.slice(1).replace(/([A-Z])/g, ' $1');
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Object.entries(laborEstimate).map(([phase, data]) => {
        const colors = getPhaseColor(phase);
        return (
          <div key={phase} className={`${colors.light} border ${colors.border} rounded-lg p-4`}>
            <h4 className={`font-semibold ${colors.text} mb-2`}>
              {formatPhaseName(phase)}
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-surface-400">Hours:</span>
                <span className="font-semibold text-surface-200">{data.hours}</span>
              </div>
              {data.duration && (
                <div className="flex justify-between text-sm">
                  <span className="text-surface-400">Duration:</span>
                  <span className="font-semibold text-surface-200">{data.duration}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

/**
 * Empty state when no timeline data exists
 */
const EmptyTimelineState = memo(function EmptyTimelineState() {
  return (
    <div className="p-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-700 mb-4">
        <Calendar className="w-6 h-6 text-surface-400" />
      </div>
      <h4 className="text-sm font-medium text-surface-300 mb-1">
        No Timeline Available
      </h4>
      <p className="text-xs text-surface-500 max-w-xs mx-auto">
        Timeline data will appear here after AI analysis generates project phases.
      </p>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * TimelineVisualizer - Gantt-style timeline showing project phases
 * 
 * Features:
 * - Visual Gantt chart with phase bars
 * - Phase detail cards with labor hours
 * - Critical path highlighting
 * - Labor estimate summary (fallback)
 * 
 * @param {Object} props
 * @param {Object} props.aiAnalysis - Structured AI analysis with timeline data
 */
function TimelineVisualizer({ aiAnalysis }) {
  // Memoized calculations
  const { timeline, laborEstimate, hasData, totalDays } = useMemo(() => {
    const timeline = aiAnalysis?.timeline || {};
    const laborEstimate = aiAnalysis?.laborEstimate || {};
    const hasData = !!(timeline?.phases?.length || Object.keys(laborEstimate).length);
    
    // Calculate total duration
    let totalDays = 0;
    if (timeline.phases?.length > 0) {
      totalDays = timeline.phases.reduce((total, phase) => {
        return total + (parseInt(phase.duration) || 0);
      }, 0);
    }
    
    return { timeline, laborEstimate, hasData, totalDays };
  }, [aiAnalysis]);

  if (!hasData) {
    return <EmptyTimelineState />;
  }

  const hasPhases = timeline.phases?.length > 0;

  return (
    <div className="space-y-6">
      <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
        <TimelineHeader estimatedDuration={timeline.estimatedDuration} />

        {hasPhases ? (
          <div className="space-y-4">
            <GanttTimeline phases={timeline.phases} totalDays={totalDays} />
            <PhaseDetailsGrid phases={timeline.phases} laborEstimate={laborEstimate} />
          </div>
        ) : (
          <LaborSummary laborEstimate={laborEstimate} />
        )}

        <CriticalPathSection items={timeline.criticalPath} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PropTypes
// ═══════════════════════════════════════════════════════════════

const phasePropType = PropTypes.shape({
  name: PropTypes.string.isRequired,
  duration: PropTypes.string.isRequired,
  tasks: PropTypes.arrayOf(PropTypes.string),
});

const laborEstimatePropType = PropTypes.objectOf(
  PropTypes.shape({
    hours: PropTypes.number,
    duration: PropTypes.string,
  })
);

TimelineVisualizer.propTypes = {
  aiAnalysis: PropTypes.shape({
    timeline: PropTypes.shape({
      estimatedDuration: PropTypes.string,
      phases: PropTypes.arrayOf(phasePropType),
      criticalPath: PropTypes.arrayOf(PropTypes.string),
    }),
    laborEstimate: laborEstimatePropType,
  }),
};

TimelineVisualizer.defaultProps = {
  aiAnalysis: null,
};

TimelineHeader.propTypes = {
  estimatedDuration: PropTypes.string,
};

GanttTimeline.propTypes = {
  phases: PropTypes.arrayOf(phasePropType).isRequired,
  totalDays: PropTypes.number.isRequired,
};

PhaseDetailCard.propTypes = {
  phase: phasePropType.isRequired,
  labor: PropTypes.shape({
    hours: PropTypes.number,
  }),
};

PhaseDetailsGrid.propTypes = {
  phases: PropTypes.arrayOf(phasePropType).isRequired,
  laborEstimate: laborEstimatePropType,
};

CriticalPathSection.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string),
};

LaborSummary.propTypes = {
  laborEstimate: laborEstimatePropType.isRequired,
};

export default memo(TimelineVisualizer);
