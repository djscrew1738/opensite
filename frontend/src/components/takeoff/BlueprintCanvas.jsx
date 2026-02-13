import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn, ZoomOut, Maximize, Move, Ruler, Square, Hash, MousePointer,
  Undo2, Redo2, Trash2, RotateCcw, Grid3X3, Circle, RectangleHorizontal,
  Type, Download, Copy, Crosshair, Magnet
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOOL_TYPES = {
  SELECT: 'select',
  PAN: 'pan',
  LENGTH: 'length',
  AREA: 'area',
  COUNT: 'count',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  ANNOTATION: 'annotation'
};

const COLORS = {
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

const SNAP_THRESHOLD = 12; // pixels on screen
const HANDLE_SIZE = 5; // pixels on screen
const MINIMAP_SIZE = 160;
const MINIMAP_MARGIN = 12;
const MAX_HISTORY = 50;

// ---------------------------------------------------------------------------
// Geometry Helpers
// ---------------------------------------------------------------------------

function dist(p1, p2) {
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

function rectFromTwoPoints(p1, p2) {
  const x = Math.min(p1.x, p2.x);
  const y = Math.min(p1.y, p2.y);
  const w = Math.abs(p2.x - p1.x);
  const h = Math.abs(p2.y - p1.y);
  return { x, y, w, h };
}

function pointInRect(pt, p1, p2, tolerance) {
  const { x, y, w, h } = rectFromTwoPoints(p1, p2);
  return pt.x >= x - tolerance && pt.x <= x + w + tolerance &&
         pt.y >= y - tolerance && pt.y <= y + h + tolerance;
}

function pointNearLine(pt, a, b, threshold) {
  const len = dist(a, b);
  if (len === 0) return dist(pt, a) < threshold;
  let t = ((pt.x - a.x) * (b.x - a.x) + (pt.y - a.y) * (b.y - a.y)) / (len * len);
  t = Math.max(0, Math.min(1, t));
  const proj = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
  return dist(pt, proj) < threshold;
}

function pointInPolygon(pt, polygon) {
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

function centroid(points) {
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  return { x: cx, y: cy };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BlueprintCanvas({
  imageUrl,
  measurements = [],
  onMeasurementsChange,
  scale,
  onScaleChange
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);

  // Core state
  const [tool, setTool] = useState(TOOL_TYPES.SELECT);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [showGrid, setShowGrid] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [crosshairEnabled, setCrosshairEnabled] = useState(false);

  // History (undo/redo)
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Calibration
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState([]);

  // Image
  const [image, setImage] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Mouse tracking (image coords)
  const [mouseImg, setMouseImg] = useState(null);
  const [snapPoint, setSnapPoint] = useState(null);

  // ---------------------------------------------------------------------------
  // Image loading
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      if (containerRef.current) {
        const container = containerRef.current.getBoundingClientRect();
        const fitZoom = Math.min(
          (container.width - 40) / img.naturalWidth,
          (container.height - 40) / img.naturalHeight,
          1
        );
        setZoom(fitZoom);
        setOffset({
          x: (container.width - img.naturalWidth * fitZoom) / 2,
          y: (container.height - img.naturalHeight * fitZoom) / 2
        });
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // ---------------------------------------------------------------------------
  // Coordinate transforms
  // ---------------------------------------------------------------------------

  const screenToImage = useCallback((screenX, screenY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (screenX - rect.left - offset.x) / zoom,
      y: (screenY - rect.top - offset.y) / zoom
    };
  }, [zoom, offset]);

  // Note: imageToScreen is currently unused but kept for potential future use
  // const imageToScreen = useCallback((imgX, imgY) => {
  //   return {
  //     x: imgX * zoom + offset.x,
  //     y: imgY * zoom + offset.y
  //   };
  // }, [zoom, offset]);

  // ---------------------------------------------------------------------------
  // Snap logic
  // ---------------------------------------------------------------------------

  const findSnapPoint = useCallback((imgPt) => {
    if (!snapEnabled) return null;
    const threshold = SNAP_THRESHOLD / zoom;
    let best = null;
    let bestDist = threshold;

    for (const m of measurements) {
      if (!m.points) continue;
      for (const p of m.points) {
        const d = dist(imgPt, p);
        if (d < bestDist) {
          bestDist = d;
          best = { x: p.x, y: p.y };
        }
      }
      // For rectangles, also snap to computed corners
      if (m.type === 'rectangle' && m.points.length === 2) {
        const corners = [
          { x: m.points[0].x, y: m.points[1].y },
          { x: m.points[1].x, y: m.points[0].y }
        ];
        for (const c of corners) {
          const d = dist(imgPt, c);
          if (d < bestDist) {
            bestDist = d;
            best = { x: c.x, y: c.y };
          }
        }
      }
    }
    return best;
  }, [measurements, snapEnabled, zoom]);

  // ---------------------------------------------------------------------------
  // History management
  // ---------------------------------------------------------------------------

  const pushHistory = useCallback((newMeasurements) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      const next = [...trimmed, JSON.parse(JSON.stringify(newMeasurements))];
      if (next.length > MAX_HISTORY) next.shift();
      return next;
    });
    setHistoryIndex(prev => {
      const idx = Math.min(prev + 1, MAX_HISTORY - 1);
      return idx;
    });
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      onMeasurementsChange(prev);
    }
  }, [history, historyIndex, onMeasurementsChange]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      onMeasurementsChange(next);
    }
  }, [history, historyIndex, onMeasurementsChange]);

  // ---------------------------------------------------------------------------
  // Measurement formatting
  // ---------------------------------------------------------------------------

  // Note: pixelsToReal is currently unused but kept for potential future use
  // const pixelsToReal = useCallback((pixels) => {
  //   if (!scale || !scale.pixelsPerUnit) return pixels;
  //   return pixels / scale.pixelsPerUnit;
  // }, [scale]);

  const formatLength = useCallback((px) => {
    if (!scale || !scale.pixelsPerUnit) return `${Math.round(px)}px`;
    return `${(px / scale.pixelsPerUnit).toFixed(1)} ${scale.unit || 'ft'}`;
  }, [scale]);

  const formatArea = useCallback((pxSq) => {
    if (!scale || !scale.pixelsPerUnit) return `${Math.round(pxSq)} sq px`;
    const sqReal = pxSq / (scale.pixelsPerUnit * scale.pixelsPerUnit);
    return `${sqReal.toFixed(1)} sq ${scale.unit || 'ft'}`;
  }, [scale]);

  // ---------------------------------------------------------------------------
  // Hit testing
  // ---------------------------------------------------------------------------

  const hitTest = useCallback((imgPt) => {
    const threshold = 10 / zoom;
    // Check in reverse order so topmost drawn items are found first
    for (let i = measurements.length - 1; i >= 0; i--) {
      const m = measurements[i];

      if (m.type === 'count' && m.points?.[0]) {
        if (dist(imgPt, m.points[0]) < 15 / zoom) return m.id;
      }

      if (m.type === 'annotation' && m.points?.[0]) {
        // Generous hit area around text origin
        if (dist(imgPt, m.points[0]) < 30 / zoom) return m.id;
      }

      if (m.type === 'length' && m.points?.length === 2) {
        if (pointNearLine(imgPt, m.points[0], m.points[1], threshold)) return m.id;
      }

      if (m.type === 'area' && m.points?.length >= 3) {
        // Check edges
        for (let j = 0; j < m.points.length; j++) {
          const next = m.points[(j + 1) % m.points.length];
          if (pointNearLine(imgPt, m.points[j], next, threshold)) return m.id;
        }
        if (pointInPolygon(imgPt, m.points)) return m.id;
      }

      if (m.type === 'rectangle' && m.points?.length === 2) {
        if (pointInRect(imgPt, m.points[0], m.points[1], threshold)) return m.id;
      }

      if (m.type === 'circle' && m.points?.length === 2) {
        const radius = dist(m.points[0], m.points[1]);
        const d = dist(imgPt, m.points[0]);
        if (Math.abs(d - radius) < threshold || d < radius) return m.id;
      }
    }
    return null;
  }, [measurements, zoom]);

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // Blueprint image
    if (image) {
      ctx.drawImage(image, 0, 0);
    }

    // Grid overlay
    if (showGrid && image) {
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1 / zoom;
      const gridSize = scale?.pixelsPerUnit ? scale.pixelsPerUnit : 50;
      for (let x = 0; x < imageSize.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, imageSize.height);
        ctx.stroke();
      }
      for (let y = 0; y < imageSize.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(imageSize.width, y);
        ctx.stroke();
      }
    }

    // Crosshair guide
    if (crosshairEnabled && mouseImg && image &&
        (tool === TOOL_TYPES.LENGTH || tool === TOOL_TYPES.AREA ||
         tool === TOOL_TYPES.RECTANGLE || tool === TOOL_TYPES.CIRCLE)) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      ctx.beginPath();
      ctx.moveTo(mouseImg.x, 0);
      ctx.lineTo(mouseImg.x, imageSize.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, mouseImg.y);
      ctx.lineTo(imageSize.width, mouseImg.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Helper: draw a rounded-rect label background
    const drawLabel = (text, x, y, color, fontSize, align = 'center', baseline = 'bottom') => {
      const fSize = fontSize / zoom;
      ctx.font = `600 ${fSize}px "Inter", system-ui, sans-serif`;
      ctx.textAlign = align;
      ctx.textBaseline = baseline;
      const metrics = ctx.measureText(text);
      const pad = 4 / zoom;
      const tw = metrics.width;
      const th = fSize;
      let lx = x;
      if (align === 'center') lx = x - tw / 2;
      else if (align === 'right') lx = x - tw;
      const ly = baseline === 'bottom' ? y - th - pad : y - pad;

      // Shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 4 / zoom;
      ctx.shadowOffsetY = 1 / zoom;
      // Background pill
      const r = 3 / zoom;
      const bx = lx - pad;
      const by = ly - pad / 2;
      const bw = tw + pad * 2;
      const bh = th + pad * 1.5;
      ctx.beginPath();
      ctx.moveTo(bx + r, by);
      ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
      ctx.arcTo(bx + bw, by + bh, bx, by + bh, r);
      ctx.arcTo(bx, by + bh, bx, by, r);
      ctx.arcTo(bx, by, bx + bw, by, r);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fill();
      ctx.restore();

      // Text
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    };

    // Helper: draw a vertex handle
    const drawHandle = (px, py, color, isSelected) => {
      const s = (isSelected ? HANDLE_SIZE + 1 : HANDLE_SIZE) / zoom;
      if (isSelected) {
        // Square handles for selected
        ctx.fillStyle = 'white';
        ctx.fillRect(px - s, py - s, s * 2, s * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5 / zoom;
        ctx.strokeRect(px - s, py - s, s * 2, s * 2);
      } else {
        // Circle dots for normal
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(px, py, s * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // ---- Draw each measurement ----
    measurements.forEach(m => {
      const isSelected = m.id === selectedId;
      const isHovered = m.id === hoveredId && !isSelected;
      const baseColor = COLORS[m.type] || '#666';
      const color = isSelected ? COLORS.selected : isHovered ? COLORS.hover : baseColor;
      const lineW = (isSelected ? 3 : isHovered ? 2.5 : 2) / zoom;

      // -- LENGTH --
      if (m.type === 'length' && m.points?.length === 2) {
        const [p1, p2] = m.points;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineW;
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Dimension ticks at endpoints
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const tickLen = 8 / zoom;
        const perpX = Math.cos(angle + Math.PI / 2) * tickLen;
        const perpY = Math.sin(angle + Math.PI / 2) * tickLen;
        ctx.beginPath();
        ctx.moveTo(p1.x - perpX, p1.y - perpY);
        ctx.lineTo(p1.x + perpX, p1.y + perpY);
        ctx.moveTo(p2.x - perpX, p2.y - perpY);
        ctx.lineTo(p2.x + perpX, p2.y + perpY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5 / zoom;
        ctx.stroke();

        // Handles
        [p1, p2].forEach(p => drawHandle(p.x, p.y, color, isSelected));

        // Label at midpoint
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const d = dist(p1, p2);
        const label = m.label || formatLength(d);
        drawLabel(label, midX, midY - 4 / zoom, color, 13);
      }

      // -- AREA (polygon) --
      if (m.type === 'area' && m.points?.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(m.points[0].x, m.points[0].y);
        m.points.forEach((p, i) => { if (i > 0) ctx.lineTo(p.x, p.y); });
        ctx.closePath();
        ctx.fillStyle = color + '18';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineW;
        ctx.stroke();

        if (isHovered && !isSelected) {
          ctx.fillStyle = color + '0c';
          ctx.fill();
        }

        m.points.forEach(p => drawHandle(p.x, p.y, color, isSelected));

        const c = centroid(m.points);
        const area = polygonArea(m.points);
        const label = m.label || formatArea(area);
        drawLabel(label, c.x, c.y + 6 / zoom, color, 13, 'center', 'middle');
      }

      // -- COUNT --
      if (m.type === 'count' && m.points?.[0]) {
        const p = m.points[0];
        const r = (isSelected ? 14 : isHovered ? 13 : 12) / zoom;

        // Outer ring glow for hover/select
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 3 / zoom, 0, Math.PI * 2);
          ctx.fillStyle = color + '20';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.fillStyle = color + '25';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 / zoom;
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const label = m.label || String(m.count || 1);
        ctx.font = `700 ${12 / zoom}px "Inter", system-ui, sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, p.x, p.y);
      }

      // -- RECTANGLE --
      if (m.type === 'rectangle' && m.points?.length === 2) {
        const { x, y, w, h } = rectFromTwoPoints(m.points[0], m.points[1]);
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.fillStyle = color + '15';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineW;
        ctx.stroke();

        if (isHovered && !isSelected) {
          ctx.fillStyle = color + '0a';
          ctx.fill();
        }

        // Corner handles
        const corners = [
          m.points[0], m.points[1],
          { x: m.points[0].x, y: m.points[1].y },
          { x: m.points[1].x, y: m.points[0].y }
        ];
        corners.forEach(c => drawHandle(c.x, c.y, color, isSelected));

        // Dimension labels on edges
        const area = w * h;
        const areaLabel = m.label || formatArea(area);
        drawLabel(areaLabel, x + w / 2, y + h / 2 + 6 / zoom, color, 13, 'center', 'middle');

        // Width and height dimension labels
        if (w > 40 / zoom) {
          const wLabel = formatLength(w);
          drawLabel(wLabel, x + w / 2, y - 4 / zoom, color, 11);
        }
        if (h > 40 / zoom) {
          const hLabel = formatLength(h);
          ctx.save();
          ctx.translate(x - 8 / zoom, y + h / 2);
          ctx.rotate(-Math.PI / 2);
          drawLabel(hLabel, 0, 0, color, 11, 'center', 'bottom');
          ctx.restore();
        }
      }

      // -- CIRCLE --
      if (m.type === 'circle' && m.points?.length === 2) {
        const center = m.points[0];
        const radius = dist(m.points[0], m.points[1]);

        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color + '15';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineW;
        ctx.stroke();

        if (isHovered && !isSelected) {
          ctx.fillStyle = color + '0a';
          ctx.fill();
        }

        // Center cross
        const cs = 6 / zoom;
        ctx.beginPath();
        ctx.moveTo(center.x - cs, center.y);
        ctx.lineTo(center.x + cs, center.y);
        ctx.moveTo(center.x, center.y - cs);
        ctx.lineTo(center.x, center.y + cs);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1 / zoom;
        ctx.stroke();

        // Radius line
        ctx.beginPath();
        ctx.setLineDash([3 / zoom, 3 / zoom]);
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(m.points[1].x, m.points[1].y);
        ctx.stroke();
        ctx.setLineDash([]);

        drawHandle(center.x, center.y, color, isSelected);
        drawHandle(m.points[1].x, m.points[1].y, color, isSelected);

        const area = Math.PI * radius * radius;
        const areaLabel = m.label || formatArea(area);
        drawLabel(areaLabel, center.x, center.y + radius / 3 + 6 / zoom, color, 13, 'center', 'middle');

        // Radius label along radius line
        const rMidX = (center.x + m.points[1].x) / 2;
        const rMidY = (center.y + m.points[1].y) / 2;
        const rLabel = 'r=' + formatLength(radius);
        drawLabel(rLabel, rMidX, rMidY - 4 / zoom, color, 11);
      }

      // -- ANNOTATION --
      if (m.type === 'annotation' && m.points?.[0]) {
        const p = m.points[0];
        const text = m.text || m.label || 'Note';
        const fSize = 14 / zoom;
        ctx.font = `500 ${fSize}px "Inter", system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const tw = ctx.measureText(text).width;
        const pad = 6 / zoom;

        // Background
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 4 / zoom;
        const r = 3 / zoom;
        const bx = p.x - pad;
        const by = p.y - pad;
        const bw = tw + pad * 2;
        const bh = fSize + pad * 2;
        ctx.beginPath();
        ctx.moveTo(bx + r, by);
        ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
        ctx.arcTo(bx + bw, by + bh, bx, by + bh, r);
        ctx.arcTo(bx, by + bh, bx, by, r);
        ctx.arcTo(bx, by, bx + bw, by, r);
        ctx.closePath();
        ctx.fillStyle = isSelected ? '#fef3c7' : isHovered ? '#fff7ed' : '#fffbeb';
        ctx.fill();
        ctx.strokeStyle = isSelected ? COLORS.selected : isHovered ? COLORS.hover : '#94a3b8';
        ctx.lineWidth = (isSelected ? 2 : 1) / zoom;
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#1e293b';
        ctx.fillText(text, p.x, p.y);

        if (isSelected) {
          drawHandle(p.x - pad, p.y - pad, COLORS.selected, true);
        }
      }
    });

    // ---- In-progress drawing ----
    if (currentPoints.length > 0 && !calibrating) {
      const color = COLORS[tool] || '#666';
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2 / zoom;

      if (tool === TOOL_TYPES.LENGTH && currentPoints.length === 1 && mouseImg) {
        const p1 = currentPoints[0];
        const target = snapPoint || mouseImg;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
        drawHandle(p1.x, p1.y, color, false);
        // Live measurement
        const d = dist(p1, target);
        const label = formatLength(d);
        const midX = (p1.x + target.x) / 2;
        const midY = (p1.y + target.y) / 2;
        drawLabel(label, midX, midY - 8 / zoom, color, 12);
      }

      if (tool === TOOL_TYPES.AREA && currentPoints.length >= 1 && mouseImg) {
        const target = snapPoint || mouseImg;
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
        currentPoints.forEach((p, i) => { if (i > 0) ctx.lineTo(p.x, p.y); });
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
        // Close preview
        if (currentPoints.length >= 2) {
          ctx.beginPath();
          ctx.setLineDash([2 / zoom, 4 / zoom]);
          ctx.strokeStyle = color + '60';
          ctx.moveTo(target.x, target.y);
          ctx.lineTo(currentPoints[0].x, currentPoints[0].y);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        currentPoints.forEach(p => drawHandle(p.x, p.y, color, false));
        // Live area
        if (currentPoints.length >= 2) {
          const previewPts = [...currentPoints, target];
          const area = polygonArea(previewPts);
          const c = centroid(previewPts);
          drawLabel(formatArea(area), c.x, c.y, color, 12, 'center', 'middle');
        }
      }

      if (tool === TOOL_TYPES.RECTANGLE && currentPoints.length === 1 && mouseImg) {
        const target = snapPoint || mouseImg;
        const { x, y, w, h } = rectFromTwoPoints(currentPoints[0], target);
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.fillStyle = color + '10';
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        const area = w * h;
        drawLabel(formatArea(area), x + w / 2, y + h / 2, color, 12, 'center', 'middle');
        if (w > 30 / zoom) drawLabel(formatLength(w), x + w / 2, y - 4 / zoom, color, 11);
        if (h > 30 / zoom) {
          ctx.save();
          ctx.translate(x - 8 / zoom, y + h / 2);
          ctx.rotate(-Math.PI / 2);
          drawLabel(formatLength(h), 0, 0, color, 11, 'center', 'bottom');
          ctx.restore();
        }
      }

      if (tool === TOOL_TYPES.CIRCLE && currentPoints.length === 1 && mouseImg) {
        const center = currentPoints[0];
        const target = snapPoint || mouseImg;
        const r = dist(center, target);
        ctx.beginPath();
        ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
        ctx.fillStyle = color + '10';
        ctx.fill();
        ctx.stroke();
        // Radius line
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
        ctx.setLineDash([]);
        const area = Math.PI * r * r;
        drawLabel(formatArea(area), center.x, center.y + r / 3, color, 12, 'center', 'middle');
        const rMid = { x: (center.x + target.x) / 2, y: (center.y + target.y) / 2 };
        drawLabel('r=' + formatLength(r), rMid.x, rMid.y - 6 / zoom, color, 11);
      }

      ctx.setLineDash([]);
    }

    // ---- Calibration in-progress ----
    if (calibrationPoints.length > 0) {
      ctx.strokeStyle = COLORS.calibration;
      ctx.lineWidth = 2.5 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);

      if (calibrationPoints.length === 1) {
        drawHandle(calibrationPoints[0].x, calibrationPoints[0].y, COLORS.calibration, false);
        if (mouseImg) {
          ctx.beginPath();
          ctx.moveTo(calibrationPoints[0].x, calibrationPoints[0].y);
          ctx.lineTo(mouseImg.x, mouseImg.y);
          ctx.stroke();
          const d = dist(calibrationPoints[0], mouseImg);
          drawLabel(`${Math.round(d)}px`, (calibrationPoints[0].x + mouseImg.x) / 2,
            (calibrationPoints[0].y + mouseImg.y) / 2 - 8 / zoom, COLORS.calibration, 12);
        }
      }

      if (calibrationPoints.length === 2) {
        ctx.beginPath();
        ctx.moveTo(calibrationPoints[0].x, calibrationPoints[0].y);
        ctx.lineTo(calibrationPoints[1].x, calibrationPoints[1].y);
        ctx.stroke();
        calibrationPoints.forEach(p => drawHandle(p.x, p.y, COLORS.calibration, false));
      }

      ctx.setLineDash([]);
    }

    // ---- Snap indicator ----
    if (snapPoint && (tool !== TOOL_TYPES.SELECT && tool !== TOOL_TYPES.PAN && !calibrating)) {
      ctx.beginPath();
      ctx.arc(snapPoint.x, snapPoint.y, 8 / zoom, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.snap;
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();
      // Inner dot
      ctx.beginPath();
      ctx.arc(snapPoint.x, snapPoint.y, 3 / zoom, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.snap;
      ctx.fill();
    }

    ctx.restore();

    // ---- Minimap (drawn in screen space) ----
    if (showMinimap && image && imageSize.width > 0) {
      const mx = width - MINIMAP_SIZE - MINIMAP_MARGIN;
      const my = height - MINIMAP_SIZE - MINIMAP_MARGIN;
      const mmScale = Math.min(MINIMAP_SIZE / imageSize.width, MINIMAP_SIZE / imageSize.height);
      const mmW = imageSize.width * mmScale;
      const mmH = imageSize.height * mmScale;
      const mmX = mx + (MINIMAP_SIZE - mmW) / 2;
      const mmY = my + (MINIMAP_SIZE - mmH) / 2;

      // Minimap background
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(mx - 4, my - 4, MINIMAP_SIZE + 8, MINIMAP_SIZE + 8, 6);
      ctx.fill();
      ctx.stroke();

      // Minimap image
      ctx.drawImage(image, mmX, mmY, mmW, mmH);

      // Viewport rectangle
      const vpLeft = -offset.x / zoom;
      const vpTop = -offset.y / zoom;
      const vpW = width / zoom;
      const vpH = height / zoom;

      const vx = mmX + vpLeft * mmScale;
      const vy = mmY + vpTop * mmScale;
      const vw = vpW * mmScale;
      const vh = vpH * mmScale;

      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        Math.max(mmX, vx), Math.max(mmY, vy),
        Math.min(vw, mmW), Math.min(vh, mmH)
      );
      ctx.fillStyle = 'rgba(37, 99, 235, 0.08)';
      ctx.fillRect(
        Math.max(mmX, vx), Math.max(mmY, vy),
        Math.min(vw, mmW), Math.min(vh, mmH)
      );
    }

  }, [image, imageSize, measurements, currentPoints, calibrationPoints, zoom, offset,
      selectedId, hoveredId, showGrid, showMinimap, tool, calibrating, formatLength,
      formatArea, scale, mouseImg, snapPoint, crosshairEnabled]);

  // ---------------------------------------------------------------------------
  // Animation loop
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      draw();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  // Resize canvas to container
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      // Only resize if dimensions actually changed to avoid flicker
      if (canvas.width !== Math.round(rect.width) || canvas.height !== Math.round(rect.height)) {
        canvas.width = Math.round(rect.width);
        canvas.height = Math.round(rect.height);
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // ---------------------------------------------------------------------------
  // Mouse handlers
  // ---------------------------------------------------------------------------

  const handleMouseDown = (e) => {
    // Middle-click pan or pan tool
    if (e.button === 1 || (e.button === 0 && tool === TOOL_TYPES.PAN)) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      return;
    }

    // Check minimap click
    if (e.button === 0 && showMinimap && image) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const mx = canvas.width - MINIMAP_SIZE - MINIMAP_MARGIN;
      const my = canvas.height - MINIMAP_SIZE - MINIMAP_MARGIN;
      if (cx >= mx - 4 && cx <= mx + MINIMAP_SIZE + 4 && cy >= my - 4 && cy <= my + MINIMAP_SIZE + 4) {
        const mmScale = Math.min(MINIMAP_SIZE / imageSize.width, MINIMAP_SIZE / imageSize.height);
        const mmW = imageSize.width * mmScale;
        const mmH = imageSize.height * mmScale;
        const mmX = mx + (MINIMAP_SIZE - mmW) / 2;
        const mmY = my + (MINIMAP_SIZE - mmH) / 2;
        const imgX = (cx - mmX) / mmScale;
        const imgY = (cy - mmY) / mmScale;
        // Center viewport on clicked image point
        setOffset({
          x: canvas.width / 2 - imgX * zoom,
          y: canvas.height / 2 - imgY * zoom
        });
        return;
      }
    }

    if (e.button !== 0) return;

    const rawPt = screenToImage(e.clientX, e.clientY);
    const pt = snapPoint || rawPt;

    // Calibration mode
    if (calibrating) {
      const newCalPts = [...calibrationPoints, pt];
      setCalibrationPoints(newCalPts);
      if (newCalPts.length === 2) {
        const d = dist(newCalPts[0], newCalPts[1]);
        const known = prompt('Enter the real-world length of this line (e.g. "10"):');
        if (known && !isNaN(Number(known)) && Number(known) > 0) {
          const unitName = prompt('Enter the unit (e.g. "ft", "in", "m"):', 'ft') || 'ft';
          const ppu = d / Number(known);
          onScaleChange({ pixelsPerUnit: ppu, unit: unitName, calibrationLength: Number(known) });
        }
        setCalibrating(false);
        setCalibrationPoints([]);
      }
      return;
    }

    // SELECT tool
    if (tool === TOOL_TYPES.SELECT) {
      const found = hitTest(rawPt);
      setSelectedId(found);
      if (!found) {
        // Start pan on empty area
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      }
      return;
    }

    // LENGTH tool
    if (tool === TOOL_TYPES.LENGTH) {
      const newPts = [...currentPoints, pt];
      setCurrentPoints(newPts);
      if (newPts.length === 2) {
        const newM = { id: `m_${Date.now()}`, type: 'length', points: newPts, label: '' };
        const updated = [...measurements, newM];
        onMeasurementsChange(updated);
        pushHistory(updated);
        setCurrentPoints([]);
      }
      return;
    }

    // AREA tool
    if (tool === TOOL_TYPES.AREA) {
      setCurrentPoints(prev => [...prev, pt]);
      return;
    }

    // COUNT tool
    if (tool === TOOL_TYPES.COUNT) {
      const newM = { id: `m_${Date.now()}`, type: 'count', points: [pt], count: 1, label: '' };
      const updated = [...measurements, newM];
      onMeasurementsChange(updated);
      pushHistory(updated);
      return;
    }

    // RECTANGLE tool
    if (tool === TOOL_TYPES.RECTANGLE) {
      const newPts = [...currentPoints, pt];
      setCurrentPoints(newPts);
      if (newPts.length === 2) {
        const newM = { id: `m_${Date.now()}`, type: 'rectangle', points: newPts, label: '' };
        const updated = [...measurements, newM];
        onMeasurementsChange(updated);
        pushHistory(updated);
        setCurrentPoints([]);
      }
      return;
    }

    // CIRCLE tool
    if (tool === TOOL_TYPES.CIRCLE) {
      const newPts = [...currentPoints, pt];
      setCurrentPoints(newPts);
      if (newPts.length === 2) {
        const newM = { id: `m_${Date.now()}`, type: 'circle', points: newPts, label: '' };
        const updated = [...measurements, newM];
        onMeasurementsChange(updated);
        pushHistory(updated);
        setCurrentPoints([]);
      }
      return;
    }

    // ANNOTATION tool
    if (tool === TOOL_TYPES.ANNOTATION) {
      const text = prompt('Enter annotation text:');
      if (text && text.trim()) {
        const newM = { id: `m_${Date.now()}`, type: 'annotation', points: [pt], text: text.trim(), label: text.trim() };
        const updated = [...measurements, newM];
        onMeasurementsChange(updated);
        pushHistory(updated);
      }
      return;
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    if (!canvasRef.current) return;
    const imgPt = screenToImage(e.clientX, e.clientY);
    setMouseImg(imgPt);

    // Snap detection
    const snap = findSnapPoint(imgPt);
    setSnapPoint(snap);

    // Hover detection (only in select mode or when idle)
    if (tool === TOOL_TYPES.SELECT && !calibrating) {
      const found = hitTest(imgPt);
      setHoveredId(found);
    } else {
      setHoveredId(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleMouseLeave = () => {
    handleMouseUp();
    setMouseImg(null);
    setSnapPoint(null);
    setHoveredId(null);
  };

  const handleDoubleClick = () => {
    // Close area polygon
    if (tool === TOOL_TYPES.AREA && currentPoints.length >= 3) {
      const newM = { id: `m_${Date.now()}`, type: 'area', points: [...currentPoints], label: '' };
      const updated = [...measurements, newM];
      onMeasurementsChange(updated);
      pushHistory(updated);
      setCurrentPoints([]);
      return;
    }

    // Double-click to edit label on selected
    if (tool === TOOL_TYPES.SELECT && selectedId) {
      const m = measurements.find(x => x.id === selectedId);
      if (m) {
        const currentLabel = m.type === 'annotation' ? (m.text || '') : (m.label || '');
        const newLabel = prompt('Edit label:', currentLabel);
        if (newLabel !== null) {
          const updated = measurements.map(x =>
            x.id === selectedId
              ? { ...x, label: newLabel, ...(x.type === 'annotation' ? { text: newLabel } : {}) }
              : x
          );
          onMeasurementsChange(updated);
          pushHistory(updated);
        }
      }
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    const newZoom = Math.max(0.05, Math.min(8, zoom * delta));

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setOffset(prev => ({
      x: mouseX - (mouseX - prev.x) * (newZoom / zoom),
      y: mouseY - (mouseY - prev.y) * (newZoom / zoom)
    }));
    setZoom(newZoom);
  };

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    const updated = measurements.filter(m => m.id !== selectedId);
    onMeasurementsChange(updated);
    pushHistory(updated);
    setSelectedId(null);
  }, [selectedId, measurements, onMeasurementsChange, pushHistory]);

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return;
    const m = measurements.find(x => x.id === selectedId);
    if (!m) return;
    const offsetAmt = 20 / zoom;
    const dup = {
      ...JSON.parse(JSON.stringify(m)),
      id: `m_${Date.now()}`,
      points: m.points.map(p => ({ x: p.x + offsetAmt, y: p.y + offsetAmt }))
    };
    const updated = [...measurements, dup];
    onMeasurementsChange(updated);
    pushHistory(updated);
    setSelectedId(dup.id);
  }, [selectedId, measurements, onMeasurementsChange, pushHistory, zoom]);

  const fitToScreen = () => {
    if (!image || !containerRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const fitZoom = Math.min(
      (container.width - 40) / imageSize.width,
      (container.height - 40) / imageSize.height,
      1
    );
    setZoom(fitZoom);
    setOffset({
      x: (container.width - imageSize.width * fitZoom) / 2,
      y: (container.height - imageSize.height * fitZoom) / 2
    });
  };

  const clearAll = () => {
    if (measurements.length === 0) return;
    if (!window.confirm('Clear all measurements?')) return;
    onMeasurementsChange([]);
    pushHistory([]);
    setSelectedId(null);
    setCurrentPoints([]);
  };

  const exportImage = useCallback(() => {
    if (!image) return;
    // Create an off-screen canvas at full image resolution
    const exp = document.createElement('canvas');
    exp.width = imageSize.width;
    exp.height = imageSize.height;
    const ectx = exp.getContext('2d');

    // Draw blueprint
    ectx.drawImage(image, 0, 0);

    // Draw measurements at 1:1 scale by temporarily setting zoom=1 offset=0
    // We re-render to the export canvas by directly calling a mini draw
    // For simplicity, capture current canvas with measurements
    const srcCanvas = canvasRef.current;
    if (srcCanvas) {
      // Use a temporary full-res render
      const tmp = document.createElement('canvas');
      tmp.width = imageSize.width;
      tmp.height = imageSize.height;
      const tctx = tmp.getContext('2d');
      tctx.drawImage(image, 0, 0);

      // Render measurements at 1:1
      measurements.forEach(m => {
        const color = COLORS[m.type] || '#666';
        const lw = 2;

        if (m.type === 'length' && m.points?.length === 2) {
          const [p1, p2] = m.points;
          tctx.beginPath();
          tctx.strokeStyle = color;
          tctx.lineWidth = lw;
          tctx.moveTo(p1.x, p1.y);
          tctx.lineTo(p2.x, p2.y);
          tctx.stroke();

          const d = dist(p1, p2);
          const label = m.label || formatLength(d);
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          tctx.font = 'bold 14px sans-serif';
          tctx.textAlign = 'center';
          tctx.textBaseline = 'bottom';
          const tw = tctx.measureText(label).width;
          tctx.fillStyle = 'rgba(255,255,255,0.9)';
          tctx.fillRect(midX - tw / 2 - 4, midY - 18, tw + 8, 18);
          tctx.fillStyle = color;
          tctx.fillText(label, midX, midY - 2);
        }

        if (m.type === 'area' && m.points?.length >= 3) {
          tctx.beginPath();
          tctx.moveTo(m.points[0].x, m.points[0].y);
          m.points.forEach((p, i) => { if (i > 0) tctx.lineTo(p.x, p.y); });
          tctx.closePath();
          tctx.fillStyle = color + '20';
          tctx.fill();
          tctx.strokeStyle = color;
          tctx.lineWidth = lw;
          tctx.stroke();

          const c = centroid(m.points);
          const area = polygonArea(m.points);
          const label = m.label || formatArea(area);
          tctx.font = 'bold 14px sans-serif';
          tctx.textAlign = 'center';
          tctx.textBaseline = 'middle';
          tctx.fillStyle = color;
          tctx.fillText(label, c.x, c.y);
        }

        if (m.type === 'rectangle' && m.points?.length === 2) {
          const { x, y, w, h } = rectFromTwoPoints(m.points[0], m.points[1]);
          tctx.beginPath();
          tctx.rect(x, y, w, h);
          tctx.fillStyle = color + '18';
          tctx.fill();
          tctx.strokeStyle = color;
          tctx.lineWidth = lw;
          tctx.stroke();

          const area = w * h;
          const label = m.label || formatArea(area);
          tctx.font = 'bold 14px sans-serif';
          tctx.textAlign = 'center';
          tctx.textBaseline = 'middle';
          tctx.fillStyle = color;
          tctx.fillText(label, x + w / 2, y + h / 2);
        }

        if (m.type === 'circle' && m.points?.length === 2) {
          const center = m.points[0];
          const radius = dist(m.points[0], m.points[1]);
          tctx.beginPath();
          tctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
          tctx.fillStyle = color + '18';
          tctx.fill();
          tctx.strokeStyle = color;
          tctx.lineWidth = lw;
          tctx.stroke();

          const area = Math.PI * radius * radius;
          const label = m.label || formatArea(area);
          tctx.font = 'bold 14px sans-serif';
          tctx.textAlign = 'center';
          tctx.textBaseline = 'middle';
          tctx.fillStyle = color;
          tctx.fillText(label, center.x, center.y);
        }

        if (m.type === 'count' && m.points?.[0]) {
          const p = m.points[0];
          tctx.beginPath();
          tctx.fillStyle = color + '30';
          tctx.strokeStyle = color;
          tctx.lineWidth = 2;
          tctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
          tctx.fill();
          tctx.stroke();
          tctx.font = 'bold 12px sans-serif';
          tctx.fillStyle = color;
          tctx.textAlign = 'center';
          tctx.textBaseline = 'middle';
          tctx.fillText(String(m.count || 1), p.x, p.y);
        }

        if (m.type === 'annotation' && m.points?.[0]) {
          const p = m.points[0];
          const text = m.text || m.label || 'Note';
          tctx.font = '500 14px sans-serif';
          const tw = tctx.measureText(text).width;
          tctx.fillStyle = '#fffbeb';
          tctx.strokeStyle = '#94a3b8';
          tctx.lineWidth = 1;
          tctx.fillRect(p.x - 6, p.y - 6, tw + 12, 26);
          tctx.strokeRect(p.x - 6, p.y - 6, tw + 12, 26);
          tctx.fillStyle = '#1e293b';
          tctx.textAlign = 'left';
          tctx.textBaseline = 'top';
          tctx.fillText(text, p.x, p.y);
        }
      });

      // Download
      const link = document.createElement('a');
      link.download = `blueprint-takeoff-${Date.now()}.png`;
      link.href = tmp.toDataURL('image/png');
      link.click();
    }
  }, [image, imageSize, measurements, formatLength, formatArea]);

  // ---------------------------------------------------------------------------
  // Keyboard shortcuts
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      const key = e.key.toLowerCase();

      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey) {
        switch (key) {
          case 'v': setTool(TOOL_TYPES.SELECT); setCurrentPoints([]); return;
          case 'h': setTool(TOOL_TYPES.PAN); setCurrentPoints([]); return;
          case 'l': setTool(TOOL_TYPES.LENGTH); setCurrentPoints([]); return;
          case 'a': setTool(TOOL_TYPES.AREA); setCurrentPoints([]); return;
          case 'c': setTool(TOOL_TYPES.COUNT); setCurrentPoints([]); return;
          case 'r': setTool(TOOL_TYPES.RECTANGLE); setCurrentPoints([]); return;
          case 'o': setTool(TOOL_TYPES.CIRCLE); setCurrentPoints([]); return;
          case 't': setTool(TOOL_TYPES.ANNOTATION); setCurrentPoints([]); return;
          case 'g': setShowGrid(g => !g); return;
          case 's': setSnapEnabled(s => !s); return;
          case 'x': setCrosshairEnabled(c => !c); return;
          case 'm': setShowMinimap(v => !v); return;
        }
      }

      switch (key) {
        case 'delete':
        case 'backspace':
          if (!e.ctrlKey && !e.metaKey) deleteSelected();
          break;
        case 'escape':
          setCurrentPoints([]);
          setCalibrating(false);
          setCalibrationPoints([]);
          setSelectedId(null);
          setTool(TOOL_TYPES.SELECT);
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) redo(); else undo();
          }
          break;
        case 'y':
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); redo(); }
          break;
        case 'd':
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); duplicateSelected(); }
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedId, measurements, undo, redo, deleteSelected, duplicateSelected]);

  // ---------------------------------------------------------------------------
  // Toolbar config
  // ---------------------------------------------------------------------------

  const toolButtons = [
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

  const getCursorStyle = () => {
    if (isDragging) return 'grabbing';
    if (tool === TOOL_TYPES.PAN) return 'grab';
    if (hoveredId && tool === TOOL_TYPES.SELECT) return 'pointer';
    if (tool === TOOL_TYPES.SELECT) return 'default';
    if (calibrating) return 'crosshair';
    return 'crosshair';
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-white border-b border-gray-200 flex-wrap">
        {/* Tool buttons */}
        <div className="flex items-center gap-0.5">
          {toolButtons.map(btn => {
            if (btn.separator) {
              return <div key={btn.id} className="w-px h-6 bg-gray-200 mx-1" />;
            }
            const Icon = btn.icon;
            const isActive = tool === btn.id;
            const typeColor = COLORS[btn.id];
            return (
              <button
                key={btn.id}
                onClick={() => { setTool(btn.id); setCurrentPoints([]); }}
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
            onClick={() => setZoom(z => Math.min(8, z * 1.25))}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(0.05, z * 0.8))}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-gray-500 w-10 text-center font-mono tabular-nums select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={fitToScreen}
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
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-25 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-25 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            onClick={duplicateSelected}
            disabled={!selectedId}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-25 disabled:cursor-not-allowed"
            title="Duplicate (Ctrl+D)"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={deleteSelected}
            disabled={!selectedId}
            className="p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded disabled:opacity-25 disabled:cursor-not-allowed"
            title="Delete (Del)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={clearAll}
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
            onClick={() => setShowGrid(g => !g)}
            className={`p-1.5 rounded transition-colors ${
              showGrid ? 'bg-gray-200 text-gray-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="Toggle Grid (G)"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSnapEnabled(s => !s)}
            className={`p-1.5 rounded transition-colors ${
              snapEnabled ? 'bg-pink-100 text-pink-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="Snap to Points (S)"
          >
            <Magnet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCrosshairEnabled(c => !c)}
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
            onClick={() => {
              setCalibrating(true);
              setCalibrationPoints([]);
              setCurrentPoints([]);
            }}
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
            onClick={exportImage}
            disabled={!image}
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

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ minHeight: 400, backgroundColor: '#f1f5f9' }}
      >
        {!imageUrl ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Ruler className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No blueprint loaded</p>
              <p className="text-sm">Upload a blueprint image to begin measuring</p>
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onDoubleClick={handleDoubleClick}
            onWheel={handleWheel}
            style={{ cursor: getCursorStyle() }}
            className="absolute inset-0"
          />
        )}

        {/* Calibration instruction overlay */}
        {calibrating && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            Click two points on a known dimension ({calibrationPoints.length}/2)
            <button
              onClick={() => { setCalibrating(false); setCalibrationPoints([]); }}
              className="ml-2 text-purple-200 hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Tool hint overlay */}
        {tool === TOOL_TYPES.AREA && currentPoints.length > 0 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs font-medium">
            Click to add points ({currentPoints.length}). Double-click to close polygon. Esc to cancel.
          </div>
        )}
        {(tool === TOOL_TYPES.LENGTH || tool === TOOL_TYPES.RECTANGLE || tool === TOOL_TYPES.CIRCLE) && currentPoints.length === 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs font-medium">
            {tool === TOOL_TYPES.LENGTH && 'Click second point to complete. Esc to cancel.'}
            {tool === TOOL_TYPES.RECTANGLE && 'Click opposite corner to complete. Esc to cancel.'}
            {tool === TOOL_TYPES.CIRCLE && 'Click edge point to set radius. Esc to cancel.'}
          </div>
        )}

        {/* Keyboard shortcut hint - shown briefly or on ? key */}
        {/* Coordinates display */}
        {mouseImg && image && (
          <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded px-2 py-1 text-[10px] font-mono text-gray-500 tabular-nums select-none">
            {Math.round(mouseImg.x)}, {Math.round(mouseImg.y)}
            {scale?.pixelsPerUnit && (
              <span className="ml-2 text-gray-400">
                ({(mouseImg.x / scale.pixelsPerUnit).toFixed(1)}, {(mouseImg.y / scale.pixelsPerUnit).toFixed(1)} {scale.unit})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
