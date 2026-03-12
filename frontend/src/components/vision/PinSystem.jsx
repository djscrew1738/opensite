/**
 * PinSystem Component
 * Manages pins and findings on the canvas
 * 
 * Features:
 * - Visual pin markers on nodes
 * - Pin details panel
 * - Connection management
 * - Different pin types and colors
 * 
 * @module components/vision/PinSystem
 */

import { useState, memo, useCallback } from 'react';
import { 
  Pin, X, MessageSquare, Link2, Trash2, Edit2, 
  Check, ChevronRight, Clock, AlertCircle, Info,
  Circle, Square, Triangle, Star, Flag
} from 'lucide-react';
import { colors, shadows } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const PIN_ICONS = {
  circle: Circle,
  square: Square,
  triangle: Triangle,
  star: Star,
  flag: Flag,
  pin: Pin,
};

// User-selectable pin colors (functional, not design tokens)
const PIN_COLORS = [
  { name: 'Red', value: '#EF4444', meaning: 'Critical issue' },
  { name: 'Orange', value: '#F97316', meaning: 'Warning' },
  { name: 'Yellow', value: '#EAB308', meaning: 'Note' },
  { name: 'Green', value: '#22C55E', meaning: 'Approved' },
  { name: 'Blue', value: '#3B82F6', meaning: 'Info' },
  { name: 'Purple', value: '#8B5CF6', meaning: 'Question' },
];

// Default pin color
const DEFAULT_PIN_COLOR = '#3B82F6';

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Pin marker on canvas
 * @param {{ pin: any; node: any; viewBox: any; isSelected: boolean; onSelect: () => void }} props
 */
const PinMarker = memo(function PinMarker({ 
  pin, 
  node, 
  viewBox, 
  isSelected, 
  onSelect,
}) {
  const screenX = (node.x + pin.x * node.scale) * viewBox.zoom;
  const screenY = (node.y + pin.y * node.scale) * viewBox.zoom - 8; // Offset for pin tip
  
  const Icon = PIN_ICONS[pin.icon] || Pin;
  const pinColor = pin.color || DEFAULT_PIN_COLOR;

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-full z-20"
      style={{
        left: screenX,
        top: screenY,
      }}
    >
      {/* Pin marker */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        className={`relative group transition-transform hover:scale-110 ${isSelected ? 'scale-125' : ''}`}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-all"
          style={{ 
            backgroundColor: pinColor,
            border: `2px solid ${isSelected ? colors.text.primary : colors.text.inverse}`,
          }}
        >
          <Icon style={{ width: '12px', height: '12px', color: colors.text.inverse }} />
        </div>

        {/* Pulse effect for new pins */}
        {pin.isNew && (
          <span 
            className="absolute inset-0 rounded-full animate-ping opacity-75"
            style={{ backgroundColor: pinColor }} 
          />
        )}
      </button>

      {/* Pin tooltip */}
      <div 
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
                    px-2 py-1 rounded-lg text-xs whitespace-nowrap pointer-events-none
                    transition-opacity ${isSelected ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
          color: colors.text.primary,
        }}
      >
        {pin.label || 'Untitled pin'}
        <div 
          className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
          style={{ borderTopColor: 'rgba(0, 0, 0, 0.8)' }}
        />
      </div>
    </div>
  );
});

PinMarker.displayName = 'PinMarker';

/**
 * Pin list item in the panel
 * @param {{ pin: any; isSelected: boolean; onSelect: () => void }} props
 */
const PinListItem = memo(function PinListItem({ pin, isSelected, onSelect }) {
  const Icon = PIN_ICONS[pin.icon] || Pin;
  const pinColor = pin.color || DEFAULT_PIN_COLOR;

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-start gap-2 p-2 rounded-lg text-left transition-colors text-xs"
      style={{ 
        backgroundColor: isSelected ? colors.accent.muted : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = colors.surface.elevated;
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: pinColor }}
      >
        <Icon style={{ width: '10px', height: '10px', color: colors.text.inverse }} />
      </div>
      <div className="flex-1 min-w-0">
        <p 
          className="font-medium truncate"
          style={{ color: isSelected ? colors.accent.DEFAULT : colors.text.secondary }}
        >
          {pin.label || 'Untitled'}
        </p>
        {pin.description && (
          <p className="text-xs line-clamp-2 mt-0.5" style={{ color: colors.text.muted }}>
            {pin.description}
          </p>
        )}
      </div>
    </button>
  );
});

PinListItem.displayName = 'PinListItem';

