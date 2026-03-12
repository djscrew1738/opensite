/**
 * AnnotationOverlay Component
 * Renders annotation overlays on top of the OpenSeadragon viewer.
 * 
 * Supports:
 * - HTML Overlays (Rects) - for fixtures, labels, pins
 * - SVG Overlays (Paths) - for pipes, walls, runs
 * 
 * @module components/vision/AnnotationOverlay
 */

import { useEffect, useState, useCallback, useRef, memo } from 'react';
import { colors } from '../../styles/tokens';

// Default annotation color (functional, not design token)
const DEFAULT_ANNOTATION_COLOR = '#607D8B';

/**
 * AnnotationOverlay - Renders annotations on OpenSeadragon viewer
 * @param {{
 *   viewer: any;
 *   layers: any[];
 *   zoom: number;
 * }} props
 */
const AnnotationOverlay = memo(function AnnotationOverlay({ viewer, layers, zoom }) {
  const [overlayElements, setOverlayElements] = useState([]);
  const svgOverlayRef = useRef(null);

  // Initialize SVG Overlay
  useEffect(() => {
    if (!viewer || !window.OpenSeadragon) return;
    
    try {
      // svgOverlay is a plugin added to OSD prototype
      if (viewer.svgOverlay) {
        svgOverlayRef.current = viewer.svgOverlay();
      } else {
        console.warn('OSD SVG Overlay plugin not loaded correctly');
      }
    } catch (e) {
      console.error('Error initializing SVG overlay:', e);
    }

    return () => {
      // Cleanup handled by OSD viewer destroy
    };
  }, [viewer]);

  const updateOverlays = useCallback(() => {
    if (!viewer || !viewer.viewport) return;
    const OSD = window.OpenSeadragon;
    if (!OSD) return;

    // 1. CLEANUP PREVIOUS HTML OVERLAYS
    overlayElements.forEach(el => {
      try { viewer.removeOverlay(el); } catch (e) { /* ignore */ }
    });

    // 2. CLEANUP PREVIOUS SVG CONTENT
    if (svgOverlayRef.current) {
      const node = svgOverlayRef.current.node();
      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }
    }

    const newHTMLElements = [];

    (layers || []).forEach(layer => {
      if (!layer.visible) return;

      const inRange = zoom >= (layer.minZoom || 0) && zoom <= (layer.maxZoom || 20);
      if (!inRange) return;

      const color = layer.style?.color || DEFAULT_ANNOTATION_COLOR;
      const opacity = layer.style?.opacity || 0.6;
      const strokeWidth = layer.style?.strokeWidth || 2;

      (layer.data || []).forEach((annotation) => {
        // --- TYPE: PATH / POLYLINE (SVG) ---
        if (annotation.type === 'path' || annotation.points) {
          if (!svgOverlayRef.current) return;
          
          const points = annotation.points || [];
          if (points.length < 2) return;

          const path = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
          const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
          
          path.setAttribute('points', pointsStr);
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke', color);
          path.setAttribute('stroke-width', (strokeWidth / 1000).toString()); // normalized units
          path.setAttribute('stroke-opacity', opacity.toString());
          path.setAttribute('stroke-linecap', 'round');
          path.setAttribute('stroke-linejoin', 'round');
          path.style.cursor = 'pointer';
          path.style.pointerEvents = 'visibleStroke';

          // Hover effect
          path.addEventListener('mouseenter', () => path.setAttribute('stroke-opacity', '1'));
          path.addEventListener('mouseleave', () => path.setAttribute('stroke-opacity', opacity.toString()));

          if (annotation.label) {
            const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
            title.textContent = `${annotation.label}${annotation.details ? ': ' + annotation.details : ''}`;
            path.appendChild(title);
          }

          svgOverlayRef.current.node().appendChild(path);
        }
        
        // --- TYPE: RECT / PIN (HTML OVERLAY) ---
        else if (annotation.x !== undefined && annotation.y !== undefined) {
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

          if (annotation.label) {
            const label = document.createElement('div');
            label.style.cssText = `
              position: absolute;
              bottom: 100%;
              left: 0;
              padding: 2px 6px;
              background: ${color};
              color: ${colors.text.inverse};
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

          el.title = [annotation.label, annotation.details].filter(Boolean).join(' — ');
          el.addEventListener('mouseenter', () => { el.style.opacity = '1'; });
          el.addEventListener('mouseleave', () => { el.style.opacity = String(opacity); });

          const rect = new OSD.Rect(
            annotation.x,
            annotation.y,
            annotation.width || 0.02,
            annotation.height || 0.02
          );

          try {
            viewer.addOverlay({ element: el, location: rect });
            newHTMLElements.push(el);
          } catch (e) {}
        }
      });
    });

    setOverlayElements(newHTMLElements);
  }, [viewer, layers, zoom]);

  useEffect(() => {
    updateOverlays();
  }, [updateOverlays]);

  useEffect(() => {
    if (!viewer) return;
    const handler = () => updateOverlays();
    viewer.addHandler('resize', handler);
    return () => viewer.removeHandler('resize', handler);
  }, [viewer, updateOverlays]);

  return null;
});

AnnotationOverlay.displayName = 'AnnotationOverlay';

export default AnnotationOverlay;
