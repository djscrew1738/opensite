import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SmoothPage — Wrapper component for smooth page transitions
 * 
 * Features:
 * - Smooth fade-in animation on mount
 * - Staggered children animation support
 * - Directional slide animations for tab navigation
 * - Prevents flash of unstyled content
 */
export function SmoothPage({ 
  children, 
  className = '', 
  stagger = false,
  direction = null, // 'left' | 'right' | null
  delay = 0 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const hasMounted = useRef(false);

  useEffect(() => {
    // Small delay to allow browser to paint
    const timer = setTimeout(() => {
      setIsVisible(true);
      hasMounted.current = true;
    }, delay);
    
    return () => {
      clearTimeout(timer);
      setIsVisible(false);
    };
  }, [location.pathname, delay]);

  // Determine animation class
  const getAnimationClass = () => {
    if (!isVisible) return 'opacity-0';
    
    if (direction === 'left') return 'page-slide-left';
    if (direction === 'right') return 'page-slide-right';
    return 'page-transition-wrapper';
  };

  return (
    <div 
      className={`
        ${getAnimationClass()} 
        ${stagger ? 'stagger-container' : ''} 
        ${className}
      `}
      style={{ 
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

/**
 * PageSection — A section within a page with entrance animation
 */
export function PageSection({ 
  children, 
  className = '', 
  delay = 0,
  as: Component = 'div'
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Component 
      className={`
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}
        ${className}
      `}
      style={{ 
        transitionDelay: `${delay}ms`,
        willChange: 'transform, opacity' 
      }}
    >
      {children}
    </Component>
  );
}

/**
 * StaggerItem — Individual item with staggered entrance
 */
export function StaggerItem({ 
  children, 
  className = '',
  index = 0,
  baseDelay = 0
}) {
  const delay = baseDelay + (index * 40);
  
  return (
    <div 
      className={`
        animate-in fade-in slide-in-from-bottom-2
        duration-300 ease-out
        ${className}
      `}
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  );
}

/**
 * usePageTransition — Hook for managing page transitions
 */
export function usePageTransition() {
  const location = useLocation();
  const prevPath = useRef(location.pathname);
  const [direction, setDirection] = useState(null);

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      // Simple heuristic: compare path depth or order
      const paths = ['/', '/leads', '/plans', '/ai', '/history', '/vision', '/settings', '/plumbing', '/documents'];
      const currentIdx = paths.indexOf(location.pathname);
      const prevIdx = paths.indexOf(prevPath.current);
      
      if (currentIdx !== -1 && prevIdx !== -1) {
        setDirection(currentIdx > prevIdx ? 'left' : 'right');
      }
      
      prevPath.current = location.pathname;
    }
  }, [location.pathname]);

  return { direction, pathname: location.pathname };
}
