import { useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, Check, X, Edit3, Trash2, BrickWall, Info } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Wall Type Configurations
// ═══════════════════════════════════════════════════════════════

const WALL_CONFIG = {
  interior: {
    label: 'Interior Wall',
    color: '#6B7280',
    strokeWidth: 3,
    dashArray: 'none',
  },
  exterior: {
    label: 'Exterior Wall',
    color: '#3B82F6',
    strokeWidth: 4,
    dashArray: 'none',
  },
  loadBearing: {
    label: 'Load Bearing',
    color: '#EF4444',
    strokeWidth: 5,
    dashArray: 'none',
  },
  partition: {
    label: 'Partition',
    color: '#10B981',
    strokeWidth: 2,
    dashArray: '4,4',
  },
  plumbing: {
    label: 'Plumbing Wall',
    color: '#8B5CF6',
    strokeWidth: 4,
    dashArray: '8,4',
  },
  unknown: {
    label: 'Unknown',
    color: '#9CA3AF',
    strokeWidth: 2,
    dashArray: '2,2',
  },
};

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate distance between two normalized points
 */
function calculateDistance(p1, p2, scale = 1) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const pixelDistance = Math.sqrt(dx * dx + dy * dy);
  // Convert to feet using scale (pixels per foot)
  return (pixelDistance * scale).toFixed(1);
}

/**
 * Calculate angle between two points in degrees
 */
function calculateAngle(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return angle;
}

/**
 * Get midpoint between two points
 */
