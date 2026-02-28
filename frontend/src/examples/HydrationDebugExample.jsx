/**
 * HYDRATION DEBUG EXAMPLE
 * 
 * Prompt: "My React app is loading fast, but it's taking 3 seconds for the 
 * buttons to become clickable. Can you help me debug the hydration phase?"
 * 
 * This example shows:
 * 1. How to detect hydration issues
 * 2. How to measure hydration time
 * 3. How to prevent hydration mismatches
 * 4. How to progressively enhance the UI
 */

import { useEffect, useState, useRef, memo } from 'react';
import { 
  useHydration, 
  useHydrationDelay, 
  useInteractive,
  HydrationSafe 
} from '../hooks/useHydration';
import { useMemoizedCallback } from '../hooks/useMemoizedCallback';

// ═════════════════════════════════════════════════════════════════════════════
// HYDRATION MONITORING - Track hydration performance
// ═════════════════════════════════════════════════════════════════════════════

/**
 * useHydrationMetrics - Hook to measure hydration timing
 * Use this to identify slow hydration in development
 */
function useHydrationMetrics(componentName) {
  const startTimeRef = useRef(performance.now());
  const isHydrated = useHydration();
  const isInteractive = useInteractive();

  useEffect(() => {
    if (isHydrated) {
      const hydrationTime = performance.now() - startTimeRef.current;
      
      // Log hydration metrics
      console.log(`[Hydration] ${componentName}:`, {
        hydrationTimeMs: Math.round(hydrationTime),
        timestamp: new Date().toISOString(),
      });

      // Warn if hydration is slow (> 100ms)
      if (hydrationTime > 100) {
        console.warn(
          `[Hydration] ${componentName} took ${Math.round(hydrationTime)}ms to hydrate. ` +
          'Consider: reducing component complexity, lazy loading, or code splitting.'
        );
      }
    }
  }, [isHydrated, componentName]);

  useEffect(() => {
    if (isInteractive) {
      const timeToInteractive = performance.now() - startTimeRef.current;
      console.log(`[TTI] ${componentName} became interactive after ${Math.round(timeToInteractive)}ms`);
    }
  }, [isInteractive, componentName]);

  return { isHydrated, isInteractive };
}

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: DEBUGGING SLOW HYDRATION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * SlowHydrationDebug - Component that helps identify hydration bottlenecks
 */
export function SlowHydrationDebug({ children }) {
  const [metrics, setMetrics] = useState(null);
  const renderCount = useRef(0);
  renderCount.current++;

  useEffect(() => {
    // Record hydration complete time
    const hydrationTime = performance.now();
    
    // Check for common hydration issues
    const issues = [];
    
    // Issue 1: Large component tree
    if (renderCount.current > 5) {
      issues.push(`Too many renders during hydration (${renderCount.current})`);
    }
    
    // Issue 2: Check for hydration mismatch
    const hasMismatch = document.querySelector('[data-hydration-mismatch]');
    if (hasMismatch) {
      issues.push('Hydration mismatch detected - check server/client HTML differences');
    }

    setMetrics({
      hydrationTime,
      renderCount: renderCount.current,
      issues,
      userAgent: navigator.userAgent,
      memory: performance.memory ? {
        usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
      } : 'N/A',
    });
  }, []);

  // Show debug panel in development
  if (process.env.NODE_ENV === 'development' && metrics) {
    return (
      <>
        {children}
        <HydrationDebugPanel metrics={metrics} />
      </>
    );
  }

  return children;
}

