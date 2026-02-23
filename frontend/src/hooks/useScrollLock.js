import { useEffect, useRef } from 'react';

/**
 * useScrollLock - Locks body scroll when modal/dialog is open
 * Prevents background scrolling while maintaining modal scroll
 * 
 * @param {boolean} isLocked - Whether to lock scroll
 * @param {string} targetSelector - Optional selector for scrollable container (default: body)
 * 
 * @example
 * function Modal({ isOpen }) {
 *   useScrollLock(isOpen);
 *   return <div>// modal content</div>;
 * }
 * 
 * @example
 * // Lock specific container
 * function Drawer({ isOpen }) {
 *   useScrollLock(isOpen, '.drawer-content');
 *   return <div className="drawer-content">// drawer content</div>;
 * }
 */
export function useScrollLock(isLocked, targetSelector = null) {
  const scrollY = useRef(0);
  const originalStyles = useRef({});

  useEffect(() => {
    if (!isLocked) return;

    const target = targetSelector 
      ? document.querySelector(targetSelector)
      : document.body;

    if (!target) return;

    // Store current scroll position and styles
    scrollY.current = window.scrollY;
    originalStyles.current = {
      overflow: target.style.overflow,
      position: target.style.position,
      top: target.style.top,
      width: target.style.width,
      height: target.style.height,
      touchAction: target.style.touchAction
    };

    // Apply scroll lock styles
    if (target === document.body) {
      // For body, we need to maintain scroll position
      target.style.position = 'fixed';
      target.style.top = `-${scrollY.current}px`;
      target.style.width = '100%';
      target.style.height = '100%';
      target.style.overflow = 'hidden';
      target.style.touchAction = 'none';
    } else {
      // For specific container
      target.style.overflow = 'hidden';
      target.style.touchAction = 'none';
    }

    // Prevent touchmove on mobile
    const preventTouchMove = (e) => {
      // Allow scrolling within the modal if the target is inside it
      const modal = e.target.closest('[role="dialog"]');
      if (!modal) {
        e.preventDefault();
      }
    };

    // Only prevent touchmove on body, not inside modals
    if (target === document.body) {
      document.addEventListener('touchmove', preventTouchMove, { passive: false });
    }

    return () => {
      // Restore original styles
      Object.keys(originalStyles.current).forEach(key => {
        target.style[key] = originalStyles.current[key] || '';
      });

      // Restore scroll position if body was locked
      if (target === document.body && scrollY.current) {
        window.scrollTo(0, scrollY.current);
      }

      if (target === document.body) {
        document.removeEventListener('touchmove', preventTouchMove);
      }
    };
  }, [isLocked, targetSelector]);
}

/**
 * useBodyScrollLock - Simplified hook specifically for body scroll locking
 * @param {boolean} isLocked 
 */
export function useBodyScrollLock(isLocked) {
  return useScrollLock(isLocked, null);
}

export default useScrollLock;
