import { useState, useCallback, useRef } from 'react';

/**
 * useMicroInteraction — Hook for consistent micro-interactions
 * Provides state management for hover, active, focus, and success states
 */

export function useMicroInteraction({
  onHover,
  onPress,
  onRelease,
  onFocus,
  onBlur,
  successDuration = 2000
} = {}) {
  const [state, setState] = useState({
    isHovered: false,
    isPressed: false,
    isFocused: false,
    isSuccess: false,
    isError: false
  });

  const successTimeoutRef = useRef(null);

  const setHover = useCallback((value) => {
    setState(prev => ({ ...prev, isHovered: value }));
    if (value) onHover?.();
  }, [onHover]);

  const setPressed = useCallback((value) => {
    setState(prev => ({ ...prev, isPressed: value }));
    if (value) onPress?.();
    else onRelease?.();
  }, [onPress, onRelease]);

  const setFocused = useCallback((value) => {
    setState(prev => ({ ...prev, isFocused: value }));
    if (value) onFocus?.();
    else onBlur?.();
  }, [onFocus, onBlur]);

  const triggerSuccess = useCallback(() => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    
    setState(prev => ({ ...prev, isSuccess: true, isError: false }));
    
    successTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isSuccess: false }));
    }, successDuration);
  }, [successDuration]);

  const triggerError = useCallback((duration = 3000) => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    
    setState(prev => ({ ...prev, isError: true, isSuccess: false }));
    
    successTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isError: false }));
    }, duration);
  }, []);

  const reset = useCallback(() => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    setState({
      isHovered: false,
      isPressed: false,
      isFocused: false,
      isSuccess: false,
      isError: false
    });
  }, []);

  // Event handlers
  const handlers = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPressed(false);
    },
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
    onTouchStart: () => setPressed(true),
    onTouchEnd: () => setPressed(false),
    onFocus: () => setFocused(true),
    onBlur: () => {
      setFocused(false);
      setPressed(false);
    }
  };

  return {
    state,
    handlers,
    triggerSuccess,
    triggerError,
    reset,
    isInteractive: state.isHovered || state.isPressed || state.isFocused
  };
}

/**
 * useRipple — Hook for material-style ripple effect
 */
export function useRipple() {
  const [ripples, setRipples] = useState([]);
  const containerRef = useRef(null);

  const createRipple = useCallback((event) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const newRipple = {
      x,
      y,
      size,
      id: Date.now()
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
  }, []);

  return { ripples, createRipple, containerRef };
}

/**
 * useAnimatedNumber — Hook for animating number changes
 */
export function useAnimatedNumber(value, { duration = 500, delay = 0 } = {}) {
  const [displayValue, setDisplayValue] = useState(value);
  const startTimeRef = useRef(null);
  const startValueRef = useRef(value);

  const animate = useCallback((timestamp) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current - delay;
    
    if (elapsed < 0) {
      requestAnimationFrame(animate);
      return;
    }

    const progress = Math.min(elapsed / duration, 1);
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    
    const currentValue = startValueRef.current + (value - startValueRef.current) * easeOutQuart;
    setDisplayValue(Math.round(currentValue * 100) / 100);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      startTimeRef.current = null;
      startValueRef.current = value;
    }
  }, [value, duration, delay]);

  // Start animation when value changes
  const prevValueRef = useRef(value);
  if (prevValueRef.current !== value) {
    startTimeRef.current = null;
    prevValueRef.current = value;
    requestAnimationFrame(animate);
  }

  return displayValue;
}

/**
 * useStaggeredAnimation — Hook for staggered list animations
 */
export function useStaggeredAnimation(itemCount, { staggerDelay = 50, initialDelay = 0 } = {}) {
  const [visibleItems, setVisibleItems] = useState(new Set());

  const trigger = useCallback(() => {
    setVisibleItems(new Set());
    
    for (let i = 0; i < itemCount; i++) {
      setTimeout(() => {
        setVisibleItems(prev => new Set([...prev, i]));
      }, initialDelay + i * staggerDelay);
    }
  }, [itemCount, staggerDelay, initialDelay]);

  const isVisible = useCallback((index) => visibleItems.has(index), [visibleItems]);

  return { trigger, isVisible, visibleCount: visibleItems.size };
}

/**
 * useLoadingState — Hook for managing loading states with success/error feedback
 */
export function useLoadingState() {
  const [state, setState] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [error, setError] = useState(null);

  const startLoading = useCallback(() => {
    setState('loading');
    setError(null);
  }, []);

  const setSuccess = useCallback(() => {
    setState('success');
    setTimeout(() => setState('idle'), 2000);
  }, []);

  const setErrorState = useCallback((err) => {
    setState('error');
    setError(err);
    setTimeout(() => {
      setState('idle');
      setError(null);
    }, 3000);
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
  }, []);

  return {
    state,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    error,
    startLoading,
    setSuccess,
    setError: setErrorState,
    reset
  };
}

export default {
  useMicroInteraction,
  useRipple,
  useAnimatedNumber,
  useStaggeredAnimation,
  useLoadingState
};
