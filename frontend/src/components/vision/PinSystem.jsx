import { useState } from 'react';
import { 
  Pin, X, MessageSquare, Link2, Trash2, Edit2, 
  Check, ChevronRight, Clock, AlertCircle, Info,
  Circle, Square, Triangle, Star, Flag
} from 'lucide-react';

/**
 * PinSystem - Manages pins and findings on the canvas
 * 
 * Features:
 * - Visual pin markers on nodes
 * - Pin details panel
 * - Connection management
 * - Different pin types and colors
 */

const PIN_ICONS = {
  circle: Circle,
  square: Square,
  triangle: Triangle,
  star: Star,
  flag: Flag,
  pin: Pin,
};

const PIN_COLORS = [
  { name: 'Red', value: '#EF4444', meaning: 'Critical issue' },
  { name: 'Orange', value: '#F97316', meaning: 'Warning' },
  { name: 'Yellow', value: '#EAB308', meaning: 'Note' },
  { name: 'Green', value: '#22C55E', meaning: 'Approved' },
  { name: 'Blue', value: '#3B82F6', meaning: 'Info' },
  { name: 'Purple', value: '#8B5CF6', meaning: 'Question' },
];

export default function PinSystem({
  pins,
  nodes,
  viewBox,
  selectedPin,
  setSelectedPin,
  onUpdatePin,
  onRemovePin,
}) {
  const [editingPin, setEditingPin] = useState(null);
  const [showAllPins, setShowAllPins] = useState(true);

  // Calculate screen position for a pin
  const getPinScreenPosition = (pin) => {
    const node = nodes.find(n => n.id === pin.nodeId);
    if (!node) return null;

    return {
      x: (node.x + pin.x * node.scale) * viewBox.zoom,
      y: (node.y + pin.y * node.scale) * viewBox.zoom,
    };
  };

  // Get pins grouped by type
  const pinsByType = pins.reduce((acc, pin) => {
    const type = pin.type || 'finding';
    if (!acc[type]) acc[type] = [];
    acc[type].push(pin);
    return acc;
  }, {});

  return (
    <>
      {/* Pin markers on canvas */}
      {showAllPins && pins.map(pin => {
        const pos = getPinScreenPosition(pin);
        if (!pos) return null;

        const isSelected = selectedPin === pin.id;
        const Icon = PIN_ICONS[pin.icon] || Pin;

        return (
          <div
            key={pin.id}
            className="absolute transform -translate-x-1/2 -translate-y-full z-20"
            style={{
              left: pos.x,
              top: pos.y - 8, // Offset for pin tip
            }}
          >
            {/* Pin marker */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPin(isSelected ? null : pin.id);
              }}
              className={`relative group transition-transform hover:scale-110
                         ${isSelected ? 'scale-125' : ''}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg
                           border-2 border-white dark:border-surface-800
                           transition-all`}
                style={{ backgroundColor: pin.color || '#3B82F6' }}
              >
                <Icon className="w-3 h-3 text-white" />
              </div>

              {/* Pulse effect for new pins */}
              {pin.isNew && (
                <span className="absolute inset-0 rounded-full animate-ping opacity-75"
                      style={{ backgroundColor: pin.color || '#3B82F6' }} />
              )}
            </button>

            {/* Pin tooltip */}
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
                            px-2 py-1 rounded-lg bg-black/80 text-white text-xs
                            whitespace-nowrap pointer-events-none
                            transition-opacity ${isSelected ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
              {pin.label || 'Untitled pin'}
              <div className="absolute top-full left-1/2 -translate-x-1/2 
                              border-4 border-transparent border-t-black/80" />
            </div>

            {/* Pin details popup */}
            {isSelected && (
              <PinDetails
                pin={pin}
                onClose={() => setSelectedPin(null)}
                onUpdate={onUpdatePin}
                onRemove={onRemovePin}
                onEdit={() => setEditingPin(pin)}
              />
            )}
          </div>
        );
      })}

      {/* Pins list panel */}
      <div className="absolute top-4 left-4 w-64 max-h-[calc(100%-2rem)]
                      bg-white/95 dark:bg-surface-800/95 backdrop-blur-sm
                      rounded-xl shadow-xl border border-surface-200 dark:border-surface-700
                      flex flex-col z-30">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-primary-500" />
            <span className="text-sm font-semibold text-surface-800 dark:text-surface-200">
              Findings
            </span>
            <span className="text-xs text-surface-400">
              ({pins.length})
            </span>
          </div>
          <button
            onClick={() => setShowAllPins(!showAllPins)}
            className={`text-xs px-2 py-1 rounded transition-colors
                       ${showAllPins 
                         ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30' 
                         : 'text-surface-400 hover:bg-surface-100'}`}
          >
            {showAllPins ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Pin list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {pins.length === 0 ? (
            <div className="text-center py-8 text-surface-400 text-xs">
              <Pin className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No pins yet</p>
              <p className="mt-1 opacity-70">Click the pin tool to add findings</p>
            </div>
          ) : (
            Object.entries(pinsByType).map(([type, typePins]) => (
              <div key={type} className="mb-3">
                <div className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider px-2 mb-1">
                  {type}s ({typePins.length})
                </div>
                {typePins.map(pin => {
                  const isSelected = selectedPin === pin.id;
                  const Icon = PIN_ICONS[pin.icon] || Pin;

                  return (
                    <button
                      key={pin.id}
                      onClick={() => setSelectedPin(isSelected ? null : pin.id)}
                      className={`w-full flex items-start gap-2 p-2 rounded-lg text-left
                                 transition-colors text-xs
                                 ${isSelected 
                                   ? 'bg-primary-100 dark:bg-primary-900/30' 
                                   : 'hover:bg-surface-100 dark:hover:bg-surface-700'}`}
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: pin.color || '#3B82F6' }}
                      >
                        <Icon className="w-2.5 h-2.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate
                                      ${isSelected 
                                        ? 'text-primary-700 dark:text-primary-300' 
                                        : 'text-surface-700 dark:text-surface-300'}`}>
                          {pin.label || 'Untitled'}
                        </p>
                        {pin.description && (
                          <p className="text-[10px] text-surface-400 line-clamp-2 mt-0.5">
                            {pin.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Legend */}
        <div className="p-2 border-t border-surface-200 dark:border-surface-700">
          <div className="text-[10px] font-semibold text-surface-400 mb-1">Legend</div>
          <div className="grid grid-cols-3 gap-1">
            {PIN_COLORS.slice(0, 6).map(color => (
              <div key={color.value} className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color.value }}
                />
                <span className="text-[10px] text-surface-500 truncate" title={color.meaning}>
                  {color.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Pin details popup
 */
function PinDetails({ pin, onClose, onUpdate, onRemove, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(pin);

  const handleSave = () => {
    onUpdate(pin.id, editData);
    setIsEditing(false);
  };

  const Icon = PIN_ICONS[pin.icon] || Pin;

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64
                    bg-white dark:bg-surface-800 rounded-xl shadow-2xl
                    border border-surface-200 dark:border-surface-700
                    z-50 animate-in fade-in zoom-in duration-200">
      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 
                      border-8 border-transparent border-t-white dark:border-t-surface-800" />

      {isEditing ? (
        /* Edit mode */
        <div className="p-3 space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-surface-500 uppercase">Label</label>
            <input
              type="text"
              value={editData.label || ''}
              onChange={(e) => setEditData({ ...editData, label: e.target.value })}
              className="w-full mt-1 px-2 py-1 text-xs rounded border border-surface-200 
                         dark:border-surface-600 dark:bg-surface-700"
              placeholder="Pin label..."
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-surface-500 uppercase">Description</label>
            <textarea
              value={editData.description || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="w-full mt-1 px-2 py-1 text-xs rounded border border-surface-200 
                         dark:border-surface-600 dark:bg-surface-700 resize-none"
              rows={3}
              placeholder="Add details..."
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-surface-500 uppercase">Color</label>
            <div className="flex gap-1 mt-1 flex-wrap">
              {PIN_COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={() => setEditData({ ...editData, color: color.value })}
                  className={`w-5 h-5 rounded-full border-2 transition-all
                             ${editData.color === color.value 
                               ? 'border-surface-900 dark:border-white scale-110' 
                               : 'border-transparent'}`}
                  style={{ backgroundColor: color.value }}
                  title={color.meaning}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5
                         bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700"
            >
              <Check className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={() => { setIsEditing(false); setEditData(pin); }}
              className="px-3 py-1.5 text-surface-600 text-xs rounded-lg 
                         hover:bg-surface-100 dark:hover:bg-surface-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* View mode */
        <div className="p-3">
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: pin.color || '#3B82F6' }}
            >
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-surface-800 dark:text-surface-200">
                {pin.label || 'Untitled Pin'}
              </h4>
              <p className="text-[10px] text-surface-400 mt-0.5">
                {new Date(pin.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-surface-400 hover:text-surface-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {pin.description && (
            <p className="mt-3 text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
              {pin.description}
            </p>
          )}

          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-surface-600 
                         hover:bg-surface-100 dark:hover:bg-surface-700 rounded"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
            <button
              onClick={() => onRemove(pin.id)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 
                         hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
