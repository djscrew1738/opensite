import { useEffect, useState, useRef } from 'react';

/**
 * AnimatedNumber — Count-up animation for metric displays
 * Uses easing for natural deceleration (fast start, slow finish)
 * Duration: 800ms per spec
 * 
 * Accessibility features:
 * - Respects prefers-reduced-motion
 * - aria-live region for screen reader announcements
 * - Visual hidden text for full value announcement
 */
export default function AnimatedNumber({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  announceChange = false,
}) {
  const [display, setDisplay] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const prevValueRef = useRef(0);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    const startValue = prevValueRef.current;
    prevValueRef.current = numValue;

    // If reduced motion is preferred, just show the final value
    if (prefersReducedMotion) {
      setDisplay(numValue);
      return;
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for natural deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (numValue - startValue) * eased;

      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    startTimeRef.current = null;
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, prefersReducedMotion]);

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.round(display).toLocaleString();

  const fullFormatted = decimals > 0
    ? Number(value).toFixed(decimals)
    : Math.round(Number(value)).toLocaleString();

  return (
    <>
      <span 
        className={`font-mono tabular-nums ${className}`}
        aria-label={announceChange ? undefined : `${prefix}${fullFormatted}${suffix}`}
      >
        {prefix}{formatted}{suffix}
      </span>
      {/* Screen reader announcement for value changes */}
      {announceChange && (
        <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          Value changed to {prefix}{fullFormatted}{suffix}
        </span>
      )}
    </>
  );
}
