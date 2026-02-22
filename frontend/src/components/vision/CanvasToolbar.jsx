import { useState } from 'react';
import { 
  MousePointer2, Hand, Pencil, Circle, Square,
  ArrowRight, Type, Trash2, ZoomIn, ZoomOut, 
  Maximize2, Grid3X3, Layers, Pin, Link2,
  Eye, Undo, Redo, Plus, Download, Save,
  Ruler, Minus, BoxSelect, Droplet,
  ChevronDown, Palette
} from 'lucide-react';

/**
 * CanvasToolbar - Toolbar for Vision Canvas controls
 * 
 * Provides tools for:
 * - Selection and navigation
 * - Drawing (pipes, walls, fixtures)
 * - Pin and connection creation
 * - View controls (zoom, grid, layers)
 * - Undo/redo
 */

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

const COLORS = [
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

export default function CanvasToolbar({
  mode,
  setMode,
  modes,
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
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showWidthPicker, setShowWidthPicker] = useState(false);

  const isDrawingMode = ['draw_pipe', 'draw_wall', 'draw_fixture'].includes(mode);

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-surface-200 dark:border-surface-700
                    bg-white/90 dark:bg-surface-900/90 backdrop-blur-sm z-10">
      
      {/* Tool buttons */}
      <div className="flex items-center gap-0.5">
        {TOOLS.map((tool, i) => {
          if (tool.type === 'separator') {
            return <div key={i} className="w-px h-6 bg-surface-200 dark:bg-surface-700 mx-1" />;
          }

          const isActive = mode === tool.id;
          const Icon = tool.icon;

          return (
            <button
              key={tool.id}
              onClick={() => setMode(tool.id)}
              title={`${tool.label} (${tool.shortcut})`}
              className={`
                relative p-2 rounded-lg transition-all
                ${isActive 
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' 
                  : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-700 dark:hover:text-surface-200'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {isActive && (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className="w-px h-6 bg-surface-200 dark:bg-surface-700 mx-1" />

      {/* Drawing options (when in drawing mode) */}
      {isDrawingMode && (
        <>
          {/* Color picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg 
                         text-surface-600 dark:text-surface-300
                         hover:bg-surface-100 dark:hover:bg-surface-800"
            >
              <div 
                className="w-4 h-4 rounded border border-surface-300"
                style={{ backgroundColor: drawingColor }}
              />
              <ChevronDown className="w-3 h-3" />
            </button>

            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 rounded-xl 
                              bg-white dark:bg-surface-800 shadow-xl border border-surface-200 dark:border-surface-700
                              z-50 grid grid-cols-5 gap-1">
                {COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => {
                      setDrawingColor(color.value);
                      setShowColorPicker(false);
                    }}
                    className={`w-6 h-6 rounded border-2 transition-all
                              ${drawingColor === color.value 
                                ? 'border-surface-900 dark:border-white scale-110' 
                                : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Line width picker */}
          <div className="relative">
            <button
              onClick={() => setShowWidthPicker(!showWidthPicker)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg 
                         text-surface-600 dark:text-surface-300
                         hover:bg-surface-100 dark:hover:bg-surface-800"
            >
              <div 
                className="w-4 bg-surface-600 rounded-full"
                style={{ height: `${Math.min(drawingWidth * 2, 12)}px` }}
              />
              <ChevronDown className="w-3 h-3" />
            </button>

            {showWidthPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 rounded-xl 
                              bg-white dark:bg-surface-800 shadow-xl border border-surface-200 dark:border-surface-700
                              z-50 flex flex-col gap-2">
                {LINE_WIDTHS.map(width => (
                  <button
                    key={width}
                    onClick={() => {
                      setDrawingWidth(width);
                      setShowWidthPicker(false);
                    }}
                    className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-surface-100 dark:hover:bg-surface-700
                              ${drawingWidth === width ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                  >
                    <div 
                      className="w-6 bg-surface-600 rounded-full"
                      style={{ height: `${Math.min(width * 2, 12)}px` }}
                    />
                    <span className="text-xs text-surface-600 dark:text-surface-400">{width}px</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-surface-200 dark:bg-surface-700 mx-1" />
        </>
      )}

      <div className="flex-1" />

      {/* View controls */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-lg text-surface-500 dark:text-surface-400
                     hover:bg-surface-100 dark:hover:bg-surface-800
                     disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-lg text-surface-500 dark:text-surface-400
                     hover:bg-surface-100 dark:hover:bg-surface-800
                     disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-surface-200 dark:bg-surface-700 mx-1" />

        <button
          onClick={onZoomOut}
          className="p-2 rounded-lg text-surface-500 dark:text-surface-400
                     hover:bg-surface-100 dark:hover:bg-surface-800"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono text-surface-600 dark:text-surface-400 min-w-[50px] text-center">
          {(zoom * 100).toFixed(0)}%
        </span>
        <button
          onClick={onZoomIn}
          className="p-2 rounded-lg text-surface-500 dark:text-surface-400
                     hover:bg-surface-100 dark:hover:bg-surface-800"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={onFit}
          className="p-2 rounded-lg text-surface-500 dark:text-surface-400
                     hover:bg-surface-100 dark:hover:bg-surface-800"
          title="Fit to screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-surface-200 dark:bg-surface-700 mx-1" />

        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-2 rounded-lg transition-colors
                     ${showGrid 
                       ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' 
                       : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'}`}
          title="Toggle grid"
        >
          <Grid3X3 className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowOcr(!showOcr)}
          className={`p-2 rounded-lg transition-colors
                     ${showOcr 
                       ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' 
                       : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'}`}
          title="Toggle OCR overlay"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-surface-200 dark:bg-surface-700 mx-1" />

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={onAddBlueprint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                     bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300
                     hover:bg-surface-200 dark:hover:bg-surface-700
                     text-xs font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Blueprint
        </button>

        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                     bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300
                     hover:bg-surface-200 dark:hover:bg-surface-700
                     text-xs font-medium"
        >
          <Save className="w-3.5 h-3.5" />
          Save
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                     bg-primary-600 text-white
                     hover:bg-primary-700
                     text-xs font-medium"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>
    </div>
  );
}
