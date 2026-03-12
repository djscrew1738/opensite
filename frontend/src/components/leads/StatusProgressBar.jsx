import { Check } from 'lucide-react';

const steps = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'won', label: 'Won' },
];

export default function StatusProgressBar({ currentStatus, onStatusChange, disabled = false }) {
  const currentIdx = steps.findIndex(s => s.key === currentStatus);

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isFuture = idx > currentIdx;
        const canClick = !disabled && idx === currentIdx + 1;

        return (
          <button
            key={step.key}
            onClick={() => canClick && onStatusChange?.(step.key)}
            disabled={!canClick}
            className={`
              flex items-center gap-1 px-2 py-1 rounded-lg text-2xs font-bold uppercase tracking-wider
              transition-all duration-200
              ${isCompleted
                ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                : isCurrent
                  ? 'bg-blue-100 dark:bg-copper-950/30 text-blue-700 dark:text-blue-400 ring-1 ring-blue-300 dark:ring-blue-700'
                  : canClick
                    ? 'bg-concrete-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 hover:bg-blue-50 dark:hover:bg-copper-950/20 hover:text-blue-600 cursor-pointer'
                    : 'bg-concrete-50 dark:bg-surface-800/50 text-surface-300 dark:text-surface-600 cursor-default'
              }
            `}
            title={canClick ? `Advance to ${step.label}` : step.label}
          >
            {isCompleted && <Check className="w-3 h-3" strokeWidth={3} />}
            <span>{step.label}</span>
          </button>
        );
      })}
    </div>
  );
}
