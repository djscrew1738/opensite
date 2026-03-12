import { useState, useMemo, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import FixtureCard from './FixtureCard';
import { QUALIFYING_FIXTURES, NON_QUALIFYING_FIXTURES } from './constants';

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Grid stats showing active types and total count
 */
const GridStats = memo(function GridStats({ activeCount, totalCount }) {
  return (
    <div className="flex items-center gap-4 sm:gap-6">
      <p className="text-sm text-surface-500">
        <span className="font-bold text-surface-900 dark:text-surface-100">{activeCount}</span>
        {' '}of {QUALIFYING_FIXTURES.length} types
      </p>
      <p className="text-sm text-surface-500">
        <span className="font-bold text-surface-900 dark:text-surface-100">{totalCount}</span>
        {' '}total fixtures
      </p>
    </div>
  );
});

/**
 * Filter input with clear button
 */
const FilterInput = memo(function FilterInput({ value, onChange, onClear }) {
  return (
    <div className="relative">
      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
      <input
        type="text"
        placeholder="Filter fixtures..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-9 py-1.5 text-sm rounded-lg border border-surface-600 bg-surface-800 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all w-full sm:w-48"
        aria-label="Filter fixtures"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-surface-400 hover:text-surface-200 hover:bg-surface-700 transition-colors"
          aria-label="Clear filter"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
});

/**
 * Toggle button for showing all fixtures
 */
const ShowAllToggle = memo(function ShowAllToggle({ showAll, onToggle, count }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-200 px-3 py-1.5 rounded-lg hover:bg-surface-700 transition-colors"
      aria-expanded={showAll}
      aria-label={showAll ? 'Show fewer fixtures' : `Show all ${count} fixtures`}
    >
      {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      {showAll ? 'Show Less' : `Show All (${count})`}
    </button>
  );
});

/**
 * Empty state when filter returns no results
 */
const EmptyFilterState = memo(function EmptyFilterState({ filter, onClear }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-800 mb-4">
        <Filter className="w-6 h-6 text-surface-500" />
      </div>
      <p className="text-surface-400 mb-2">
        No fixtures match &quot;<span className="text-surface-200">{filter}</span>&quot;
      </p>
      <button
        onClick={onClear}
        className="text-accent-500 hover:text-accent-400 text-sm font-medium transition-colors"
      >
        Clear filter
      </button>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * FixtureGrid - Responsive grid of fixture selection cards
 * 
 * Features:
 * - Filterable fixture list
 * - Toggle between qualifying and all fixtures
 * - Stats display
 * - Responsive grid layout
 * 
 * @param {Object} props
 * @param {Object} props.fixtures - Current fixture counts { [key]: number }
 * @param {Function} props.onChange - Callback when fixtures change
 */
function FixtureGrid({ fixtures, onChange }) {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState('');

  // Memoized fixture list based on showAll toggle
  const allFixtures = useMemo(() => 
    showAll 
      ? [...QUALIFYING_FIXTURES, ...NON_QUALIFYING_FIXTURES] 
      : QUALIFYING_FIXTURES,
    [showAll]
  );

  // Memoized filtered fixtures
  const filteredFixtures = useMemo(() => {
    if (!filter.trim()) return allFixtures;
    const lowerFilter = filter.toLowerCase();
    return allFixtures.filter(f => f.label.toLowerCase().includes(lowerFilter));
  }, [allFixtures, filter]);

  // Memoized stats
  const stats = useMemo(() => ({
    activeCount: QUALIFYING_FIXTURES.filter(f => (fixtures[f.key] || 0) > 0).length,
    totalCount: QUALIFYING_FIXTURES.reduce((sum, f) => sum + (fixtures[f.key] || 0), 0),
  }), [fixtures]);

  // Memoized change handler
  const handleFixtureChange = useCallback((key, value) => {
    const currentValue = fixtures[key] || 0;
    if (currentValue !== value) {
      onChange({ ...fixtures, [key]: value });
    }
  }, [fixtures, onChange]);

  // Memoized filter handlers
  const handleFilterChange = useCallback((value) => {
    setFilter(value);
  }, []);

  const handleClearFilter = useCallback(() => {
    setFilter('');
  }, []);

  const handleToggleShowAll = useCallback(() => {
    setShowAll(prev => !prev);
  }, []);

  const totalAvailable = QUALIFYING_FIXTURES.length + NON_QUALIFYING_FIXTURES.length;

  return (
    <div className="space-y-4">
      {/* Header with stats and controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <GridStats activeCount={stats.activeCount} totalCount={stats.totalCount} />
        
        <div className="flex items-center gap-2">
          <FilterInput 
            value={filter} 
            onChange={handleFilterChange} 
            onClear={handleClearFilter} 
          />
          <ShowAllToggle 
            showAll={showAll} 
            onToggle={handleToggleShowAll}
            count={totalAvailable}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filteredFixtures.map(fixture => (
          <FixtureCard
            key={fixture.key}
            fixture={fixture}
            count={fixtures[fixture.key] || 0}
            onChange={handleFixtureChange}
            showQuickAdd={!filter}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredFixtures.length === 0 && (
        <EmptyFilterState filter={filter} onClear={handleClearFilter} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PropTypes
// ═══════════════════════════════════════════════════════════════

FixtureGrid.propTypes = {
  fixtures: PropTypes.objectOf(PropTypes.number).isRequired,
  onChange: PropTypes.func.isRequired,
};

GridStats.propTypes = {
  activeCount: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
};

FilterInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};

ShowAllToggle.propTypes = {
  showAll: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  count: PropTypes.number.isRequired,
};

EmptyFilterState.propTypes = {
  filter: PropTypes.string.isRequired,
  onClear: PropTypes.func.isRequired,
};

export default memo(FixtureGrid);
