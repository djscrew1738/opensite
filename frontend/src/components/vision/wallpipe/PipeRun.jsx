import { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Wind, Activity, Check, X, Edit3, Trash2, Route } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Pipe Type Configurations
// ═══════════════════════════════════════════════════════════════

const PIPE_CONFIG = {
  water_supply: {
    label: 'Water Supply',
    color: '#3B82F6',
    icon: Droplets,
    strokeWidth: 3,
    description: 'Cold/hot water distribution',
  },
  hot_water: {
    label: 'Hot Water',
    color: '#EF4444',
    icon: Droplets,
    strokeWidth: 3,
    description: 'Hot water lines',
  },
  cold_water: {
    label: 'Cold Water',
    color: '#06B6D4',
    icon: Droplets,
    strokeWidth: 3,
    description: 'Cold water lines',
  },
  drain: {
    label: 'Drain/Waste',
    color: '#6B7280',
    icon: Activity,
    strokeWidth: 4,
    description: 'Wastewater drainage',
  },
  vent: {
    label: 'Vent',
    color: '#F59E0B',
    icon: Wind,
    strokeWidth: 2,
    description: 'Plumbing vent lines',
  },
  gas: {
    label: 'Gas Line',
    color: '#F97316',
    icon: Activity,
    strokeWidth: 2,
    description: 'Natural gas supply',
  },
  unknown: {
    label: 'Unknown',
    color: '#9CA3AF',
    icon: Route,
    strokeWidth: 2,
    description: 'Unidentified pipe',
  },
};

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate total path length
 */
function calculatePathLength(points, scale = 1) {
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }
  return (totalLength * scale).toFixed(1);
}

/**
 * Generate SVG path from points
 */
function generatePath(points) {
  if (points.length < 2) return '';
  
  let path = `M ${points[0].x * 100} ${points[0].y * 100}`;
  
  // Use smooth curves for pipe runs
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];
    
    // If it's a straight line, use L
    if (i === 1 || points.length <= 3) {
      path += ` L ${p2.x * 100} ${p2.y * 100}`;
    } else {
      // Use quadratic bezier for smoother curves
      const midX = (p1.x + p2.x) / 2 * 100;
      const midY = (p1.y + p2.y) / 2 * 100;
      path += ` Q ${p1.x * 100} ${p1.y * 100}, ${midX} ${midY}`;
      path += ` T ${p2.x * 100} ${p2.y * 100}`;
    }
  }
  
  return path;
}

// ═══════════════════════════════════════════════════════════════
// Tooltip Component
// ═══════════════════════════════════════════════════════════════

