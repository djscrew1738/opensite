/**
 * CanvasToolbar Component
 * Toolbar for Vision Canvas controls
 * 
 * Provides tools for:
 * - Selection and navigation
 * - Drawing (pipes, walls, fixtures)
 * - Pin and connection creation
 * - View controls (zoom, grid, layers)
 * - Undo/redo
 * 
 * @module components/vision/CanvasToolbar
 */

import { useState, memo, useCallback, useEffect } from 'react';
import { 
  MousePointer2, Hand, Pencil, Circle, Square,
  ArrowRight, Type, Trash2, ZoomIn, ZoomOut, 
  Maximize2, Grid3X3, Layers, Pin, Link2,
  Eye, Undo, Redo, Plus, Download, Save,
  Ruler, Minus, BoxSelect, Droplet,
  ChevronDown, Palette, BrainCircuit, X, Sparkles
} from 'lucide-react';
import { colors, shadows } from '../../styles/tokens';
import { visionApi } from '../../api/vision';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const TOOLS = [
  { id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { id: 'pan', icon: Hand, label: 'Pan', shortcut: 'H' },
  { type: 'separator' },
  { id: 'pin', icon: Pin, label: 'Pin Finding', shortcut: 'P' },
  { id: 'connect', icon: Link2, label: 'Connect', shortcut: 'C' },
  { type: 'separator' },
  { id: 'draw_pipe', icon: Minus, label: 'Draw Pipe', shortcut: '1', group: 'drawing' },
  { id: 'draw_wall', icon: BoxSelect, label: 'Draw Wall', shortcut: '2', group: 'drawing' },
  { id: 'draw_fixture', icon: Droplet, label: 'Mark Fixture', shortcut: '3', group: 'drawing' },
  { type: 'separator' },
  { id: 'measure', icon: Ruler, label: 'Measure', shortcut: 'M' },
  { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
];

// User-selectable drawing colors (functional, not design tokens)
const DRAWING_COLORS = [
  { name: 'Red', value: '#FF6B6B', category: 'alerts' },
  { name: 'Orange', value: '#FF9F43', category: 'alerts' },
  { name: 'Yellow', value: '#Feca57', category: 'alerts' },
  { name: 'Green', value: '#1DD1A1', category: 'safe' },
  { name: 'Blue', value: '#54A0FF', category: 'info' },
  { name: 'Purple', value: '#5F27CD', category: 'info' },
  { name: 'Pink', value: '#FF9FF3', category: 'special' },
  { name: 'Gray', value: '#8395A7', category: 'neutral' },
  { name: 'Black', value: '#2C3E50', category: 'neutral' },
  { name: 'White', value: '#FFFFFF', category: 'neutral' },
];

const LINE_WIDTHS = [1, 2, 3, 5, 8];

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Tool button component
 * @param {{ tool: any; isActive: boolean; onClick: () => void }} props
 */
const ToolButton = memo(function ToolButton({ tool, isActive, onClick }) {
  const Icon = tool.icon;

  const handleClick = useCallback(() => {
    onClick(tool.id);
  }, [tool.id, onClick]);

  return (
    <button
      onClick={handleClick}
      title={`${tool.label} (${tool.shortcut})`}
      className="relative p-2 rounded-lg transition-all"
      style={{
        backgroundColor: isActive ? colors.accent.muted : 'transparent',
        color: isActive ? colors.accent.DEFAULT : colors.text.muted,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = colors.surface.elevated;
          e.currentTarget.style.color = colors.text.secondary;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = colors.text.muted;
        }
      }}
    >
      <Icon style={{ width: '16px', height: '16px' }} />
      {isActive && (
        <div 
          className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
          style={{ backgroundColor: colors.accent.DEFAULT }}
        />
      )}
    </button>
  );
});

ToolButton.displayName = 'ToolButton';

/**
 * Separator between tool groups
 */
const Separator = memo(function Separator() {
  return (
    <div 
      className="w-px h-6 mx-1"
      style={{ backgroundColor: colors.border.default }}
    />
  );
});

Separator.displayName = 'Separator';

/**
 * Color picker dropdown
 * @param {{ drawingColor: string; setDrawingColor: (c: string) => void }} props
 */
const ColorPicker = memo(function ColorPicker({ drawingColor, setDrawingColor }) {
  const [showPicker, setShowPicker] = useState(false);

  const handleColorSelect = useCallback((color) => {
    setDrawingColor(color.value);
    setShowPicker(false);
  }, [setDrawingColor]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors"
        style={{ color: colors.text.secondary }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surface.elevated}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <div 
          className="w-4 h-4 rounded"
          style={{ 
            backgroundColor: drawingColor,
            border: `1px solid ${colors.border.default}`,
          }}
        />
        <ChevronDown style={{ width: '12px', height: '12px' }} />
      </button>

      {showPicker && (
        <div 
          className="absolute top-full left-0 mt-1 p-2 rounded-xl z-50 grid grid-cols-5 gap-1"
          style={{ 
            backgroundColor: colors.surface.card,
            border: `1px solid ${colors.border.default}`,
            boxShadow: shadows.cardHover,
          }}
        >
          {DRAWING_COLORS.map(color => (
            <button
              key={color.value}
              onClick={() => handleColorSelect(color)}
              className="w-6 h-6 rounded transition-all"
              style={{ 
                backgroundColor: color.value,
                border: `2px solid ${drawingColor === color.value ? colors.text.primary : 'transparent'}`,
                transform: drawingColor === color.value ? 'scale(1.1)' : 'scale(1)',
              }}
              title={color.name}
            />
          ))}
        </div>
      )}
    </div>
  );
});

ColorPicker.displayName = 'ColorPicker';

/**
 * Line width picker dropdown
 * @param {{ drawingWidth: number; setDrawingWidth: (w: number) => void }} props
 */
const WidthPicker = memo(function WidthPicker({ drawingWidth, setDrawingWidth }) {
  const [showPicker, setShowPicker] = useState(false);

  const handleWidthSelect = useCallback((width) => {
    setDrawingWidth(width);
    setShowPicker(false);
  }, [setDrawingWidth]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors"
        style={{ color: colors.text.secondary }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surface.elevated}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <div 
          className="w-4 rounded-full"
          style={{ 
            height: `${Math.min(drawingWidth * 2, 12)}px`,
            backgroundColor: colors.text.secondary,
          }}
        />
        <ChevronDown style={{ width: '12px', height: '12px' }} />
      </button>

      {showPicker && (
        <div 
          className="absolute top-full left-0 mt-1 p-2 rounded-xl z-50 flex flex-col gap-2"
          style={{ 
            backgroundColor: colors.surface.card,
            border: `1px solid ${colors.border.default}`,
            boxShadow: shadows.cardHover,
          }}
        >
          {LINE_WIDTHS.map(width => (
            <button
              key={width}
              onClick={() => handleWidthSelect(width)}
              className="flex items-center gap-2 px-2 py-1 rounded transition-colors"
              style={{ 
                backgroundColor: drawingWidth === width ? colors.accent.muted : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (drawingWidth !== width) {
                  e.currentTarget.style.backgroundColor = colors.surface.elevated;
                }
              }}
              onMouseLeave={(e) => {
                if (drawingWidth !== width) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div 
                className="w-6 rounded-full"
                style={{ 
                  height: `${Math.min(width * 2, 12)}px`,
                  backgroundColor: colors.text.secondary,
                }}
              />
              <span style={{ color: colors.text.secondary, fontSize: '12px' }}>{width}px</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

WidthPicker.displayName = 'WidthPicker';

/**
 * Icon button with hover state
 * @param {{ icon: any; onClick: () => void; disabled?: boolean; title?: string; isActive?: boolean }} props
 */
const IconButton = memo(function IconButton({ 
  icon: Icon, 
  onClick, 
  disabled = false, 
  title,
  isActive = false,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="p-2 rounded-lg transition-all disabled:cursor-not-allowed"
      style={{
        backgroundColor: isActive ? colors.accent.muted : 'transparent',
        color: isActive ? colors.accent.DEFAULT : colors.text.muted,
        opacity: disabled ? 0.3 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isActive) {
          e.currentTarget.style.backgroundColor = colors.surface.elevated;
          e.currentTarget.style.color = colors.text.secondary;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = colors.text.muted;
        }
      }}
    >
      <Icon style={{ width: '16px', height: '16px' }} />
    </button>
  );
});

IconButton.displayName = 'IconButton';

/**
 * Toggle button with active state
 * @param {{ icon: any; isActive: boolean; onClick: () => void; title?: string }} props
 */
const ToggleButton = memo(function ToggleButton({ 
  icon: Icon, 
  isActive, 
  onClick, 
  title,
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-2 rounded-lg transition-all"
      style={{
        backgroundColor: isActive ? colors.accent.muted : 'transparent',
        color: isActive ? colors.accent.DEFAULT : colors.text.muted,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = colors.surface.elevated;
          e.currentTarget.style.color = colors.text.secondary;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = colors.text.muted;
        }
      }}
    >
      <Icon style={{ width: '16px', height: '16px' }} />
    </button>
  );
});

ToggleButton.displayName = 'ToggleButton';

/**
 * AnalyzeMenu - Dropdown for AI analysis options
 */
const AnalyzeMenu = memo(function AnalyzeMenu({ onAnalyze, isAnalyzing }) {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      visionApi.getModels()
        .then(res => setModels(res.models || []))
        .catch(err => console.error('Failed to fetch models:', err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  const handleStartAnalysis = (modelId) => {
    onAnalyze(modelId, 'global');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isAnalyzing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{
          backgroundColor: colors.accent.DEFAULT,
          color: colors.text.inverse,
          opacity: isAnalyzing ? 0.7 : 1,
        }}
      >
        {isAnalyzing ? (
          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <BrainCircuit style={{ width: '14px', height: '14px' }} />
        )}
        {isAnalyzing ? 'Analyzing...' : 'AI Analyze'}
      </button>

      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-1 w-64 p-2 rounded-xl z-50 flex flex-col gap-1 shadow-2xl"
          style={{ 
            backgroundColor: colors.surface.card,
            border: `1px solid ${colors.border.default}`,
            boxShadow: shadows.cardHover,
          }}
        >
          <div className="px-2 py-1.5 flex items-center justify-between border-b border-surface-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-500">
              Select Analysis Model
            </span>
            <button onClick={() => setIsOpen(false)} className="text-surface-500 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-4 text-center text-xs text-surface-500">Loading models...</div>
          ) : models.length === 0 ? (
            <div className="p-4 text-center text-xs text-surface-500">No models available</div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {models.map(model => (
                <button
                  key={model.id}
                  onClick={() => handleStartAnalysis(model.id)}
                  className="w-full flex flex-col gap-0.5 p-2 rounded-lg text-left transition-colors hover:bg-surface-700 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white group-hover:text-accent-default">
                      {model.name}
                    </span>
                    {model.provider === 'ollama' && (
                      <span className="text-[9px] px-1 rounded bg-blue-500/20 text-blue-400 font-mono">
                        LOCAL
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-surface-500 line-clamp-1">
                    {model.provider} • {model.quality}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-1 pt-1 border-t border-surface-700">
            <button 
              onClick={() => handleStartAnalysis('auto')}
              className="w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors hover:bg-surface-700"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent-default" />
              <span className="text-xs font-medium">Auto-select Best</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

AnalyzeMenu.displayName = 'AnalyzeMenu';

/**
 * Action button with text label
 * @param {{ icon: any; label: string; onClick: () => void; variant?: 'default' | 'primary' }} props
 */
const ActionButton = memo(function ActionButton({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = 'default',
}) {
  const isPrimary = variant === 'primary';

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
      style={{
        backgroundColor: isPrimary ? colors.accent.DEFAULT : colors.surface.elevated,
        color: isPrimary ? colors.text.inverse : colors.text.secondary,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isPrimary ? colors.accent.hover : colors.border.default;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isPrimary ? colors.accent.DEFAULT : colors.surface.elevated;
      }}
    >
      <Icon style={{ width: '14px', height: '14px' }} />
      {label}
    </button>
  );
});

ActionButton.displayName = 'ActionButton';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * CanvasToolbar - Toolbar for canvas controls
 * @param {{
 *   mode: string;
 *   setMode: (mode: string) => void;
 *   zoom: number;
 *   onZoomIn: () => void;
 *   onZoomOut: () => void;
 *   onFit: () => void;
 *   showGrid: boolean;
 *   setShowGrid: (show: boolean) => void;
 *   showOcr: boolean;
 *   setShowOcr: (show: boolean) => void;
 *   drawingColor: string;
 *   setDrawingColor: (c: string) => void;
 *   drawingWidth: number;
 *   setDrawingWidth: (w: number) => void;
 *   onUndo: () => void;
 *   onRedo: () => void;
 *   canUndo: boolean;
 *   canRedo: boolean;
 *   onAddBlueprint: () => void;
 *   onExport: () => void;
 *   onSave: () => void;
 *   onClear?: () => void;
 *   onAnalyze: (model: string, type: string) => void;
 *   isAnalyzing: boolean;
 *   onClose?: () => void;
 * }} props
 */
const CanvasToolbar = memo(function CanvasToolbar({
  mode,
  setMode,
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
  showGrid,
  setShowGrid,
  showOcr,
  setShowOcr,
  drawingColor,
  setDrawingColor,
  drawingWidth,
  setDrawingWidth,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onAddBlueprint,
  onExport,
  onSave,
  onClear,
  onAnalyze,
  isAnalyzing,
  onClose,
}) {
  const isDrawingMode = ['draw_pipe', 'draw_wall', 'draw_fixture'].includes(mode);

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
  }, [setMode]);

  return (
    <div 
      className="flex items-center gap-1 px-3 py-2 z-10"
      style={{ 
        backgroundColor: `${colors.surface.card}E6`, // 90% opacity
        backdropFilter: 'blur(4px)',
        borderBottom: `1px solid ${colors.border.default}`,
      }}
    >
      {/* Tool buttons */}
      <div className="flex items-center gap-0.5">
        {TOOLS.map((tool, i) => {
          if (tool.type === 'separator') {
            return <Separator key={i} />;
          }

          return (
            <ToolButton
              key={tool.id}
              tool={tool}
              isActive={mode === tool.id}
              onClick={handleModeChange}
            />
          );
        })}
      </div>

      <Separator />

      {/* Drawing options (when in drawing mode) */}
      {isDrawingMode && (
        <>
          <ColorPicker 
            drawingColor={drawingColor} 
            setDrawingColor={setDrawingColor} 
          />
          <WidthPicker 
            drawingWidth={drawingWidth} 
            setDrawingWidth={setDrawingWidth} 
          />
          <Separator />
        </>
      )}

      <div className="flex-1" />

      {/* View controls */}
      <div className="flex items-center gap-0.5">
        <IconButton
          icon={Undo}
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        />
        <IconButton
          icon={Redo}
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        />

        {onClear && (
          <IconButton
            icon={Trash2}
            onClick={onClear}
            title="Clear Canvas"
          />
        )}

        <Separator />

        <IconButton
          icon={ZoomOut}
          onClick={onZoomOut}
          title="Zoom out"
        />
        <span 
          className="text-xs font-mono min-w-[50px] text-center"
          style={{ color: colors.text.secondary }}
        >
          {(zoom * 100).toFixed(0)}%
        </span>
        <IconButton
          icon={ZoomIn}
          onClick={onZoomIn}
          title="Zoom in"
        />
        <IconButton
          icon={Maximize2}
          onClick={onFit}
          title="Fit to screen"
        />

        <Separator />

        <ToggleButton
          icon={Grid3X3}
          isActive={showGrid}
          onClick={() => setShowGrid(!showGrid)}
          title="Toggle grid"
        />
        <ToggleButton
          icon={Eye}
          isActive={showOcr}
          onClick={() => setShowOcr(!showOcr)}
          title="Toggle OCR overlay"
        />
      </div>

      <Separator />

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        <AnalyzeMenu onAnalyze={onAnalyze} isAnalyzing={isAnalyzing} />
        
        <Separator />

        <ActionButton
          icon={Plus}
          label="Add Blueprint"
          onClick={onAddBlueprint}
        />
        <ActionButton
          icon={Save}
          label="Save"
          onClick={onSave}
        />
        <ActionButton
          icon={Download}
          label="Export"
          onClick={onExport}
          variant="primary"
        />

        {onClose && (
          <>
            <Separator />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 text-surface-500 hover:text-red-500"
              title="Close Canvas"
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>
          </>
        )}
      </div>
    </div>
  );
});

CanvasToolbar.displayName = 'CanvasToolbar';

export default CanvasToolbar;
