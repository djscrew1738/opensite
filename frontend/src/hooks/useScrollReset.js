import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * useScrollReset — Smoothly resets scroll position on route change
 * 
 * Features:
 * - Resets scroll to top on route change
 * - Optional smooth scrolling behavior
 * - Can be disabled for specific routes
 */
export function useScrollReset({ smooth = true, behavior = 'smooth' } = {}) {
  const location = useLocation();

  useEffect(() => {
    // Small delay to allow page transition to start
    const timer = setTimeout(() => {
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.scrollTo({
          top: 0,
          behavior: smooth ? behavior : 'auto',
        });
      } else {
        window.scrollTo({
          top: 0,
          behavior: smooth ? behavior : 'auto',
        });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname, smooth, behavior]);
}

export default useScrollReset;
