import { useCallback, useRef } from 'react';

/**
 * useSwipe - Hook for detecting swipe gestures on touch devices
 * 
 * @param {Object} options
 * @param {Function} options.onSwipeLeft - Callback when user swipes left
 * @param {Function} options.onSwipeRight - Callback when user swipes right
 * @param {Function} options.onSwipeUp - Callback when user swipes up
 * @param {Function} options.onSwipeDown - Callback when user swipes down
 * @param {number} options.threshold - Minimum distance to trigger swipe (default: 50)
 * @param {number} options.timeout - Maximum time for swipe (default: 500ms)
 * 
 * @returns {Object} Swipe handlers to spread on element
 * 
 * @example
 * function MobileSidebar() {
 *   const swipeHandlers = useSwipe({
 *     onSwipeRight: () => setIsOpen(true),
 *     onSwipeLeft: () => setIsOpen(false),
 *   });
 *   
 *   return <div {...swipeHandlers}>Content</div>;
 * }
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  timeout = 500,
} = {}) {
  const touchStart = useRef(null);
  const touchStartTime = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    touchStartTime.current = Date.now();
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchStart.current || !touchStartTime.current) return;

    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();

    // Check if swipe was within timeout
    if (endTime - touchStartTime.current > timeout) {
      touchStart.current = null;
      touchStartTime.current = null;
      return;
    }

    const deltaX = endX - touchStart.current.x;
    const deltaY = endY - touchStart.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine if horizontal or vertical swipe
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (absDeltaX >= threshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }
    } else {
      // Vertical swipe
      if (absDeltaY >= threshold) {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }

    touchStart.current = null;
    touchStartTime.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, timeout]);

  const handleTouchMove = useCallback((e) => {
    // Prevent default scrolling when swiping horizontally
    if (!touchStart.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(touch.clientY - touchStart.current.y);

    // If horizontal swipe detected, prevent default scrolling
    if (absDeltaX > absDeltaY && absDeltaX > 10) {
      e.preventDefault();
    }
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchMove: handleTouchMove,
  };
}

/**
 * useSwipeable - Simplified API for common use case (left/right swipes)
 * @param {Function} onOpen - Called on right swipe
 * @param {Function} onClose - Called on left swipe
 */
export function useSwipeable({ onOpen, onClose, enabled = true } = {}) {
  return useSwipe({
    onSwipeRight: enabled ? onOpen : undefined,
    onSwipeLeft: enabled ? onClose : undefined,
  });
}

export default useSwipe;
