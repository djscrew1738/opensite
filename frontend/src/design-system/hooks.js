/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DARK FORGE INTERACTION HOOKS — UI/UX Overhaul
 * Custom React hooks for micro-interactions and UI behaviors
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// REDUCED MOTION
// ═══════════════════════════════════════════════════════════════════════════════

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (event) => setReducedMotion(event.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOVER STATE
// ═══════════════════════════════════════════════════════════════════════════════

export function useHover() {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return { ref, isHovered };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESS/ACTIVE STATE
// ═══════════════════════════════════════════════════════════════════════════════

export function usePress() {
  const [isPressed, setIsPressed] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);
    const handleTouchStart = () => setIsPressed(true);
    const handleTouchEnd = () => setIsPressed(false);

    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseUp);
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mouseleave', handleMouseUp);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return { ref, isPressed };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMBINED HOVER + PRESS
// ═══════════════════════════════════════════════════════════════════════════════

export function useInteraction() {
  const [state, setState] = useState({ hovered: false, pressed: false, focused: false });
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const setHovered = (hovered) => setState(s => ({ ...s, hovered }));
    const setPressed = (pressed) => setState(s => ({ ...s, pressed }));
    const setFocused = (focused) => setState(s => ({ ...s, focused }));

    element.addEventListener('mouseenter', () => setHovered(true));
    element.addEventListener('mouseleave', () => { setHovered(false); setPressed(false); });
    element.addEventListener('mousedown', () => setPressed(true));
    element.addEventListener('mouseup', () => setPressed(false));
    element.addEventListener('touchstart', () => setPressed(true), { passive: true });
    element.addEventListener('touchend', () => setPressed(false));
    element.addEventListener('focus', () => setFocused(true));
    element.addEventListener('blur', () => setFocused(false));

    return () => {
      element.removeEventListener('mouseenter', () => setHovered(true));
      element.removeEventListener('mouseleave', () => { setHovered(false); setPressed(false); });
      element.removeEventListener('mousedown', () => setPressed(true));
      element.removeEventListener('mouseup', () => setPressed(false));
      element.removeEventListener('touchstart', () => setPressed(true));
      element.removeEventListener('touchend', () => setPressed(false));
      element.removeEventListener('focus', () => setFocused(true));
      element.removeEventListener('blur', () => setFocused(false));
    };
  }, []);

  return { ref, ...state };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COUNT UP ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

export function useCountUp(
  end,
  { start = 0, duration = 1000, delay = 0, decimals = 0, suffix = '', prefix = '' } = {}
) {
  const [value, setValue] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);
  const reducedMotion = useReducedMotion();

  const startAnimation = useCallback(() => {
    if (reducedMotion) {
      setValue(end);
      return;
    }

    setIsAnimating(true);
    const startTime = performance.now() + delay;
    const diff = end - start;

    const tick = (now) => {
      if (now < startTime) {
        requestAnimationFrame(tick);
        return;
      }

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = start + diff * eased;
      
      setValue(Number(current.toFixed(decimals)));

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(tick);
  }, [end, start, duration, delay, decimals, reducedMotion]);

  const displayValue = `${prefix}${value.toLocaleString()}${suffix}`;

  return { value, displayValue, isAnimating, startAnimation };
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERSECTION OBSERVER (Scroll Reveal)
// ═══════════════════════════════════════════════════════════════════════════════

export function useInView(options = {}) {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options;
  const [isInView, setIsInView] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (triggerOnce && hasTriggered) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) {
            setHasTriggered(true);
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return { ref, isInView };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEBOUNCED VALUE
// ═══════════════════════════════════════════════════════════════════════════════

export function useDebouncedValue(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ═══════════════════════════════════════════════════════════════════════════════
// THROTTLED CALLBACK
// ═══════════════════════════════════════════════════════════════════════════════

export function useThrottledCallback(callback, delay = 100) {
  const lastRun = useRef(0);
  const timeout = useRef(null);

  return useCallback(
    (...args) => {
      const now = Date.now();
      const remaining = delay - (now - lastRun.current);

      if (remaining <= 0) {
        lastRun.current = now;
        callback(...args);
      } else if (!timeout.current) {
        timeout.current = setTimeout(() => {
          lastRun.current = Date.now();
          timeout.current = null;
          callback(...args);
        }, remaining);
      }
    },
    [callback, delay]
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LONG PRESS
// ═══════════════════════════════════════════════════════════════════════════════

export function useLongPress(callback, { threshold = 500 } = {}) {
  const [isLongPress, setIsLongPress] = useState(false);
  const timerRef = useRef(null);
  const isLongPressRef = useRef(false);

  const start = useCallback(() => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsLongPress(true);
      callback();
    }, threshold);
  }, [callback, threshold]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsLongPress(false);
  }, []);

  const handlers = {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };

  return { handlers, isLongPress };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RIPPLE EFFECT
// ═══════════════════════════════════════════════════════════════════════════════

export function useRipple() {
  const [ripples, setRipples] = useState([]);

  const createRipple = useCallback((event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const newRipple = {
      x,
      y,
      size,
      id: Date.now(),
    };

    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
  }, []);

  return { ripples, createRipple };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS TRAP (for modals)
// ═══════════════════════════════════════════════════════════════════════════════

export function useFocusTrap(isActive) {
  const containerRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    previousFocus.current = document.activeElement;
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement?.focus();

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        previousFocus.current?.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscape);
      previousFocus.current?.focus();
    };
  }, [isActive]);

  return containerRef;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCROLL POSITION
