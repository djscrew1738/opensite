import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  AlertTriangle,
  FileText,
  Wrench
} from 'lucide-react';

/**
 * AIInsightsPanel - Structured AI analysis with collapsible sections
 * @param {object} aiAnalysis - Structured AI analysis data
 * @param {string} aiAnalysisText - Fallback text analysis
 */
export default function AIInsightsPanel({ aiAnalysis, aiAnalysisText }) {
  const [expandedSections, setExpandedSections] = useState({
    requirements: true,
    timeline: true,
    recommendations: true,
    risks: false,
    compliance: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Fallback to text if no structured analysis
  if (!aiAnalysis && aiAnalysisText) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h3>
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap">{aiAnalysisText}</p>
        </div>
      </div>
    );
  }

  if (!aiAnalysis) {
    return null;
  }

  const CollapsibleSection = ({ title, icon: Icon, isExpanded, onToggle, children, badge }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-gray-600" />}
          <h4 className="font-semibold text-gray-900">{title}</h4>
          {badge && (
            <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
              {badge}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isExpanded && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Analysis & Insights</h3>
        <p className="text-sm text-gray-600">
          AI-powered analysis of your blueprint with detailed recommendations
        </p>
      </div>

      {/* Requirements Section */}
      {aiAnalysis.requirements && Object.keys(aiAnalysis.requirements).length > 0 && (
        <CollapsibleSection
          title="Plumbing Requirements"
          icon={Wrench}
          isExpanded={expandedSections.requirements}
          onToggle={() => toggleSection('requirements')}
        >
          <div className="space-y-4">
            {/* Pipes */}
            {aiAnalysis.requirements.pipes && aiAnalysis.requirements.pipes.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Piping</h5>
                <div className="space-y-2">
                  {aiAnalysis.requirements.pipes.map((pipe, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded p-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-blue-900">{pipe.type}</p>
                          <p className="text-sm text-blue-700">
                            {pipe.material} • {pipe.size}
                          </p>
                          {pipe.estimatedLength && (
                            <p className="text-xs text-blue-600 mt-1">
                              Est. Length: {pipe.estimatedLength}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Water Heater */}
            {aiAnalysis.requirements.waterHeater && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Water Heater</h5>
                <div className="bg-orange-50 border border-orange-200 rounded p-3">
                  <p className="font-medium text-orange-900">
                    {aiAnalysis.requirements.waterHeater.type}
                  </p>
                  <p className="text-sm text-orange-700">
                    {aiAnalysis.requirements.waterHeater.capacity}
                  </p>
                  {aiAnalysis.requirements.waterHeater.location && (
                    <p className="text-xs text-orange-600 mt-1">
                      Location: {aiAnalysis.requirements.waterHeater.location}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Drainage */}
            {aiAnalysis.requirements.drainage && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Drainage System</h5>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <p className="text-sm text-gray-700">{aiAnalysis.requirements.drainage}</p>
                </div>
              </div>
            )}

            {/* Special Features */}
            {aiAnalysis.requirements.specialFeatures && aiAnalysis.requirements.specialFeatures.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Special Features</h5>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.requirements.specialFeatures.map((feature, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Timeline Section */}
      {aiAnalysis.timeline && (
        <CollapsibleSection
          title="Project Timeline"
          icon={FileText}
          isExpanded={expandedSections.timeline}
          onToggle={() => toggleSection('timeline')}
          badge={aiAnalysis.timeline.estimatedDuration}
        >
          <div className="space-y-4">
            {aiAnalysis.timeline.phases && aiAnalysis.timeline.phases.length > 0 && (
              <div className="space-y-3">
                {aiAnalysis.timeline.phases.map((phase, index) => (
                  <div key={index} className="border-l-4 border-primary-500 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="font-semibold text-gray-900">{phase.name}</h5>
                      <span className="text-sm text-gray-600">{phase.duration}</span>
                    </div>
                    {phase.tasks && phase.tasks.length > 0 && (
                      <ul className="text-sm text-gray-600 space-y-1">
                        {phase.tasks.map((task, taskIndex) => (
                          <li key={taskIndex} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {aiAnalysis.timeline.criticalPath && aiAnalysis.timeline.criticalPath.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h5 className="font-medium text-gray-900 mb-2">Critical Path</h5>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.timeline.criticalPath.map((item, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full"
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
      {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
        <CollapsibleSection
          title="Recommendations"
          icon={Lightbulb}
          isExpanded={expandedSections.recommendations}
          onToggle={() => toggleSection('recommendations')}
          badge={aiAnalysis.recommendations.length}
        >
          <ul className="space-y-2">
            {aiAnalysis.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* Risks Section */}
      {aiAnalysis.risks && aiAnalysis.risks.length > 0 && (
        <CollapsibleSection
          title="Potential Risks & Mitigation"
          icon={AlertTriangle}
          isExpanded={expandedSections.risks}
          onToggle={() => toggleSection('risks')}
          badge={aiAnalysis.risks.length}
        >
          <div className="space-y-3">
            {aiAnalysis.risks.map((risk, index) => (
              <div key={index} className="border border-yellow-200 rounded-lg overflow-hidden">
                <div className="bg-yellow-50 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-yellow-900">{risk.risk}</p>
                      {risk.mitigation && (
                        <div className="mt-2 pt-2 border-t border-yellow-200">
                          <p className="text-xs text-yellow-700 font-medium mb-1">Mitigation:</p>
                          <p className="text-sm text-yellow-800">{risk.mitigation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Code Compliance Section */}
      {aiAnalysis.codeCompliance && aiAnalysis.codeCompliance.notes && aiAnalysis.codeCompliance.notes.length > 0 && (
        <CollapsibleSection
          title="Code Compliance Notes"
          icon={AlertCircle}
          isExpanded={expandedSections.compliance}
          onToggle={() => toggleSection('compliance')}
        >
          <ul className="space-y-2">
            {aiAnalysis.codeCompliance.notes.map((note, index) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{note}</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* Labor Estimate */}
      {aiAnalysis.laborEstimate && (
        <div className="card bg-gray-50">
          <h4 className="font-semibold text-gray-900 mb-3">Labor Estimate</h4>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(aiAnalysis.laborEstimate).map(([phase, data]) => (
              <div key={phase} className="bg-white border border-gray-200 rounded p-3">
                <p className="text-xs text-gray-600 mb-1">
                  {phase.charAt(0).toUpperCase() + phase.slice(1).replace(/([A-Z])/g, '-$1')}
                </p>
                <p className="text-lg font-bold text-gray-900">{data.hours} hrs</p>
                {data.duration && (
                  <p className="text-xs text-gray-500">{data.duration}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
