import { memo, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { FIXTURE_PRICE } from './constants';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const QUICK_ADD_VALUES = [1, 5, 10];
const HIGH_COUNT_THRESHOLD = 50;

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Fixture icon with dynamic background
 */
const FixtureIcon = memo(function FixtureIcon({ icon: Icon, color, isActive }) {
  const bgStyle = useMemo(() => ({
    backgroundColor: isActive ? `${color}20` : `${color}10`,
    transform: isActive ? 'scale(1.05)' : 'scale(1)',
  }), [color, isActive]);

  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
      style={bgStyle}
    >
      <Icon className="w-5 h-5" style={{ color }} aria-hidden="true" />
    </div>
  );
});

/**
 * Price/subtotal display
 */
const PriceDisplay = memo(function PriceDisplay({ count, color }) {
  const subtotal = count * FIXTURE_PRICE;

  if (count > 0) {
    return (
      <p className="text-xs font-semibold" style={{ color }}>
        ${subtotal.toLocaleString()}
      </p>
    );
  }

  return (
    <p className="text-xs text-surface-400">
      ${FIXTURE_PRICE.toLocaleString()} each
    </p>
  );
});

/**
 * Clear button (visible on hover when count > 0)
 */
const ClearButton = memo(function ClearButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-surface-400 hover:text-danger-500 hover:bg-danger-500/10 transition-all focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-danger-500/50"
      title="Clear count"
      aria-label="Clear fixture count"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
});

/**
 * Stepper control for incrementing/decrementing
 */
const Stepper = memo(function Stepper({ count, color, onDecrement, onIncrement, onChange }) {
  return (
    <div className="flex items-center justify-between bg-surface-900 rounded-xl p-1.5">
      <button
        type="button"
        onClick={onDecrement}
        disabled={count === 0}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-700 hover:text-surface-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500/50"
        aria-label="Decrease count"
      >
        <Minus className="w-4 h-4" />
      </button>
      
      <input
        type="number"
        min="0"
        max="9999"
        value={count}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-12 text-center bg-transparent text-lg font-bold text-surface-100 tabular-nums focus:outline-none"
        aria-label="Fixture count"
      />
      
      <button
        type="button"
        onClick={onIncrement}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-white transition-all hover:opacity-90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-900"
        style={{ backgroundColor: color }}
        aria-label="Increase count"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
});

/**
 * Quick add buttons for preset values
 */
const QuickAddButtons = memo(function QuickAddButtons({ currentCount, color, onSetValue }) {
  const availableValues = QUICK_ADD_VALUES.filter(n => n !== currentCount);
  
  if (availableValues.length === 0) return null;

  return (
    <div className="flex gap-1 mt-2">
      {availableValues.map(n => (
        <button
          key={n}
          onClick={() => onSetValue(n)}
          className="flex-1 py-1 text-xs font-medium rounded-md bg-surface-700 text-surface-400 hover:bg-surface-600 hover:text-surface-200 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500/50"
          aria-label={`Add ${n} fixtures`}
        >
          +{n}
        </button>
      ))}
    </div>
  );
});

/**
 * High count badge for large numbers
 */
const HighCountBadge = memo(function HighCountBadge({ count, color }) {
  if (count < HIGH_COUNT_THRESHOLD) return null;

  return (
    <div
      className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-lg"
      style={{ backgroundColor: color }}
      aria-label={`Count: ${count}`}
    >
      {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * FixtureCard - Individual fixture selection card
 * 
 * Features:
 * - Stepper controls (+/-)
 * - Direct number input
 * - Quick-add buttons (when count is 0)
 * - Subtotal calculation
 * - Clear on hover
 * - High count badge
 * 
 * @param {Object} props
 * @param {Object} props.fixture - Fixture config { key, label, icon, color }
 * @param {number} props.count - Current count
 * @param {Function} props.onChange - Change callback (key, value)
 * @param {boolean} props.showQuickAdd - Whether to show quick-add buttons
 */
function FixtureCard({ fixture, count, onChange, showQuickAdd = false }) {
  const Icon = fixture.icon;
  const isActive = count > 0;

  // Memoized handlers
  const handleDecrement = useCallback(() => {
    onChange(fixture.key, Math.max(0, count - 1));
  }, [fixture.key, count, onChange]);

  const handleIncrement = useCallback(() => {
    onChange(fixture.key, count + 1);
  }, [fixture.key, count, onChange]);

  const handleSetValue = useCallback((value) => {
    onChange(fixture.key, Math.max(0, Math.min(9999, value)));
  }, [fixture.key, onChange]);

  const handleClear = useCallback(() => {
    onChange(fixture.key, 0);
  }, [fixture.key, onChange]);

  // Dynamic border styles based on active state
  const borderClasses = isActive
    ? 'border-accent-500 shadow-sm'
    : 'border-surface-600 hover:border-surface-500';

  return (
    <div
      className={`group relative bg-surface-800 border rounded-xl p-3 sm:p-4 transition-all duration-200 hover:shadow-md ${borderClasses}`}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
          style={{ backgroundColor: fixture.color }}
          aria-hidden="true"
        />
      )}

      {/* Header: Icon + Label + Price */}
      <div className="flex items-center gap-3 mb-3">
        <FixtureIcon icon={Icon} color={fixture.color} isActive={isActive} />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-surface-100 truncate" title={fixture.label}>
            {fixture.label}
          </p>
          <PriceDisplay count={count} color={fixture.color} />
        </div>
        
        {isActive && <ClearButton onClick={handleClear} />}
      </div>

      {/* Stepper */}
      <Stepper
        count={count}
        color={fixture.color}
        onDecrement={handleDecrement}
        onIncrement={handleIncrement}
        onChange={handleSetValue}
      />

      {/* Quick Add Buttons */}
      {showQuickAdd && count === 0 && (
        <QuickAddButtons
          currentCount={count}
          color={fixture.color}
          onSetValue={handleSetValue}
        />
      )}

      {/* High Count Badge */}
      <HighCountBadge count={count} color={fixture.color} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PropTypes
// ═══════════════════════════════════════════════════════════════

const fixturePropType = PropTypes.shape({
  key: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string.isRequired,
});

FixtureCard.propTypes = {
  fixture: fixturePropType.isRequired,
  count: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  showQuickAdd: PropTypes.bool,
};

FixtureCard.defaultProps = {
  showQuickAdd: false,
};

FixtureIcon.propTypes = {
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
};

PriceDisplay.propTypes = {
  count: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

ClearButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

Stepper.propTypes = {
  count: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  onDecrement: PropTypes.func.isRequired,
  onIncrement: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
};

QuickAddButtons.propTypes = {
  currentCount: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  onSetValue: PropTypes.func.isRequired,
};

HighCountBadge.propTypes = {
  count: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

export default memo(FixtureCard);
