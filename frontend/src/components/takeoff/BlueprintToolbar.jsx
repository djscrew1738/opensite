/**
 * BlueprintToolbar Component
 * Toolbar for blueprint measurement tools
 * 
 * @module components/takeoff/BlueprintToolbar
 */

import React, { memo, useCallback, useState } from 'react';
import {
  ZoomIn, ZoomOut, Maximize, Move, Ruler, Square, Hash, MousePointer,
  Undo2, Redo2, Trash2, RotateCcw, Grid3X3, Circle, RectangleHorizontal,
  Type, Download, Copy, Crosshair, Magnet
} from 'lucide-react';
import { TOOL_TYPES, COLORS } from './canvasUtils';
import { colors } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Tool button component
 */
const ToolButton = memo(function ToolButton({ btn, isActive, onClick }) {
  const Icon = btn.icon;
  const typeColor = COLORS[btn.id];

  const handleClick = useCallback(() => {
    onClick(btn.id);
  }, [btn.id, onClick]);

  return (
    <button
      onClick={handleClick}
      className="p-1.5 rounded transition-all"
      style={{
        backgroundColor: isActive ? `${colors.accent.DEFAULT}20` : 'transparent',
        color: isActive ? colors.accent.DEFAULT : colors.text.muted,
        boxShadow: isActive ? `0 0 0 1px ${colors.accent.DEFAULT}66` : 'none',
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
      title={btn.label}
      aria-label={btn.label}
      aria-pressed={isActive}
    >
      <Icon 
        className="w-4 h-4" 
        style={isActive && typeColor ? { color: typeColor } : undefined} 
      />
    </button>
  );
});

ToolButton.displayName = 'ToolButton';

/**
 * Separator between button groups
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
 * Icon button with tooltip
 */
const IconButton = memo(function IconButton({ 
  icon: Icon, 
  onClick, 
  disabled, 
  title, 
  isActive,
  activeColor,
  danger,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const getBackgroundColor = () => {
    if (disabled) return 'transparent';
    if (isActive) return isHovered ? colors.surface.elevated : `${activeColor}20`;
    return isHovered ? colors.surface.elevated : 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return colors.text.muted;
    if (isActive) return activeColor;
    if (isHovered && danger) return colors.danger.DEFAULT;
    return colors.text.muted;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-1.5 rounded transition-all disabled:cursor-not-allowed"
      style={{
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
        opacity: disabled ? 0.25 : 1,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={title}
      aria-label={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
});

IconButton.displayName = 'IconButton';

/**
 * Zoom display showing current zoom percentage
 */
const ZoomDisplay = memo(function ZoomDisplay({ zoom }) {
  return (
    <span 
      className="text-[11px] w-10 text-center font-mono tabular-nums select-none"
      style={{ color: colors.text.muted }}
    >
      {Math.round(zoom * 100)}%
    </span>
  );
});

ZoomDisplay.displayName = 'ZoomDisplay';

/**
 * Calibration button
 */
const CalibrationButton = memo(function CalibrationButton({ calibrating, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 text-[11px] font-medium rounded transition-colors"
      style={{
        backgroundColor: calibrating ? `${colors.accent.purple}20` : 'transparent',
        color: calibrating ? colors.accent.purple : colors.text.secondary,
        boxShadow: calibrating ? `0 0 0 1px ${colors.accent.purple}66` : 'none',
      }}
      onMouseEnter={(e) => {
        if (!calibrating) {
          e.currentTarget.style.backgroundColor = colors.surface.elevated;
        }
      }}
      onMouseLeave={(e) => {
        if (!calibrating) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {calibrating ? 'Click 2 pts...' : 'Set Scale'}
    </button>
  );
});

CalibrationButton.displayName = 'CalibrationButton';

/**
 * Measurement counter showing count by type
 */
const MeasurementCounter = memo(function MeasurementCounter({ measurements }) {
  if (measurements.length === 0) return null;

  const counts = measurements.reduce((acc, m) => {
    acc[m.type] = (acc[m.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div 
      className="ml-auto flex items-center gap-2 text-[11px]"
      style={{ color: colors.text.muted }}
    >
      <div className="flex items-center gap-1.5">
        {Object.entries(counts).map(([type, count]) => (
          <span key={type} className="flex items-center gap-0.5">
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: COLORS[type] || '#666' }} 
            />
            <span>{count}</span>
          </span>
        ))}
      </div>
    </div>
  );
});

MeasurementCounter.displayName = 'MeasurementCounter';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * BlueprintToolbar - Toolbar for blueprint measurement canvas
 * 
 * @param {{
 *   tool: string,
 *   onToolChange: (tool: string) => void,
 *   zoom: number,
 *   onZoomIn: () => void,
 *   onZoomOut: () => void,
 *   onFitToScreen: () => void,
 *   showGrid: boolean,
 *   onToggleGrid: () => void,
 *   snapEnabled: boolean,
 *   onToggleSnap: () => void,
 *   crosshairEnabled: boolean,
 *   onToggleCrosshair: () => void,
 *   onUndo: () => void,
 *   onRedo: () => void,
 *   canUndo: boolean,
 *   canRedo: boolean,
 *   selectedId: string | null,
 *   onDuplicate: () => void,
 *   onDelete: () => void,
 *   onClearAll: () => void,
 *   calibrating: boolean,
 *   onStartCalibration: () => void,
 *   scale?: { pixelsPerUnit: number, unit: string },
 *   onExport: () => void,
 *   hasImage: boolean,
 *   measurements: Array<any>,
 * }} props
 */
const BlueprintToolbar = memo(function BlueprintToolbar({
  tool,
  onToolChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  showGrid,
  onToggleGrid,
  snapEnabled,
  onToggleSnap,
  crosshairEnabled,
  onToggleCrosshair,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  selectedId,
  onDuplicate,
  onDelete,
  onClearAll,
  calibrating,
  onStartCalibration,
  scale,
  onExport,
  hasImage,
  measurements,
}) {
  const handleToolChange = useCallback((newTool) => {
    onToolChange(newTool);
  }, [onToolChange]);

  return (
    <div 
      className="flex items-center gap-0.5 px-2 py-1.5 flex-wrap"
      style={{ 
        backgroundColor: colors.surface.card,
        borderBottom: `1px solid ${colors.border.default}`,
      }}
    >
      {/* Tool buttons */}
      <div className="flex items-center gap-0.5">
        {TOOL_BUTTONS.map((btn) => {
          if (btn.separator) {
            return <Separator key={btn.id} />;
          }
          return (
            <ToolButton
              key={btn.id}
              btn={btn}
              isActive={tool === btn.id}
              onClick={handleToolChange}
            />
          );
        })}
      </div>

      <Separator />

      {/* Zoom controls */}
      <div className="flex items-center gap-0.5">
        <IconButton
          icon={ZoomIn}
          onClick={onZoomIn}
          title="Zoom In (+)"
        />
        <IconButton
          icon={ZoomOut}
          onClick={onZoomOut}
          title="Zoom Out (-)"
        />
        <ZoomDisplay zoom={zoom} />
        <IconButton
          icon={Maximize}
          onClick={onFitToScreen}
          title="Fit to Screen"
        />
      </div>

      <Separator />

      {/* Undo/Redo/Delete */}
      <div className="flex items-center gap-0.5">
        <IconButton
          icon={Undo2}
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        />
        <IconButton
          icon={Redo2}
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        />
        <IconButton
          icon={Copy}
          onClick={onDuplicate}
          disabled={!selectedId}
          title="Duplicate (Ctrl+D)"
        />
        <IconButton
          icon={Trash2}
          onClick={onDelete}
          disabled={!selectedId}
          title="Delete (Del)"
          danger
        />
        <IconButton
          icon={RotateCcw}
          onClick={onClearAll}
          title="Clear All"
          danger
        />
      </div>

      <Separator />

      {/* Toggles */}
      <div className="flex items-center gap-0.5">
        <IconButton
          icon={Grid3X3}
          onClick={onToggleGrid}
          isActive={showGrid}
          activeColor={colors.text.secondary}
          title="Toggle Grid (G)"
        />
        <IconButton
          icon={Magnet}
          onClick={onToggleSnap}
          isActive={snapEnabled}
          activeColor={colors.accent.pink}
          title="Snap to Points (S)"
        />
        <IconButton
          icon={Crosshair}
          onClick={onToggleCrosshair}
          isActive={crosshairEnabled}
          activeColor={colors.text.secondary}
          title="Crosshair Guide (X)"
        />
      </div>

      <Separator />

      {/* Scale and Export */}
      <div className="flex items-center gap-1">
        <CalibrationButton
          calibrating={calibrating}
          onClick={onStartCalibration}
        />
        {scale && scale.pixelsPerUnit && (
          <span 
            className="text-[11px] tabular-nums"
            style={{ color: colors.text.muted }}
          >
            1{scale.unit}={Math.round(scale.pixelsPerUnit)}px
          </span>
        )}
        <IconButton
          icon={Download}
          onClick={onExport}
          disabled={!hasImage}
          title="Export as PNG"
        />
      </div>

      {/* Measurement counter */}
      <MeasurementCounter measurements={measurements} />
    </div>
  );
});

BlueprintToolbar.displayName = 'BlueprintToolbar';

export default BlueprintToolbar;
