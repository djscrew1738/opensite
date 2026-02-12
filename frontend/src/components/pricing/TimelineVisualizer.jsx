import { Calendar, Clock, AlertCircle } from 'lucide-react';

/**
 * TimelineVisualizer - Gantt-style timeline showing project phases
 * @param {object} aiAnalysis - Structured AI analysis with timeline data
 * @param {object} estimate - Pricing estimate with labor breakdown
 */
export default function TimelineVisualizer({ aiAnalysis, estimate }) {
  if (!aiAnalysis?.timeline && !aiAnalysis?.laborEstimate) {
    return null;
  }

  const timeline = aiAnalysis.timeline || {};
  const laborEstimate = aiAnalysis.laborEstimate || {};

  // Phase colors matching the cost visualization
  const phaseColors = {
    'rough-in': { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-700' },
    'roughin': { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-700' },
    'top-out': { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700' },
    'topout': { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700' },
    'trim': { bg: 'bg-cyan-500', light: 'bg-cyan-100', text: 'text-cyan-700' },
    'default': { bg: 'bg-gray-500', light: 'bg-gray-100', text: 'text-gray-700' }
  };

  const getPhaseColor = (phaseName) => {
    const key = phaseName.toLowerCase().replace(/[\s-]/g, '');
    return phaseColors[key] || phaseColors.default;
  };

  // Calculate total duration in days
  const calculateTotalDays = () => {
    if (timeline.phases && timeline.phases.length > 0) {
      return timeline.phases.reduce((total, phase) => {
        const days = parseInt(phase.duration) || 0;
        return total + days;
      }, 0);
    }
    return 0;
  };

  const totalDays = calculateTotalDays();

  // Calculate phase widths for visual representation
  const getPhaseWidth = (duration) => {
    if (!totalDays) return '33.33%';
    const days = parseInt(duration) || 0;
    return `${(days / totalDays) * 100}%`;
  };

  return (
    <div className="space-y-6">
      {/* Timeline Overview */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Project Timeline</h3>
          </div>
          {timeline.estimatedDuration && (
            <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-lg">
              <Clock className="w-5 h-5 text-primary-600" />
              <span className="font-semibold text-primary-700">
                {timeline.estimatedDuration}
              </span>
            </div>
          )}
        </div>

        {/* Gantt-style Timeline */}
        {timeline.phases && timeline.phases.length > 0 && (
          <div className="space-y-4">
            <div className="relative">
              {/* Timeline bar */}
              <div className="flex w-full h-12 rounded-lg overflow-hidden border border-gray-200">
                {timeline.phases.map((phase, index) => {
                  const colors = getPhaseColor(phase.name);
                  const width = getPhaseWidth(phase.duration);

                  return (
                    <div
                      key={index}
                      className={`relative ${colors.bg} flex items-center justify-center text-white font-medium text-sm px-2`}
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
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>Day 1</span>
                  <span>Day {Math.ceil(totalDays / 2)}</span>
                  <span>Day {totalDays}</span>
                </div>
              )}
            </div>

            {/* Phase Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {timeline.phases.map((phase, index) => {
                const colors = getPhaseColor(phase.name);
                const laborKey = phase.name.toLowerCase().replace(/[\s-]/g, '');
                const labor = laborEstimate[laborKey];

                return (
                  <div key={index} className={`border-2 ${colors.light} rounded-lg p-4`}>
                    <div className="flex items-start justify-between mb-3">
                      <h4 className={`font-semibold ${colors.text}`}>{phase.name}</h4>
                      <span className={`text-sm font-medium ${colors.text}`}>
                        {phase.duration}
                      </span>
                    </div>

                    {labor && (
                      <div className="mb-3 pb-3 border-b border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Labor Hours</span>
                          <span className="font-semibold text-gray-900">{labor.hours} hrs</span>
                        </div>
                      </div>
                    )}

                    {phase.tasks && phase.tasks.length > 0 && (
                      <ul className="space-y-1">
                        {phase.tasks.map((task, taskIndex) => (
                          <li key={taskIndex} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-gray-400 mt-0.5">•</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Critical Path */}
        {timeline.criticalPath && timeline.criticalPath.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900 mb-2">Critical Path Items</h4>
                <p className="text-sm text-amber-700 mb-2">
                  These milestones are critical to project timeline. Delays here will impact overall completion.
                </p>
                <div className="flex flex-wrap gap-2">
                  {timeline.criticalPath.map((item, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Labor Summary (if no phases) */}
        {(!timeline.phases || timeline.phases.length === 0) && Object.keys(laborEstimate).length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(laborEstimate).map(([phase, data]) => {
              const colors = getPhaseColor(phase);
              return (
                <div key={phase} className={`${colors.light} border-2 rounded-lg p-4`}>
                  <h4 className={`font-semibold ${colors.text} mb-2`}>
                    {phase.charAt(0).toUpperCase() + phase.slice(1).replace(/([A-Z])/g, ' $1')}
                  </h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Hours:</span>
                      <span className="font-semibold text-gray-900">{data.hours}</span>
                    </div>
                    {data.duration && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-semibold text-gray-900">{data.duration}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Milestone Progress Tracker (Future Enhancement) */}
      {/* This section could be enhanced to show actual progress vs. planned */}
    </div>
  );
}
