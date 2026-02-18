import { useEffect, useState, useCallback } from 'react';

/**
 * Renders annotation overlays on top of the OpenSeadragon viewer.
 * Uses OSD's overlay system to position elements in image coordinates.
 * OpenSeadragon is loaded via CDN (window.OpenSeadragon).
 */
export default function AnnotationOverlay({ viewer, layers, zoom }) {
  const [overlayElements, setOverlayElements] = useState([]);

  const updateOverlays = useCallback(() => {
    if (!viewer || !viewer.viewport) return;
    const OSD = window.OpenSeadragon;
    if (!OSD) return;

    // Remove existing overlays
    overlayElements.forEach(el => {
      try { viewer.removeOverlay(el); } catch (e) { /* ignore */ }
    });

    const newElements = [];

    (layers || []).forEach(layer => {
      if (!layer.visible) return;

      // Check zoom range
      const inRange = zoom >= (layer.minZoom || 0) && zoom <= (layer.maxZoom || 20);
      if (!inRange) return;

      const color = layer.style?.color || '#607D8B';
      const opacity = layer.style?.opacity || 0.6;

      (layer.data || []).forEach((annotation, i) => {
        if (annotation.x === undefined || annotation.y === undefined) return;

        const el = document.createElement('div');
        el.className = 'vision-annotation';
        el.style.cssText = `
          border: 2px solid ${color};
          background: ${color}20;
          border-radius: 4px;
          pointer-events: auto;
          cursor: pointer;
          opacity: ${opacity};
          transition: opacity 0.2s;
          position: relative;
        `;

        // Label
        if (annotation.label) {
          const label = document.createElement('div');
          label.style.cssText = `
            position: absolute;
            bottom: 100%;
            left: 0;
            padding: 2px 6px;
            background: ${color};
            color: white;
            font-size: 10px;
            font-weight: 600;
            white-space: nowrap;
            border-radius: 3px 3px 0 0;
            line-height: 1.3;
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
          `;
          label.textContent = annotation.label;
          el.appendChild(label);
        }

        // Tooltip on hover
        el.title = [annotation.label, annotation.details].filter(Boolean).join(' \u2014 ');

        el.addEventListener('mouseenter', () => { el.style.opacity = '1'; });
        el.addEventListener('mouseleave', () => { el.style.opacity = String(opacity); });

        // Convert normalized coordinates to OSD viewport coordinates
        const rect = new OSD.Rect(
          annotation.x,
          annotation.y,
          annotation.width || 0.02,
          annotation.height || 0.02
        );

        try {
          viewer.addOverlay({
            element: el,
            location: rect,
          });
          newElements.push(el);
        } catch (e) {
          // Viewer may not be ready
        }
      });
    });

    setOverlayElements(newElements);
  }, [viewer, layers, zoom]);

  useEffect(() => {
    updateOverlays();
  }, [updateOverlays]);

  // Re-render overlays when viewer resizes
  useEffect(() => {
    if (!viewer) return;
    const handler = () => updateOverlays();
    viewer.addHandler('resize', handler);
    return () => viewer.removeHandler('resize', handler);
  }, [viewer, updateOverlays]);

  return null; // Overlays are rendered directly in the OSD container
}
