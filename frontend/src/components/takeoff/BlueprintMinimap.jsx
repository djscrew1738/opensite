import { memo, useRef, useEffect, useCallback } from 'react';
import { MINIMAP_SIZE, MINIMAP_MARGIN } from './canvasUtils';

// ---------------------------------------------------------------------------
// BlueprintMinimap — a standalone canvas that renders the thumbnail + viewport
// ---------------------------------------------------------------------------

function BlueprintMinimap({ image, imageSize, zoom, offset, canvasWidth, canvasHeight, onPan }) {
  const minimapRef = useRef(null);

  // Full outer size including padding
  const outerSize = MINIMAP_SIZE + 8;

  // Compute minimap scaling once
  const mmScale = Math.min(MINIMAP_SIZE / imageSize.width, MINIMAP_SIZE / imageSize.height);
  const mmW = imageSize.width * mmScale;
  const mmH = imageSize.height * mmScale;
  const innerOffsetX = (MINIMAP_SIZE - mmW) / 2;
  const innerOffsetY = (MINIMAP_SIZE - mmH) / 2;

  // Draw the minimap
  const draw = useCallback(() => {
    const canvas = minimapRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 6);
    ctx.fill();
    ctx.stroke();

    // Image thumbnail
    const dx = 4 + innerOffsetX;
    const dy = 4 + innerOffsetY;
    ctx.drawImage(image, dx, dy, mmW, mmH);

    // Viewport rectangle
    const vpLeft = -offset.x / zoom;
    const vpTop = -offset.y / zoom;
    const vpW = canvasWidth / zoom;
    const vpH = canvasHeight / zoom;

    const vx = dx + vpLeft * mmScale;
    const vy = dy + vpTop * mmScale;
    const vw = vpW * mmScale;
    const vh = vpH * mmScale;

    const clampedX = Math.max(dx, vx);
    const clampedY = Math.max(dy, vy);
    const clampedW = Math.min(vw, mmW);
    const clampedH = Math.min(vh, mmH);

    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(clampedX, clampedY, clampedW, clampedH);
    ctx.fillStyle = 'rgba(37, 99, 235, 0.08)';
    ctx.fillRect(clampedX, clampedY, clampedW, clampedH);
  }, [image, imageSize, zoom, offset, canvasWidth, canvasHeight, mmScale, mmW, mmH, innerOffsetX, innerOffsetY]);

  // Redraw whenever dependencies change
  useEffect(() => {
    let frameId;
    const loop = () => {
      draw();
      frameId = requestAnimationFrame(loop);
    };
    loop();
    return () => { if (frameId) cancelAnimationFrame(frameId); };
  }, [draw]);

  // Handle clicks to pan
  const handleClick = useCallback((e) => {
    const canvas = minimapRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    // Convert minimap click to image coordinates
    const dx = 4 + innerOffsetX;
    const dy = 4 + innerOffsetY;
    const imgX = (cx - dx) / mmScale;
    const imgY = (cy - dy) / mmScale;

    // Only handle clicks inside the image area
    if (imgX >= 0 && imgX <= imageSize.width && imgY >= 0 && imgY <= imageSize.height) {
      onPan(imgX, imgY);
    }
  }, [innerOffsetX, innerOffsetY, mmScale, imageSize, onPan]);

  return (
    <canvas
      ref={minimapRef}
      width={outerSize}
      height={outerSize}
      onClick={handleClick}
      style={{
        position: 'absolute',
        right: MINIMAP_MARGIN,
        bottom: MINIMAP_MARGIN,
        width: outerSize,
        height: outerSize,
        cursor: 'pointer',
        pointerEvents: 'auto',
      }}
    />
  );
}

export default memo(BlueprintMinimap);
