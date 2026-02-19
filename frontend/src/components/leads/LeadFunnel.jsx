import { useMemo } from 'react';

const stages = [
  { key: 'hot', label: 'Hot', color: 'bg-hot-500', lightBg: 'bg-hot-100 dark:bg-hot-950/30' },
  { key: 'warm', label: 'Warm', color: 'bg-warm-500', lightBg: 'bg-warm-100 dark:bg-warm-950/30' },
  { key: 'cold', label: 'Cold', color: 'bg-cool-400', lightBg: 'bg-cool-100 dark:bg-cool-900/30' },
];

export default function LeadFunnel({ leads = [] }) {
  const counts = useMemo(() => {
    const c = { hot: 0, warm: 0, cold: 0, total: leads.length };
    leads.forEach(l => {
      const status = l.status?.toLowerCase();
      if (status === 'hot') c.hot++;
      else if (status === 'warm') c.warm++;
      else c.cold++;
    });
    return c;
  }, [leads]);

  if (counts.total === 0) return null;

  return (
    <div className="card">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Lead Pipeline
          </h3>
          <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300 tabular-nums">
            {counts.total} total
          </span>
        </div>

        {/* Progress bar */}
        <div className="pipe-track h-3 flex overflow-hidden rounded-full">
          {stages.map(stage => {
            const pct = counts.total > 0 ? (counts[stage.key] / counts.total) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={stage.key}
                className={`${stage.color} transition-all duration-700 first:rounded-l-full last:rounded-r-full`}
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3">
          {stages.map(stage => (
            <div key={stage.key} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                {stage.label}
              </span>
              <span className="text-xs font-bold font-mono text-gray-900 dark:text-gray-200 tabular-nums">
                {counts[stage.key]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
