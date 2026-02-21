import { useState } from 'react';
import FixtureCard from './FixtureCard';
import { QUALIFYING_FIXTURES, NON_QUALIFYING_FIXTURES } from './constants';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';

export default function FixtureGrid({ fixtures, onChange }) {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState('');

  const handleFixtureChange = (key, value) => {
    onChange({ ...fixtures, [key]: value });
  };

  const allFixtures = showAll 
    ? [...QUALIFYING_FIXTURES, ...NON_QUALIFYING_FIXTURES]
    : QUALIFYING_FIXTURES;

  const filteredFixtures = filter 
    ? allFixtures.filter(f => f.label.toLowerCase().includes(filter.toLowerCase()))
    : allFixtures;

  const activeCount = QUALIFYING_FIXTURES.filter(f => (fixtures[f.key] || 0) > 0).length;
  const totalCount = QUALIFYING_FIXTURES.reduce((sum, f) => sum + (fixtures[f.key] || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-surface-500">
            <span className="font-bold text-surface-900">{activeCount}</span> of {QUALIFYING_FIXTURES.length} types selected
          </p>
          <p className="text-sm text-surface-500">
            <span className="font-bold text-surface-900">{totalCount}</span> total fixtures
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Filter fixtures..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 px-3 py-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showAll ? 'Show Less' : 'Show All'}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filteredFixtures.map(fixture => (
          <FixtureCard
            key={fixture.key}
            fixture={fixture}
            count={fixtures[fixture.key] || 0}
            onChange={(val) => handleFixtureChange(fixture.key, val)}
            showQuickAdd={!filter}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredFixtures.length === 0 && (
        <div className="text-center py-12 text-surface-400">
          <p>No fixtures match "{filter}"</p>
          <button 
            onClick={() => setFilter('')}
            className="text-accent-600 hover:text-accent-700 text-sm mt-2"
          >
            Clear filter
          </button>
        </div>
      )}
    </div>
  );
}
