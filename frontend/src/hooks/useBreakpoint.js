import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Breakpoint definitions following Tailwind defaults
 */
export const BREAKPOINTS = {
  sm: 640,   // Small devices (landscape phones)
  md: 768,   // Medium devices (tablets)
  lg: 1024,  // Large devices (desktops)
  xl: 1280,  // Extra large devices
  '2xl': 1536, // 2X Extra large devices
};

/**
 * Hook to track current breakpoint
 * @returns {Object} Current breakpoint state
 */
export function useBreakpoint() {
  const [width, setWidth] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth : BREAKPOINTS.lg
  );

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const breakpoint = useMemo(() => {
    if (width >= BREAKPOINTS['2xl']) return '2xl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
  }, [width]);

  const isMobile = width < BREAKPOINTS.md;
  const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
  const isDesktop = width >= BREAKPOINTS.lg;
  const isLargeDesktop = width >= BREAKPOINTS.xl;

  return {
    width,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    // Helpers
    isBelow: (bp) => width < BREAKPOINTS[bp],
    isAbove: (bp) => width >= BREAKPOINTS[bp],
    isBetween: (min, max) => width >= BREAKPOINTS[min] && width < BREAKPOINTS[max],
  };
}

/**
 * Hook for responsive values based on breakpoint
 * @param {Object} values - Values for each breakpoint
 * @returns {any} Value for current breakpoint
 */
export function useResponsiveValue(values) {
  const { breakpoint, isMobile, isTablet, isDesktop } = useBreakpoint();
  
  return useMemo(() => {
    // Direct breakpoint match
    if (values[breakpoint] !== undefined) {
      return values[breakpoint];
    }
    
    // Mobile/Tablet/Desktop shorthand
    if (isMobile && values.mobile !== undefined) return values.mobile;
    if (isTablet && values.tablet !== undefined) return values.tablet;
    if (isDesktop && values.desktop !== undefined) return values.desktop;
    
    // Default fallback
    return values.default ?? values.lg ?? values.md ?? values.sm ?? values.xs;
  }, [breakpoint, isMobile, isTablet, isDesktop, values]);
}

/**
 * Hook to detect touch device
 */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
      );
    };
    
    checkTouch();
  }, []);

  return isTouch;
}

/**
 * Hook to detect orientation
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState(() => 
    typeof window !== 'undefined' && window.screen?.orientation?.type 
      ? window.screen.orientation.type
      : 'landscape-primary'
  );

  useEffect(() => {
    const handleChange = () => {
      setOrientation(window.screen?.orientation?.type || 'landscape-primary');
    };

    window.addEventListener('orientationchange', handleChange);
    return () => window.removeEventListener('orientationchange', handleChange);
  }, []);

  const isPortrait = orientation.includes('portrait');
  const isLandscape = orientation.includes('landscape');

  return { orientation, isPortrait, isLandscape };
}

/**
 * Hook to detect if user prefers reduced motion
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook for media query
 * @param {string} query - CSS media query
 * @returns {boolean} Whether media query matches
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const handler = (e) => setMatches(e.matches);
    media.addEventListener('change', handler);
    
    return () => media.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export default useBreakpoint;
