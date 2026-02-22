import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Move, RotateCw, Maximize2, Trash2, Lock, Unlock,
  Eye, EyeOff, MoreHorizontal, X, ZoomIn, ZoomOut
} from 'lucide-react';
import { visionApi } from '../../api/vision';
import OcrOverlay from './OcrOverlay';

/**
 * CanvasNode - Draggable blueprint document node
 * 
 * Renders a blueprint within a resizable, rotatable container on the canvas.
 * Supports zoom/pan within the node, pins, and OCR overlay.
 */

const MIN_WIDTH = 300;
const MIN_HEIGHT = 200;

export default function CanvasNode({ 
  node, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onRemove,
  viewBox,
  pins = [],
  onAddPin,
  onRemovePin,
  mode,
  connectingFrom,
  setConnectingFrom,
  showOcr,
  ocrData,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [internalZoom, setInternalZoom] = useState(1);
  const [internalPan, setInternalPan] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  
  const nodeRef = useRef(null);
  const dragStartRef = useRef(null);
  const imageRef = useRef(null);

  const { x, y, width, height, rotation, scale, opacity, visible, locked, projectId, project } = node;

  // Calculate screen position
  const screenX = (x - viewBox.x) * viewBox.zoom;
  const screenY = (y - viewBox.y) * viewBox.zoom;
  const screenWidth = width * viewBox.zoom * scale;
  const screenHeight = height * viewBox.zoom * scale;

  // Handle node dragging
  const handleMouseDown = useCallback((e) => {
    if (locked || !visible) return;
    if (e.target.closest('.node-control')) return;
    if (e.button !== 0) return;
    
    e.stopPropagation();
    onSelect();
    
    if (mode === 'pan' || (!mode || mode === 'select')) {
      setIsDragging(true);
      dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        nodeX: x,
        nodeY: y,
      };
    }
  }, [locked, visible, mode, onSelect, x, y]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !dragStartRef.current) return;
    
    const dx = (e.clientX - dragStartRef.current.mouseX) / viewBox.zoom;
    const dy = (e.clientY - dragStartRef.current.mouseY) / viewBox.zoom;
    
    onUpdate({
      x: dragStartRef.current.nodeX + dx,
      y: dragStartRef.current.nodeY + dy,
    });
  }, [isDragging, viewBox.zoom, onUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Handle resizing
  const handleResizeStart = useCallback((e) => {
    e.stopPropagation();
    setIsResizing(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width,
      height,
    };
  }, [width, height]);

  const handleResizeMove = useCallback((e) => {
    if (!isResizing || !dragStartRef.current) return;
    
    const dx = (e.clientX - dragStartRef.current.mouseX) / viewBox.zoom;
    const dy = (e.clientY - dragStartRef.current.mouseY) / viewBox.zoom;
    
    onUpdate({
      width: Math.max(MIN_WIDTH, dragStartRef.current.width + dx),
      height: Math.max(MIN_HEIGHT, dragStartRef.current.height + dy),
    });
  }, [isResizing, viewBox.zoom, onUpdate]);

  // Handle internal zoom
  const handleInternalZoomIn = useCallback((e) => {
    e.stopPropagation();
    setInternalZoom(prev => Math.min(prev * 1.2, 5));
  }, []);

  const handleInternalZoomOut = useCallback((e) => {
    e.stopPropagation();
    setInternalZoom(prev => Math.max(prev / 1.2, 0.5));
  }, []);

  const handleResetView = useCallback((e) => {
    e.stopPropagation();
    setInternalZoom(1);
    setInternalPan({ x: 0, y: 0 });
  }, []);

  // Handle pin creation
  const handleImageClick = useCallback((e) => {
    if (mode !== 'pin' && mode !== 'connect') return;
    
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clickX = (e.clientX - rect.left) / internalZoom;
    const clickY = (e.clientY - rect.top) / internalZoom;
    
    // Convert to node-relative coordinates
    const nodeX = clickX / scale;
    const nodeY = clickY / scale;
    
    if (mode === 'pin') {
      onAddPin(node.id, nodeX, nodeY, { type: 'finding' });
    } else if (mode === 'connect' && !connectingFrom) {
      // Create temp pin and start connection
      const tempPin = {
        id: `temp-${Date.now()}`,
        nodeId: node.id,
        x: nodeX,
        y: nodeY,
      };
      setConnectingFrom(tempPin.id);
      onAddPin(node.id, nodeX, nodeY, { type: 'connection' });
    }
  }, [mode, node.id, scale, internalZoom, onAddPin, connectingFrom, setConnectingFrom]);

  // Global event listeners for drag/resize
  useEffect(() => {
    if (isDragging || isResizing) {
      const handleMove = (e) => {
        if (isDragging) handleMouseMove(e);
        if (isResizing) handleResizeMove(e);
      };
      
      const handleUp = () => {
        setIsDragging(false);
        setIsResizing(false);
        dragStartRef.current = null;
      };
      
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleResizeMove]);

  if (!visible) return null;

  const containerStyle = {
    position: 'absolute',
    left: screenX,
    top: screenY,
    width: screenWidth,
    height: screenHeight,
    transform: `rotate(${rotation}deg)`,
    opacity,
    zIndex: isSelected ? 10 : 1,
    cursor: isDragging ? 'grabbing' : locked ? 'not-allowed' : mode === 'select' ? 'grab' : 'crosshair',
  };

  return (
    <div
      ref={nodeRef}
      style={containerStyle}
      className={`group ${isSelected ? 'ring-2 ring-primary-500' : 'ring-1 ring-surface-300 dark:ring-surface-600'}`}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setShowControls(false);
      }}
    >
      {/* Node header */}
      <div className="absolute -top-8 left-0 right-0 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-surface-600 dark:text-surface-400 truncate max-w-[200px]">
            {project?.name || 'Blueprint'}
          </span>
          {locked && <Lock className="w-3 h-3 text-surface-400" />}
        </div>
        
        {/* Quick controls */}
        {(isSelected || isHovering) && (
          <div className="flex items-center gap-1 node-control">
            <button
              onClick={(e) => { e.stopPropagation(); onUpdate({ locked: !locked }); }}
              className="p-1 rounded bg-white dark:bg-surface-800 shadow-sm hover:bg-surface-100"
              title={locked ? 'Unlock' : 'Lock'}
            >
              {locked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onUpdate({ visible: false }); }}
              className="p-1 rounded bg-white dark:bg-surface-800 shadow-sm hover:bg-surface-100"
              title="Hide"
            >
              <EyeOff className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowControls(!showControls); }}
              className="p-1 rounded bg-white dark:bg-surface-800 shadow-sm hover:bg-surface-100"
              title="More options"
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Expanded controls */}
      {showControls && (
        <div className="absolute -top-32 left-0 bg-white dark:bg-surface-800 rounded-lg shadow-lg border border-surface-200 dark:border-surface-700 p-2 z-20 node-control">
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onUpdate({ rotation: rotation - 90 }); }}
                className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-700"
                title="Rotate left"
              >
                <RotateCw className="w-3.5 h-3.5 rotate-180" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onUpdate({ rotation: rotation + 90 }); }}
                className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-700"
                title="Rotate right"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-surface-200 mx-1" />
              <button
                onClick={(e) => { e.stopPropagation(); onUpdate({ scale: Math.max(0.5, scale - 0.1) }); }}
                className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-700"
                title="Scale down"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs w-12 text-center">{(scale * 100).toFixed(0)}%</span>
              <button
                onClick={(e) => { e.stopPropagation(); onUpdate({ scale: Math.min(2, scale + 0.1) }); }}
                className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-700"
                title="Scale up"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onUpdate({ opacity: Math.max(0.2, opacity - 0.2) }); }}
                className="px-2 py-1 text-xs rounded hover:bg-surface-100 dark:hover:bg-surface-700"
              >
                Opacity -
              </button>
              <span className="text-xs w-10 text-center">{(opacity * 100).toFixed(0)}%</span>
              <button
                onClick={(e) => { e.stopPropagation(); onUpdate({ opacity: Math.min(1, opacity + 0.2) }); }}
                className="px-2 py-1 text-xs rounded hover:bg-surface-100 dark:hover:bg-surface-700"
              >
                Opacity +
              </button>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="w-full flex items-center justify-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            >
              <Trash2 className="w-3 h-3" />
              Remove from canvas
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative w-full h-full bg-surface-900 rounded overflow-hidden">
        {/* Blueprint image with deep zoom */}
        <div 
          ref={imageRef}
          className="w-full h-full overflow-hidden"
          style={{
            transform: `scale(${internalZoom}) translate(${internalPan.x}px, ${internalPan.y}px)`,
            transformOrigin: 'center center',
          }}
          onClick={handleImageClick}
        >
          <img
            src={visionApi.getThumbnailUrl(projectId)}
            alt={project?.name || 'Blueprint'}
            className="w-full h-full object-contain"
            draggable={false}
          />
          
          {/* OCR Overlay */}
          {showOcr && ocrData && (
            <OcrOverlay 
              data={ocrData} 
              scale={internalZoom}
              width={width}
              height={height}
            />
          )}

          {/* Pin markers */}
          {pins.map(pin => (
            <div
              key={pin.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group/pin"
              style={{
                left: pin.x * scale * internalZoom,
                top: pin.y * scale * internalZoom,
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (mode === 'connect' && connectingFrom && connectingFrom !== pin.id) {
                  // Complete connection
                }
              }}
            >
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-125"
                style={{ backgroundColor: pin.color }}
                title={pin.label || pin.description}
              />
              {pin.label && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 
                                bg-black/80 text-white text-[10px] rounded whitespace-nowrap 
                                opacity-0 group-hover/pin:opacity-100 transition-opacity pointer-events-none z-10">
                  {pin.label}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Internal zoom controls */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <button
            onClick={handleInternalZoomOut}
            className="p-1 rounded bg-black/60 text-white hover:bg-black/80"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded min-w-[40px] text-center">
            {(internalZoom * 100).toFixed(0)}%
          </span>
          <button
            onClick={handleInternalZoomIn}
            className="p-1 rounded bg-black/60 text-white hover:bg-black/80"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1 rounded bg-black/60 text-white hover:bg-black/80"
            title="Reset view"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>

        {/* Pin indicator */}
        {mode === 'pin' && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-primary-500 text-white text-xs rounded">
            Click to add pin
          </div>
        )}

        {mode === 'connect' && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-violet-500 text-white text-xs rounded">
            {connectingFrom ? 'Click to complete connection' : 'Click to start connection'}
          </div>
        )}
      </div>

      {/* Resize handle */}
      {!locked && (
        <div
          className="absolute -bottom-3 -right-3 w-6 h-6 cursor-se-resize flex items-center justify-center"
          onMouseDown={handleResizeStart}
        >
          <div className="w-3 h-3 bg-primary-500 rounded-full shadow-md hover:scale-110 transition-transform" />
        </div>
      )}
    </div>
  );
}
