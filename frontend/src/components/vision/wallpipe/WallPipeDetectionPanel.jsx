import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WALL_CONFIG } from './WallSegment';
import { PIPE_CONFIG } from './PipeRun';
import {
  Scan, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Ruler, Activity, Trash2, Edit3, RefreshCw, Wand2,
  BrickWall, Route, Target, Sparkles
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Wall List Item
// ═══════════════════════════════════════════════════════════════

function WallListItem({
  wall,
  isSelected,
  onSelect,
  onVerify,
  onReject,
  onDelete,
  onTypeChange,
  scale,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const config = WALL_CONFIG[wall.type] || WALL_CONFIG.unknown;
  const length = Math.sqrt(
    Math.pow((wall.x2 - wall.x1) * scale, 2) + 
    Math.pow((wall.y2 - wall.y1) * scale, 2)
  ).toFixed(1);

  const statusIcons = {
    verified: { icon: CheckCircle2, color: 'text-emerald-500' },
    pending: { icon: Target, color: 'text-amber-500' },
    rejected: { icon: XCircle, color: 'text-red-500' },
  };
  const status = statusIcons[wall.status] || statusIcons.pending;
  const StatusIcon = status.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`rounded-xl border transition-all ${
        isSelected
          ? 'bg-accent-500/10 border-accent-500/50'
          : 'bg-surface-850/50 border-surface-800 hover:border-surface-700'
      }`}
    >
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => onSelect?.(wall.id)}
      >
        {/* Color indicator */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${config.color}30` }}
        >
          <div
            className="w-4 h-1 rounded-full"
            style={{ backgroundColor: config.color }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-surface-100 truncate">
              {config.label}
            </span>
            <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-surface-500 font-mono">{length} ft</span>
            {wall.confidence && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                wall.confidence >= 80
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : wall.confidence >= 50
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
              }`}>
                {wall.confidence}%
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {wall.status === 'pending' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onVerify?.(wall.id); }}
                className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/20 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReject?.(wall.id); }}
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/20 transition-colors"
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
                <div className="grid grid-cols-1 gap-1">
                  {Object.entries(WALL_CONFIG)
                    .filter(([key]) => key !== 'unknown')
                    .map(([type, typeConfig]) => (
                      <button
                        key={type}
                        onClick={() => {
                          onTypeChange?.(wall.id, type);
                          setIsEditing(false);
                        }}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                          wall.type === type
                            ? 'bg-surface-700 text-surface-100'
                            : 'hover:bg-surface-800 text-surface-400'
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: typeConfig.color }}
                        />
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
                  Change wall type
                </button>
              )}

              {/* Details */}
              <div className="text-xs space-y-1 text-surface-500">
                <p>Position: ({wall.x1.toFixed(2)}, {wall.y1.toFixed(2)}) → ({wall.x2.toFixed(2)}, {wall.y2.toFixed(2)})</p>
                {wall.thickness && <p>Thickness: {wall.thickness}"</p>}
                {wall.height && <p>Height: {wall.height} ft</p>}
              </div>

              {/* Delete */}
              <button
                onClick={() => onDelete?.(wall.id)}
                className="flex items-center gap-2 text-xs text-red-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete wall
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Pipe List Item
// ═══════════════════════════════════════════════════════════════

function PipeListItem({
  pipe,
  isSelected,
  onSelect,
  onVerify,
  onReject,
  onDelete,
  onTypeChange,
  scale,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const config = PIPE_CONFIG[pipe.type] || PIPE_CONFIG.unknown;
  const Icon = config.icon;

  // Calculate total length
  const length = useMemo(() => {
    if (!pipe.points) return '0.0';
    let total = 0;
    for (let i = 1; i < pipe.points.length; i++) {
      const dx = pipe.points[i].x - pipe.points[i - 1].x;
      const dy = pipe.points[i].y - pipe.points[i - 1].y;
      total += Math.sqrt(dx * dx + dy * dy);
    }
    return (total * scale).toFixed(1);
  }, [pipe.points, scale]);

  const statusIcons = {
    verified: { icon: CheckCircle2, color: 'text-emerald-500' },
    pending: { icon: Target, color: 'text-amber-500' },
    rejected: { icon: XCircle, color: 'text-red-500' },
  };
  const status = statusIcons[pipe.status] || statusIcons.pending;
  const StatusIcon = status.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`rounded-xl border transition-all ${
        isSelected
          ? 'bg-accent-500/10 border-accent-500/50'
          : 'bg-surface-850/50 border-surface-800 hover:border-surface-700'
      }`}
    >
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => onSelect?.(pipe.id)}
      >
        {/* Icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${config.color}30` }}
        >
          <Icon className="w-4 h-4" style={{ color: config.color }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-surface-100 truncate">
              {config.label}
            </span>
            <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-surface-500 font-mono">{length} ft</span>
            {pipe.diameter && (
              <span className="text-xs text-surface-500">{pipe.diameter}"</span>
            )}
            {pipe.confidence && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                pipe.confidence >= 80
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : pipe.confidence >= 50
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
              }`}>
                {pipe.confidence}%
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {pipe.status === 'pending' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onVerify?.(pipe.id); }}
                className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/20 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReject?.(pipe.id); }}
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/20 transition-colors"
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
                <div className="grid grid-cols-1 gap-1">
                  {Object.entries(PIPE_CONFIG)
                    .filter(([key]) => key !== 'unknown')
                    .map(([type, typeConfig]) => {
                      const TypeIcon = typeConfig.icon;
                      return (
                        <button
                          key={type}
                          onClick={() => {
                            onTypeChange?.(pipe.id, type);
                            setIsEditing(false);
                          }}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                            pipe.type === type
                              ? 'bg-surface-700 text-surface-100'
                              : 'hover:bg-surface-800 text-surface-400'
                          }`}
                        >
                          <TypeIcon className="w-3.5 h-3.5" style={{ color: typeConfig.color }} />
                          {typeConfig.label}
                        </button>
                      );
                    })}
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-xs text-surface-400 hover:text-surface-200 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Change pipe type
                </button>
              )}

              {/* Details */}
              <div className="text-xs space-y-1 text-surface-500">
                <p>Segments: {pipe.points ? pipe.points.length - 1 : 0}</p>
                {pipe.material && <p>Material: {pipe.material}</p>}
              </div>

              {/* Delete */}
              <button
                onClick={() => onDelete?.(pipe.id)}
                className="flex items-center gap-2 text-xs text-red-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete pipe run
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
 * WallPipeDetectionPanel Component
 * Sidebar panel for managing wall and pipe detections
 */
export function WallPipeDetectionPanel({
  walls = [],
  pipes = [],
  scale = 1,
  selectedWallId,
  selectedPipeId,
  onWallSelect,
  onPipeSelect,
  onWallUpdate,
  onWallDelete,
  onPipeUpdate,
  onPipeDelete,
  onRunDetection,
  isDetecting = false,
  collapsed = false,
  onToggleCollapse,
}) {
  const [activeTab, setActiveTab] = useState('walls'); // 'walls' | 'pipes'

  // Stats
  const stats = useMemo(() => {
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

    const pipeStats = {
      total: pipes.length,
      verified: pipes.filter(p => p.status === 'verified').length,
      pending: pipes.filter(p => p.status === 'pending').length,
    };

    return { wallStats, pipeStats };
  }, [walls, pipes, scale]);

  // Bulk actions
  const handleVerifyAllWalls = useCallback(() => {
    walls.filter(w => w.status === 'pending').forEach(w => 
      onWallUpdate?.(w.id, { status: 'verified' })
    );
  }, [walls, onWallUpdate]);

  const handleVerifyAllPipes = useCallback(() => {
    pipes.filter(p => p.status === 'pending').forEach(p => 
      onPipeUpdate?.(p.id, { status: 'verified' })
    );
  }, [pipes, onPipeUpdate]);

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
        <div className="flex flex-col gap-2 items-center">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <span className="text-xs font-semibold text-blue-500">{stats.wallStats.verified}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <span className="text-xs font-semibold text-purple-500">{stats.pipeStats.verified}</span>
          </div>
        </div>
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
            <h3 className="text-sm font-semibold text-surface-100">Detection</h3>
            <p className="text-xs text-surface-500">Walls & Pipe Runs</p>
          </div>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors"
        >
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 px-3 py-3 border-b border-surface-800">
        <div className="bg-surface-850/50 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <BrickWall className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs text-surface-400">Walls</span>
          </div>
          <p className="text-lg font-bold text-surface-100">{stats.wallStats.total}</p>
          <p className="text-xs text-surface-500">{stats.wallStats.totalLength.toFixed(0)} ft</p>
        </div>
        <div className="bg-surface-850/50 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Route className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-xs text-surface-400">Pipes</span>
          </div>
          <p className="text-lg font-bold text-surface-100">{stats.pipeStats.total}</p>
          <p className="text-xs text-surface-500">{stats.pipeStats.verified} verified</p>
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

      {/* Tabs */}
      <div className="flex border-b border-surface-800">
        <button
          onClick={() => setActiveTab('walls')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'walls'
              ? 'text-accent-400 border-b-2 border-accent-500 bg-accent-500/10'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
          }`}
        >
          <BrickWall className="w-3.5 h-3.5" />
          Walls ({walls.length})
        </button>
        <button
          onClick={() => setActiveTab('pipes')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'pipes'
              ? 'text-accent-400 border-b-2 border-accent-500 bg-accent-500/10'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
          }`}
        >
          <Route className="w-3.5 h-3.5" />
          Pipes ({pipes.length})
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence mode="popLayout">
          {activeTab === 'walls' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {walls.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-surface-800 flex items-center justify-center">
                    <BrickWall className="w-6 h-6 text-surface-500" />
                  </div>
                  <p className="text-sm text-surface-400">No walls detected</p>
                </div>
              ) : (
                <>
                  {stats.wallStats.pending > 0 && (
                    <button
                      onClick={handleVerifyAllWalls}
                      className="w-full mb-2 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-xs font-medium"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verify All Walls ({stats.wallStats.pending})
                    </button>
                  )}
                  {walls.map(wall => (
                    <WallListItem
                      key={wall.id}
                      wall={wall}
                      isSelected={selectedWallId === wall.id}
                      onSelect={onWallSelect}
                      onVerify={(id) => onWallUpdate?.(id, { status: 'verified' })}
                      onReject={(id) => onWallUpdate?.(id, { status: 'rejected' })}
                      onDelete={onWallDelete}
                      onTypeChange={(id, type) => onWallUpdate?.(id, { type })}
                      scale={scale}
                    />
                  ))}
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'pipes' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {pipes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-surface-800 flex items-center justify-center">
                    <Route className="w-6 h-6 text-surface-500" />
                  </div>
                  <p className="text-sm text-surface-400">No pipes detected</p>
                </div>
              ) : (
                <>
                  {stats.pipeStats.pending > 0 && (
                    <button
                      onClick={handleVerifyAllPipes}
                      className="w-full mb-2 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-xs font-medium"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verify All Pipes ({stats.pipeStats.pending})
                    </button>
                  )}
                  {pipes.map(pipe => (
                    <PipeListItem
                      key={pipe.id}
                      pipe={pipe}
                      isSelected={selectedPipeId === pipe.id}
                      onSelect={onPipeSelect}
                      onVerify={(id) => onPipeUpdate?.(id, { status: 'verified' })}
                      onReject={(id) => onPipeUpdate?.(id, { status: 'rejected' })}
                      onDelete={onPipeDelete}
                      onTypeChange={(id, type) => onPipeUpdate?.(id, { type })}
                      scale={scale}
                    />
                  ))}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-surface-800 text-center">
        <p className="text-xs text-surface-500">
          <Sparkles className="w-3 h-3 inline mr-1" />
          AECVision Wall & Pipe Detection
        </p>
      </div>
    </div>
  );
}

export default WallPipeDetectionPanel;