const PipeTooltip = memo(function PipeTooltip({
  pipe,
  config,
  totalLength,
  onVerify,
  onReject,
  onDelete,
  onTypeChange,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const typeOptions = Object.entries(PIPE_CONFIG).filter(([key]) => key !== 'unknown');
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 5, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute z-50"
      style={{
        left: `${pipe.points[pipe.points.length - 1].x * 100}%`,
        top: `${pipe.points[pipe.points.length - 1].y * 100}%`,
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
          <Icon className="w-4 h-4" style={{ color: config.color }} />
          <span className="text-sm font-semibold text-surface-100">
            {isEditing ? 'Change Type' : config.label}
          </span>
          {pipe.diameter && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-surface-800 text-surface-300">
              {pipe.diameter}"
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
                  {typeOptions.map(([type, typeConfig]) => {
                    const TypeIcon = typeConfig.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          onTypeChange?.(type);
                          setIsEditing(false);
                        }}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                          pipe.type === type
                            ? 'bg-surface-700 text-surface-100'
                            : 'hover:bg-surface-800 text-surface-400'
                        }`}
                      >
                        <TypeIcon className="w-3.5 h-3.5" style={{ color: typeConfig.color }} />
                        <span className="flex-1 text-left">{typeConfig.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Description */}
          {!isEditing && (
            <p className="text-xs text-surface-400">{config.description}</p>
          )}

          {/* Measurements */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <Route className="w-3.5 h-3.5 text-surface-500" />
              <span className="text-surface-400">Total Length:</span>
              <span className="text-surface-100 font-mono font-medium">{totalLength} ft</span>
            </div>
            {pipe.points && (
              <div className="flex items-center gap-2 text-xs">
                <Activity className="w-3.5 h-3.5 text-surface-500" />
                <span className="text-surface-400">Segments:</span>
                <span className="text-surface-100 font-mono">{pipe.points.length - 1}</span>
              </div>
            )}
            {pipe.material && (
              <div className="text-xs text-surface-400">
                Material: <span className="text-surface-300">{pipe.material}</span>
              </div>
            )}
          </div>

          {/* Confidence */}
          {pipe.confidence && (
            <div className={`text-xs px-2 py-1 rounded-lg ${
              pipe.confidence >= 80
                ? 'bg-emerald-500/10 text-emerald-400'
                : pipe.confidence >= 50
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-red-500/10 text-red-400'
            }`}>
              AI Confidence: {pipe.confidence}%
            </div>
          )}

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
 * PipeRun Component
 * Displays a pipe run path on the blueprint with type-based styling
 * 
 * @param {Object} props.pipe - Pipe data with points array
 * @param {number} props.scale - Scale factor
 * @param {boolean} props.isSelected - Whether pipe is selected
 * @param {boolean} props.showFlow - Whether to show flow animation
 * @param {Function} props.onClick - Click handler
 * @param {Function} props.onVerify - Verify handler
 * @param {Function} props.onReject - Reject handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onTypeChange - Type change handler
 */
export function PipeRun({
  pipe,
  scale = 1,
  isSelected = false,
  showFlow = true,
  onClick,
  onVerify,
  onReject,
  onDelete,
  onTypeChange,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const config = PIPE_CONFIG[pipe.type] || PIPE_CONFIG.unknown;
  const Icon = config.icon;

  // Calculate total length
  const totalLength = useMemo(() => 
    calculatePathLength(pipe.points || [], scale),
    [pipe.points, scale]
  );

  // Generate path
  const pathD = useMemo(() => 
    generatePath(pipe.points || []),
    [pipe.points]
  );

  // Get endpoint for icon
  const endPoint = pipe.points?.[pipe.points.length - 1] || { x: 0, y: 0 };

  // Status-based styling
  const getStatusStyles = () => {
    switch (pipe.status) {
      case 'verified':
        return { opacity: 1 };
      case 'rejected':
        return { opacity: 0.3 };
      default:
        return { opacity: 0.85 };
    }
  };

  const statusStyles = getStatusStyles();

  return (
    <>
      {/* Pipe path */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={config.color}
        strokeWidth={config.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ 
          pathLength: 1, 
          opacity: statusStyles.opacity,
        }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          cursor: 'pointer',
          filter: isSelected ? `drop-shadow(0 0 6px ${config.color})` : 'none',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(pipe.id);
        }}
      />

      {/* Flow animation */}
      {showFlow && pipe.status !== 'rejected' && (
        <motion.path
          d={pathD}
          fill="none"
          stroke="white"
          strokeWidth={config.strokeWidth * 0.5}
          strokeLinecap="round"
          strokeDasharray="8,12"
          initial={{ strokeDashoffset: 20 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Hover highlight */}
      {isHovered && !isSelected && (
        <path
          d={pathD}
          fill="none"
          stroke={config.color}
          strokeWidth={config.strokeWidth + 3}
          strokeLinecap="round"
          strokeOpacity={0.3}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Endpoint icon */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 400 }}
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(pipe.id);
        }}
      >
        <circle
          cx={`${endPoint.x * 100}%`}
          cy={`${endPoint.y * 100}%`}
          r="12"
          fill={config.color}
          stroke="white"
          strokeWidth="2"
        />
        <foreignObject
          x={`${endPoint.x * 100}%`}
          y={`${endPoint.y * 100}%`}
          width="24"
          height="24"
          style={{
            transform: 'translate(-12px, -12px)',
            pointerEvents: 'none',
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
        </foreignObject>
      </motion.g>

      {/* Status indicator */}
      {pipe.status === 'verified' && (
        <circle
          cx={`${endPoint.x * 100}%`}
          cy={`${endPoint.y * 100}%`}
          r="5"
          fill="#10B981"
          stroke="white"
          strokeWidth="2"
          style={{ transform: 'translate(15px, 0)', pointerEvents: 'none' }}
        />
      )}
      {pipe.status === 'rejected' && (
        <circle
          cx={`${endPoint.x * 100}%`}
          cy={`${endPoint.y * 100}%`}
          r="5"
          fill="#EF4444"
          stroke="white"
          strokeWidth="2"
          style={{ transform: 'translate(15px, 0)', pointerEvents: 'none' }}
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
              <PipeTooltip
                pipe={pipe}
                config={config}
                totalLength={totalLength}
                onVerify={() => onVerify?.(pipe.id)}
                onReject={() => onReject?.(pipe.id)}
                onDelete={() => onDelete?.(pipe.id)}
                onTypeChange={(type) => onTypeChange?.(pipe.id, type)}
              />
            </div>
          </foreignObject>
        )}
      </AnimatePresence>
    </>
  );
}

export default PipeRun;

// Export config for use in other components
export { PIPE_CONFIG };
