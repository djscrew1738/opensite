import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MeasurementType,
  calculateDistance,
  calculatePolygonArea,
  calculatePerimeter,
  calculateAngle,
  getMidpoint,
  getCentroid,
  formatMeasurement,
  generateMeasurementId,
  DEFAULT_MEASUREMENT_COLORS,
} from './measurementTypes';
import { Ruler, Square, X, Check, Trash2, Move } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Distance Measurement Component
// ═══════════════════════════════════════════════════════════════

function DistanceMeasurement({
  measurement,
  scale,
  unit,
  isActive,
  isSelected,
  onClick,
  onDelete,
  onUpdate,
}) {
  const { points, label } = measurement;
  if (points.length < 2) return null;

  const p1 = points[0];
  const p2 = points[1];
  const distance = calculateDistance(p1, p2, scale);
  const midpoint = getMidpoint(p1, p2);
  const angle = calculateAngle(p1, p2);
  const color = DEFAULT_MEASUREMENT_COLORS.distance;

  return (
    <g
      className="measurement-group"
      style={{ cursor: isActive ? 'crosshair' : 'pointer' }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(measurement.id);
      }}
    >
      {/* Main line */}
      <line
        x1={`${p1.x * 100}%`}
        y1={`${p1.y * 100}%`}
        x2={`${p2.x * 100}%`}
        y2={`${p2.y * 100}%`}
        stroke={color}
        strokeWidth={isSelected ? 3 : 2}
        strokeLinecap="round"
        strokeDasharray={isActive ? '5,5' : 'none'}
        opacity={isActive ? 0.8 : 1}
      />

      {/* Selection highlight */}
      {isSelected && (
        <line
          x1={`${p1.x * 100}%`}
          y1={`${p1.y * 100}%`}
          x2={`${p2.x * 100}%`}
          y2={`${p2.y * 100}%`}
          stroke={color}
          strokeWidth={8}
          strokeOpacity={0.2}
          strokeLinecap="round"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Endpoints */}
      <circle
        cx={`${p1.x * 100}%`}
        cy={`${p1.y * 100}%`}
        r={isSelected ? 6 : 4}
        fill={color}
        stroke="white"
        strokeWidth={2}
      />
      <circle
        cx={`${p2.x * 100}%`}
        cy={`${p2.y * 100}%`}
        r={isSelected ? 6 : 4}
        fill={color}
        stroke="white"
        strokeWidth={2}
      />

      {/* Label background */}
      <foreignObject
        x={`${midpoint.x * 100}%`}
        y={`${midpoint.y * 100}%`}
        width="100"
        height="30"
        style={{
          transform: 'translate(-50px, -35px)',
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        <div className="flex flex-col items-center">
          <div
            className="px-2 py-1 rounded-lg text-xs font-semibold text-white shadow-lg"
            style={{ backgroundColor: color, whiteSpace: 'nowrap' }}
          >
            {formatMeasurement(distance, unit)}
          </div>
          {label && (
            <div className="mt-1 px-2 py-0.5 rounded text-xs text-surface-300 bg-surface-900/80">
              {label}
            </div>
          )}
        </div>
      </foreignObject>

      {/* Delete button (when selected) */}
      {isSelected && (
        <foreignObject
          x={`${p2.x * 100}%`}
          y={`${p2.y * 100}%`}
          width="24"
          height="24"
          style={{ transform: 'translate(10px, -12px)' }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(measurement.id);
            }}
            className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-lg"
          >
            <X className="w-3 h-3" />
          </button>
        </foreignObject>
      )}
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════
// Area Measurement Component
// ═══════════════════════════════════════════════════════════════

function AreaMeasurement({
  measurement,
  scale,
  unit,
  isActive,
  isSelected,
  onClick,
  onDelete,
}) {
  const { points, label } = measurement;
  if (points.length < 3) return null;

  const area = calculatePolygonArea(points, scale);
  const perimeter = calculatePerimeter(points, scale);
  const centroid = getCentroid(points);
  const color = DEFAULT_MEASUREMENT_COLORS.area;

  // Generate polygon path
  const pathD = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x * 100} ${p.y * 100}`
  ).join(' ') + ' Z';

  return (
    <g
      className="measurement-group"
      style={{ cursor: isActive ? 'crosshair' : 'pointer' }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(measurement.id);
      }}
    >
      {/* Fill */}
      <path
        d={pathD}
        fill={color}
        fillOpacity={isSelected ? 0.3 : 0.15}
        stroke={color}
        strokeWidth={isSelected ? 3 : 2}
        strokeLinejoin="round"
        strokeDasharray={isActive ? '5,5' : 'none'}
      />

      {/* Perimeter line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeDasharray="none"
        style={{ pointerEvents: 'none' }}
      />

      {/* Vertices */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={`${p.x * 100}%`}
          cy={`${p.y * 100}%`}
          r={isSelected ? 5 : 3}
          fill={color}
          stroke="white"
          strokeWidth={2}
        />
      ))}

      {/* Label */}
      <foreignObject
        x={`${centroid.x * 100}%`}
        y={`${centroid.y * 100}%`}
        width="140"
        height="50"
        style={{
          transform: 'translate(-70px, -25px)',
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        <div className="flex flex-col items-center">
          <div
            className="px-2 py-1 rounded-lg text-xs font-semibold text-white shadow-lg"
            style={{ backgroundColor: color }}
          >
            {formatMeasurement(area, unit === 'ft' ? 'sq ft' : 'm²', 1)}
          </div>
          <div className="mt-1 px-2 py-0.5 rounded text-xs text-surface-300 bg-surface-900/80">
            Perimeter: {formatMeasurement(perimeter, unit, 0)}
          </div>
          {label && (
            <div className="mt-0.5 px-2 py-0.5 rounded text-xs text-surface-400 bg-surface-900/80">
              {label}
            </div>
          )}
        </div>
      </foreignObject>

      {/* Delete button */}
      {isSelected && (
        <foreignObject
          x={`${points[0].x * 100}%`}
          y={`${points[0].y * 100}%`}
          width="24"
          height="24"
          style={{ transform: 'translate(-30px, -30px)' }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(measurement.id);
            }}
            className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-lg"
          >
            <X className="w-3 h-3" />
          </button>
        </foreignObject>
      )}
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════
// Active Measurement Drawing
// ═══════════════════════════════════════════════════════════════

function ActiveMeasurement({
  type,
  points,
  currentPoint,
  scale,
  unit,
}) {
  if (!points.length && !currentPoint) return null;

  const allPoints = currentPoint ? [...points, currentPoint] : points;
  const color = DEFAULT_MEASUREMENT_COLORS[type];

  if (type === MeasurementType.DISTANCE && allPoints.length >= 1) {
    const p1 = allPoints[0];
    const p2 = allPoints[allPoints.length - 1];
    const distance = calculateDistance(p1, p2, scale);
    const midpoint = getMidpoint(p1, p2);

    return (
      <g style={{ pointerEvents: 'none' }}>
        <line
          x1={`${p1.x * 100}%`}
          y1={`${p1.y * 100}%`}
          x2={`${p2.x * 100}%`}
          y2={`${p2.y * 100}%`}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="5,5"
          opacity={0.8}
        />
        <circle
          cx={`${p1.x * 100}%`}
          cy={`${p1.y * 100}%`}
          r={5}
          fill={color}
          stroke="white"
          strokeWidth={2}
        />
        <circle
          cx={`${p2.x * 100}%`}
          cy={`${p2.y * 100}%`}
          r={5}
          fill={color}
          stroke="white"
          strokeWidth={2}
        />
        <foreignObject
          x={`${midpoint.x * 100}%`}
          y={`${midpoint.y * 100}%`}
          width="100"
          height="24"
          style={{ transform: 'translate(-50px, -35px)', overflow: 'visible' }}
        >
          <div
            className="px-2 py-1 rounded-lg text-xs font-semibold text-white shadow-lg"
            style={{ backgroundColor: color, whiteSpace: 'nowrap' }}
          >
            {formatMeasurement(distance, unit)}
          </div>
        </foreignObject>
      </g>
    );
  }

  if (type === MeasurementType.AREA && allPoints.length >= 2) {
    const pathD = allPoints.map((p, i) => 
      `${i === 0 ? 'M' : 'L'} ${p.x * 100} ${p.y * 100}`
    ).join(' ');

    return (
      <g style={{ pointerEvents: 'none' }}>
        <path
          d={pathD}
          fill={color}
          fillOpacity={0.1}
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeDasharray="5,5"
        />
        {allPoints.map((p, i) => (
          <circle
            key={i}
            cx={`${p.x * 100}%`}
            cy={`${p.y * 100}%`}
            r={4}
            fill={color}
            stroke="white"
            strokeWidth={2}
          />
        ))}
      </g>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
// Main Overlay Component
// ═══════════════════════════════════════════════════════════════

export function MeasurementOverlay({
  measurements = [],
  activeTool = null,
  scale = 1,
  unit = 'ft',
  onMeasurementAdd,
  onMeasurementUpdate,
  onMeasurementDelete,
  onMeasurementSelect,
  selectedId,
  viewerRef,
  isVisible = true,
}) {
  const [activePoints, setActivePoints] = useState([]);
  const [currentPoint, setCurrentPoint] = useState(null);
  const svgRef = useRef(null);

  // Convert mouse position to normalized coordinates
  const getNormalizedPoint = useCallback((clientX, clientY) => {
    if (!viewerRef.current || !window.OpenSeadragon) return { x: 0.5, y: 0.5 };
    
    const viewer = viewerRef.current;
    const element = viewer.element;
    const rect = element.getBoundingClientRect();
    
    const pixel = new window.OpenSeadragon.Point(
      clientX - rect.left,
      clientY - rect.top
    );
    
    const viewportPoint = viewer.viewport.pointFromPixel(pixel);
    const imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint);
    const imageSize = viewer.world.getItemAt(0)?.getContentSize() || { x: 1, y: 1 };
    
    return {
      x: Math.max(0, Math.min(1, imagePoint.x / imageSize.x)),
      y: Math.max(0, Math.min(1, imagePoint.y / imageSize.y)),
    };
  }, [viewerRef]);

  // Handle mouse move for preview
  const handleMouseMove = useCallback((e) => {
    if (!activeTool) return;
    const point = getNormalizedPoint(e.clientX, e.clientY);
    setCurrentPoint(point);
  }, [activeTool, getNormalizedPoint]);

  // Handle click to add point
  const handleClick = useCallback((e) => {
    if (!activeTool) return;
    e.stopPropagation();

    const point = getNormalizedPoint(e.clientX, e.clientY);

    if (activeTool === MeasurementType.DISTANCE) {
      if (activePoints.length === 0) {
        setActivePoints([point]);
      } else {
        // Complete distance measurement
        const newMeasurement = {
          id: generateMeasurementId(),
          type: MeasurementType.DISTANCE,
          points: [activePoints[0], point],
          label: '',
          createdAt: new Date().toISOString(),
        };
        onMeasurementAdd?.(newMeasurement);
        setActivePoints([]);
        setCurrentPoint(null);
      }
    } else if (activeTool === MeasurementType.AREA) {
      // Check if closing the polygon (clicking near first point)
      if (activePoints.length >= 3) {
        const firstPoint = activePoints[0];
        const distance = calculateDistance(point, firstPoint, 1);
        
        if (distance < 0.02) {
          // Close polygon
          const newMeasurement = {
            id: generateMeasurementId(),
            type: MeasurementType.AREA,
            points: [...activePoints],
            label: '',
            createdAt: new Date().toISOString(),
          };
          onMeasurementAdd?.(newMeasurement);
          setActivePoints([]);
          setCurrentPoint(null);
          return;
        }
      }
      
      setActivePoints(prev => [...prev, point]);
    }
  }, [activeTool, activePoints, getNormalizedPoint, onMeasurementAdd]);

  // Handle right-click to cancel
  const handleContextMenu = useCallback((e) => {
    if (activeTool && activePoints.length > 0) {
      e.preventDefault();
      setActivePoints([]);
      setCurrentPoint(null);
    }
  }, [activeTool, activePoints.length]);

  // Handle key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activePoints.length > 0) {
        setActivePoints([]);
        setCurrentPoint(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePoints.length]);

  if (!isVisible) return null;

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      style={{ cursor: activeTool ? 'crosshair' : 'default' }}
    >
      {/* Completed measurements */}
      <AnimatePresence>
        {measurements.map((measurement) => {
          const isSelected = selectedId === measurement.id;
          
          if (measurement.type === MeasurementType.DISTANCE) {
            return (
              <DistanceMeasurement
                key={measurement.id}
                measurement={measurement}
                scale={scale}
                unit={unit}
                isActive={false}
                isSelected={isSelected}
                onClick={onMeasurementSelect}
                onDelete={onMeasurementDelete}
              />
            );
          }
          
          if (measurement.type === MeasurementType.AREA) {
            return (
              <AreaMeasurement
                key={measurement.id}
                measurement={measurement}
                scale={scale}
                unit={unit}
                isActive={false}
                isSelected={isSelected}
                onClick={onMeasurementSelect}
                onDelete={onMeasurementDelete}
              />
            );
          }
          
          return null;
        })}
      </AnimatePresence>

      {/* Active measurement being drawn */}
      {activeTool && (
        <ActiveMeasurement
          type={activeTool}
          points={activePoints}
          currentPoint={currentPoint}
          scale={scale}
          unit={unit}
        />
      )}
    </svg>
  );
}

export default MeasurementOverlay;