function getMidpoint(p1, p2) {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

// ═══════════════════════════════════════════════════════════════
// Tooltip Component
// ═══════════════════════════════════════════════════════════════

const WallTooltip = memo(function WallTooltip({
  wall,
  config,
  realLength,
  onVerify,
  onReject,
  onDelete,
  onTypeChange,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const typeOptions = Object.entries(WALL_CONFIG).filter(([key]) => key !== 'unknown');

  return (
    <motion.div
      initial={{ opacity: 0, y: 5, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 5, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute z-50"
      style={{
        left: `${wall.x2 * 100}%`,
        top: `${wall.y2 * 100}%`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-12px',
        minWidth: '200px',
      }}
    >
      <div className="bg-surface-900 border border-surface-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className="px-3 py-2 flex items-center gap-2"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <BrickWall className="w-4 h-4" style={{ color: config.color }} />
          <span className="text-sm font-semibold text-surface-100">
            {isEditing ? 'Change Type' : config.label}
          </span>
          {wall.confidence && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
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

        {/* Body */}
        <div className="p-3 space-y-3">
          {/* Type selector when editing */}
          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 gap-1">
                  {typeOptions.map(([type, typeConfig]) => (
                    <button
                      key={type}
                      onClick={() => {
                        onTypeChange?.(type);
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* Measurements */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <Ruler className="w-3.5 h-3.5 text-surface-500" />
              <span className="text-surface-400">Length:</span>
              <span className="text-surface-100 font-mono font-medium">{realLength} ft</span>
            </div>
            {wall.thickness && (
              <div className="flex items-center gap-2 text-xs">
                <Info className="w-3.5 h-3.5 text-surface-500" />
                <span className="text-surface-400">Thickness:</span>
                <span className="text-surface-100 font-mono">{wall.thickness}"</span>
              </div>
            )}
            {wall.height && (
              <div className="flex items-center gap-2 text-xs">
                <Info className="w-3.5 h-3.5 text-surface-500" />
                <span className="text-surface-400">Height:</span>
                <span className="text-surface-100 font-mono">{wall.height} ft</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-surface-800">
            {!isEditing && (
              <>
                <button
                  onClick={onVerify}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-xs font-medium"
                >
                  <Check className="w-3 h-3" />
                  Verify
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center p-1.5 rounded-lg bg-surface-800 text-surface-400 hover:bg-surface-700 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onReject}
                  className="flex items-center justify-center p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onDelete}
                  className="flex items-center justify-center p-1.5 rounded-lg bg-surface-800 text-surface-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            {isEditing && (
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-2 py-1.5 rounded-lg bg-surface-800 text-surface-400 hover:bg-surface-700 transition-colors text-xs font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
        <div className="w-2 h-2 bg-surface-900 border-r border-b border-surface-700 rotate-45 transform origin-center" />
      </div>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * WallSegment Component
 * Displays a wall segment on the blueprint with measurements
 * 
 * @param {Object} props.wall - Wall data
 * @param {number} props.scale - Scale factor (pixels per foot)
 * @param {boolean} props.isSelected - Whether wall is selected
 * @param {Function} props.onClick - Click handler
 * @param {Function} props.onVerify - Verify handler
 * @param {Function} props.onReject - Reject handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onTypeChange - Type change handler
 */
export function WallSegment({
  wall,
  scale = 1,
  isSelected = false,
  onClick,
  onVerify,
  onReject,
  onDelete,
  onTypeChange,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const config = WALL_CONFIG[wall.type] || WALL_CONFIG.unknown;

  // Calculate wall geometry
  const p1 = { x: wall.x1, y: wall.y1 };
  const p2 = { x: wall.x2, y: wall.y2 };
  const midpoint = getMidpoint(p1, p2);
  const realLength = calculateDistance(p1, p2, scale);
  const angle = calculateAngle(p1, p2);

  // Status-based styling
  const getStatusStyles = () => {
    switch (wall.status) {
      case 'verified':
        return { opacity: 1, filter: 'none' };
      case 'rejected':
        return { opacity: 0.3, filter: 'grayscale(100%)' };
      default:
        return { opacity: 0.8, filter: 'none' };
    }
  };

  const statusStyles = getStatusStyles();

  return (
    <>
      {/* Wall line */}
      <motion.line
        x1={`${wall.x1 * 100}%`}
        y1={`${wall.y1 * 100}%`}
        x2={`${wall.x2 * 100}%`}
        y2={`${wall.y2 * 100}%`}
        stroke={config.color}
        strokeWidth={config.strokeWidth}
        strokeDasharray={config.dashArray}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ 
          pathLength: 1, 
          opacity: statusStyles.opacity,
          filter: statusStyles.filter,
        }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          cursor: 'pointer',
          pointerEvents: 'stroke',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(wall.id);
        }}
      />

      {/* Selection highlight */}
      {isSelected && (
        <line
          x1={`${wall.x1 * 100}%`}
          y1={`${wall.y1 * 100}%`}
          x2={`${wall.x2 * 100}%`}
          y2={`${wall.y2 * 100}%`}
          stroke={config.color}
          strokeWidth={config.strokeWidth + 4}
          strokeOpacity={0.3}
          strokeLinecap="round"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Hover highlight */}
      {isHovered && !isSelected && (
        <line
          x1={`${wall.x1 * 100}%`}
          y1={`${wall.y1 * 100}%`}
          x2={`${wall.x2 * 100}%`}
          y2={`${wall.y2 * 100}%`}
          stroke={config.color}
          strokeWidth={config.strokeWidth + 2}
          strokeOpacity={0.3}
          strokeLinecap="round"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Length label (only when hovered or selected) */}
      <AnimatePresence>
        {(isHovered || isSelected) && (
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{ pointerEvents: 'none' }}
          >
            <rect
              x={`${midpoint.x * 100}%`}
              y={`${midpoint.y * 100}%`}
              width="50"
              height="20"
              rx="4"
              fill="rgba(0,0,0,0.8)"
              transform={`translate(-25, -10) rotate(${angle}, ${midpoint.x * 100}, ${midpoint.y * 100})`}
            />
            <text
              x={`${midpoint.x * 100}%`}
              y={`${midpoint.y * 100}%`}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="10"
              fontWeight="600"
              transform={`rotate(${angle}, ${midpoint.x * 100}, ${midpoint.y * 100})`}
            >
              {realLength} ft
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* Verified/Rejected indicator */}
      {wall.status === 'verified' && (
        <circle
          cx={`${midpoint.x * 100}%`}
          cy={`${midpoint.y * 100}%`}
          r="6"
          fill="#10B981"
          stroke="white"
          strokeWidth="2"
        />
      )}
      {wall.status === 'rejected' && (
        <circle
          cx={`${midpoint.x * 100}%`}
          cy={`${midpoint.y * 100}%`}
          r="6"
          fill="#EF4444"
          stroke="white"
          strokeWidth="2"
        />
      )}

      {/* Tooltip */}
      <AnimatePresence>
        {(isHovered || isSelected) && (
          <foreignObject
            width="100%"
            height="100%"
            style={{ pointerEvents: 'none', overflow: 'visible' }}
          >
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <WallTooltip
                wall={wall}
                config={config}
                realLength={realLength}
                onVerify={() => onVerify?.(wall.id)}
                onReject={() => onReject?.(wall.id)}
                onDelete={() => onDelete?.(wall.id)}
                onTypeChange={(type) => onTypeChange?.(wall.id, type)}
              />
            </div>
          </foreignObject>
        )}
      </AnimatePresence>
    </>
  );
}

export default WallSegment;

// Export config for use in other components
export { WALL_CONFIG };
