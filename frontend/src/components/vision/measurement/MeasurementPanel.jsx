import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MeasurementType,
  calculateDistance,
  calculatePolygonArea,
  calculatePerimeter,
  formatMeasurement,
  MEASUREMENT_LABELS,
} from './measurementTypes';
import {
  Ruler,
  Square,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Calculator,
  X,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Measurement List Item
// ═══════════════════════════════════════════════════════════════

function MeasurementItem({
  measurement,
  scale,
  unit,
  isSelected,
  onSelect,
  onDelete,
  onToggleVisibility,
  isVisible,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getIcon = () => {
    switch (measurement.type) {
      case MeasurementType.DISTANCE:
        return <Ruler className="w-4 h-4 text-blue-500" />;
      case MeasurementType.AREA:
        return <Square className="w-4 h-4 text-emerald-500" />;
      default:
        return <Ruler className="w-4 h-4 text-surface-500" />;
    }
  };

  const getValue = () => {
    switch (measurement.type) {
      case MeasurementType.DISTANCE:
        if (measurement.points.length >= 2) {
          const dist = calculateDistance(measurement.points[0], measurement.points[1], scale);
          return formatMeasurement(dist, unit);
        }
        return '0';
      case MeasurementType.AREA:
        if (measurement.points.length >= 3) {
          const area = calculatePolygonArea(measurement.points, scale);
          return formatMeasurement(area, unit === 'ft' ? 'sq ft' : 'm²', 1);
        }
        return '0';
      default:
        return '';
    }
  };

  const getSecondaryValue = () => {
    if (measurement.type === MeasurementType.AREA && measurement.points.length >= 3) {
      const perimeter = calculatePerimeter(measurement.points, scale);
      return `Perimeter: ${formatMeasurement(perimeter, unit, 0)}`;
    }
    return null;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`group rounded-xl border transition-all ${
        isSelected
          ? 'bg-accent-500/10 border-accent-500/50'
          : 'bg-surface-850/50 border-surface-800 hover:border-surface-700'
      }`}
    >
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => onSelect?.(measurement.id)}
      >
        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center flex-shrink-0">
          {getIcon()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-surface-100">
              {MEASUREMENT_LABELS[measurement.type]}
            </span>
            {measurement.label && (
              <span className="text-xs text-surface-500 truncate">({measurement.label})</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-mono text-surface-300">{getValue()}</span>
            {getSecondaryValue() && (
              <span className="text-xs text-surface-500">{getSecondaryValue()}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility?.(measurement.id);
            }}
            className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-800 transition-colors"
          >
            {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(measurement.id);
            }}
            className="p-1.5 rounded-lg text-surface-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-800 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-surface-800"
          >
            <div className="p-3 space-y-2">
              {/* Point coordinates */}
              <div className="text-xs text-surface-500 space-y-1">
                <p className="font-medium text-surface-400">Points:</p>
                {measurement.points.map((p, i) => (
                  <p key={i} className="font-mono">
                    P{i + 1}: ({p.x.toFixed(3)}, {p.y.toFixed(3)})
                  </p>
                ))}
              </div>

              {/* Timestamp */}
              <p className="text-xs text-surface-600">
                Created: {new Date(measurement.createdAt).toLocaleString()}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Summary Stats Component
// ═══════════════════════════════════════════════════════════════

function MeasurementSummary({ measurements, scale, unit }) {
  const stats = useMemo(() => {
    const distances = measurements.filter(m => m.type === MeasurementType.DISTANCE);
    const areas = measurements.filter(m => m.type === MeasurementType.AREA);

    const totalDistance = distances.reduce((sum, m) => {
      if (m.points.length >= 2) {
        return sum + calculateDistance(m.points[0], m.points[1], scale);
      }
      return sum;
    }, 0);

    const totalArea = areas.reduce((sum, m) => {
      if (m.points.length >= 3) {
        return sum + calculatePolygonArea(m.points, scale);
      }
      return sum;
    }, 0);

    return {
      count: measurements.length,
      distances: distances.length,
      areas: areas.length,
      totalDistance,
      totalArea,
    };
  }, [measurements, scale]);

  return (
    <div className="grid grid-cols-2 gap-2 p-3 bg-surface-850/50 rounded-xl border border-surface-800">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-surface-400">
          <Ruler className="w-3 h-3" />
          <span className="text-xs uppercase">Distances</span>
        </div>
        <p className="text-lg font-bold text-blue-500">{stats.distances}</p>
        <p className="text-xs text-surface-500">{formatMeasurement(stats.totalDistance, unit, 0)}</p>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-surface-400">
          <Square className="w-3 h-3" />
          <span className="text-xs uppercase">Areas</span>
        </div>
        <p className="text-lg font-bold text-emerald-500">{stats.areas}</p>
        <p className="text-xs text-surface-500">
          {formatMeasurement(stats.totalArea, unit === 'ft' ? 'sq ft' : 'm²', 0)}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Export Dialog
// ═══════════════════════════════════════════════════════════════

function ExportDialog({ measurements, onClose, onExport }) {
  const [format, setFormat] = useState('json');

  const handleExport = () => {
    const data = {
      measurements,
      exportedAt: new Date().toISOString(),
      total: measurements.length,
    };

    let content;
    let mimeType;
    let filename;

    if (format === 'json') {
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      filename = 'measurements.json';
    } else if (format === 'csv') {
      const headers = 'ID,Type,Value,Unit,Points,Created At\n';
      const rows = measurements.map(m => {
        const points = m.points.map(p => `(${p.x.toFixed(3)},${p.y.toFixed(3)})`).join(';');
        return `${m.id},${m.type},${m.value || ''},${m.unit || ''},"${points}",${m.createdAt}`;
      }).join('\n');
      content = headers + rows;
      mimeType = 'text/csv';
      filename = 'measurements.csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    onExport?.();
    onClose();
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-80 rounded-xl bg-surface-900 border border-surface-700 p-4 shadow-2xl"
      >
        <h3 className="text-sm font-semibold text-surface-100 mb-3">Export Measurements</h3>
        
        <div className="space-y-2 mb-4">
          <button
            onClick={() => setFormat('json')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              format === 'json' ? 'bg-accent-500/20 text-accent-400' : 'bg-surface-800 text-surface-400'
            }`}
          >
            <span>JSON</span>
            {format === 'json' && <Check className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setFormat('csv')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              format === 'csv' ? 'bg-accent-500/20 text-accent-400' : 'bg-surface-800 text-surface-400'
            }`}
          >
            <span>CSV</span>
            {format === 'csv' && <Check className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-surface-800 text-surface-400 text-sm hover:bg-surface-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex-1 py-2 rounded-lg bg-accent-600 text-white text-sm hover:bg-accent-500 transition-colors"
          >
            Export
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Panel Component
// ═══════════════════════════════════════════════════════════════

export function MeasurementPanel({
  measurements = [],
  scale,
  unit,
  selectedId,
  onSelect,
  onDelete,
  onToggleVisibility,
  onClearAll,
  onExport,
  collapsed,
  onToggleCollapse,
  visibleIds = [],
}) {
  const [showExport, setShowExport] = useState(false);

  if (collapsed) {
    return (
      <motion.button
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        onClick={onToggleCollapse}
        className="absolute top-20 right-4 z-20 p-3 rounded-xl bg-surface-900/95 border border-surface-700 text-surface-400 hover:text-surface-100 transition-colors shadow-lg"
      >
        <Calculator className="w-5 h-5" />
        {measurements.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-500 text-white text-xs flex items-center justify-center">
            {measurements.length}
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-72 bg-surface-900/95 backdrop-blur-sm border-l border-surface-800 flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-accent-500" />
          <h3 className="text-sm font-semibold text-surface-100">Measurements</h3>
        </div>
        <div className="flex items-center gap-1">
          {measurements.length > 0 && (
            <button
              onClick={() => setShowExport(true)}
              className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-800 hover:text-surface-200 transition-colors"
              title="Export measurements"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-800 hover:text-surface-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary */}
      {measurements.length > 0 && (
        <div className="p-3 border-b border-surface-800">
          <MeasurementSummary measurements={measurements} scale={scale} unit={unit} />
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence mode="popLayout">
          {measurements.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-surface-800 flex items-center justify-center">
                <Ruler className="w-6 h-6 text-surface-500" />
              </div>
              <p className="text-sm text-surface-400">No measurements</p>
              <p className="text-xs text-surface-500 mt-1">
                Use the measurement tools to add dimensions
              </p>
            </div>
          ) : (
            measurements.map((measurement) => (
              <MeasurementItem
                key={measurement.id}
                measurement={measurement}
                scale={scale}
                unit={unit}
                isSelected={selectedId === measurement.id}
                isVisible={visibleIds.includes(measurement.id)}
                onSelect={onSelect}
                onDelete={onDelete}
                onToggleVisibility={onToggleVisibility}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {measurements.length > 0 && (
        <div className="px-3 py-2 border-t border-surface-800 bg-surface-850/30">
          <button
            onClick={onClearAll}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All Measurements
          </button>
        </div>
      )}

      {/* Export dialog */}
      {showExport && (
        <ExportDialog
          measurements={measurements}
          onClose={() => setShowExport(false)}
          onExport={onExport}
        />
      )}
    </motion.div>
  );
}

export default MeasurementPanel;
