import { useState, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import {
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  AlertTriangle,
  FileText,
  Wrench,
  Clock,
  TrendingUp
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Collapsible section wrapper
 */
const CollapsibleSection = memo(function CollapsibleSection({ 
  title, 
  icon: Icon, 
  isExpanded, 
  onToggle, 
  children, 
  badge 
}) {
  return (
    <div className="border border-surface-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-surface-800 hover:bg-surface-750 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent-500/50"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-surface-400" />}
          <h4 className="font-semibold text-surface-100">{title}</h4>
          {badge && (
            <span className="px-2 py-0.5 text-xs font-medium bg-accent-500/10 text-accent-400 rounded">
              {badge}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-surface-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-surface-500" />
        )}
      </button>
      {isExpanded && (
        <div className="p-4 bg-surface-900">
          {children}
        </div>
      )}
    </div>
  );
});

/**
 * Pipe requirement card
 */
const PipeCard = memo(function PipeCard({ pipe }) {
  return (
    <div className="bg-accent-500/5 border border-accent-500/20 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="font-medium text-accent-400">{pipe.type}</p>
          <p className="text-sm text-surface-400">
            {pipe.material} • {pipe.size}
          </p>
          {pipe.estimatedLength && (
            <p className="text-xs text-surface-500 mt-1">
              Est. Length: {pipe.estimatedLength}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

/**
 * Water heater requirement card
 */
const WaterHeaterCard = memo(function WaterHeaterCard({ waterHeater }) {
  return (
    <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
      <p className="font-medium text-orange-400">{waterHeater.type}</p>
      <p className="text-sm text-surface-400">{waterHeater.capacity}</p>
      {waterHeater.location && (
        <p className="text-xs text-surface-500 mt-1">
          Location: {waterHeater.location}
        </p>
      )}
    </div>
  );
});

/**
 * Feature badge for special features
 */
const FeatureBadge = memo(function FeatureBadge({ feature }) {
  return (
    <span className="px-3 py-1 bg-violet-500/10 text-violet-400 text-sm rounded-full border border-violet-500/20">
      {feature}
    </span>
  );
});

/**
 * Phase timeline item
 */
const PhaseTimelineItem = memo(function PhaseTimelineItem({ phase }) {
  return (
    <div className="border-l-4 border-accent-500 pl-4 py-2">
      <div className="flex items-center justify-between mb-1">
        <h5 className="font-semibold text-surface-200">{phase.name}</h5>
        <span className="text-sm text-surface-400 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {phase.duration}
        </span>
      </div>
      {phase.tasks && phase.tasks.length > 0 && (
        <ul className="text-sm text-surface-400 space-y-1">
          {phase.tasks.map((task, taskIndex) => (
            <li key={taskIndex} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>{task}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

/**
 * Recommendation item
 */
const RecommendationItem = memo(function RecommendationItem({ text }) {
  return (
    <li className="flex items-start gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
      <span className="text-sm text-surface-300">{text}</span>
    </li>
  );
});

/**
 * Risk card with mitigation
 */
const RiskCard = memo(function RiskCard({ risk, mitigation }) {
  return (
    <div className="border border-warning-500/20 rounded-lg overflow-hidden">
      <div className="bg-warning-500/5 p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-warning-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-warning-400">{risk}</p>
            {mitigation && (
              <div className="mt-2 pt-2 border-t border-warning-500/20">
                <p className="text-xs text-surface-500 font-medium mb-1">Mitigation:</p>
                <p className="text-sm text-surface-300">{mitigation}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Compliance note item
 */
const ComplianceItem = memo(function ComplianceItem({ note }) {
  return (
    <li className="flex items-start gap-3 p-3 bg-accent-500/5 border border-accent-500/20 rounded-lg">
      <FileText className="w-5 h-5 text-accent-500 mt-0.5 flex-shrink-0" />
      <span className="text-sm text-surface-300">{note}</span>
    </li>
  );
});

/**
 * Labor estimate card
 */
const LaborCard = memo(function LaborCard({ phase, hours, duration }) {
  const formattedPhase = phase.charAt(0).toUpperCase() + phase.slice(1).replace(/([A-Z])/g, ' $1');
  
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-lg p-3">
      <p className="text-xs text-surface-500 mb-1">{formattedPhase}</p>
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-accent-500" />
        <p className="text-lg font-bold text-surface-200">{hours} hrs</p>
      </div>
      {duration && (
        <p className="text-xs text-surface-500">{duration}</p>
      )}
    </div>
  );
});

/**
 * Empty state when only text analysis available
 */
const TextAnalysisView = memo(function TextAnalysisView({ text }) {
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
      <h3 className="text-lg font-semibold text-surface-100 mb-4">AI Analysis</h3>
      <div className="prose prose-sm max-w-none">
        <p className="text-surface-300 whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * AIInsightsPanel - Structured AI analysis with collapsible sections
 * 
 * Sections:
 * - Plumbing Requirements (pipes, water heater, drainage, special features)
 * - Project Timeline (phases, critical path)
 * - Recommendations
 * - Potential Risks & Mitigation
 * - Code Compliance Notes
 * - Labor Estimate
 * 
 * @param {Object} props
 * @param {Object} props.aiAnalysis - Structured AI analysis data
 * @param {string} props.aiAnalysisText - Fallback text analysis
 */
function AIInsightsPanel({ aiAnalysis, aiAnalysisText }) {
  const [expandedSections, setExpandedSections] = useState({
    requirements: true,
    timeline: true,
    recommendations: true,
    risks: false,
    compliance: false
  });

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Fallback to text if no structured analysis
  if (!aiAnalysis && aiAnalysisText) {
    return <TextAnalysisView text={aiAnalysisText} />;
  }

  if (!aiAnalysis) {
    return null;
  }

  const { requirements, timeline, recommendations, risks, codeCompliance, laborEstimate } = aiAnalysis;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-surface-100 mb-2">AI Analysis & Insights</h3>
        <p className="text-sm text-surface-400">
          AI-powered analysis of your blueprint with detailed recommendations
        </p>
      </div>

      {/* Requirements Section */}
      {requirements && Object.keys(requirements).length > 0 && (
        <CollapsibleSection
          title="Plumbing Requirements"
          icon={Wrench}
          isExpanded={expandedSections.requirements}
          onToggle={() => toggleSection('requirements')}
        >
          <div className="space-y-4">
            {/* Pipes */}
            {requirements.pipes?.length > 0 && (
              <div>
                <h5 className="font-medium text-surface-200 mb-2">Piping</h5>
                <div className="space-y-2">
                  {requirements.pipes.map((pipe, index) => (
                    <PipeCard key={index} pipe={pipe} />
                  ))}
                </div>
              </div>
            )}

            {/* Water Heater */}
            {requirements.waterHeater && (
              <div>
                <h5 className="font-medium text-surface-200 mb-2">Water Heater</h5>
                <WaterHeaterCard waterHeater={requirements.waterHeater} />
              </div>
            )}

            {/* Drainage */}
            {requirements.drainage && (
              <div>
                <h5 className="font-medium text-surface-200 mb-2">Drainage System</h5>
                <div className="bg-surface-800 border border-surface-700 rounded-lg p-3">
                  <p className="text-sm text-surface-400">{requirements.drainage}</p>
                </div>
              </div>
            )}

            {/* Special Features */}
            {requirements.specialFeatures?.length > 0 && (
              <div>
                <h5 className="font-medium text-surface-200 mb-2">Special Features</h5>
                <div className="flex flex-wrap gap-2">
                  {requirements.specialFeatures.map((feature, index) => (
                    <FeatureBadge key={index} feature={feature} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Timeline Section */}
      {timeline && (
        <CollapsibleSection
          title="Project Timeline"
          icon={FileText}
          isExpanded={expandedSections.timeline}
          onToggle={() => toggleSection('timeline')}
          badge={timeline.estimatedDuration}
        >
          <div className="space-y-4">
            {timeline.phases?.length > 0 && (
              <div className="space-y-3">
                {timeline.phases.map((phase, index) => (
                  <PhaseTimelineItem key={index} phase={phase} />
                ))}
              </div>
            )}

            {timeline.criticalPath?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-surface-700">
                <h5 className="font-medium text-surface-200 mb-2">Critical Path</h5>
                <div className="flex flex-wrap gap-2">
                  {timeline.criticalPath.map((item, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-danger-500/10 text-danger-400 text-sm rounded-full border border-danger-500/20"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Recommendations Section */}
      {recommendations?.length > 0 && (
        <CollapsibleSection
          title="Recommendations"
          icon={Lightbulb}
          isExpanded={expandedSections.recommendations}
          onToggle={() => toggleSection('recommendations')}
          badge={recommendations.length}
        >
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <RecommendationItem key={index} text={rec} />
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* Risks Section */}
      {risks?.length > 0 && (
        <CollapsibleSection
          title="Potential Risks & Mitigation"
          icon={AlertTriangle}
          isExpanded={expandedSections.risks}
          onToggle={() => toggleSection('risks')}
          badge={risks.length}
        >
          <div className="space-y-3">
            {risks.map((risk, index) => (
              <RiskCard 
                key={index} 
                risk={risk.risk} 
                mitigation={risk.mitigation} 
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Code Compliance Section */}
      {codeCompliance?.notes?.length > 0 && (
        <CollapsibleSection
          title="Code Compliance Notes"
          icon={AlertCircle}
          isExpanded={expandedSections.compliance}
          onToggle={() => toggleSection('compliance')}
        >
          <ul className="space-y-2">
            {codeCompliance.notes.map((note, index) => (
              <ComplianceItem key={index} note={note} />
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* Labor Estimate */}
      {laborEstimate && (
        <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
          <h4 className="font-semibold text-surface-100 mb-3">Labor Estimate</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(laborEstimate).map(([phase, data]) => (
              <LaborCard
                key={phase}
                phase={phase}
                hours={data.hours}
                duration={data.duration}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PropTypes
// ═══════════════════════════════════════════════════════════════

const pipePropType = PropTypes.shape({
  type: PropTypes.string.isRequired,
  material: PropTypes.string,
  size: PropTypes.string,
  estimatedLength: PropTypes.string,
});

const waterHeaterPropType = PropTypes.shape({
  type: PropTypes.string.isRequired,
  capacity: PropTypes.string,
  location: PropTypes.string,
});

const phasePropType = PropTypes.shape({
  name: PropTypes.string.isRequired,
  duration: PropTypes.string.isRequired,
  tasks: PropTypes.arrayOf(PropTypes.string),
});

const riskPropType = PropTypes.shape({
  risk: PropTypes.string.isRequired,
  mitigation: PropTypes.string,
});

AIInsightsPanel.propTypes = {
  aiAnalysis: PropTypes.shape({
    requirements: PropTypes.shape({
      pipes: PropTypes.arrayOf(pipePropType),
      waterHeater: waterHeaterPropType,
      drainage: PropTypes.string,
      specialFeatures: PropTypes.arrayOf(PropTypes.string),
    }),
    timeline: PropTypes.shape({
      estimatedDuration: PropTypes.string,
      phases: PropTypes.arrayOf(phasePropType),
      criticalPath: PropTypes.arrayOf(PropTypes.string),
    }),
    recommendations: PropTypes.arrayOf(PropTypes.string),
    risks: PropTypes.arrayOf(riskPropType),
    codeCompliance: PropTypes.shape({
      notes: PropTypes.arrayOf(PropTypes.string),
    }),
    laborEstimate: PropTypes.objectOf(
      PropTypes.shape({
        hours: PropTypes.number,
        duration: PropTypes.string,
      })
    ),
  }),
  aiAnalysisText: PropTypes.string,
};

AIInsightsPanel.defaultProps = {
  aiAnalysis: null,
  aiAnalysisText: null,
};

CollapsibleSection.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

PipeCard.propTypes = {
  pipe: pipePropType.isRequired,
};

WaterHeaterCard.propTypes = {
  waterHeater: waterHeaterPropType.isRequired,
};

FeatureBadge.propTypes = {
  feature: PropTypes.string.isRequired,
};

PhaseTimelineItem.propTypes = {
  phase: phasePropType.isRequired,
};

RecommendationItem.propTypes = {
  text: PropTypes.string.isRequired,
};

RiskCard.propTypes = {
  risk: PropTypes.string.isRequired,
  mitigation: PropTypes.string,
};

ComplianceItem.propTypes = {
  note: PropTypes.string.isRequired,
};

LaborCard.propTypes = {
  phase: PropTypes.string.isRequired,
  hours: PropTypes.number.isRequired,
  duration: PropTypes.string,
};

TextAnalysisView.propTypes = {
  text: PropTypes.string.isRequired,
};

export default memo(AIInsightsPanel);
