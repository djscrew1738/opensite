import { useEffect, useRef, useState, useCallback } from 'react';
import { AlertCircle, Ruler, X, Check, Loader2 } from 'lucide-react';
import VisionToolbar from './VisionToolbar';
import LayerPanel from './LayerPanel';
import AnnotationOverlay from './AnnotationOverlay';
import { FixtureOverlay, FixtureDetectionPanel } from './fixtures';
import { WallAndPipeOverlay, WallPipeDetectionPanel, DEMO_WALLS, DEMO_PIPES } from './wallpipe';
import { useFixtureDetection } from '../../hooks/useFixtureDetection';

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
  const [showFixturePanel, setShowFixturePanel] = useState(true);
  const [showWallPipePanel, setShowWallPipePanel] = useState(true);
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerError, setViewerError] = useState(null);

  // Calibration state
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState([]);
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [pixelDistance, setPixelDistance] = useState(0);
  const [realDistance, setRealDistance] = useState('10');

  // Wall and Pipe state (using demo data for now)
  const [walls, setWalls] = useState(DEMO_WALLS);
  const [pipes, setPipes] = useState(DEMO_PIPES);
  const [selectedWallId, setSelectedWallId] = useState(null);
  const [selectedPipeId, setSelectedPipeId] = useState(null);
  const [isDetectingWallsPipes, setIsDetectingWallsPipes] = useState(false);

  // Fixture detection hook
  const {
    fixtures,
    selectedFixtureId,
    isDetecting,
    stats,
    handleUpdateFixture,
    handleDeleteFixture,
    handleSelectFixture,
    handleRunDetection,
    handleBulkAction,
    setSelectedFixtureId,
  } = useFixtureDetection(project?.id);

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
      
      event.preventDefaultAction = true;

      const webPoint = event.position;
      const viewportPoint = viewer.viewport.pointFromPixel(webPoint);
      const imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint);
      const imageSize = viewer.world.getItemAt(0).getContentSize();
      
      setCalibrationPoints(prev => {
        const next = [...prev, { 
          x: imagePoint.x / imageSize.x, 
          y: imagePoint.y / imageSize.y 
        }];
        
        if (next.length === 2) {
          const dx = next[1].x - next[0].x;
          const dy = next[1].y - next[0].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          setPixelDistance(dist);
          setShowScaleModal(true);
          setIsCalibrating(false);
        }
        
        return next;
      });
    };

    viewer.addHandler('canvas-click', handler);
    return () => viewer.removeHandler('canvas-click', handler);
  }, [isCalibrating]);

  // Pan to selected fixture
  useEffect(() => {
    if (!selectedFixtureId || !osdRef.current || !viewerReady) return;
    
    const fixture = fixtures.find(f => f.id === selectedFixtureId);
    if (!fixture) return;
    
    const point = new window.OpenSeadragon.Point(fixture.x, fixture.y);
    osdRef.current.viewport.panTo(point, true);
    
    const currentZoom = osdRef.current.viewport.getZoom();
    if (currentZoom < 2) {
      osdRef.current.viewport.zoomTo(2, point, true);
    }
  }, [selectedFixtureId, fixtures, viewerReady]);

  // Pan to selected wall endpoint
  useEffect(() => {
    if (!selectedWallId || !osdRef.current || !viewerReady) return;
    
    const wall = walls.find(w => w.id === selectedWallId);
    if (!wall) return;
    
    const midX = (wall.x1 + wall.x2) / 2;
    const midY = (wall.y1 + wall.y2) / 2;
    const point = new window.OpenSeadragon.Point(midX, midY);
    osdRef.current.viewport.panTo(point, true);
  }, [selectedWallId, walls, viewerReady]);

  // Pan to selected pipe endpoint
  useEffect(() => {
    if (!selectedPipeId || !osdRef.current || !viewerReady) return;
    
    const pipe = pipes.find(p => p.id === selectedPipeId);
    if (!pipe || !pipe.points?.length) return;
    
    const lastPoint = pipe.points[pipe.points.length - 1];
    const point = new window.OpenSeadragon.Point(lastPoint.x, lastPoint.y);
    osdRef.current.viewport.panTo(point, true);
  }, [selectedPipeId, pipes, viewerReady]);

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

    const scaleFactor = dist / pixelDistance;
    await onUpdateScale(scaleFactor);
    setShowScaleModal(false);
    setCalibrationPoints([]);
  };

  const semanticZoom = Math.log2(zoom + 1) * 3;

  // Fixture detection handlers
  const handleRunFixtureDetection = useCallback(() => {
    handleRunDetection(selectedModel, { type: 'fixtures' });
  }, [handleRunDetection, selectedModel]);

  // Wall handlers
  const handleUpdateWall = useCallback((id, updates) => {
    setWalls(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const handleDeleteWall = useCallback((id) => {
    setWalls(prev => prev.filter(w => w.id !== id));
    if (selectedWallId === id) setSelectedWallId(null);
  }, [selectedWallId]);

  // Pipe handlers
  const handleUpdatePipe = useCallback((id, updates) => {
    setPipes(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const handleDeletePipe = useCallback((id) => {
    setPipes(prev => prev.filter(p => p.id !== id));
    if (selectedPipeId === id) setSelectedPipeId(null);
  }, [selectedPipeId]);

  // Run wall/pipe detection
  const handleRunWallPipeDetection = useCallback(() => {
    setIsDetectingWallsPipes(true);
    // Simulate detection delay
    setTimeout(() => {
      setIsDetectingWallsPipes(false);
    }, 2000);
  }, []);

  // Bulk actions for walls/pipes
  const handleBulkWallPipeAction = useCallback((action, ids) => {
    if (action === 'verify') {
      setWalls(prev => prev.map(w => ids.includes(w.id) ? { ...w, status: 'verified' } : w));
      setPipes(prev => prev.map(p => ids.includes(p.id) ? { ...p, status: 'verified' } : p));
    }
  }, []);

  // Calculate scale (assuming 100px = 10ft for demo)
  const scale = project?.scale || 10;

  return (
    <div className="relative flex-1 flex h-full overflow-hidden">
      {/* Main viewer area */}
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
          analyzing={analyzing || isDetecting || isDetectingWallsPipes}
          hasLayers={layers?.length > 0}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          onCalibrate={handleToggleCalibration}
          calibrating={isCalibrating}
          fixturesCount={stats.total}
          onToggleFixturePanel={() => setShowFixturePanel(!showFixturePanel)}
          showFixturePanel={showFixturePanel}
          onToggleWallPipePanel={() => setShowWallPipePanel(!showWallPipePanel)}
          showWallPipePanel={showWallPipePanel}
          wallsCount={walls.length}
          pipesCount={pipes.length}
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

          {/* Fixture Detection Overlay */}
          {viewerReady && fixtures.length > 0 && (
            <FixtureOverlay
              fixtures={fixtures}
              selectedId={selectedFixtureId}
              onFixtureSelect={handleSelectFixture}
              onFixtureUpdate={handleUpdateFixture}
              onFixtureDelete={handleDeleteFixture}
              onBulkAction={handleBulkAction}
              scale={zoom}
              className="absolute inset-0 pointer-events-none [&>*]:pointer-events-auto"
            />
          )}

          {/* Wall and Pipe Overlay */}
          {viewerReady && (walls.length > 0 || pipes.length > 0) && (
            <WallAndPipeOverlay
              walls={walls}
              pipes={pipes}
              scale={scale}
              selectedWallId={selectedWallId}
              selectedPipeId={selectedPipeId}
              onWallSelect={setSelectedWallId}
              onPipeSelect={setSelectedPipeId}
              onWallUpdate={handleUpdateWall}
              onWallDelete={handleDeleteWall}
              onPipeUpdate={handleUpdatePipe}
              onPipeDelete={handleDeletePipe}
              onBulkAction={handleBulkWallPipeAction}
              visible={true}
              onToggleVisibility={() => {}}
            />
          )}

          {/* Calibration Line */}
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

          {/* Calibration Help */}
          {isCalibrating && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full
                            bg-amber-600 text-white text-xs font-semibold shadow-2xl animate-bounce">
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
                    <p className="text-xs text-white/40">Enter real-world distance</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-white/30 uppercase mb-1.5">Length (ft)</label>
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
                      className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-white/60 hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveCalibration}
                      className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white shadow-lg shadow-amber-600/20 transition-all"
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

      {/* Side panels */}
      <div className="flex h-full">
        {/* Wall & Pipe Detection Panel */}
        {showWallPipePanel && (
          <WallPipeDetectionPanel
            walls={walls}
            pipes={pipes}
            scale={scale}
            selectedWallId={selectedWallId}
            selectedPipeId={selectedPipeId}
            onWallSelect={setSelectedWallId}
            onPipeSelect={setSelectedPipeId}
            onWallUpdate={handleUpdateWall}
            onWallDelete={handleDeleteWall}
            onPipeUpdate={handleUpdatePipe}
            onPipeDelete={handleDeletePipe}
            onRunDetection={handleRunWallPipeDetection}
            isDetecting={isDetectingWallsPipes}
            collapsed={!showWallPipePanel}
            onToggleCollapse={() => setShowWallPipePanel(!showWallPipePanel)}
          />
        )}

        {/* Fixture Detection Panel */}
        {showFixturePanel && (
          <FixtureDetectionPanel
            fixtures={fixtures}
            onFixtureUpdate={handleUpdateFixture}
            onFixtureDelete={handleDeleteFixture}
            onFixtureSelect={handleSelectFixture}
            onRunDetection={handleRunFixtureDetection}
            selectedId={selectedFixtureId}
            isDetecting={isDetecting}
            collapsed={!showFixturePanel}
            onToggleCollapse={() => setShowFixturePanel(!showFixturePanel)}
          />
        )}
      </div>
    </div>
  );
}
