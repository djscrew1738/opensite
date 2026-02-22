import { useMemo } from 'react';

/**
 * CanvasConnection - Renders connection lines between pins/nodes
 * 
 * Supports:
 * - Straight lines
 * - Curved bezier paths
 * - Different line styles (solid, dashed, dotted)
 * - Arrowheads for directed connections
 * - Labels along the path
 */

const STYLES = {
  solid: undefined,
  dashed: '8,4',
  dotted: '2,2',
  pipe: '12,6,2,6',
};

export default function CanvasConnection({ 
  connection, 
  pins, 
  nodes, 
  viewBox,
  animated = false,
}) {
  // Get pin positions
  const fromPin = pins.find(p => p.id === connection.fromPin);
  const toPin = pins.find(p => p.id === connection.toPin);

  const path = useMemo(() => {
    if (!fromPin || !toPin) return null;

    const fromNode = nodes.find(n => n.id === fromPin.nodeId);
    const toNode = nodes.find(n => n.id === toPin.nodeId);
    
    if (!fromNode || !toNode) return null;

    // Calculate absolute positions
    const fromX = (fromNode.x + fromPin.x * fromNode.scale) * viewBox.zoom;
    const fromY = (fromNode.y + fromPin.y * fromNode.scale) * viewBox.zoom;
    const toX = (toNode.x + toPin.x * toNode.scale) * viewBox.zoom;
    const toY = (toNode.y + toPin.y * toNode.scale) * viewBox.zoom;

    // Calculate control points for bezier curve
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Curvature based on distance
    const curvature = Math.min(dist * 0.3, 150);
    
    let d;
    if (connection.style === 'straight') {
      d = `M ${fromX} ${fromY} L ${toX} ${toY}`;
    } else {
      // Curved path with control points
      const cp1x = fromX + (dx > 0 ? curvature : -curvature);
      const cp1y = fromY;
      const cp2x = toX - (dx > 0 ? curvature : -curvature);
      const cp2y = toY;
      
      d = `M ${fromX} ${fromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toX} ${toY}`;
    }

    return {
      d,
      fromX, fromY, toX, toY,
      midX: (fromX + toX) / 2,
      midY: (fromY + toY) / 2,
    };
  }, [fromPin, toPin, nodes, viewBox.zoom, connection.style]);

  if (!path) return null;

  const { d, fromX, fromY, toX, toY, midX, midY } = path;
  const strokeColor = connection.color || '#3B82F6';
  const strokeWidth = (connection.width || 2) * viewBox.zoom;
  const dashArray = STYLES[connection.style] || STYLES.solid;

  // Calculate arrow angle
  const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;

  return (
    <g className="canvas-connection">
      {/* Glow effect for pipe/wall connections */}
      {connection.type === 'pipe' && (
        <path
          d={d}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth + 4}
          strokeOpacity={0.3}
          strokeLinecap="round"
        />
      )}

      {/* Main path */}
      <path
        d={d}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        strokeLinecap="round"
        className={animated ? 'animate-dash' : ''}
        style={animated ? {
          strokeDasharray: '10,5',
          animation: 'dash 1s linear infinite',
        } : {}}
      />

      {/* Arrowhead for directed connections */}
      {connection.directed && (
        <g transform={`translate(${toX}, ${toY}) rotate(${angle})`}>
          <polygon
            points={`0,0 -8,-4 -8,4`}
            fill={strokeColor}
          />
        </g>
      )}

      {/* Label */}
      {connection.label && (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect
            x={-connection.label.length * 3 - 8}
            y={-10}
            width={connection.label.length * 6 + 16}
            height={20}
            rx={4}
            fill="white"
            stroke={strokeColor}
            strokeWidth={1}
            className="dark:fill-surface-800"
          />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            className="text-[10px] fill-surface-700 dark:fill-surface-300"
            style={{ fontSize: '10px' }}
          >
            {connection.label}
          </text>
        </g>
      )}

      {/* Distance marker for measurements */}
      {connection.type === 'measurement' && connection.distance && (
        <g transform={`translate(${midX}, ${midY})`}>
          <circle r={14} fill={strokeColor} />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            className="text-[9px] fill-white font-medium"
            style={{ fontSize: '9px' }}
          >
            {connection.distance}
          </text>
        </g>
      )}

      {/* Flow direction indicators for pipes */}
      {connection.type === 'pipe' && connection.showFlow && (
        <>
          {[0.25, 0.5, 0.75].map((t, i) => {
            // Approximate position along bezier curve
            const tx = fromX + (toX - fromX) * t;
            const ty = fromY + (toY - fromY) * t;
            return (
              <circle
                key={i}
                cx={tx}
                cy={ty}
                r={3}
                fill={strokeColor}
                className="animate-pulse"
              />
            );
          })}
        </>
      )}
    </g>
  );
}

/**
 * Renders a temporary connection line while dragging
 */
export function TemporaryConnection({ from, to, color = '#3B82F6', style = 'solid' }) {
  if (!from || !to) return null;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const curvature = Math.min(Math.sqrt(dx * dx + dy * dy) * 0.2, 100);

  const d = `M ${from.x} ${from.y} C ${from.x + curvature} ${from.y}, ${to.x - curvature} ${to.y}, ${to.x} ${to.y}`;

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeDasharray={STYLES[style]}
      strokeLinecap="round"
      opacity={0.6}
    />
  );
}
