import { memo } from 'react';
import {
  ZoomIn, ZoomOut, Maximize, Move, Ruler, Square, Hash, MousePointer,
  Undo2, Redo2, Trash2, RotateCcw, Grid3X3, Circle, RectangleHorizontal,
  Type, Download, Copy, Crosshair, Magnet
} from 'lucide-react';
import { TOOL_TYPES, COLORS } from './canvasUtils';

// ---------------------------------------------------------------------------
// Toolbar button configuration
// ---------------------------------------------------------------------------

const TOOL_BUTTONS = [
  { id: TOOL_TYPES.SELECT, icon: MousePointer, label: 'Select (V)', section: 'tools' },
  { id: TOOL_TYPES.PAN, icon: Move, label: 'Pan (H)', section: 'tools' },
  { id: 'sep1', separator: true },
  { id: TOOL_TYPES.LENGTH, icon: Ruler, label: 'Length (L)', section: 'measure' },
  { id: TOOL_TYPES.AREA, icon: Square, label: 'Area Polygon (A)', section: 'measure' },
  { id: TOOL_TYPES.RECTANGLE, icon: RectangleHorizontal, label: 'Rectangle (R)', section: 'measure' },
  { id: TOOL_TYPES.CIRCLE, icon: Circle, label: 'Circle (O)', section: 'measure' },
  { id: TOOL_TYPES.COUNT, icon: Hash, label: 'Count (C)', section: 'measure' },
  { id: 'sep2', separator: true },
  { id: TOOL_TYPES.ANNOTATION, icon: Type, label: 'Annotation (T)', section: 'annotate' },
];

// ---------------------------------------------------------------------------
// BlueprintToolbar
// ---------------------------------------------------------------------------

function BlueprintToolbar({
  // Tool state
  tool,
  onToolChange,
  // Zoom
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  // Toggles
  showGrid,
  onToggleGrid,
  snapEnabled,
  onToggleSnap,
  crosshairEnabled,
  onToggleCrosshair,
  // History
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  // Selection actions
  selectedId,
  onDuplicate,
  onDelete,
  onClearAll,
  // Calibration
  calibrating,
  onStartCalibration,
  scale,
  // Export
  onExport,
  hasImage,
  // Measurements (for counter)
  measurements,
}) {
  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 bg-white border-b border-gray-200 flex-wrap">
      {/* Tool buttons */}
      <div className="flex items-center gap-0.5">
        {TOOL_BUTTONS.map(btn => {
          if (btn.separator) {
            return <div key={btn.id} className="w-px h-6 bg-gray-200 mx-1" />;
          }
          const Icon = btn.icon;
          const isActive = tool === btn.id;
          const typeColor = COLORS[btn.id];
          return (
            <button
              key={btn.id}
              onClick={() => onToolChange(btn.id)}
              className={`p-1.5 rounded transition-all ${
                isActive
                  ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
              title={btn.label}
            >
              <Icon className="w-4 h-4" style={isActive && typeColor ? { color: typeColor } : undefined} />
            </button>
          );
        })}
      </div>

      <div className="w-px h-6 bg-gray-200 mx-1.5" />

      {/* Zoom controls */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onZoomIn}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-[11px] text-gray-500 w-10 text-center font-mono tabular-nums select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={onFitToScreen}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
          title="Fit to Screen"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-gray-200 mx-1.5" />

      {/* Undo/Redo/Delete */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-25 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-25 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDuplicate}
          disabled={!selectedId}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-25 disabled:cursor-not-allowed"
          title="Duplicate (Ctrl+D)"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          disabled={!selectedId}
          className="p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded disabled:opacity-25 disabled:cursor-not-allowed"
          title="Delete (Del)"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          onClick={onClearAll}
          className="p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded"
          title="Clear All"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-gray-200 mx-1.5" />

      {/* Toggles */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onToggleGrid}
          className={`p-1.5 rounded transition-colors ${
            showGrid ? 'bg-gray-200 text-gray-700' : 'text-gray-500 hover:bg-gray-100'
          }`}
          title="Toggle Grid (G)"
        >
          <Grid3X3 className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleSnap}
          className={`p-1.5 rounded transition-colors ${
            snapEnabled ? 'bg-pink-100 text-pink-700' : 'text-gray-500 hover:bg-gray-100'
          }`}
          title="Snap to Points (S)"
        >
          <Magnet className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleCrosshair}
          className={`p-1.5 rounded transition-colors ${
            crosshairEnabled ? 'bg-gray-200 text-gray-700' : 'text-gray-500 hover:bg-gray-100'
          }`}
          title="Crosshair Guide (X)"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-gray-200 mx-1.5" />

      {/* Scale and Export */}
      <div className="flex items-center gap-1">
        <button
          onClick={onStartCalibration}
          className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
            calibrating
              ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-300'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {calibrating ? 'Click 2 pts...' : 'Set Scale'}
        </button>
        {scale && scale.pixelsPerUnit && (
          <span className="text-[11px] text-gray-500 tabular-nums">
            1{scale.unit}={Math.round(scale.pixelsPerUnit)}px
          </span>
        )}
        <button
          onClick={onExport}
          disabled={!hasImage}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-25 disabled:cursor-not-allowed"
          title="Export as PNG"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Measurement counter */}
      <div className="ml-auto flex items-center gap-2 text-[11px] text-gray-500">
        {measurements.length > 0 && (
          <div className="flex items-center gap-1.5">
            {Object.entries(
              measurements.reduce((acc, m) => { acc[m.type] = (acc[m.type] || 0) + 1; return acc; }, {})
            ).map(([type, count]) => (
              <span key={type} className="flex items-center gap-0.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[type] || '#666' }} />
                <span>{count}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(BlueprintToolbar);