/**
 * Color option for pin editing
 * @param {{ color: any; isSelected: boolean; onSelect: () => void }} props
 */
const ColorOption = memo(function ColorOption({ color, isSelected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className="w-5 h-5 rounded-full transition-all"
      style={{ 
        backgroundColor: color.value,
        border: `2px solid ${isSelected ? colors.text.primary : 'transparent'}`,
        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
      }}
      title={color.meaning}
    />
  );
});

ColorOption.displayName = 'ColorOption';

/**
 * Pin details popup in edit mode
 * @param {{ pin: any; onSave: (data: any) => void; onCancel: () => void }} props
 */
const PinEditMode = memo(function PinEditMode({ pin, onSave, onCancel }) {
  const [editData, setEditData] = useState(pin);

  const handleColorSelect = useCallback((color) => {
    setEditData({ ...editData, color: color.value });
  }, [editData]);

  return (
    <div className="p-3 space-y-3">
      <div>
        <label 
          className="text-xs font-semibold uppercase"
          style={{ color: colors.text.muted }}
        >
          Label
        </label>
        <input
          type="text"
          value={editData.label || ''}
          onChange={(e) => setEditData({ ...editData, label: e.target.value })}
          className="w-full mt-1 px-2 py-1 text-xs rounded"
          style={{ 
            backgroundColor: colors.surface.elevated,
            border: `1px solid ${colors.border.default}`,
            color: colors.text.primary,
          }}
          placeholder="Pin label..."
        />
      </div>
      <div>
        <label 
          className="text-xs font-semibold uppercase"
          style={{ color: colors.text.muted }}
        >
          Description
        </label>
        <textarea
          value={editData.description || ''}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          className="w-full mt-1 px-2 py-1 text-xs rounded resize-none"
          style={{ 
            backgroundColor: colors.surface.elevated,
            border: `1px solid ${colors.border.default}`,
            color: colors.text.primary,
          }}
          rows={3}
          placeholder="Add details..."
        />
      </div>
      <div>
        <label 
          className="text-xs font-semibold uppercase"
          style={{ color: colors.text.muted }}
        >
          Color
        </label>
        <div className="flex gap-1 mt-1 flex-wrap">
          {PIN_COLORS.map(color => (
            <ColorOption
              key={color.value}
              color={color}
              isSelected={editData.color === color.value}
              onSelect={() => handleColorSelect(color)}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onSave(editData)}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors"
          style={{ 
            backgroundColor: colors.accent.DEFAULT,
            color: colors.text.inverse,
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent.hover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent.DEFAULT}
        >
          <Check style={{ width: '12px', height: '12px' }} />
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs rounded-lg transition-colors"
          style={{ color: colors.text.secondary }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surface.elevated}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          Cancel
        </button>
      </div>
    </div>
  );
});

PinEditMode.displayName = 'PinEditMode';

/**
 * Pin details popup in view mode
 * @param {{ pin: any; onClose: () => void; onEdit: () => void; onRemove: () => void }} props
 */
const PinViewMode = memo(function PinViewMode({ pin, onClose, onEdit, onRemove }) {
  const Icon = PIN_ICONS[pin.icon] || Pin;
  const pinColor = pin.color || DEFAULT_PIN_COLOR;

  return (
    <div className="p-3">
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: pinColor }}
        >
          <Icon style={{ width: '16px', height: '16px', color: colors.text.inverse }} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 
            className="font-semibold text-sm"
            style={{ color: colors.text.primary }}
          >
            {pin.label || 'Untitled Pin'}
          </h4>
          <p className="text-xs mt-0.5" style={{ color: colors.text.muted }}>
            {new Date(pin.createdAt).toLocaleString()}
          </p>
        </div>
        <button
          onClick={onClose}
          className="transition-colors"
          style={{ color: colors.text.muted }}
          onMouseEnter={(e) => e.currentTarget.style.color = colors.text.secondary}
          onMouseLeave={(e) => e.currentTarget.style.color = colors.text.muted}
        >
          <X style={{ width: '16px', height: '16px' }} />
        </button>
      </div>

      {pin.description && (
        <p 
          className="mt-3 text-xs leading-relaxed"
          style={{ color: colors.text.secondary }}
        >
          {pin.description}
        </p>
      )}

      <div 
        className="flex items-center gap-1 mt-3 pt-3"
        style={{ borderTop: `1px solid ${colors.border.default}` }}
      >
        <button
          onClick={onEdit}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors"
          style={{ color: colors.text.secondary }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surface.elevated}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Edit2 style={{ width: '12px', height: '12px' }} />
          Edit
        </button>
        <button
          onClick={onRemove}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors"
          style={{ color: colors.danger.DEFAULT }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.danger.muted}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Trash2 style={{ width: '12px', height: '12px' }} />
          Delete
        </button>
      </div>
    </div>
  );
});

PinViewMode.displayName = 'PinViewMode';

/**
 * Pin details popup
 * @param {{ pin: any; onClose: () => void; onUpdate: (id: string, data: any) => void; onRemove: (id: string) => void }} props
 */
const PinDetails = memo(function PinDetails({ pin, onClose, onUpdate, onRemove }) {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = useCallback((data) => {
    onUpdate(pin.id, data);
    setIsEditing(false);
  }, [pin.id, onUpdate]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleRemove = useCallback(() => {
    onRemove(pin.id);
  }, [pin.id, onRemove]);

  return (
    <div 
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 rounded-xl z-50"
      style={{ 
        backgroundColor: colors.surface.card,
        boxShadow: shadows.cardHover,
        border: `1px solid ${colors.border.default}`,
      }}
    >
      {/* Arrow */}
      <div 
        className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent"
        style={{ borderTopColor: colors.surface.card }}
      />

      {isEditing ? (
        <PinEditMode 
          pin={pin} 
          onSave={handleSave} 
          onCancel={handleCancel}
        />
      ) : (
        <PinViewMode 
          pin={pin} 
          onClose={onClose}
          onEdit={() => setIsEditing(true)}
          onRemove={handleRemove}
        />
      )}
    </div>
  );
});

PinDetails.displayName = 'PinDetails';

/**
 * Pins panel header
 * @param {{ count: number; showAll: boolean; onToggle: () => void }} props
 */
const PinsHeader = memo(function PinsHeader({ count, showAll, onToggle }) {
  return (
    <div 
      className="flex items-center justify-between p-3"
      style={{ borderBottom: `1px solid ${colors.border.default}` }}
    >
      <div className="flex items-center gap-2">
        <Pin style={{ width: '16px', height: '16px', color: colors.accent.DEFAULT }} />
        <span className="text-sm font-semibold" style={{ color: colors.text.primary }}>
          Findings
        </span>
        <span className="text-xs" style={{ color: colors.text.muted }}>
          ({count})
        </span>
      </div>
      <button
        onClick={onToggle}
        className="text-xs px-2 py-1 rounded transition-colors"
        style={{ 
          backgroundColor: showAll ? colors.accent.muted : 'transparent',
          color: showAll ? colors.accent.DEFAULT : colors.text.muted,
        }}
        onMouseEnter={(e) => {
          if (!showAll) {
            e.currentTarget.style.backgroundColor = colors.surface.elevated;
          }
        }}
        onMouseLeave={(e) => {
          if (!showAll) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {showAll ? 'Hide' : 'Show'}
      </button>
    </div>
  );
});

PinsHeader.displayName = 'PinsHeader';

/**
 * Empty pins state
 */
const EmptyPinsState = memo(function EmptyPinsState() {
  return (
    <div className="text-center py-8 text-xs" style={{ color: colors.text.muted }}>
      <Pin style={{ width: '32px', height: '32px', margin: '0 auto 8px', opacity: 0.3 }} />
      <p>No pins yet</p>
      <p className="mt-1 opacity-70">Click the pin tool to add findings</p>
    </div>
  );
});

EmptyPinsState.displayName = 'EmptyPinsState';

/**
 * Pin type group in the list
 * @param {{ type: string; pins: any[]; selectedPin: string | null; onSelect: (id: string | null) => void }} props
 */
const PinTypeGroup = memo(function PinTypeGroup({ type, pins, selectedPin, onSelect }) {
  return (
    <div className="mb-3">
      <div 
        className="text-xs font-semibold uppercase tracking-wider px-2 mb-1"
        style={{ color: colors.text.muted }}
      >
        {type}s ({pins.length})
      </div>
      {pins.map(pin => (
        <PinListItem
          key={pin.id}
          pin={pin}
          isSelected={selectedPin === pin.id}
          onSelect={() => onSelect(selectedPin === pin.id ? null : pin.id)}
        />
      ))}
    </div>
  );
});

PinTypeGroup.displayName = 'PinTypeGroup';

/**
 * Legend item
 * @param {{ color: any }} props
 */
const LegendItem = memo(function LegendItem({ color }) {
  return (
    <div className="flex items-center gap-1">
      <div 
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color.value }}
      />
      <span 
        className="text-xs truncate" 
        style={{ color: colors.text.secondary }}
        title={color.meaning}
      >
        {color.name}
      </span>
    </div>
  );
});

LegendItem.displayName = 'LegendItem';

/**
 * Pins legend
 */
const PinsLegend = memo(function PinsLegend() {
  return (
    <div 
      className="p-2"
      style={{ borderTop: `1px solid ${colors.border.default}` }}
    >
      <div 
        className="text-xs font-semibold mb-1"
        style={{ color: colors.text.muted }}
      >
        Legend
      </div>
      <div className="grid grid-cols-3 gap-1">
        {PIN_COLORS.slice(0, 6).map(color => (
          <LegendItem key={color.value} color={color} />
        ))}
      </div>
    </div>
  );
});

PinsLegend.displayName = 'PinsLegend';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * PinSystem - Manages pins and findings on the canvas
 * @param {{
 *   pins: any[];
 *   nodes: any[];
 *   viewBox: { zoom: number };
 *   selectedPin: string | null;
 *   setSelectedPin: (id: string | null) => void;
 *   onUpdatePin: (id: string, data: any) => void;
 *   onRemovePin: (id: string) => void;
 * }} props
 */
const PinSystem = memo(function PinSystem({
  pins,
  nodes,
  viewBox,
  selectedPin,
  setSelectedPin,
  onUpdatePin,
  onRemovePin,
}) {
  const [showAllPins, setShowAllPins] = useState(true);

  // Get pins grouped by type
  const pinsByType = pins.reduce((acc, pin) => {
    const type = pin.type || 'finding';
    if (!acc[type]) acc[type] = [];
    acc[type].push(pin);
    return acc;
  }, {});

  // Calculate screen position for a pin
  const getPinScreenPosition = useCallback((pin) => {
    const node = nodes.find(n => n.id === pin.nodeId);
    if (!node) return null;

    return {
      x: (node.x + pin.x * node.scale) * viewBox.zoom,
      y: (node.y + pin.y * node.scale) * viewBox.zoom,
    };
  }, [nodes, viewBox]);

  const handlePinSelect = useCallback((pinId) => {
    setSelectedPin(selectedPin === pinId ? null : pinId);
  }, [selectedPin, setSelectedPin]);

  const handleCloseDetails = useCallback(() => {
    setSelectedPin(null);
  }, [setSelectedPin]);

  return (
    <>
      {/* Pin markers on canvas */}
      {showAllPins && pins.map(pin => {
        const pos = getPinScreenPosition(pin);
        if (!pos) return null;

        const node = nodes.find(n => n.id === pin.nodeId);
        if (!node) return null;

        const isSelected = selectedPin === pin.id;

        return (
          <div
            key={pin.id}
            className="absolute transform -translate-x-1/2 -translate-y-full z-20"
            style={{
              left: pos.x,
              top: pos.y - 8, // Offset for pin tip
            }}
          >
            <PinMarker
              pin={pin}
              node={node}
              viewBox={viewBox}
              isSelected={isSelected}
              onSelect={() => handlePinSelect(pin.id)}
            />

            {/* Pin details popup */}
            {isSelected && (
              <PinDetails
                pin={pin}
                onClose={handleCloseDetails}
                onUpdate={onUpdatePin}
                onRemove={onRemovePin}
              />
            )}
          </div>
        );
      })}

      {/* Pins list panel */}
      <div 
        className="absolute top-4 left-4 w-64 max-h-[calc(100%-2rem)] rounded-xl flex flex-col z-30"
        style={{ 
          backgroundColor: `${colors.surface.card}F2`, // 95% opacity
          backdropFilter: 'blur(4px)',
          border: `1px solid ${colors.border.default}`,
          boxShadow: shadows.cardHover,
        }}
      >
        <PinsHeader 
          count={pins.length}
          showAll={showAllPins}
          onToggle={() => setShowAllPins(!showAllPins)}
        />

        {/* Pin list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {pins.length === 0 ? (
            <EmptyPinsState />
          ) : (
            Object.entries(pinsByType).map(([type, typePins]) => (
              <PinTypeGroup
                key={type}
                type={type}
                pins={typePins}
                selectedPin={selectedPin}
                onSelect={handlePinSelect}
              />
            ))
          )}
        </div>

        <PinsLegend />
      </div>
    </>
  );
});

PinSystem.displayName = 'PinSystem';

export default PinSystem;
