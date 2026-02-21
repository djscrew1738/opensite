import { Minus, Plus, Trash2, Zap } from 'lucide-react';
import { FIXTURE_PRICE } from './constants';

export default function FixtureCard({ fixture, count, onChange, showQuickAdd = false }) {
  const Icon = fixture.icon;
  const subtotal = count * FIXTURE_PRICE;

  const decrement = () => onChange(Math.max(0, count - 1));
  const increment = () => onChange(count + 1);
  const setValue = (val) => onChange(Math.max(0, val));
  const clear = () => onChange(0);

  // Quick add buttons (1, 5, 10)
  const quickAdds = [1, 5, 10].filter(n => n !== count);

  return (
    <div
      className={`group relative bg-white dark:bg-surface-800 border rounded-xl p-4 transition-all hover:shadow-md ${
        count > 0 
          ? 'border-accent-300 dark:border-accent-600 shadow-sm' 
          : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
      }`}
    >
      {/* Active indicator */}
      {count > 0 && (
        <div 
          className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
          style={{ backgroundColor: fixture.color }}
        />
      )}

      {/* Icon + Label */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
          style={{ 
            backgroundColor: count > 0 ? `${fixture.color}20` : `${fixture.color}10`,
            transform: count > 0 ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          <Icon className="w-5 h-5" style={{ color: fixture.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">{fixture.label}</p>
          {count > 0 ? (
            <p className="text-xs font-bold" style={{ color: fixture.color }}>
              ${subtotal.toLocaleString()}
            </p>
          ) : (
            <p className="text-xs text-surface-400">
              ${FIXTURE_PRICE.toLocaleString()} each
            </p>
          )}
        </div>
        {count > 0 && (
          <button
            onClick={clear}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 transition-all"
            title="Clear"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between bg-surface-50 dark:bg-surface-900 rounded-xl p-1.5">
        <button
          type="button"
          onClick={decrement}
          disabled={count === 0}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          min="0"
          value={count}
          onChange={(e) => setValue(parseInt(e.target.value) || 0)}
          className="w-12 text-center bg-transparent text-lg font-bold text-surface-900 dark:text-surface-100 tabular-nums focus:outline-none"
        />
        <button
          type="button"
          onClick={increment}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: fixture.color }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Add Buttons */}
      {showQuickAdd && count === 0 && (
        <div className="flex gap-1 mt-2">
          {quickAdds.map(n => (
            <button
              key={n}
              onClick={() => setValue(n)}
              className="flex-1 py-1 text-[10px] font-medium rounded-md bg-surface-100 dark:bg-surface-700 text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
            >
              +{n}
            </button>
          ))}
        </div>
      )}

      {/* Count badge for large numbers */}
      {count >= 50 && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: fixture.color }}
        >
          {count}
        </div>
      )}
    </div>
  );
}