function HydrationDebugPanel({ metrics }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        zIndex: 9999,
        fontFamily: 'monospace',
        fontSize: '12px',
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px 12px',
          background: metrics.issues.length > 0 ? '#ef4444' : '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Hydration {metrics.issues.length > 0 ? `(${metrics.issues.length} issues)` : 'OK'}
      </button>
      
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: '8px',
            padding: '16px',
            background: '#1f2937',
            color: '#f3f4f6',
            borderRadius: '8px',
            width: '320px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Hydration Metrics</h3>
          <pre style={{ margin: 0, overflow: 'auto' }}>
            {JSON.stringify(metrics, null, 2)}
          </pre>
          {metrics.issues.length > 0 && (
            <div style={{ marginTop: '12px', color: '#fca5a5' }}>
              <strong>Issues:</strong>
              <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                {metrics.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: PROGRESSIVE HYDRATION - Fix slow button interactions
// ═════════════════════════════════════════════════════════════════════════════

/**
 * ProgressiveButton - Button that becomes clickable immediately after hydration
 * 
 * Solution to: "buttons taking 3 seconds to become clickable"
 */
export const ProgressiveButton = memo(function ProgressiveButton({ 
  onClick, 
  children,
  disabled = false,
  ...props 
}) {
  const isHydrated = useHydration();
  const isInteractive = useInteractive();
  
  // Use stable callback to prevent unnecessary re-renders
  const handleClick = useMemoizedCallback((e) => {
    if (!isInteractive) {
      console.warn('[Hydration] Button clicked before interactivity');
      return;
    }
    onClick?.(e);
  });

  return (
    <button
      onClick={handleClick}
      disabled={disabled || !isHydrated}
      style={{
        opacity: isHydrated ? 1 : 0.6,
        cursor: isHydrated ? 'pointer' : 'not-allowed',
        position: 'relative',
      }}
      {...props}
    >
      {children}
      {/* Loading indicator during hydration */}
      {!isHydrated && (
        <span 
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
          aria-hidden="true"
        >
          ...
        </span>
      )}
    </button>
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: HYDRATION-SAFE COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * ClientOnly - Only renders children on the client after hydration
 * Prevents hydration mismatches for client-only features
 */
export function ClientOnly({ children, fallback = null }) {
  return (
    <HydrationSafe fallback={fallback}>
      {() => children}
    </HydrationSafe>
  );
}

/**
 * StaggeredHydration - Gradually reveals content to reduce hydration load
 */
export function StaggeredHydration({ children, staggerDelay = 50 }) {
  const delays = [0, 1, 2, 3].map(i => i * staggerDelay);
  
  return (
    <>
      {children.map((child, index) => (
        <StaggeredItem key={index} delay={delays[index % delays.length]}>
          {child}
        </StaggeredItem>
      ))}
    </>
  );
}

function StaggeredItem({ children, delay }) {
  const isReady = useHydrationDelay(delay);
  
  return (
    <div
      style={{
        opacity: isReady ? 1 : 0,
        transform: isReady ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
      }}
    >
      {children}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: LAZY HYDRATION - Defer hydration of non-critical components
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LazyHydrate - Delays hydration of heavy components until idle
 */
export function LazyHydrate({ children, fallback, priority = 'low' }) {
  const [shouldHydrate, setShouldHydrate] = useState(false);
  const isHydrated = useHydration();

  useEffect(() => {
    if (!isHydrated) return;

    if (priority === 'high') {
      setShouldHydrate(true);
    } else if (priority === 'low' && 'requestIdleCallback' in window) {
      const id = requestIdleCallback(() => setShouldHydrate(true), { timeout: 2000 });
      return () => cancelIdleCallback(id);
    } else {
      // Fallback for browsers without requestIdleCallback
      const timer = setTimeout(() => setShouldHydrate(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isHydrated, priority]);

  if (!shouldHydrate) {
    return fallback || null;
  }

  return children;
}

// ═════════════════════════════════════════════════════════════════════════════
// USAGE EXAMPLE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Example: App wrapper with hydration debugging
 */
export function AppWithHydrationDebug() {
  return (
    <SlowHydrationDebug>
      <YourApp />
    </SlowHydrationDebug>
  );
}

function YourApp() {
  return (
    <div>
      {/* These buttons become clickable immediately after hydration */}
      <ProgressiveButton onClick={() => console.log('Clicked!')}>
        Click Me
      </ProgressiveButton>

      {/* Heavy component hydrates when browser is idle */}
      <LazyHydrate 
        fallback={<div>Loading chart...</div>}
        priority="low"
      >
        <HeavyChartComponent />
      </LazyHydrate>

      {/* Content staggers in to reduce hydration jank */}
      <StaggeredHydration staggerDelay={100}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i}>Item {i}</div>
        ))}
      </StaggeredHydration>

      {/* Client-only component (no SSR) */}
      <ClientOnly fallback={<div>Loading map...</div>}>
        <InteractiveMap />
      </ClientOnly>
    </div>
  );
}

// Placeholder components
function HeavyChartComponent() {
  return <div>Complex Chart</div>;
}

function InteractiveMap() {
  return <div>Interactive Map</div>;
}

export default AppWithHydrationDebug;
