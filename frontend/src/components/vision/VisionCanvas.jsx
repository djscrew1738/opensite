/**
 * VisionCanvas Component
 * Spatial workspace for blueprint analysis
 * 
 * Features:
 * - Infinite canvas with pan/zoom
 * - Multiple blueprint nodes (side-by-side comparison)
 * - Pin findings with connections
 * - Drawing overlays (pipes, walls, fixtures)
 * - OCR text overlay
 * - Spatial relationship visualization
 * 
 * @module components/vision/VisionCanvas
 */

import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { 
  Move, MousePointer2, Pencil, Circle, Square, 
  ArrowRight, Type, Trash2, ZoomIn, ZoomOut, 
  Maximize2, Grid3X3, Layers, Pin, Link,
  Eye, EyeOff, Download, Undo, Redo,
  Plus, X, ChevronDown, MoreHorizontal
} from 'lucide-react';
import { colors } from '../../styles/tokens';
import { visionApi } from '../../api/vision';
import CanvasNode from './CanvasNode';
import CanvasConnection from './CanvasConnection';
import CanvasToolbar from './CanvasToolbar';
import OcrOverlay from './OcrOverlay';
import PinSystem from './PinSystem';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const CANVAS_MODES = {
  SELECT: 'select',
  PAN: 'pan',
  DRAW_PIPE: 'draw_pipe',
  DRAW_WALL: 'draw_wall',
  DRAW_FIXTURE: 'draw_fixture',
  PIN: 'pin',
  CONNECT: 'connect',
  MEASURE: 'measure',
  TEXT: 'text',
};

const DEFAULT_CANVAS_STATE = {
  nodes: [],
  connections: [],
  pins: [],
  drawings: [],
  viewBox: { x: 0, y: 0, zoom: 1 },
};

// Default colors (functional, for user selection)
const DEFAULT_DRAWING_COLOR = '#FF6B6B';
const DEFAULT_PIN_COLOR = '#FF6B6B';

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Zoom indicator overlay
 * @param {{ zoom: number }} props
 */
const ZoomIndicator = memo(function ZoomIndicator({ zoom }) {
  return (
    <div 
      className="absolute bottom-4 left-4 z-10 px-3 py-1.5 rounded-lg text-xs font-mono"
      style={{ 
        backgroundColor: `${colors.surface.card}99`,
        backdropFilter: 'blur(4px)',
        color: colors.text.primary,
      }}
    >
      {(zoom * 100).toFixed(0)}%
    </div>
  );
});

ZoomIndicator.displayName = 'ZoomIndicator';

/**
 * Node count overlay
 * @param {{ nodeCount: number; pinCount: number }} props
 */
const NodeCount = memo(function NodeCount({ nodeCount, pinCount }) {
  return (
    <div 
      className="absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded-lg text-xs"
      style={{ 
        backgroundColor: `${colors.surface.card}99`,
        backdropFilter: 'blur(4px)',
        color: colors.text.primary,
      }}
    >
      {nodeCount} blueprint{nodeCount !== 1 ? 's' : ''} • {pinCount} pins
    </div>
  );
});

NodeCount.displayName = 'NodeCount';

/**
 * SVG Grid pattern
 * @param {{ show: boolean; zoom: number }} props
 */
const CanvasGrid = memo(function CanvasGrid({ show, zoom }) {
  if (!show) return null;
  
  const gridSize = 50 * zoom;
  
  return (
    <pattern
      id="canvas-grid"
      width={gridSize}
      height={gridSize}
      patternUnits="userSpaceOnUse"
    >
      <path
        d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
        fill="none"
        stroke={colors.border.default}
        strokeWidth={0.5 / zoom}
      />
    </pattern>
  );
});

CanvasGrid.displayName = 'CanvasGrid';

/**
 * Drawing path renderer
 * @param {{ drawing: any }} props
 */
