import { Clock, CheckCircle2, XCircle, Loader2, Trash2, ChevronRight } from 'lucide-react';
import { formatRelativeTime } from '../../utils/format';

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

export default function DiscoveryRunHistory({ runs, onSelectRun, activeRunId, onDeleteRun }) {
  if (!runs || runs.length === 0) return null;

  return (
    <div className="card">
      <div className="card-body p-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
          Past Runs
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {runs.map((run) => {
            const Icon = STATUS_ICONS[run.status] || Clock;
            const isActive = run.id === activeRunId;

            return (
              <div
                key={run.id}
                onClick={() => onSelectRun(run.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-accent-50 border border-accent-200'
                    : 'hover:bg-concrete-50 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${STATUS_STYLES[run.status]}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {run.keyword} — {run.city}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatRelativeTime(run.createdAt)}
                    {run.totalFound > 0 && ` · ${run.totalFound} found`}
                    {run.scored > 0 && ` · ${run.scored} scored`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {onDeleteRun && run.status !== 'running' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRun(run.id);
                      }}
                      className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
