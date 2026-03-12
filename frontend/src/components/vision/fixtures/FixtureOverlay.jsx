import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FixtureMarker, FIXTURE_CONFIG } from './FixtureMarker';
import { 
  Layers, Filter, CheckCircle2, XCircle, HelpCircle,
  Eye, EyeOff, RefreshCw
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Filter & Stats Components
// ═══════════════════════════════════════════════════════════════

/**
 * Filter chip for fixture types
 */
function FilterChip({ type, config, count, isActive, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
        isActive 
          ? `${config.bgColor} text-white` 
          : 'bg-surface-800 text-surface-400 hover:bg-surface-700'
      }`}
    >
      <config.icon className="w-3 h-3" />
      <span>{config.label}</span>
      <span className={`px-1 rounded ${isActive ? 'bg-white/20' : 'bg-surface-900'}`}>
        {count}
      </span>
    </button>
  );
}

/**
 * Stats bar showing fixture counts by status
 */
function FixtureStats({ fixtures, onFilterByStatus }) {
  const stats = useMemo(() => {
    const total = fixtures.length;
    const verified = fixtures.filter(f => f.status === 'verified').length;
    const pending = fixtures.filter(f => f.status === 'pending').length;
    const rejected = fixtures.filter(f => f.status === 'rejected').length;
    return { total, verified, pending, rejected };
  }, [fixtures]);

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-surface-850/50 rounded-xl border border-surface-800">
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-surface-400">Total:</span>
        <span className="font-semibold text-surface-100">{stats.total}</span>
      </div>
      <div className="w-px h-4 bg-surface-700" />
      <button 
        onClick={() => onFilterByStatus?.('verified')}
        className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        <span className="text-emerald-500 font-medium">{stats.verified}</span>
      </button>
      <button 
        onClick={() => onFilterByStatus?.('pending')}
        className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
      >
        <HelpCircle className="w-3 h-3 text-amber-500" />
        <span className="text-amber-500 font-medium">{stats.pending}</span>
      </button>
      <button 
        onClick={() => onFilterByStatus?.('rejected')}
        className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
      >
        <XCircle className="w-3 h-3 text-red-500" />
        <span className="text-red-500 font-medium">{stats.rejected}</span>
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * FixtureOverlay Component
 * Manages and displays all AI-detected fixture markers on the blueprint
 * 
 * @param {Object} props
 * @param {Array} props.fixtures - Array of fixture objects
 * @param {Function} props.onFixtureUpdate - Called when a fixture is updated
 * @param {Function} props.onFixtureDelete - Called when a fixture is deleted
 * @param {Function} props.onBulkAction - Called for bulk operations
 * @param {number} props.scale - Current zoom scale for marker sizing
 * @param {boolean} props.showFilters - Whether to show filter controls
 * @param {boolean} props.showStats - Whether to show statistics bar
 * @param {string} props.className - Additional CSS classes
 */
export function FixtureOverlay({
  fixtures = [],
  onFixtureUpdate,
  onFixtureDelete,
  onBulkAction,
  scale = 1,
  showFilters = true,
  showStats = true,
  className = '',
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [activeFilters, setActiveFilters] = useState(new Set(Object.keys(FIXTURE_CONFIG)));
  const [statusFilter, setStatusFilter] = useState(null); // null = all
  const [visible, setVisible] = useState(true);

  // Handle fixture click
  const handleFixtureClick = useCallback((id) => {
    setSelectedId(prev => prev === id ? null : id);
  }, []);

  // Handle verify action
  const handleVerify = useCallback((id) => {
    onFixtureUpdate?.(id, { status: 'verified' });
    setSelectedId(null);
  }, [onFixtureUpdate]);

  // Handle reject action
  const handleReject = useCallback((id) => {
    onFixtureUpdate?.(id, { status: 'rejected' });
    setSelectedId(null);
  }, [onFixtureUpdate]);

  // Handle type change
  const handleTypeChange = useCallback((id, newType) => {
    onFixtureUpdate?.(id, { type: newType });
  }, [onFixtureUpdate]);

  // Toggle type filter
  const toggleTypeFilter = useCallback((type) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  // Filter fixtures
  const filteredFixtures = useMemo(() => {
    return fixtures.filter(fixture => {
      // Type filter
      if (!activeFilters.has(fixture.type)) return false;
      // Status filter
      if (statusFilter && fixture.status !== statusFilter) return false;
      return true;
    });
  }, [fixtures, activeFilters, statusFilter]);

  // Type counts for filter chips
  const typeCounts = useMemo(() => {
    const counts = {};
    fixtures.forEach(f => {
      counts[f.type] = (counts[f.type] || 0) + 1;
    });
    return counts;
  }, [fixtures]);

  // Bulk actions
  const handleVerifyAll = useCallback(() => {
    const pendingIds = filteredFixtures
      .filter(f => f.status === 'pending')
      .map(f => f.id);
    onBulkAction?.('verify', pendingIds);
  }, [filteredFixtures, onBulkAction]);

  const handleClearFilters = useCallback(() => {
    setActiveFilters(new Set(Object.keys(FIXTURE_CONFIG)));
    setStatusFilter(null);
  }, []);

  // Click outside to deselect
  useEffect(() => {
    const handleClickOutside = () => setSelectedId(null);
    if (selectedId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [selectedId]);

  if (!visible) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-surface-900/90 border border-surface-700 text-surface-400 hover:text-surface-100 transition-colors shadow-lg"
        onClick={() => setVisible(true)}
        title="Show fixtures"
      >
        <Eye className="w-5 h-5" />
      </motion.button>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Fixture markers */}
      <AnimatePresence>
        {filteredFixtures.map(fixture => (
          <FixtureMarker
            key={fixture.id}
            fixture={fixture}
            isSelected={selectedId === fixture.id}
            onClick={handleFixtureClick}
            onVerify={handleVerify}
            onReject={handleReject}
            onDelete={onFixtureDelete}
            onTypeChange={(type) => handleTypeChange(fixture.id, type)}
            scale={scale}
          />
        ))}
      </AnimatePresence>

      {/* Filter panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-4 z-20 w-64 bg-surface-900/95 backdrop-blur-sm border border-surface-700 rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-surface-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent-500" />
              <span className="text-sm font-semibold text-surface-100">Fixture Filters</span>
            </div>
            <button
              onClick={() => setVisible(false)}
              className="p-1 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors"
              title="Hide overlay"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>

          {/* Stats */}
          {showStats && (
            <div className="px-3 py-2 border-b border-surface-800">
              <FixtureStats 
                fixtures={fixtures} 
                onFilterByStatus={setStatusFilter}
              />
            </div>
          )}

          {/* Type filters */}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-3 h-3 text-surface-400" />
              <span className="text-xs font-medium text-surface-400 uppercase">Types</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(FIXTURE_CONFIG)
                .filter(([key]) => key !== 'unknown')
                .map(([type, config]) => (
                  <FilterChip
                    key={type}
                    type={type}
                    config={config}
                    count={typeCounts[type] || 0}
                    isActive={activeFilters.has(type)}
                    onToggle={() => toggleTypeFilter(type)}
                  />
                ))}
            </div>
          </div>

          {/* Actions */}
          <div className="px-3 py-2 border-t border-surface-800 bg-surface-850/30">
            <div className="flex gap-2">
              <button
                onClick={handleVerifyAll}
                disabled={!filteredFixtures.some(f => f.status === 'pending')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verify All
              </button>
              <button
                onClick={handleClearFilters}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-800 text-surface-400 hover:bg-surface-700 transition-colors text-xs font-medium"
                title="Clear filters"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default FixtureOverlay;
