import { useEffect, useRef, useState, useCallback } from 'react';
import VisionToolbar from './VisionToolbar';
import LayerPanel from './LayerPanel';
import AnnotationOverlay from './AnnotationOverlay';

export default function VisionViewer({ project, layers, onLayerUpdate, onAnalyze, analyzing, selectedModel, onModelChange }) {
  const viewerRef = useRef(null);
  const osdRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  const [showLayers, setShowLayers] = useState(true);
  const [viewerReady, setViewerReady] = useState(false);

  // Initialize OpenSeadragon
  useEffect(() => {
    if (!project || !viewerRef.current) return;

    // OpenSeadragon loaded via CDN (window.OpenSeadragon)
    const OSD = window.OpenSeadragon;
    if (!OSD) return;

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
      setMaxZoom(viewer.viewport.getMaxZoom());
    });

    return () => {
      viewer.destroy();
      osdRef.current = null;
      setViewerReady(false);
    };
  }, [project?.id]);

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
        onAnalyze={onAnalyze}
        analyzing={analyzing}
        hasLayers={layers?.length > 0}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
      />

      <div className="relative flex-1 overflow-hidden">
        {/* OpenSeadragon container */}
        <div
          ref={viewerRef}
          className="absolute inset-0 bg-surface-950"
          style={{ cursor: 'grab' }}
        />

        {/* Annotation overlays */}
        {viewerReady && osdRef.current && layers && (
          <AnnotationOverlay
            viewer={osdRef.current}
            layers={layers}
            zoom={semanticZoom}
          />
        )}

        {/* Layer panel */}
        {showLayers && layers && layers.length > 0 && (
          <div className="absolute top-3 right-3 z-20">
            <LayerPanel
              layers={layers}
              onLayerUpdate={onLayerUpdate}
              currentZoom={semanticZoom}
            />
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
