import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FIXTURE_CONFIG } from './FixtureMarker';
import { 
  Scan, CheckCircle2, XCircle, HelpCircle, ChevronDown, ChevronUp,
  Trash2, Edit3, RefreshCw, Wand2, Filter, ArrowUpRight, ArrowDownRight,
  Target, Sparkles, List, LayoutGrid
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Fixture List Item Component
// ═══════════════════════════════════════════════════════════════

function FixtureListItem({ 
  fixture, 
  isSelected,
  onSelect, 
  onVerify, 
  onReject, 
  onDelete,
  onTypeChange 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const config = FIXTURE_CONFIG[fixture.type] || FIXTURE_CONFIG.unknown;
  const Icon = config.icon;
  
  const statusConfig = {
    verified: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    pending: { icon: HelpCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  };
  const status = statusConfig[fixture.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`group rounded-xl border transition-all ${
        isSelected 
          ? 'bg-accent-500/10 border-accent-500/50' 
          : 'bg-surface-850/50 border-surface-800 hover:border-surface-700'
      }`}
    >
      <div 
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => onSelect?.(fixture.id)}
      >
        {/* Icon */}
        <div 
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bgColor}`}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-surface-100 truncate">
              {config.label}
            </span>
            {fixture.confidence && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                fixture.confidence >= 80 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : fixture.confidence >= 50 
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
              }`}>
                {fixture.confidence}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`flex items-center gap-1 text-xs ${status.color}`}>
              <StatusIcon className="w-3 h-3" />
              {fixture.status}
            </span>
            <span className="text-xs text-surface-500">
              ({Math.round(fixture.x * 100)}%, {Math.round(fixture.y * 100)}%)
            </span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {fixture.status === 'pending' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onVerify?.(fixture.id); }}
                className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                title="Verify"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReject?.(fixture.id); }}
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/20 transition-colors"
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-800 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-surface-800"
          >
            <div className="p-3 space-y-3">
              {/* Type selector */}
              {isEditing ? (
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(FIXTURE_CONFIG)
                    .filter(([key]) => key !== 'unknown')
                    .map(([type, typeConfig]) => (
                      <button
                        key={type}
                        onClick={() => {
                          onTypeChange?.(fixture.id, type);
                          setIsEditing(false);
                        }}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                          fixture.type === type 
                            ? `${typeConfig.bgColor} text-white` 
                            : 'hover:bg-surface-800 text-surface-400'
                        }`}
                      >
                        <typeConfig.icon className="w-3 h-3" />
                        {typeConfig.label}
                      </button>
                    ))}
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-xs text-surface-400 hover:text-surface-200 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Change type
                </button>
              )}
              
              {/* Details */}
              <div className="text-xs space-y-1 text-surface-500">
                {fixture.dimensions && (
                  <p>Dimensions: <span className="text-surface-300">{fixture.dimensions}</span></p>
                )}
                {fixture.detectedAt && (
                  <p>Detected: <span className="text-surface-300">{new Date(fixture.detectedAt).toLocaleString()}</span></p>
                )}
                {fixture.aiModel && (
                  <p>AI Model: <span className="text-surface-300">{fixture.aiModel}</span></p>
                )}
              </div>
              
              {/* Delete action */}
              <button
                onClick={() => onDelete?.(fixture.id)}
                className="flex items-center gap-2 text-xs text-red-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete marker
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * FixtureDetectionPanel Component
 * Sidebar panel for managing AI-detected fixtures
 * 
 * @param {Object} props
 * @param {Array} props.fixtures - Array of fixture objects
 * @param {Function} props.onFixtureUpdate - Called when fixture is updated
 * @param {Function} props.onFixtureDelete - Called when fixture is deleted
 * @param {Function} props.onFixtureSelect - Called when fixture is selected
 * @param {Function} props.onRunDetection - Called to trigger new AI detection
 * @param {string} props.selectedId - Currently selected fixture ID
 * @param {boolean} props.isDetecting - Whether detection is in progress
 * @param {boolean} props.collapsed - Whether panel is collapsed
 * @param {Function} props.onToggleCollapse - Toggle collapse state
 */
export function FixtureDetectionPanel({
  fixtures = [],
  onFixtureUpdate,
  onFixtureDelete,
  onFixtureSelect,
  onRunDetection,
  selectedId,
  isDetecting = false,
  collapsed = false,
  onToggleCollapse,
}) {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [sortBy, setSortBy] = useState('confidence'); // 'confidence' | 'type' | 'status'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'verified' | 'rejected'

  // Stats
  const stats = useMemo(() => {
    const total = fixtures.length;
    const verified = fixtures.filter(f => f.status === 'verified').length;
    const pending = fixtures.filter(f => f.status === 'pending').length;
    const rejected = fixtures.filter(f => f.status === 'rejected').length;
    const avgConfidence = fixtures.length > 0
      ? Math.round(fixtures.reduce((sum, f) => sum + (f.confidence || 0), 0) / fixtures.length)
      : 0;
    return { total, verified, pending, rejected, avgConfidence };
  }, [fixtures]);

  // Filtered and sorted fixtures
  const displayFixtures = useMemo(() => {
    let filtered = [...fixtures];
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(f => f.status === filterStatus);
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return (b.confidence || 0) - (a.confidence || 0);
        case 'type':
          return (a.type || '').localeCompare(b.type || '');
        case 'status':
          const statusOrder = { pending: 0, verified: 1, rejected: 2 };
          return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [fixtures, filterStatus, sortBy]);

  // Handle bulk actions
  const handleVerifyAll = useCallback(() => {
    const pendingIds = fixtures
      .filter(f => f.status === 'pending')
      .map(f => f.id);
    pendingIds.forEach(id => onFixtureUpdate?.(id, { status: 'verified' }));
  }, [fixtures, onFixtureUpdate]);

  const handleRejectAll = useCallback(() => {
    const pendingIds = fixtures
      .filter(f => f.status === 'pending')
      .map(f => f.id);
    pendingIds.forEach(id => onFixtureUpdate?.(id, { status: 'rejected' }));
  }, [fixtures, onFixtureUpdate]);

  // Collapsed state
  if (collapsed) {
    return (
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-14 bg-surface-900 border-l border-surface-800 flex flex-col items-center py-4 gap-3"
      >
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl bg-surface-800 text-surface-400 hover:text-surface-100 transition-colors"
        >
          <Scan className="w-5 h-5" />
        </button>
        {stats.total > 0 && (
          <div className="flex flex-col gap-2 items-center">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-xs font-semibold text-emerald-500">{stats.verified}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <span className="text-xs font-semibold text-amber-500">{stats.pending}</span>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="w-80 bg-surface-900 border-l border-surface-800 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-500/20 flex items-center justify-center">
            <Scan className="w-4 h-4 text-accent-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-surface-100">Fixture Detection</h3>
            <p className="text-xs text-surface-500">AI-powered identification</p>
          </div>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors"
        >
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2 px-3 py-3 border-b border-surface-800">
        <div className="text-center">
          <p className="text-lg font-bold text-surface-100">{stats.total}</p>
          <p className="text-[9px] text-surface-500 uppercase">Total</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-emerald-500">{stats.verified}</p>
          <p className="text-[9px] text-surface-500 uppercase">Verified</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-amber-500">{stats.pending}</p>
          <p className="text-[9px] text-surface-500 uppercase">Pending</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-accent-500">{stats.avgConfidence}%</p>
          <p className="text-[9px] text-surface-500 uppercase">Avg</p>
        </div>
      </div>

      {/* Run Detection Button */}
      <div className="px-3 py-3 border-b border-surface-800">
        <button
          onClick={onRunDetection}
          disabled={isDetecting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all shadow-lg shadow-accent-600/20"
        >
          {isDetecting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          {isDetecting ? 'Detecting...' : 'Run AI Detection'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-800 bg-surface-850/30">
        <div className="flex items-center gap-1">
          {[
            { key: 'all', label: 'All', count: stats.total },
            { key: 'pending', label: 'Pending', count: stats.pending },
            { key: 'verified', label: 'Verified', count: stats.verified },
            { key: 'rejected', label: 'Rejected', count: stats.rejected },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === key 
                  ? 'bg-surface-700 text-surface-100' 
                  : 'text-surface-500 hover:text-surface-300'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-surface-700 text-surface-100' : 'text-surface-500'}`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-surface-700 text-surface-100' : 'text-surface-500'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {stats.pending > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-800">
          <button
            onClick={handleVerifyAll}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-xs font-medium"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verify All
          </button>
          <button
            onClick={handleRejectAll}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-xs font-medium"
          >
            <XCircle className="w-3.5 h-3.5" />
            Reject All
          </button>
        </div>
      )}

      {/* Fixture List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence mode="popLayout">
          {displayFixtures.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-surface-800 flex items-center justify-center">
                <Target className="w-6 h-6 text-surface-500" />
              </div>
              <p className="text-sm text-surface-400">No fixtures detected</p>
              <p className="text-xs text-surface-500 mt-1">
                Run AI detection to identify fixtures
              </p>
            </div>
          ) : (
            displayFixtures.map(fixture => (
              <FixtureListItem
                key={fixture.id}
                fixture={fixture}
                isSelected={selectedId === fixture.id}
                onSelect={onFixtureSelect}
                onVerify={(id) => onFixtureUpdate?.(id, { status: 'verified' })}
                onReject={(id) => onFixtureUpdate?.(id, { status: 'rejected' })}
                onDelete={onFixtureDelete}
                onTypeChange={(id, type) => onFixtureUpdate?.(id, { type })}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-surface-800 text-center">
        <p className="text-xs text-surface-500">
          <Sparkles className="w-3 h-3 inline mr-1" />
          Powered by AECVision AI
        </p>
      </div>
    </div>
  );
}

export default FixtureDetectionPanel;
