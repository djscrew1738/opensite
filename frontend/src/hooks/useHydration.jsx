import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

/**
 * useHydration - Detects when the app has finished hydrating on the client
 * 
 * Useful for:
 * - Preventing hydration mismatches between server and client renders
 * - Delaying client-only features until after hydration
 * - Showing loading states during hydration
 * 
 * @returns {boolean} Whether the app has hydrated
 * 
 * @example
 * function ClientOnlyComponent() {
 *   const isHydrated = useHydration();
 *   
 *   if (!isHydrated) {
 *     return <Skeleton />; // Server-safe fallback
 *   }
 *   
 *   return <InteractiveComponent />;
 * }
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

/**
 * useIsClient - Alternative to useHydration with additional client checks
 * 
 * Returns true only when running in a browser environment after hydration.
 * More conservative than useHydration.
 * 
 * @returns {boolean} Whether we're on the client after hydration
 * 
 * @example
 * function BrowserFeature() {
 *   const isClient = useIsClient();
 *   
 *   // Don't render on server or during hydration
 *   if (!isClient) return null;
 *   
 *   return <div>{window.innerWidth}</div>;
 * }
 */
export function useIsClient() {
  return useSyncExternalStore(
    () => () => {}, // No-op subscription
    () => true,     // Client value
    () => false     // Server value
  );
}

/**
 * useHydrationSafe - Returns a value that only updates after hydration
 * 
 * Prevents hydration mismatches by returning the server-safe initial value
 * until hydration completes, then switches to the client value.
 * 
 * @param {Function} clientValueFn - Function that returns the client-side value
 * @param {any} serverValue - Value to use on server and during hydration
 * @returns {any} The safe value (serverValue during SSR, clientValue after hydration)
 * 
 * @example
 * function ThemeToggle() {
 *   // Returns 'light' on server, then actual preference after hydration
 *   const theme = useHydrationSafe(
 *     () => localStorage.getItem('theme') || 'system',
 *     'light' // server-safe default
 *   );
 *   
 *   return <button className={theme}>Toggle Theme</button>;
 * }
 */
export function useHydrationSafe(clientValueFn, serverValue) {
  const [value, setValue] = useState(serverValue);
  const isHydrated = useHydration();

  useEffect(() => {
    if (isHydrated) {
      setValue(clientValueFn());
    }
  }, [isHydrated, clientValueFn]);

  return value;
}

/**
 * useHydrationState - useState that prevents hydration mismatches
 * 
 * Similar to useState but ensures the initial value is always the server-safe
 * value to prevent hydration mismatches.
 * 
 * @param {any} serverValue - Initial value for SSR and hydration
 * @param {Function} getClientValue - Function to get the client value after hydration
 * @returns {[any, Function]} [value, setValue]
 * 
 * @example
 * function WidthDisplay() {
 *   // Starts at 0 (server), then updates to actual width (client)
 *   const [width, setWidth] = useHydrationState(0, () => window.innerWidth);
 *   
 *   useEffect(() => {
 *     const handleResize = () => setWidth(window.innerWidth);
 *     window.addEventListener('resize', handleResize);
 *     return () => window.removeEventListener('resize', handleResize);
 *   }, []);
 *   
 *   return <div>Window width: {width}px</div>;
 * }
 */
export function useHydrationState(serverValue, getClientValue) {
  const [value, setValue] = useState(serverValue);
  const isHydrated = useHydration();

  useEffect(() => {
    if (isHydrated && getClientValue) {
      setValue(getClientValue());
    }
  }, [isHydrated, getClientValue]);

  return [value, setValue];
}

/**
 * withHydrationSafe - HOC that wraps a component with hydration safety
 * 
 * @param {Component} Component - Component to wrap
 * @param {Object} options - Options
 * @param {Component} options.fallback - Component to render during hydration
 * @returns {Component} Wrapped component
 * 
 * @example
 * const SafeChart = withHydrationSafe(ChartComponent, {
 *   fallback: ChartSkeleton
 * });
 * 
 * function Dashboard() {
 *   return <SafeChart data={data} />;
 * }
 */
export function withHydrationSafe(Component, options = {}) {
  const { fallback: Fallback = null } = options;

  return function HydrationSafeWrapper(props) {
    const isHydrated = useHydration();

    if (!isHydrated) {
      return Fallback ? <Fallback {...props} /> : null;
    }

    return <Component {...props} />;
  };
}

/**
 * useHydrationDelay - Delays rendering until after a specified time post-hydration
 * 
 * Useful for staggering animations or progressively revealing content.
 * 
 * @param {number} delayMs - Milliseconds to wait after hydration (default: 0)
 * @returns {boolean} Whether the delay has passed
 * 
 * @example
 * function StaggeredContent() {
 *   const showHeader = useHydrationDelay(0);
 *   const showContent = useHydrationDelay(100);
 *   const showFooter = useHydrationDelay(200);
 *   
 *   return (
 *     <>
 *       {showHeader && <Header />}
 *       {showContent && <Content />}
 *       {showFooter && <Footer />}
 *     </>
 *   );
 * }
 */
export function useHydrationDelay(delayMs = 0) {
  const [isReady, setIsReady] = useState(false);
  const isHydrated = useHydration();

  useEffect(() => {
    if (!isHydrated) return;

    if (delayMs === 0) {
      setIsReady(true);
      return;
    }

    const timer = setTimeout(() => {
      setIsReady(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [isHydrated, delayMs]);

  return isReady;
}

/**
 * useInteractive - Returns true when the page becomes interactive
 * 
 * Goes beyond basic hydration to detect when the page is fully interactive
 * (all event listeners attached, JS loaded, etc.)
 * 
 * @returns {boolean} Whether the page is fully interactive
 * 
 * @example
 * function App() {
 *   const isInteractive = useInteractive();
 *   
 *   return (
 *     <div className={isInteractive ? 'interactive' : 'loading'}>
 *       <button disabled={!isInteractive}>Click me</button>
 *     </div>
 *   );
 * }
 */
export function useInteractive() {
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    // Check if document is already interactive
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setIsInteractive(true);
      return;
    }

    // Wait for DOMContentLoaded or readystatechange
    const handleReady = () => {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setIsInteractive(true);
      }
    };

    document.addEventListener('readystatechange', handleReady);
    return () => document.removeEventListener('readystatechange', handleReady);
  }, []);

  return isInteractive;
}

/**
 * HydrationSafe - Render prop component for hydration-safe rendering
 * 
 * @param {Object} props - Component props
 * @param {Function} props.children - Render function (receives { isHydrated, isClient })
 * @param {ReactNode} props.fallback - Fallback to render during hydration
 * @returns {ReactNode} The rendered content
 * 
 * @example
 * <HydrationSafe fallback={<Skeleton />}>
 *   {({ isHydrated }) => (
 *     <Chart data={isHydrated ? liveData : staticData} />
 *   )}
 * </HydrationSafe>
 */
export function HydrationSafe({ children, fallback = null }) {
  const isHydrated = useHydration();
  const isClient = useIsClient();

  if (!isHydrated) {
    return fallback;
  }

  return children({ isHydrated, isClient });
}
