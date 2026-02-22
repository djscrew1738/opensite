// ---------------------------------------------------------------------------
// Blueprint Canvas — Constants & Geometry Helpers
// ---------------------------------------------------------------------------

export const TOOL_TYPES = {
  SELECT: 'select',
  PAN: 'pan',
  LENGTH: 'length',
  AREA: 'area',
  COUNT: 'count',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  ANNOTATION: 'annotation'
};

export const COLORS = {
  length: '#2563eb',
  area: '#16a34a',
  count: '#dc2626',
  rectangle: '#7c3aed',
  circle: '#0891b2',
  annotation: '#64748b',
  selected: '#f59e0b',
  hover: '#fb923c',
  calibration: '#a855f7',
  snap: '#ec4899'
};

export const SNAP_THRESHOLD = 12; // pixels on screen
export const HANDLE_SIZE = 5;     // pixels on screen
export const MINIMAP_SIZE = 160;
export const MINIMAP_MARGIN = 12;
export const MAX_HISTORY = 50;

// ---------------------------------------------------------------------------
// Geometry Helpers
// ---------------------------------------------------------------------------

export function dist(p1, p2) {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

export function polygonArea(points) {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

export function rectFromTwoPoints(p1, p2) {
  const x = Math.min(p1.x, p2.x);
  const y = Math.min(p1.y, p2.y);
  const w = Math.abs(p2.x - p1.x);
  const h = Math.abs(p2.y - p1.y);
  return { x, y, w, h };
}

export function pointInRect(pt, p1, p2, tolerance) {
  const { x, y, w, h } = rectFromTwoPoints(p1, p2);
  return pt.x >= x - tolerance && pt.x <= x + w + tolerance &&
         pt.y >= y - tolerance && pt.y <= y + h + tolerance;
}

export function pointNearLine(pt, a, b, threshold) {
  const len = dist(a, b);
  if (len === 0) return dist(pt, a) < threshold;
  let t = ((pt.x - a.x) * (b.x - a.x) + (pt.y - a.y) * (b.y - a.y)) / (len * len);
  t = Math.max(0, Math.min(1, t));
  const proj = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
  return dist(pt, proj) < threshold;
}

export function pointInPolygon(pt, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > pt.y) !== (yj > pt.y)) &&
      (pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function centroid(points) {
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  return { x: cx, y: cy };
}
