import { useState } from 'react';
import {
  Ruler, Square, Hash, Trash2, Edit3, ChevronDown, ChevronUp, Package,
  RectangleHorizontal, Circle, Type, Copy
} from 'lucide-react';

const TYPE_ICONS = {
  length: Ruler,
  area: Square,
  count: Hash,
  rectangle: RectangleHorizontal,
  circle: Circle,
  annotation: Type
};

const TYPE_COLORS = {
  length: { dot: '#2563eb', bg: 'text-blue-600 bg-blue-50' },
  area: { dot: '#16a34a', bg: 'text-green-600 bg-green-50' },
  count: { dot: '#dc2626', bg: 'text-red-600 bg-red-50' },
  rectangle: { dot: '#7c3aed', bg: 'text-purple-600 bg-purple-50' },
  circle: { dot: '#0891b2', bg: 'text-cyan-600 bg-cyan-50' },
  annotation: { dot: '#64748b', bg: 'text-slate-600 bg-slate-50' }
};

const TYPE_LABELS = {
  length: 'Lengths',
  area: 'Areas',
  count: 'Counts',
  rectangle: 'Rectangles',
  circle: 'Circles',
  annotation: 'Annotations'
};

function distance(p1, p2) {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

function polygonArea(points) {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

export default function MeasurementsSidebar({
  measurements,
  onMeasurementsChange,
  selectedId,
  onSelect,
  scale,
  materials = [],
  onAssignMaterial
}) {
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const ppu = scale?.pixelsPerUnit;
  const unit = scale?.unit || 'ft';

  const formatLength = (px) => {
    if (ppu) return `${(px / ppu).toFixed(1)} ${unit}`;
    return `${Math.round(px)} px`;
  };

  const formatArea = (pxSq) => {
    if (ppu) return `${(pxSq / (ppu * ppu)).toFixed(1)} sq ${unit}`;
    return `${Math.round(pxSq)} sq px`;
  };

  const formatValue = (m) => {
    if (m.type === 'length' && m.points?.length === 2) {
      return formatLength(distance(m.points[0], m.points[1]));
    }
    if (m.type === 'area' && m.points?.length >= 3) {
      return formatArea(polygonArea(m.points));
    }
    if (m.type === 'rectangle' && m.points?.length === 2) {
      const w = Math.abs(m.points[1].x - m.points[0].x);
      const h = Math.abs(m.points[1].y - m.points[0].y);
      return formatArea(w * h);
    }
    if (m.type === 'circle' && m.points?.length === 2) {
      const r = distance(m.points[0], m.points[1]);
      return formatArea(Math.PI * r * r);
    }
    if (m.type === 'count') {
      return `x${m.count || 1}`;
    }
    if (m.type === 'annotation') {
      return m.text || m.label || '';
    }
    return '';
  };

  const formatSecondary = (m) => {
    if (m.type === 'rectangle' && m.points?.length === 2) {
      const w = Math.abs(m.points[1].x - m.points[0].x);
      const h = Math.abs(m.points[1].y - m.points[0].y);
      return `${formatLength(w)} x ${formatLength(h)}`;
    }
    if (m.type === 'circle' && m.points?.length === 2) {
      const r = distance(m.points[0], m.points[1]);
      return `r = ${formatLength(r)}`;
    }
    if (m.type === 'length' && m.points?.length === 2 && m.materialName) {
      return m.materialName;
    }
    return null;
  };

  const handleDelete = (id) => {
    const updated = measurements.filter(m => m.id !== id);
    onMeasurementsChange(updated);
    if (selectedId === id) onSelect(null);
  };

  const handleLabelSave = (id) => {
    const updated = measurements.map(m =>
      m.id === id
        ? { ...m, label: editLabel, ...(m.type === 'annotation' ? { text: editLabel } : {}) }
        : m
    );
    onMeasurementsChange(updated);
    setEditingId(null);
  };

  const handleCountChange = (id, newCount) => {
    const count = Math.max(1, parseInt(newCount) || 1);
    const updated = measurements.map(m =>
      m.id === id ? { ...m, count } : m
    );
    onMeasurementsChange(updated);
  };

  const handleDuplicate = (m) => {
    const offsetAmt = 20;
    const dup = {
      ...JSON.parse(JSON.stringify(m)),
      id: `m_${Date.now()}`,
      points: m.points.map(p => ({ x: p.x + offsetAmt, y: p.y + offsetAmt }))
    };
    onMeasurementsChange([...measurements, dup]);
  };

  const toggleGroup = (type) => {
    setCollapsedGroups(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // Group measurements by type, preserving order within groups
  const typeOrder = ['length', 'rectangle', 'circle', 'area', 'count', 'annotation'];
  const grouped = {};
  for (const type of typeOrder) {
    const items = measurements.filter(m => m.type === type);
    if (items.length > 0) grouped[type] = items;
  }

  if (measurements.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Ruler className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm font-medium">No measurements yet</p>
        <p className="text-xs mt-1 text-gray-400">Use the toolbar to start measuring</p>
        <div className="mt-4 text-left space-y-1.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Shortcuts</p>
          {[
            ['L', 'Length'],
            ['A', 'Area polygon'],
            ['R', 'Rectangle'],
            ['O', 'Circle'],
            ['C', 'Count marker'],
            ['T', 'Text annotation'],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center gap-2 text-xs text-gray-400">
              <kbd className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded text-[10px] font-mono font-semibold text-gray-500">{key}</kbd>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {Object.entries(grouped).map(([type, items]) => {
        const Icon = TYPE_ICONS[type];
        const colors = TYPE_COLORS[type];
        const isCollapsed = collapsedGroups[type];

        return (
          <div key={type}>
            {/* Group header */}
            <button
              onClick={() => toggleGroup(type)}
              className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <span className={`p-0.5 rounded ${colors.bg}`}>
                <Icon className="w-3 h-3" />
              </span>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex-1 text-left">
                {TYPE_LABELS[type]} ({items.length})
              </span>
              {isCollapsed ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronUp className="w-3 h-3 text-gray-400" />
              )}
            </button>

            {/* Items */}
            {!isCollapsed && items.map((m, idx) => {
              const isSelected = m.id === selectedId;
              const isExpanded = m.id === expandedId;
              const isEditing = m.id === editingId;
              const secondary = formatSecondary(m);

              return (
                <div
                  key={m.id}
                  className={`px-3 py-1.5 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-amber-50 border-l-2 border-amber-400'
                      : 'hover:bg-gray-50 border-l-2 border-transparent'
                  }`}
                  onClick={() => onSelect(m.id)}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {/* Color dot */}
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: colors.dot }}
                      />
                      {isEditing ? (
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleLabelSave(m.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          onBlur={() => handleLabelSave(m.id)}
                          className="input text-xs py-0 px-1 w-full h-5"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-xs font-medium text-gray-800 truncate">
                          {m.label || `${type} ${idx + 1}`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-1 flex-shrink-0">
                      <span className="text-[11px] font-semibold text-gray-600 whitespace-nowrap tabular-nums">
                        {formatValue(m)}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : m.id); }}
                        className="p-0.5 text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Secondary info line */}
                  {secondary && !isExpanded && (
                    <p className="text-[10px] text-gray-400 mt-0.5 ml-3.5 truncate">{secondary}</p>
                  )}

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-2 ml-3.5 space-y-2" onClick={(e) => e.stopPropagation()}>
                      {/* Detailed dimensions */}
                      {secondary && (
                        <p className="text-[11px] text-gray-500">{secondary}</p>
                      )}

                      {/* Perimeter for rectangle */}
                      {m.type === 'rectangle' && m.points?.length === 2 && (
                        <p className="text-[11px] text-gray-500">
                          Perimeter: {formatLength(
                            2 * Math.abs(m.points[1].x - m.points[0].x) +
                            2 * Math.abs(m.points[1].y - m.points[0].y)
                          )}
                        </p>
                      )}

                      {/* Circumference for circle */}
                      {m.type === 'circle' && m.points?.length === 2 && (
                        <p className="text-[11px] text-gray-500">
                          Circumference: {formatLength(2 * Math.PI * distance(m.points[0], m.points[1]))}
                        </p>
                      )}

                      {/* Perimeter for polygon area */}
                      {m.type === 'area' && m.points?.length >= 3 && (
                        <p className="text-[11px] text-gray-500">
                          Perimeter: {formatLength(
                            m.points.reduce((sum, p, i) => {
                              const next = m.points[(i + 1) % m.points.length];
                              return sum + distance(p, next);
                            }, 0)
                          )}
                        </p>
                      )}

                      {/* Count input */}
                      {m.type === 'count' && (
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-gray-500">Qty:</label>
                          <input
                            type="number"
                            min="1"
                            value={m.count || 1}
                            onChange={(e) => handleCountChange(m.id, e.target.value)}
                            className="input text-xs py-0 px-1 w-14 h-5"
                          />
                        </div>
                      )}

                      {/* Material assignment */}
                      {m.type !== 'annotation' && (
                        m.materialId ? (
                          <div className="flex items-center gap-1 text-[11px] text-gray-600">
                            <Package className="w-3 h-3 text-primary-500" />
                            <span className="truncate">{m.materialName || 'Assigned'}</span>
                            {m.materialUnitCost && (
                              <span className="text-gray-400 ml-1">
                                ${Number(m.materialUnitCost).toFixed(2)}/{m.materialUnit}
                              </span>
                            )}
                            <button
                              onClick={() => onAssignMaterial(m.id, null)}
                              className="text-red-400 hover:text-red-600 ml-auto"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onAssignMaterial(m.id)}
                            className="text-[11px] text-primary-600 hover:text-primary-700 flex items-center gap-1"
                          >
                            <Package className="w-3 h-3" />
                            Assign Material
                          </button>
                        )
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-0.5 pt-1 border-t border-gray-100">
                        <button
                          onClick={() => { setEditingId(m.id); setEditLabel(m.label || (m.type === 'annotation' ? m.text || '' : '')); }}
                          className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                          title="Rename"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(m)}
                          className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                          title="Duplicate"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
