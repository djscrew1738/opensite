import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WallSegment, WALL_CONFIG } from './WallSegment';
import { PipeRun, PIPE_CONFIG } from './PipeRun';
import {
  Layers, Eye, EyeOff, Filter, CheckCircle2, XCircle,
  Ruler, Activity, RefreshCw
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Filter Components
// ═══════════════════════════════════════════════════════════════

function WallFilterChip({ type, config, count, isActive, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
        isActive
          ? 'bg-surface-700 text-surface-100'
          : 'bg-surface-800 text-surface-500 hover:bg-surface-750'
      }`}
    >
      <div
        className="w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      <span>{config.label}</span>
      <span className={`px-1 rounded ${isActive ? 'bg-surface-600' : 'bg-surface-900'}`}>
        {count}
      </span>
    </button>
  );
}

function PipeFilterChip({ type, config, count, isActive, onToggle }) {
  const Icon = config.icon;
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
        isActive
          ? 'bg-surface-700 text-surface-100'
          : 'bg-surface-800 text-surface-500 hover:bg-surface-750'
      }`}
    >
      <Icon className="w-3 h-3" style={{ color: config.color }} />
      <span>{config.label}</span>
      <span className={`px-1 rounded ${isActive ? 'bg-surface-600' : 'bg-surface-900'}`}>
        {count}
      </span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// Stats Component
// ═══════════════════════════════════════════════════════════════

function DetectionStats({ walls, pipes, scale }) {
  const stats = useMemo(() => {
    // Wall stats
    const wallStats = {
      total: walls.length,
      verified: walls.filter(w => w.status === 'verified').length,
      pending: walls.filter(w => w.status === 'pending').length,
      totalLength: walls.reduce((sum, w) => {
        const dx = w.x2 - w.x1;
        const dy = w.y2 - w.y1;
        return sum + Math.sqrt(dx * dx + dy * dy) * scale;
      }, 0),
    };

    // Pipe stats
    const pipeStats = {
      total: pipes.length,
      verified: pipes.filter(p => p.status === 'verified').length,
      pending: pipes.filter(p => p.status === 'pending').length,
      totalLength: pipes.reduce((sum, p) => {
        if (!p.points) return sum;
        let length = 0;
        for (let i = 1; i < p.points.length; i++) {
          const dx = p.points[i].x - p.points[i - 1].x;
          const dy = p.points[i].y - p.points[i - 1].y;
          length += Math.sqrt(dx * dx + dy * dy);
        }
        return sum + length * scale;
      }, 0),
    };

    return { wallStats, pipeStats };
  }, [walls, pipes, scale]);

  return (
    <div className="space-y-2">
      {/* Wall stats */}
      <div className="flex items-center gap-3 px-3 py-2 bg-surface-850/50 rounded-lg border border-surface-800">
        <Ruler className="w-4 h-4 text-surface-500" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-400">Walls</span>
            <span className="text-xs font-mono text-surface-200">
              {stats.wallStats.totalLength.toFixed(0)} ft
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-emerald-500">{stats.wallStats.verified} ✓</span>
            <span className="text-xs text-amber-500">{stats.wallStats.pending} ⏳</span>
            <span className="text-xs text-surface-600">/ {stats.wallStats.total}</span>
          </div>
        </div>
      </div>

      {/* Pipe stats */}
      <div className="flex items-center gap-3 px-3 py-2 bg-surface-850/50 rounded-lg border border-surface-800">
        <Activity className="w-4 h-4 text-surface-500" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-400">Pipes</span>
            <span className="text-xs font-mono text-surface-200">
              {stats.pipeStats.totalLength.toFixed(0)} ft
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-emerald-500">{stats.pipeStats.verified} ✓</span>
            <span className="text-xs text-amber-500">{stats.pipeStats.pending} ⏳</span>
            <span className="text-xs text-surface-600">/ {stats.pipeStats.total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * WallAndPipeOverlay Component
 * SVG-based overlay for displaying wall segments and pipe runs
 * 
 * @param {Object} props
 * @param {Array} props.walls - Array of wall segments
 * @param {Array} props.pipes - Array of pipe runs
 * @param {number} props.scale - Scale factor (pixels per foot)
 * @param {Function} props.onWallUpdate - Wall update handler
 * @param {Function} props.onWallDelete - Wall delete handler
 * @param {Function} props.onPipeUpdate - Pipe update handler
 * @param {Function} props.onPipeDelete - Pipe delete handler
 * @param {Function} props.onBulkAction - Bulk action handler
 * @param {string} props.selectedWallId - Selected wall ID
 * @param {string} props.selectedPipeId - Selected pipe ID
 * @param {Function} props.onWallSelect - Wall selection handler
 * @param {Function} props.onPipeSelect - Pipe selection handler
 * @param {boolean} props.visible - Whether overlay is visible
 * @param {Function} props.onToggleVisibility - Toggle visibility
 */
export function WallAndPipeOverlay({
  walls = [],
  pipes = [],
  scale = 1,
  onWallUpdate,
  onWallDelete,
  onPipeUpdate,
  onPipeDelete,
  onBulkAction,
  selectedWallId,
  selectedPipeId,
  onWallSelect,
  onPipeSelect,
  visible = true,
  onToggleVisibility,
}) {
  const [activeWallTypes, setActiveWallTypes] = useState(new Set(Object.keys(WALL_CONFIG)));
  const [activePipeTypes, setActivePipeTypes] = useState(new Set(Object.keys(PIPE_CONFIG)));
  const [showWalls, setShowWalls] = useState(true);
  const [showPipes, setShowPipes] = useState(true);

  // Filter handlers
  const toggleWallType = useCallback((type) => {
    setActiveWallTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const togglePipeType = useCallback((type) => {
    setActivePipeTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  // Type counts
  const wallTypeCounts = useMemo(() => {
    const counts = {};
    walls.forEach(w => { counts[w.type] = (counts[w.type] || 0) + 1; });
    return counts;
  }, [walls]);

  const pipeTypeCounts = useMemo(() => {
    const counts = {};
    pipes.forEach(p => { counts[p.type] = (counts[p.type] || 0) + 1; });
    return counts;
  }, [pipes]);

  // Filtered items
  const filteredWalls = useMemo(() => 
    walls.filter(w => activeWallTypes.has(w.type)),
    [walls, activeWallTypes]
  );

  const filteredPipes = useMemo(() => 
    pipes.filter(p => activePipeTypes.has(p.type)),
    [pipes, activePipeTypes]
  );

  // Bulk actions
  const handleVerifyAll = useCallback(() => {
    const pendingWalls = filteredWalls.filter(w => w.status === 'pending').map(w => w.id);
    const pendingPipes = filteredPipes.filter(p => p.status === 'pending').map(p => p.id);
    onBulkAction?.('verify', [...pendingWalls, ...pendingPipes]);
  }, [filteredWalls, filteredPipes, onBulkAction]);

  if (!visible) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute top-4 right-72 z-20 p-2 rounded-xl bg-surface-900/90 border border-surface-700 text-surface-400 hover:text-surface-100 transition-colors shadow-lg"
        onClick={onToggleVisibility}
        title="Show walls & pipes"
      >
        <Layers className="w-5 h-5" />
      </motion.button>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* SVG Overlay */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      >
        {/* Walls */}
        {showWalls && filteredWalls.map(wall => (
          <g key={wall.id} style={{ pointerEvents: 'auto' }}>
            <WallSegment
              wall={wall}
              scale={scale}
              isSelected={selectedWallId === wall.id}
              onClick={onWallSelect}
              onVerify={(id) => onWallUpdate?.(id, { status: 'verified' })}
              onReject={(id) => onWallUpdate?.(id, { status: 'rejected' })}
              onDelete={onWallDelete}
              onTypeChange={(id, type) => onWallUpdate?.(id, { type })}
            />
          </g>
        ))}

        {/* Pipes */}
        {showPipes && filteredPipes.map(pipe => (
          <g key={pipe.id} style={{ pointerEvents: 'auto' }}>
            <PipeRun
              pipe={pipe}
              scale={scale}
              isSelected={selectedPipeId === pipe.id}
              onClick={onPipeSelect}
              onVerify={(id) => onPipeUpdate?.(id, { status: 'verified' })}
              onReject={(id) => onPipeUpdate?.(id, { status: 'rejected' })}
              onDelete={onPipeDelete}
              onTypeChange={(id, type) => onPipeUpdate?.(id, { type })}
            />
          </g>
        ))}
      </svg>

      {/* Filter Panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-4 right-72 z-20 w-64 bg-surface-900/95 backdrop-blur-sm border border-surface-700 rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-surface-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent-500" />
            <span className="text-sm font-semibold text-surface-100">Walls & Pipes</span>
          </div>
          <button
            onClick={onToggleVisibility}
            className="p-1 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="px-3 py-2 border-b border-surface-800">
          <DetectionStats walls={walls} pipes={pipes} scale={scale} />
        </div>

        {/* Walls Section */}
        <div className="p-3 border-b border-surface-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowWalls(!showWalls)}
                className={`p-1 rounded transition-colors ${showWalls ? 'text-surface-200' : 'text-surface-600'}`}
              >
                {showWalls ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <span className="text-xs font-medium text-surface-400 uppercase">Walls</span>
            </div>
            <span className="text-xs text-surface-500">{filteredWalls.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(WALL_CONFIG)
              .filter(([key]) => key !== 'unknown')
              .map(([type, config]) => (
                <WallFilterChip
                  key={type}
                  type={type}
                  config={config}
                  count={wallTypeCounts[type] || 0}
                  isActive={activeWallTypes.has(type)}
                  onToggle={() => toggleWallType(type)}
                />
              ))}
          </div>
        </div>

        {/* Pipes Section */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPipes(!showPipes)}
                className={`p-1 rounded transition-colors ${showPipes ? 'text-surface-200' : 'text-surface-600'}`}
              >
                {showPipes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <span className="text-xs font-medium text-surface-400 uppercase">Pipes</span>
            </div>
            <span className="text-xs text-surface-500">{filteredPipes.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(PIPE_CONFIG)
              .filter(([key]) => key !== 'unknown')
              .map(([type, config]) => (
                <PipeFilterChip
                  key={type}
                  type={type}
                  config={config}
                  count={pipeTypeCounts[type] || 0}
                  isActive={activePipeTypes.has(type)}
                  onToggle={() => togglePipeType(type)}
                />
              ))}
          </div>
        </div>

        {/* Actions */}
        {(walls.some(w => w.status === 'pending') || pipes.some(p => p.status === 'pending')) && (
          <div className="px-3 py-2 border-t border-surface-800 bg-surface-850/30">
            <button
              onClick={handleVerifyAll}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-xs font-medium"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verify All Pending
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default WallAndPipeOverlay;
