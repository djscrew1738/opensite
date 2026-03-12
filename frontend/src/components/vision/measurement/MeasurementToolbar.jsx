import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MeasurementType,
  MeasurementUnit,
  convertValue,
  formatMeasurement,
  MEASUREMENT_LABELS,
} from './measurementTypes';
import {
  Ruler,
  Square,
  MousePointer2,
  X,
  Settings2,
  ChevronDown,
  Trash2,
  Check,
  GripVertical,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Tool Button Component
// ═══════════════════════════════════════════════════════════════

function ToolButton({
  icon: Icon,
  label,
  isActive,
  isDisabled,
  onClick,
  shortcut,
  color,
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
        transition-all duration-200
        ${isActive
          ? `text-white shadow-lg`
          : 'bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-200'
        }
        ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
      `}
      style={{
        backgroundColor: isActive ? color : undefined,
        boxShadow: isActive ? `0 4px 14px ${color}40` : undefined,
      }}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {shortcut && (
        <kbd className="ml-1 px-1.5 py-0.5 rounded text-xs bg-black/20 font-mono">
          {shortcut}
        </kbd>
      )}
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════
// Unit Selector Component
// ═══════════════════════════════════════════════════════════════

function UnitSelector({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const units = [
    { value: MeasurementUnit.FEET, label: 'Feet', symbol: 'ft' },
    { value: MeasurementUnit.METERS, label: 'Meters', symbol: 'm' },
    { value: MeasurementUnit.INCHES, label: 'Inches', symbol: 'in' },
    { value: MeasurementUnit.CENTIMETERS, label: 'Centimeters', symbol: 'cm' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface-800 text-surface-300 text-xs hover:bg-surface-700 transition-colors"
      >
        <span className="font-medium">{value}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-1 w-32 rounded-lg bg-surface-800 border border-surface-700 shadow-xl overflow-hidden z-50"
          >
            {units.map((unit) => (
              <button
                key={unit.value}
                onClick={() => {
                  onChange(unit.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                  value === unit.value
                    ? 'bg-accent-500/20 text-accent-400'
                    : 'text-surface-300 hover:bg-surface-700'
                }`}
              >
                <span>{unit.label}</span>
                <span className="text-surface-500 font-mono">{unit.symbol}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Help Tooltip Component
// ═══════════════════════════════════════════════════════════════

function MeasurementHelp({ tool }) {
  const helpText = {
    [MeasurementType.DISTANCE]: 'Click two points to measure distance',
    [MeasurementType.AREA]: 'Click multiple points to create a polygon. Click near the first point to close.',
    null: 'Select a tool to start measuring',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute top-full left-0 right-0 mt-2 px-3 py-2 rounded-lg bg-accent-500/10 border border-accent-500/30 text-xs text-accent-300"
    >
      {helpText[tool]}
      <div className="mt-1 text-xs text-accent-400/60">
        Right-click or press ESC to cancel
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Toolbar Component
// ═══════════════════════════════════════════════════════════════

export function MeasurementToolbar({
  activeTool,
  onToolSelect,
  onToolCancel,
  unit,
  onUnitChange,
  measurementCount,
  onClearAll,
  canUndo,
  onUndo,
  isVisible,
  onToggleVisibility,
}) {
  const [showHelp, setShowHelp] = useState(false);

  const tools = [
    {
      type: null,
      icon: MousePointer2,
      label: 'Select',
      color: '#6B7280',
      shortcut: 'V',
    },
    {
      type: MeasurementType.DISTANCE,
      icon: Ruler,
      label: 'Distance',
      color: '#3B82F6',
      shortcut: 'D',
    },
    {
      type: MeasurementType.AREA,
      icon: Square,
      label: 'Area',
      color: '#10B981',
      shortcut: 'A',
    },
  ];

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT') return;
    
    switch (e.key.toLowerCase()) {
      case 'v':
        onToolSelect?.(null);
        break;
      case 'd':
        onToolSelect?.(MeasurementType.DISTANCE);
        break;
      case 'a':
        onToolSelect?.(MeasurementType.AREA);
        break;
      case 'escape':
        if (activeTool) {
          onToolCancel?.();
        }
        break;
      case 'z':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          onUndo?.();
        }
        break;
    }
  }, [activeTool, onToolSelect, onToolCancel, onUndo]);

  // Attach keyboard listener
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
  }

  if (!isVisible) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={onToggleVisibility}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-surface-900 border border-surface-700 text-surface-400 hover:text-surface-100 transition-colors shadow-lg flex items-center gap-2"
      >
        <Ruler className="w-4 h-4" />
        <span className="text-sm font-medium">Measurements</span>
        {measurementCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent-500 text-white text-xs">
            {measurementCount}
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-30"
    >
      <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-surface-900/95 backdrop-blur-md border border-surface-700 shadow-2xl">
        {/* Tool buttons */}
        <div className="flex items-center gap-1.5">
          {tools.map((tool) => (
            <ToolButton
              key={tool.type || 'select'}
              icon={tool.icon}
              label={tool.label}
              isActive={activeTool === tool.type}
              onClick={() => {
                onToolSelect?.(tool.type);
                setShowHelp(!!tool.type);
              }}
              shortcut={tool.shortcut}
              color={tool.color}
            />
          ))}
        </div>

        <div className="w-px h-8 bg-surface-700" />

        {/* Unit selector */}
        <UnitSelector value={unit} onChange={onUnitChange} />

        <div className="w-px h-8 bg-surface-700" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          {canUndo && (
            <button
              onClick={onUndo}
              className="p-2 rounded-lg text-surface-400 hover:bg-surface-800 hover:text-surface-200 transition-colors"
              title="Undo last measurement"
            >
              <GripVertical className="w-4 h-4 rotate-90" />
            </button>
          )}
          
          {measurementCount > 0 && (
            <button
              onClick={onClearAll}
              className="p-2 rounded-lg text-surface-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
              title="Clear all measurements"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onToggleVisibility}
            className="p-2 rounded-lg text-surface-400 hover:bg-surface-800 hover:text-surface-200 transition-colors"
            title="Hide toolbar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Help tooltip */}
      <AnimatePresence>
        {showHelp && activeTool && (
          <MeasurementHelp tool={activeTool} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default MeasurementToolbar;