// ═══════════════════════════════════════════════════════════════════════════════

export function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const [scrollDirection, setScrollDirection] = useState('up');
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;

    const updatePosition = () => {
      const currentY = window.scrollY;
      setScrollPosition({ x: window.scrollX, y: currentY });
      setScrollDirection(currentY > lastScrollY.current ? 'down' : 'up');
      lastScrollY.current = currentY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updatePosition);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { ...scrollPosition, direction: scrollDirection };
}

// ═══════════════════════════════════════════════════════════════════════════════
// WINDOW SIZE
// ═══════════════════════════════════════════════════════════════════════════════

export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    let ticking = false;

    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      ticking = false;
    };

    const onResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateSize);
        ticking = true;
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return size;
}

// ═══════════════════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════════════════════════════

export function useKeyPress(targetKey, callback) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === targetKey) {
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetKey, callback]);
}

export function useKeyCombo(keys, callback) {
  const pressedKeys = useRef(new Set());

  useEffect(() => {
    const handleKeyDown = (event) => {
      pressedKeys.current.add(event.key);
      
      if (keys.every(k => pressedKeys.current.has(k))) {
        event.preventDefault();
        callback(event);
      }
    };

    const handleKeyUp = (event) => {
      pressedKeys.current.delete(event.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keys, callback]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ONLINE STATUS
// ═══════════════════════════════════════════════════════════════════════════════

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEDIA QUERY
// ═══════════════════════════════════════════════════════════════════════════════

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const handler = (event) => setMatches(event.matches);
    media.addEventListener('change', handler);

    return () => media.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOUCH DEVICE DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }, []);

  return isTouch;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMOOTH SCROLL TO
// ═══════════════════════════════════════════════════════════════════════════════

export function useSmoothScroll() {
  const scrollTo = useCallback((target, options = {}) => {
    const { offset = 0, behavior = 'smooth' } = options;
    
    let element;
    if (typeof target === 'string') {
      element = document.querySelector(target);
    } else if (target?.current) {
      element = target.current;
    } else {
      element = target;
    }

    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top, behavior });
    }
  }, []);

  return scrollTo;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING STATE
// ═══════════════════════════════════════════════════════════════════════════════

export function useLoadingState() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingError = useCallback((err) => {
    setIsLoading(false);
    setError(err);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    reset,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATION SEQUENCE
// ═══════════════════════════════════════════════════════════════════════════════

export function useAnimationSequence(steps, options = {}) {
  const { onComplete, autoStart = false } = options;
  const [currentStep, setCurrentStep] = useState(autoStart ? 0 : -1);
  const [isRunning, setIsRunning] = useState(autoStart);

  const start = useCallback(() => {
    setCurrentStep(0);
    setIsRunning(true);
  }, []);

  const next = useCallback(() => {
    setCurrentStep(prev => {
      const nextStep = prev + 1;
      if (nextStep >= steps.length) {
        setIsRunning(false);
        onComplete?.();
        return -1;
      }
      return nextStep;
    });
  }, [steps.length, onComplete]);

  const reset = useCallback(() => {
    setCurrentStep(-1);
    setIsRunning(false);
  }, []);

  return {
    currentStep,
    isRunning,
    start,
    next,
    reset,
    step: steps[currentStep],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLTIP POSITION
// ═══════════════════════════════════════════════════════════════════════════════

export function useTooltipPosition(triggerRef, tooltipRef, placement = 'top') {
  const [position, setPosition] = useState({ x: 0, y: 0, placement });

  useEffect(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = 0;
    let y = 0;
    let finalPlacement = placement;

    // Calculate position based on placement
    switch (placement) {
      case 'top':
        x = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        y = triggerRect.top - tooltipRect.height - 8;
        if (y < 0) {
          y = triggerRect.bottom + 8;
          finalPlacement = 'bottom';
        }
        break;
      case 'bottom':
        x = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        y = triggerRect.bottom + 8;
        if (y + tooltipRect.height > viewportHeight) {
          y = triggerRect.top - tooltipRect.height - 8;
          finalPlacement = 'top';
        }
        break;
      case 'left':
        x = triggerRect.left - tooltipRect.width - 8;
        y = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        if (x < 0) {
          x = triggerRect.right + 8;
          finalPlacement = 'right';
        }
        break;
      case 'right':
        x = triggerRect.right + 8;
        y = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        if (x + tooltipRect.width > viewportWidth) {
          x = triggerRect.left - tooltipRect.width - 8;
          finalPlacement = 'left';
        }
        break;
    }

    // Ensure tooltip stays within viewport horizontally
    x = Math.max(8, Math.min(x, viewportWidth - tooltipRect.width - 8));

    setPosition({ x, y, placement: finalPlacement });
  }, [triggerRef, tooltipRef, placement]);

  return position;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT DEFAULT
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  useReducedMotion,
  useHover,
  usePress,
  useInteraction,
  useCountUp,
  useInView,
  useDebouncedValue,
  useThrottledCallback,
  useLongPress,
  useRipple,
  useFocusTrap,
  useScrollPosition,
  useWindowSize,
  useKeyPress,
  useKeyCombo,
  useOnlineStatus,
  useMediaQuery,
  useIsTouchDevice,
  useSmoothScroll,
  useLoadingState,
  useAnimationSequence,
  useTooltipPosition,
};
