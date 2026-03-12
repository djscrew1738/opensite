import { useState, useRef, useCallback, useEffect } from 'react';
import { useHaptic } from './useHaptic';

const THRESHOLD = 72;      // px of overscroll to trigger refresh
const RESISTANCE = 0.45;   // rubber-band resistance factor
const MAX_PULL = 120;       // maximum visual pull distance

/**
 * usePullToRefresh
 *
 * Attaches overscroll-based pull-to-refresh to a scroll container.
 * Returns `ref` (attach to scroll container), `pullDistance`, `isPulling`,
 * `isRefreshing`, and display helpers.
 *
 * @param {Function} onRefresh  — async function called when threshold is crossed
 * @param {Object}   options
 * @param {boolean}  options.enabled   — disable hook (e.g. when a page is not top)
 * @param {number}   options.threshold — px to trigger (default 72)
 *
 * @example
 * const { ref, pullDistance, isPulling, isRefreshing, progress } =
 *   usePullToRefresh(() => fetchData());
 *
 * return (
 *   <div ref={ref} className="overflow-y-auto">
 *     <PullIndicator distance={pullDistance} progress={progress} isRefreshing={isRefreshing} />
 *     {children}
 *   </div>
 * );
 */
export function usePullToRefresh(onRefresh, { enabled = true, threshold = THRESHOLD } = {}) {
  const containerRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const haptic = useHaptic();
  const passedThresholdRef = useRef(false);

  const progress = Math.min(pullDistance / threshold, 1);

  const handleTouchStart = useCallback((e) => {
    if (!enabled || isRefreshing) return;
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
  }, [enabled, isRefreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!enabled || isRefreshing || !startY.current) return;
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) {
      startY.current = 0;
      return;
    }

    const y = e.touches[0].clientY;
    const delta = y - startY.current;
    if (delta <= 0) return;

    currentY.current = y;
    // Rubber-band resistance
    const visual = Math.min(delta * RESISTANCE, MAX_PULL);
    setPullDistance(visual);
    setIsPulling(true);

    // Haptic tick at threshold crossing
    if (visual >= threshold && !passedThresholdRef.current) {
      passedThresholdRef.current = true;
      haptic.tick();
    } else if (visual < threshold && passedThresholdRef.current) {
      passedThresholdRef.current = false;
    }

    if (e.cancelable) e.preventDefault();
  }, [enabled, isRefreshing, threshold, haptic]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    const shouldRefresh = pullDistance >= threshold;

    setIsPulling(false);
    setPullDistance(0);
    startY.current = 0;
    passedThresholdRef.current = false;

    if (shouldRefresh && onRefresh) {
      haptic.confirm();
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [isPulling, pullDistance, threshold, onRefresh, haptic]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove',  handleTouchMove,  { passive: false });
    el.addEventListener('touchend',   handleTouchEnd,   { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove',  handleTouchMove);
      el.removeEventListener('touchend',   handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    ref: containerRef,
    pullDistance,
    isPulling,
    isRefreshing,
    progress,      // 0–1 normalised
  };
}

export default usePullToRefresh;
