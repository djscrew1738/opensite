import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, X, HelpCircle, AlertCircle, 
  Droplets, Bath, Square, Circle, Trash2
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Fixture Type Definitions
// ═══════════════════════════════════════════════════════════════

const FIXTURE_CONFIG = {
  toilet: {
    icon: Bath,
    label: 'Toilet',
    color: '#3B82F6', // blue
    bgColor: 'bg-blue-500',
  },
  sink: {
    icon: Droplets,
    label: 'Sink',
    color: '#10B981', // emerald
    bgColor: 'bg-emerald-500',
  },
  shower: {
    icon: Square,
    label: 'Shower',
    color: '#8B5CF6', // purple
    bgColor: 'bg-purple-500',
  },
  bathtub: {
    icon: Bath,
    label: 'Bathtub',
    color: '#F59E0B', // amber
    bgColor: 'bg-amber-500',
  },
  drain: {
    icon: Circle,
    label: 'Drain',
    color: '#6B7280', // gray
    bgColor: 'bg-surface-500',
  },
  water_heater: {
    icon: Droplets,
    label: 'Water Heater',
    color: '#EF4444', // red
    bgColor: 'bg-red-500',
  },
  hose_bib: {
    icon: Droplets,
    label: 'Hose Bib',
    color: '#06B6D4', // cyan
    bgColor: 'bg-cyan-500',
  },
  unknown: {
    icon: HelpCircle,
    label: 'Unknown',
    color: '#9CA3AF', // gray-400
    bgColor: 'bg-surface-400',
  },
};

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Confidence indicator ring around the marker
 */