const DrawingPath = memo(function DrawingPath({ drawing }) {
  const pointsStr = drawing.points.map(p => `${p.x},${p.y}`).join(' L ');
  
  if (drawing.type === CANVAS_MODES.DRAW_FIXTURE) {
    return (
      <circle
        cx={drawing.points[0]?.x}
        cy={drawing.points[0]?.y}
        r={drawing.width * 3}
        fill={drawing.color}
        fillOpacity={0.3}
        stroke={drawing.color}
        strokeWidth={drawing.width}
      />
    );
  }
  
  return (
    <path
      d={`M ${pointsStr}`}
      fill="none"
      stroke={drawing.color}
      strokeWidth={drawing.width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={drawing.type === CANVAS_MODES.DRAW_WALL ? '5,5' : undefined}
    />
  );
});

DrawingPath.displayName = 'DrawingPath';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * VisionCanvas - Spatial workspace for blueprint analysis
 * @param {{
 *   projectId?: string;
 *   onClose?: () => void;
 *   projects?: any[];
 *   onAddBlueprint?: (addNode: (project: any, x?: number, y?: number) => void) => void;
 *   onSaveCanvas?: (state: any) => void;
 *   onExport?: (state: any) => void;
 * }} props
 */
const VisionCanvas = memo(function VisionCanvas({ 
  projectId,
  onClose,
  projects = [],
  onAddBlueprint,
  onSaveCanvas,
  onExport,
}) {
  // Canvas state
  const [mode, setMode] = useState(CANVAS_MODES.SELECT);
  const [canvasState, setCanvasState] = useState(DEFAULT_CANVAS_STATE);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showOcr, setShowOcr] = useState(false);
  const [ocrData, setOcrData] = useState({});
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Drawing state
  const [currentPath, setCurrentPath] = useState(null);
  const [drawingColor, setDrawingColor] = useState(DEFAULT_DRAWING_COLOR);
  const [drawingWidth, setDrawingWidth] = useState(3);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Load project if projectId provided (Single-project mode)
  useEffect(() => {
    if (projectId) {
      const loadProject = async () => {
        try {
          const project = await visionApi.getProject(projectId);
          if (project) {
            // Check if project has saved canvas state in metadata
            let initialState = DEFAULT_CANVAS_STATE;
            if (project.metadata) {
              try {
                const meta = typeof project.metadata === 'string' ? JSON.parse(project.metadata) : project.metadata;
                if (meta.canvasState) {
                  initialState = meta.canvasState;
                }
              } catch (e) { console.warn('Failed to parse project metadata'); }
            }

            // If no nodes in metadata, add the current project as a node
            if (!initialState.nodes || initialState.nodes.length === 0) {
              const newNode = {
                id: `node-${Date.now()}`,
                projectId: project.id,
                project,
                x: 0,
                y: 0,
                width: 800,
                height: 600,
                rotation: 0,
                scale: 1,
                opacity: 1,
                visible: true,
                locked: false,
              };
              initialState = { ...initialState, nodes: [newNode] };
            }

            setCanvasState(initialState);
            setHistory([initialState]);
            setHistoryIndex(0);
          }
        } catch (err) {
          console.error('Failed to load project for canvas:', err);
        }
      };
      loadProject();
    }
  }, [projectId]);

  // Load global canvas state (multi-project mode)
  useEffect(() => {
    if (!projectId) {
      const saved = localStorage.getItem('visionCanvasState_global');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCanvasState(parsed);
          setHistory([parsed]);
          setHistoryIndex(0);
        } catch (e) {
          console.error('Failed to load global canvas state:', e);
        }
      }
    }
  }, [projectId]);

  /**
   * Save current state to persistence
   */
  const saveState = useCallback(async (stateToSave = canvasState) => {
    if (projectId) {
      try {
        await visionApi.updateProject(projectId, {
          metadata: { canvasState: stateToSave }
        });
        console.log('Project canvas state saved to database');
      } catch (err) {
        console.error('Failed to save project canvas state:', err);
      }
    } else {
      localStorage.setItem('visionCanvasState_global', JSON.stringify(stateToSave));
    }
  }, [projectId, canvasState]);

  // Save history and trigger persistence
  const pushHistory = useCallback((newState) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
    setCanvasState(newState);
    
    // Auto-save to local/session
    if (!projectId) {
      localStorage.setItem('visionCanvasState_global', JSON.stringify(newState));
    }
  }, [historyIndex, projectId]);

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setCanvasState(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setCanvasState(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const clearCanvas = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the entire canvas? This cannot be undone.')) {
      setCanvasState(DEFAULT_CANVAS_STATE);
      setHistory([DEFAULT_CANVAS_STATE]);
      setHistoryIndex(0);
      if (!projectId) {
        localStorage.removeItem('visionCanvasState_global');
      } else {
        saveState(DEFAULT_CANVAS_STATE);
      }
    }
  }, [projectId, saveState]);

  // View controls
  const handleZoomIn = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      viewBox: { ...prev.viewBox, zoom: Math.min(prev.viewBox.zoom * 1.2, 5) }
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      viewBox: { ...prev.viewBox, zoom: Math.max(prev.viewBox.zoom / 1.2, 0.1) }
    }));
  }, []);

  const handleFitToScreen = useCallback(() => {
    if (canvasState.nodes.length === 0) return;
    
    const bounds = canvasState.nodes.reduce((acc, node) => ({
      minX: Math.min(acc.minX, node.x),
      minY: Math.min(acc.minY, node.y),
      maxX: Math.max(acc.maxX, node.x + (node.width || 800)),
      maxY: Math.max(acc.maxY, node.y + (node.height || 600)),
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

    const padding = 100;
    const containerWidth = containerRef.current?.clientWidth || 1200;
    const containerHeight = containerRef.current?.clientHeight || 800;
    
    const contentWidth = bounds.maxX - bounds.minX + padding * 2;
    const contentHeight = bounds.maxY - bounds.minY + padding * 2;
    
    const zoom = Math.min(
      containerWidth / contentWidth,
      containerHeight / contentHeight,
      1
    );

    setCanvasState(newState);
  }, [canvasState.nodes]);

  // AI Analysis Trigger
  const handleAnalyze = useCallback(async (model, type) => {
    const targetProjectId = projectId || (selectedNode && canvasState.nodes.find(n => n.id === selectedNode)?.projectId);
    if (!targetProjectId) {
      alert('Please select a blueprint to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await visionApi.analyze(targetProjectId, model, type);
      alert(`AI Analysis started using ${model}. (Job: ${result.jobId})`);
    } catch (err) {
      alert(`Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [projectId, selectedNode, canvasState.nodes]);

  // Pan handling
  const handleMouseDown = useCallback((e) => {
    if (mode === CANVAS_MODES.PAN || (e.button === 1)) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY, viewBox: canvasState.viewBox });
      e.preventDefault();
    }
  }, [mode, canvasState.viewBox]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !dragStart) return;
    
    const dx = (e.clientX - dragStart.x) / dragStart.viewBox.zoom;
    const dy = (e.clientY - dragStart.y) / dragStart.viewBox.zoom;
    
    setCanvasState(prev => ({
      ...prev,
      viewBox: {
        ...prev.viewBox,
        x: dragStart.viewBox.x - dx,
        y: dragStart.viewBox.y - dy
      }
    }));
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
      pushHistory(canvasState);
    }
  }, [isDragging, canvasState, pushHistory]);

  // Node management
  const addNode = useCallback((project, x, y) => {
    const newNode = {
      id: `node-${Date.now()}`,
      projectId: project.id,
      project,
      x: x || canvasState.viewBox.x + 50,
      y: y || canvasState.viewBox.y + 50,
      width: 800,
      height: 600,
      rotation: 0,
      scale: 1,
      opacity: 1,
      visible: true,
      locked: false,
    };

    const newState = {
      ...canvasState,
      nodes: [...canvasState.nodes, newNode]
    };
    pushHistory(newState);
    setSelectedNode(newNode.id);
  }, [canvasState, pushHistory]);

  const updateNode = useCallback((nodeId, updates) => {
    const newState = {
      ...canvasState,
      nodes: canvasState.nodes.map(n => 
        n.id === nodeId ? { ...n, ...updates } : n
      )
    };
    pushHistory(newState);
  }, [canvasState, pushHistory]);

  const removeNode = useCallback((nodeId) => {
    const newState = {
      ...canvasState,
      nodes: canvasState.nodes.filter(n => n.id !== nodeId),
      connections: canvasState.connections.filter(c => 
        c.fromNode !== nodeId && c.toNode !== nodeId
      ),
      pins: canvasState.pins.filter(p => p.nodeId !== nodeId)
    };
    pushHistory(newState);
    if (selectedNode === nodeId) setSelectedNode(null);
  }, [canvasState, pushHistory, selectedNode]);

  // Pin management
  const addPin = useCallback((nodeId, x, y, data = {}) => {
    const newPin = {
      id: `pin-${Date.now()}`,
      nodeId,
      x,
      y,
      type: data.type || 'finding',
      label: data.label || '',
      description: data.description || '',
      color: data.color || DEFAULT_PIN_COLOR,
      createdAt: new Date().toISOString(),
    };

    const newState = {
      ...canvasState,
      pins: [...canvasState.pins, newPin]
    };
    pushHistory(newState);
    
    if (mode === CANVAS_MODES.CONNECT && connectingFrom) {
      // Create connection
      const newConnection = {
        id: `conn-${Date.now()}`,
        fromPin: connectingFrom,
        toPin: newPin.id,
        color: drawingColor,
        style: 'solid',
        width: 2,
      };
      newState.connections.push(newConnection);
      pushHistory(newState);
      setConnectingFrom(null);
    }
  }, [canvasState, pushHistory, mode, connectingFrom, drawingColor]);

  const removePin = useCallback((pinId) => {
    const newState = {
      ...canvasState,
      pins: canvasState.pins.filter(p => p.id !== pinId),
      connections: canvasState.connections.filter(c => 
        c.fromPin !== pinId && c.toPin !== pinId
      )
    };
    pushHistory(newState);
  }, [canvasState, pushHistory]);

  // Transform for viewBox
  const getTransform = () => {
    const { x, y, zoom } = canvasState.viewBox;
    return `translate(${-x * zoom}, ${-y * zoom}) scale(${zoom})`;
  };

  return (
    <div 
      ref={containerRef} 
      className="flex-1 flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: colors.surface.primary }}
    >
      {/* Toolbar */}
      <CanvasToolbar
        mode={mode}
        setMode={setMode}
        modes={CANVAS_MODES}
        zoom={canvasState.viewBox.zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFit={handleFitToScreen}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        showOcr={showOcr}
        setShowOcr={setShowOcr}
        drawingColor={drawingColor}
        setDrawingColor={setDrawingColor}
        drawingWidth={drawingWidth}
        setDrawingWidth={setDrawingWidth}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onClear={clearCanvas}
        onAddBlueprint={() => onAddBlueprint?.(addNode)}
        onExport={() => onExport?.(canvasState)}
        onSave={() => (projectId ? saveState() : onSaveCanvas?.(canvasState))}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
        onClose={onClose}
      />

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 relative overflow-hidden cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ touchAction: 'none' }}
        >
          <defs>
            <CanvasGrid show={showGrid} zoom={canvasState.viewBox.zoom} />
          </defs>
          
          <g transform={getTransform()}>
            {/* Grid background */}
            {showGrid && (
              <rect
                x={canvasState.viewBox.x - 10000}
                y={canvasState.viewBox.y - 10000}
                width={20000}
                height={20000}
                fill="url(#canvas-grid)"
                opacity={0.5}
              />
            )}

            {/* Connections */}
            {canvasState.connections.map(conn => (
              <CanvasConnection
                key={conn.id}
                connection={conn}
                pins={canvasState.pins}
                nodes={canvasState.nodes}
                viewBox={canvasState.viewBox}
              />
            ))}

            {/* Current drawing path */}
            {currentPath && (
              <path
                d={`M ${currentPath.points.map(p => `${p.x},${p.y}`).join(' L ')}`}
                fill="none"
                stroke={currentPath.color}
                strokeWidth={currentPath.width}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Drawings */}
            {canvasState.drawings.map(drawing => (
              <DrawingPath key={drawing.id} drawing={drawing} />
            ))}
          </g>
        </svg>

        {/* Nodes (blueprints) */}
        {canvasState.nodes.map(node => (
          <CanvasNode
            key={node.id}
            node={node}
            isSelected={selectedNode === node.id}
            onSelect={() => setSelectedNode(node.id)}
            onUpdate={(updates) => updateNode(node.id, updates)}
            onRemove={() => removeNode(node.id)}
            viewBox={canvasState.viewBox}
            pins={canvasState.pins.filter(p => p.nodeId === node.id)}
            onAddPin={addPin}
            onRemovePin={removePin}
            mode={mode}
            connectingFrom={connectingFrom}
            setConnectingFrom={setConnectingFrom}
            showOcr={showOcr}
            ocrData={ocrData[node.projectId]}
          />
        ))}

        {/* Pin system overlay */}
        <PinSystem
          pins={canvasState.pins}
          nodes={canvasState.nodes}
          viewBox={canvasState.viewBox}
          selectedPin={selectedPin}
          setSelectedPin={setSelectedPin}
          onUpdatePin={(pinId, updates) => {
            const newState = {
              ...canvasState,
              pins: canvasState.pins.map(p => 
                p.id === pinId ? { ...p, ...updates } : p
              )
            };
            pushHistory(newState);
          }}
          onRemovePin={removePin}
        />

        {/* Zoom indicator */}
        <ZoomIndicator zoom={canvasState.viewBox.zoom} />

        {/* Node count */}
        <NodeCount 
          nodeCount={canvasState.nodes.length} 
          pinCount={canvasState.pins.length} 
        />
      </div>
    </div>
  );
});

VisionCanvas.displayName = 'VisionCanvas';

export default VisionCanvas;
