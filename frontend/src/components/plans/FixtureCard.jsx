import { Minus, Plus } from 'lucide-react';
import { FIXTURE_PRICE } from './constants';

export default function FixtureCard({ fixture, count, onChange }) {
  const Icon = fixture.icon;
  const subtotal = count * FIXTURE_PRICE;

  const MAX_COUNT = 100;
  const decrement = () => onChange(Math.max(0, count - 1));
  const increment = () => onChange(Math.min(MAX_COUNT, count + 1));

  return (
    <div
      className="group relative bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-4 transition-all hover:shadow-md hover:border-surface-300 dark:hover:border-surface-600"
      style={{ '--accent': fixture.color }}
    >
      {/* Icon + Label */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${fixture.color}15` }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color: fixture.color }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">{fixture.label}</p>
          {subtotal > 0 && (
            <p className="text-xs font-medium" style={{ color: fixture.color }}>
              ${subtotal.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between bg-surface-50 dark:bg-surface-900 rounded-lg p-1">
        <button
          type="button"
          onClick={decrement}
          disabled={count === 0}
          className="w-8 h-8 rounded-md flex items-center justify-center text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-lg font-bold text-surface-900 dark:text-surface-100 tabular-nums min-w-[2ch] text-center">
          {count}
        </span>
        <button
          type="button"
          onClick={increment}
          disabled={count >= MAX_COUNT}
          className="w-8 h-8 rounded-md flex items-center justify-center text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: fixture.color }}
          title={count >= MAX_COUNT ? `Maximum ${MAX_COUNT} per fixture` : undefined}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
