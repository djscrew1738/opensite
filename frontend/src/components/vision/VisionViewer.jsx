import { useEffect, useRef, useState, useCallback } from 'react';
import { AlertCircle, Ruler, X, Check, Loader2 } from 'lucide-react';
import VisionToolbar from './VisionToolbar';
import LayerPanel from './LayerPanel';
import AnnotationOverlay from './AnnotationOverlay';

export default function VisionViewer({ 
  project, 
  layers, 
  analyses,
  onLayerUpdate, 
  onUpdateScale,
  onConvertToTakeoff,
  onAnalyze, 
  analyzing, 
  selectedModel, 
  onModelChange 
}) {
  const viewerRef = useRef(null);
  const osdRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  const [showLayers, setShowLayers] = useState(true);
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerError, setViewerError] = useState(null);

  // Calibration state
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState([]);
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [pixelDistance, setPixelDistance] = useState(0);
  const [realDistance, setRealDistance] = useState('10');

  // Initialize OpenSeadragon
  useEffect(() => {
    if (!project || !viewerRef.current) return;

    const OSD = window.OpenSeadragon;
    if (!OSD) {
      setViewerError('Deep-zoom viewer failed to load. Check your internet connection and refresh.');
      return;
    }

    const viewer = OSD({
      element: viewerRef.current,
      tileSources: `/api/vision/tiles/${project.id}/${project.id}.dzi`,
      prefixUrl: '',
      showNavigator: true,
      navigatorPosition: 'BOTTOM_RIGHT',
      navigatorSizeRatio: 0.15,
      navigatorAutoFade: true,
      showNavigationControl: false,
      animationTime: 0.3,
      blendTime: 0.1,
      constrainDuringPan: true,
      maxZoomPixelRatio: 4,
      minZoomImageRatio: 0.8,
      visibilityRatio: 0.5,
      gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: true },
      gestureSettingsTouch: { pinchToZoom: true },
      crossOriginPolicy: false,
    });

    osdRef.current = viewer;

    viewer.addHandler('zoom', (e) => {
      setZoom(e.zoom);
    });

    viewer.addHandler('open', () => {
      setViewerReady(true);
      setViewerError(null);
      setMaxZoom(viewer.viewport.getMaxZoom());
    });

    viewer.addHandler('open-failed', (e) => {
      setViewerError(`Failed to load blueprint tiles. ${e.message || 'The DZI file may be missing.'}`);
    });

    return () => {
      viewer.destroy();
      osdRef.current = null;
      setViewerReady(false);
      setViewerError(null);
    };
  }, [project?.id]);

  // Handle viewer clicks for calibration
  useEffect(() => {
    if (!osdRef.current || !isCalibrating) return;

    const viewer = osdRef.current;
    const handler = (event) => {
      if (!isCalibrating) return;
      
      // Stop OSD default behavior (like zoom on click)
      event.preventDefaultAction = true;

      // Get click coordinates in image space (pixels)
      const webPoint = event.position;
      const viewportPoint = viewer.viewport.pointFromPixel(webPoint);
      const imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint);
      
      // Get image dimensions to normalize
      const imageSize = viewer.world.getItemAt(0).getContentSize();
      
      setCalibrationPoints(prev => {
        const next = [...prev, { 
          x: imagePoint.x / imageSize.x, 
          y: imagePoint.y / imageSize.y 
        }];
        
        if (next.length === 2) {
          // Calculate normalized distance (0 to 1 space)
          const dx = next[1].x - next[0].x;
          const dy = next[1].y - next[0].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          setPixelDistance(dist); // This is now 'normalized distance'
          setShowScaleModal(true);
          setIsCalibrating(false);
        }
        
        return next;
      });
    };

    viewer.addHandler('canvas-click', handler);
    return () => viewer.removeHandler('canvas-click', handler);
  }, [isCalibrating]);

  const handleZoomIn = useCallback(() => {
    osdRef.current?.viewport.zoomBy(1.5);
  }, []);

  const handleZoomOut = useCallback(() => {
    osdRef.current?.viewport.zoomBy(0.67);
  }, []);

  const handleFit = useCallback(() => {
    osdRef.current?.viewport.goHome();
  }, []);

  const handleRotate = useCallback(() => {
    if (!osdRef.current) return;
    const current = osdRef.current.viewport.getRotation();
    osdRef.current.viewport.setRotation(current + 90);
  }, []);

  const handleFullscreen = useCallback(() => {
    osdRef.current?.setFullScreen(!osdRef.current.isFullPage());
  }, []);

  const handleToggleCalibration = useCallback(() => {
    if (isCalibrating) {
      setIsCalibrating(false);
      setCalibrationPoints([]);
    } else {
      setIsCalibrating(true);
      setCalibrationPoints([]);
      setShowScaleModal(false);
    }
  }, [isCalibrating]);

  const saveCalibration = async () => {
    const dist = parseFloat(realDistance);
    if (!dist || dist <= 0 || pixelDistance === 0) return;

    // Scale = Real Units / Normalized Distance
    // This allows: Quantity = Normalized_AI_Dist * Scale
    const scaleFactor = dist / pixelDistance;
    await onUpdateScale(scaleFactor);
    setShowScaleModal(false);
    setCalibrationPoints([]);
  };

  // Calculate semantic zoom level for layer visibility
  const semanticZoom = Math.log2(zoom + 1) * 3;

  return (
    <div className="relative flex-1 flex flex-col h-full">
      {/* Toolbar */}
      <VisionToolbar
        zoom={zoom}
        maxZoom={maxZoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFit={handleFit}
        onRotate={handleRotate}
        onFullscreen={handleFullscreen}
        onToggleLayers={() => setShowLayers(!showLayers)}
        showLayers={showLayers}
        onAnalyze={(model, type) => onAnalyze(model, type)}
        analyzing={analyzing}
        hasLayers={layers?.length > 0}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
        onCalibrate={handleToggleCalibration}
        calibrating={isCalibrating}
      />

      <div className="relative flex-1 overflow-hidden">
        {/* OpenSeadragon container */}
        <div
          ref={viewerRef}
          className="absolute inset-0 bg-surface-950"
          style={{ cursor: isCalibrating ? 'crosshair' : 'grab' }}
        />

        {/* Annotation overlays */}
        {viewerReady && osdRef.current && layers && (
          <AnnotationOverlay
            viewer={osdRef.current}
            layers={layers}
            zoom={semanticZoom}
          />
        )}

        {/* Calibration Line (Visual feedback) */}
        {viewerReady && osdRef.current && calibrationPoints.length > 0 && (
          <svg className="absolute inset-0 pointer-events-none z-20 w-full h-full">
            {calibrationPoints.map((p, i) => {
              const pixel = osdRef.current.viewport.imageToViewerElementCoordinates(
                new window.OpenSeadragon.Point(
                  p.x * osdRef.current.world.getItemAt(0).getContentSize().x,
                  p.y * osdRef.current.world.getItemAt(0).getContentSize().y
                )
              );
              return <circle key={i} cx={pixel.x} cy={pixel.y} r="4" fill="#f59e0b" />;
            })}
            {calibrationPoints.length === 2 && (() => {
              const p1 = osdRef.current.viewport.imageToViewerElementCoordinates(
                new window.OpenSeadragon.Point(
                  calibrationPoints[0].x * osdRef.current.world.getItemAt(0).getContentSize().x,
                  calibrationPoints[0].y * osdRef.current.world.getItemAt(0).getContentSize().y
                )
              );
              const p2 = osdRef.current.viewport.imageToViewerElementCoordinates(
                new window.OpenSeadragon.Point(
                  calibrationPoints[1].x * osdRef.current.world.getItemAt(0).getContentSize().x,
                  calibrationPoints[1].y * osdRef.current.world.getItemAt(0).getContentSize().y
                )
              );
              return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#f59e0b" strokeWidth="2" strokeDasharray="4" />;
            })()}
          </svg>
        )}

        {/* Calibration Help / Instructions */}
        {isCalibrating && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full
                          bg-amber-600 text-white text-xs font-bold shadow-2xl animate-bounce">
            {calibrationPoints.length === 0 
              ? 'Click first point of known distance' 
              : 'Click second point to finish'}
          </div>
        )}

        {/* Scale Modal */}
        {showScaleModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-80 rounded-2xl bg-surface-900 border border-white/10 p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Ruler className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Calibrate Scale</h3>
                  <p className="text-[10px] text-white/40">Enter real-world distance</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase mb-1.5">Length (ft)</label>
                  <input
                    type="number"
                    autoFocus
                    value={realDistance}
                    onChange={(e) => setRealDistance(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                    placeholder="e.g. 10"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowScaleModal(false); setCalibrationPoints([]); }}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-white/60 hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveCalibration}
                    className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white shadow-lg shadow-amber-600/20 transition-all"
                  >
                    Save Scale
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Layer panel */}
        {showLayers && (
          <div className="absolute top-3 right-3 z-20">
            <LayerPanel
              project={project}
              layers={layers || []}
              analyses={analyses || []}
              onLayerUpdate={onLayerUpdate}
              onUpdateScale={onUpdateScale}
              onConvertToTakeoff={onConvertToTakeoff}
              currentZoom={semanticZoom}
            />
          </div>
        )}

        {/* Error overlay */}
        {viewerError && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-surface-950/80">
            <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-red-950/80 border border-red-800 max-w-md">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-200">{viewerError}</p>
            </div>
          </div>
        )}

        {/* Zoom indicator */}
        <div className="absolute bottom-4 left-4 z-10 px-3 py-1.5 rounded-lg
                        bg-black/60 backdrop-blur-sm text-white text-xs font-mono">
          {(zoom * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}
