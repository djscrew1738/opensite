/**
 * Measurement System Types and Utilities
 */

// ═══════════════════════════════════════════════════════════════
// Enums
// ═══════════════════════════════════════════════════════════════

export const MeasurementType = {
  DISTANCE: 'distance',
  AREA: 'area',
  ANGLE: 'angle',
  POINT: 'point',
};

export const MeasurementUnit = {
  FEET: 'ft',
  METERS: 'm',
  INCHES: 'in',
  CENTIMETERS: 'cm',
};

export const MeasurementStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// ═══════════════════════════════════════════════════════════════
// Conversion Utilities
// ═══════════════════════════════════════════════════════════════

const CONVERSION_FACTORS = {
  // From feet
  ft: { ft: 1, m: 0.3048, in: 12, cm: 30.48 },
  // From meters
  m: { ft: 3.28084, m: 1, in: 39.3701, cm: 100 },
  // From inches
  in: { ft: 0.0833333, m: 0.0254, in: 1, cm: 2.54 },
  // From centimeters
  cm: { ft: 0.0328084, m: 0.01, in: 0.393701, cm: 1 },
};

/**
 * Convert measurement value between units
 */
export function convertValue(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;
  return value * CONVERSION_FACTORS[fromUnit][toUnit];
}

/**
 * Format measurement value with unit
 */
export function formatMeasurement(value, unit, decimals = 2) {
  const formatted = value.toFixed(decimals);
  // Remove trailing zeros
  const clean = formatted.replace(/\.?0+$/, '');
  return `${clean} ${unit}`;
}

/**
 * Calculate distance between two points
 */
export function calculateDistance(p1, p2, scale = 1) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const pixelDistance = Math.sqrt(dx * dx + dy * dy);
  return pixelDistance * scale;
}

/**
 * Calculate angle between two points in degrees
 */
export function calculateAngle(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Calculate polygon area using shoelace formula
 */
export function calculatePolygonArea(points, scale = 1) {
  if (points.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  return Math.abs(area) * scale * scale / 2;
}

/**
 * Calculate perimeter of polygon
 */
export function calculatePerimeter(points, scale = 1) {
  if (points.length < 2) return 0;
  
  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    perimeter += calculateDistance(points[i], points[j], scale);
  }
  
  return perimeter;
}

/**
 * Get midpoint between two points
 */
export function getMidpoint(p1, p2) {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

/**
 * Get centroid of polygon
 */
export function getCentroid(points) {
  if (points.length === 0) return { x: 0, y: 0 };
  
  const sum = points.reduce((acc, p) => ({
    x: acc.x + p.x,
    y: acc.y + p.y,
  }), { x: 0, y: 0 });
  
  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
  };
}

/**
 * Snap point to nearest grid intersection
 */
export function snapToGrid(point, gridSize = 0.01) {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

/**
 * Check if point is near a line segment
 */
export function isPointNearLine(point, lineStart, lineEnd, threshold = 0.01) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) return calculateDistance(point, lineStart) < threshold;
  
  const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (length * length)));
  
  const closest = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };
  
  return calculateDistance(point, closest) < threshold;
}

/**
 * Generate measurement ID
 */
export function generateMeasurementId() {
  return `meas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ═══════════════════════════════════════════════════════════════
// Default Templates
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_MEASUREMENT_COLORS = {
  distance: '#3B82F6', // blue
  area: '#10B981',     // emerald
  angle: '#F59E0B',    // amber
  point: '#8B5CF6',    // purple
};

export const MEASUREMENT_LABELS = {
  [MeasurementType.DISTANCE]: 'Distance',
  [MeasurementType.AREA]: 'Area',
  [MeasurementType.ANGLE]: 'Angle',
  [MeasurementType.POINT]: 'Point',
};

export const MEASUREMENT_ICONS = {
  [MeasurementType.DISTANCE]: 'Ruler',
  [MeasurementType.AREA]: 'Square',
  [MeasurementType.ANGLE]: 'Angle',
  [MeasurementType.POINT]: 'Pin',
};
