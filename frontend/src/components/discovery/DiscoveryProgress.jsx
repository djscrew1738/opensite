import { Loader2, CheckCircle2, MapPin, Globe, Brain, Mail } from 'lucide-react';

const STAGES = [
  { key: 'scraping', label: 'Scraping Maps', icon: MapPin },
  { key: 'enriching', label: 'Enriching Websites', icon: Globe },
  { key: 'scoring', label: 'AI Scoring', icon: Brain },
  { key: 'complete', label: 'Generating Outreach', icon: Mail },
];

export default function DiscoveryProgress({ run }) {
  if (!run) return null;

  const { stage, progress, status, totalFound, enriched, scored } = run;
  const isComplete = status === 'completed';
  const isFailed = status === 'failed';

  const currentStageIndex = STAGES.findIndex(s => s.key === stage);

  return (
    <div className="card">
      <div className="card-body p-4 space-y-4">
        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-700">
              {isComplete ? 'Pipeline Complete' : isFailed ? 'Pipeline Failed' : 'Processing...'}
            </span>
            <span className="text-sm font-mono font-bold text-accent-600">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-concrete-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFailed ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-accent-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stage indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            const isDone = isComplete || i < currentStageIndex;
            const isActive = !isComplete && i === currentStageIndex;

            return (
              <div
                key={s.key}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  isDone
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : isActive
                      ? 'bg-accent-50 text-accent-700 border border-accent-200'
                      : 'bg-concrete-50 text-gray-400 border border-concrete-200'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4 shrink-0" />
                )}
                <span className="truncate">{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Stats row */}
        {(totalFound > 0 || enriched > 0 || scored > 0) && (
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
        )}

        {/* Error message */}
        {isFailed && run.error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {run.error}
          </div>
        )}
      </div>
    </div>
  );
}