const ConfidenceRing = memo(function ConfidenceRing({ confidence, color }) {
  const circumference = 2 * Math.PI * 14;
  const strokeDashoffset = circumference - (confidence / 100) * circumference;
  
  return (
    <svg className="absolute -inset-1 w-8 h-8 -rotate-90" viewBox="0 0 32 32">
      {/* Background ring */}
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="2"
      />
      {/* Confidence ring */}
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="none"
        stroke={confidence >= 80 ? '#10B981' : confidence >= 50 ? '#F59E0B' : '#EF4444'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-500"
      />
    </svg>
  );
});

/**
 * Tooltip content for fixture details
 */
const FixtureTooltip = memo(function FixtureTooltip({ 
  fixture, 
  config,
  onVerify,
  onReject,
  onDelete,
  onTypeChange
}) {
  const [isEditing, setIsEditing] = useState(false);
  
  const typeOptions = Object.entries(FIXTURE_CONFIG).filter(([key]) => key !== 'unknown');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 5, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 5, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50"
      style={{ minWidth: '220px' }}
    >
      <div className="bg-surface-900 border border-surface-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div 
          className="px-3 py-2 flex items-center gap-2"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <config.icon className="w-4 h-4" style={{ color: config.color }} />
          <span className="text-sm font-semibold text-surface-100">
            {isEditing ? 'Change Type' : config.label}
          </span>
          {fixture.confidence && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
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
                <div className="grid grid-cols-2 gap-1">
                  {typeOptions.map(([key, typeConfig]) => (
                    <button
                      key={key}
                      onClick={() => {
                        onTypeChange?.(key);
                        setIsEditing(false);
                      }}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                        fixture.type === key 
                          ? 'bg-accent-500/20 text-accent-400' 
                          : 'hover:bg-surface-800 text-surface-400'
                      }`}
                    >
                      <typeConfig.icon className="w-3 h-3" />
                      {typeConfig.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Details */}
          <div className="text-xs space-y-1 text-surface-400">
            {fixture.dimensions && (
              <p>Dimensions: {fixture.dimensions}</p>
            )}
            {fixture.detectedAt && (
              <p>Detected: {new Date(fixture.detectedAt).toLocaleDateString()}</p>
            )}
            {fixture.notes && (
              <p className="text-surface-300 italic">"{fixture.notes}"</p>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-surface-800">
            {!isEditing && (
              <>
                <button
                  onClick={() => onVerify?.(fixture.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-xs font-medium"
                  title="Mark as verified"
                >
                  <Check className="w-3 h-3" />
                  Verify
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-surface-800 text-surface-400 hover:bg-surface-700 transition-colors text-xs font-medium"
                  title="Change type"
                >
                  <AlertCircle className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => onReject?.(fixture.id)}
                  className="flex items-center justify-center p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Mark as incorrect"
                >
                  <X className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDelete?.(fixture.id)}
                  className="flex items-center justify-center p-1.5 rounded-lg bg-surface-800 text-surface-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  title="Delete marker"
                >
                  <Trash2 className="w-3 h-3" />
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
 * FixtureMarker Component
 * Interactive marker for AI-detected fixtures on blueprints
 * 
 * @param {Object} props.fixture - Fixture data object
 * @param {string} props.fixture.id - Unique identifier
 * @param {string} props.fixture.type - Fixture type (toilet, sink, etc.)
 * @param {number} props.fixture.x - Normalized X position (0-1)
 * @param {number} props.fixture.y - Normalized Y position (0-1)
 * @param {number} props.fixture.confidence - Detection confidence (0-100)
 * @param {string} props.fixture.status - verified | pending | rejected
 * @param {Function} props.onVerify - Called when user verifies the fixture
 * @param {Function} props.onReject - Called when user rejects the fixture
 * @param {Function} props.onDelete - Called when user deletes the marker
 * @param {Function} props.onTypeChange - Called when user changes fixture type
 * @param {Function} props.onPositionChange - Called when marker is moved
 * @param {boolean} props.isDraggable - Whether marker can be dragged
 * @param {boolean} props.isSelected - Whether marker is currently selected
 */
export function FixtureMarker({
  fixture,
  onVerify,
  onReject,
  onDelete,
  onTypeChange,
  onPositionChange,
  onClick,
  isDraggable = false,
  isSelected = false,
  scale = 1,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const config = FIXTURE_CONFIG[fixture.type] || FIXTURE_CONFIG.unknown;
  const Icon = config.icon;
  
  // Status-based styling
  const getStatusStyles = () => {
    switch (fixture.status) {
      case 'verified':
        return 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-surface-900';
      case 'rejected':
        return 'opacity-40 grayscale';
      default:
        return '';
    }
  };
  
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    onClick?.(fixture.id);
  }, [fixture.id, onClick]);
  
  const handleMouseDown = useCallback((e) => {
    if (!isDraggable) return;
    e.stopPropagation();
    setIsDragging(true);
    
    // Drag logic would go here - simplified for this implementation
    // In a full implementation, you'd track mouse movement and
    // calculate new normalized coordinates
  }, [isDraggable]);
  
  // Scale-aware sizing
  const baseSize = 24;
  const size = Math.max(16, Math.min(32, baseSize / Math.sqrt(scale)));
  
  return (
    <motion.div
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${getStatusStyles()}`}
      style={{
        left: `${fixture.x * 100}%`,
        top: `${fixture.y * 100}%`,
        zIndex: isHovered || isSelected ? 100 : 1,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isDragging ? 1.2 : isHovered ? 1.1 : 1, 
        opacity: fixture.status === 'rejected' ? 0.4 : 1 
      }}
      whileHover={{ scale: 1.1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {/* Confidence ring */}
      {fixture.confidence && fixture.status === 'pending' && (
        <ConfidenceRing confidence={fixture.confidence} color={config.color} />
      )}
      
      {/* Verified checkmark */}
      {fixture.status === 'verified' && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center z-10">
          <Check className="w-2.5 h-2.5 text-white" />
        </div>
      )}
      
      {/* Rejected X */}
      {fixture.status === 'rejected' && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center z-10">
          <X className="w-2.5 h-2.5 text-white" />
        </div>
      )}
      
      {/* Main marker */}
      <div
        className={`relative flex items-center justify-center rounded-full shadow-lg transition-all duration-200 ${config.bgColor}`}
        style={{
          width: size,
          height: size,
          boxShadow: isSelected 
            ? `0 0 0 3px ${config.color}40, 0 4px 12px rgba(0,0,0,0.4)`
            : '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <Icon 
          className="text-white" 
          style={{ width: size * 0.55, height: size * 0.55 }}
        />
      </div>
      
      {/* Tooltip */}
      <AnimatePresence>
        {(isHovered || isSelected) && (
          <FixtureTooltip
            fixture={fixture}
            config={config}
            onVerify={onVerify}
            onReject={onReject}
            onDelete={onDelete}
            onTypeChange={onTypeChange}
          />
        )}
      </AnimatePresence>
      
      {/* Pulse animation for pending fixtures */}
      {fixture.status === 'pending' && fixture.confidence >= 80 && (
        <div 
          className="absolute inset-0 rounded-full animate-ping opacity-30"
          style={{ backgroundColor: config.color }}
        />
      )}
    </motion.div>
  );
}

export default FixtureMarker;

// Export config for use in other components
export { FIXTURE_CONFIG };
