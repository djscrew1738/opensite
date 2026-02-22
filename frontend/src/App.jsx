import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider } from './hooks/useToast';
import { ToastContainer } from './components/shared';
import Layout from './components/layout/Layout';

// Lazy load pages — store import functions for prefetching
const pageImports = {
  dashboard: () => import('./pages/Dashboard'),
  leads: () => import('./pages/LeadFinder'),
  plans: () => import('./pages/Plans'),
  ai: () => import('./pages/AIAssistant'),
  history: () => import('./pages/History'),
  vision: () => import('./pages/Vision'),
  settings: () => import('./pages/Settings'),
  plumbing: () => import('./plumbing-visualizer/PlumbingVisualizer'),
  documents: () => import('./pages/Documents'),
  canvas: () => import('./pages/Canvas'),
  alerts: () => import('./pages/Alerts'),
};

const Dashboard = lazy(pageImports.dashboard);
const LeadFinder = lazy(pageImports.leads);
const Plans = lazy(pageImports.plans);
const AIAssistant = lazy(pageImports.ai);
const History = lazy(pageImports.history);
const Vision = lazy(pageImports.vision);
const Settings = lazy(pageImports.settings);
const PlumbingVisualizer = lazy(pageImports.plumbing);
const Documents = lazy(pageImports.documents);
const Canvas = lazy(pageImports.canvas);
const Alerts = lazy(pageImports.alerts);

// Map routes to prefetch keys
const routePrefetchMap = {
  '/': 'dashboard',
  '/leads': 'leads',
  '/plans': 'plans',
  '/ai': 'ai',
  '/history': 'history',
  '/vision': 'vision',
  '/settings': 'settings',
  '/plumbing': 'plumbing',
  '/documents': 'documents',
  '/canvas': 'canvas',
  '/alerts': 'alerts',
};

// Track which chunks have been prefetched
const prefetched = new Set();

/** Prefetch a page chunk by route path */
export function prefetchRoute(path) {
  const key = routePrefetchMap[path];
  if (!key || prefetched.has(key)) return;
  prefetched.add(key);
  // Fire-and-forget — just triggers the dynamic import so the browser caches it
  pageImports[key]?.();
}

/** Eager prefetch — loads immediately but quietly */
export function eagerPrefetch(path) {
  prefetchRoute(path);
}

// Dark Forge page loader
function PageLoader() {
  return (
    <div className="p-4 space-y-4 min-h-[60vh]">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg skeleton-shimmer" />
          <div className="h-3 w-72 rounded skeleton-shimmer" />
        </div>
        <div className="h-10 w-10 rounded-xl skeleton-shimmer" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl skeleton-shimmer flex-shrink-0"
            style={{ width: '140px', animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
      <div className="space-y-3 mt-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-xl skeleton-shimmer"
            style={{ animationDelay: `${(i + 4) * 50}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// Page transition wrapper with animation
function PageTransition({ children }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionClass, setTransitionClass] = useState('page-transition-wrapper');
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      // Determine direction based on route order
      const paths = Object.keys(routePrefetchMap);
      const currentIdx = paths.indexOf(location.pathname);
      const prevIdx = paths.indexOf(prevPath.current);
      
      const direction = currentIdx > prevIdx ? 'page-slide-left' : 'page-slide-right';
      setTransitionClass(direction);
      
      // Small delay to allow transition to start
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        prevPath.current = location.pathname;
      }, 30);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname, children]);

  return (
    <div className={`tab-content-wrapper ${transitionClass}`} key={location.pathname}>
      {displayChildren}
    </div>
  );
}

// Prefetch adjacent routes when a page loads
function RoutePrefetcher() {
  const location = useLocation();
  const prefetchedAdjacent = useRef(new Set());

  useEffect(() => {
    // Smooth scroll to top on route change
    const mainContent = document.querySelector('main');
    if (mainContent && mainContent.scrollTop > 0) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    if (prefetchedAdjacent.current.has(location.pathname)) return;
    prefetchedAdjacent.current.add(location.pathname);

    // After current page renders, prefetch likely next pages (idle callback)
    const id = requestIdleCallback?.(() => {
      const paths = Object.keys(routePrefetchMap);
      const currentIdx = paths.indexOf(location.pathname);

      // Prefetch neighbors and the most common destinations
      const toPrefetch = new Set(['/', '/settings']); // always-useful pages
      if (currentIdx >= 0) {
        if (paths[currentIdx - 1]) toPrefetch.add(paths[currentIdx - 1]);
        if (paths[currentIdx + 1]) toPrefetch.add(paths[currentIdx + 1]);
      }

      toPrefetch.forEach(p => {
        if (p !== location.pathname) prefetchRoute(p);
      });
    }, { timeout: 2000 }) ?? setTimeout(() => {
      // Fallback for browsers without requestIdleCallback
      prefetchRoute('/');
      prefetchRoute('/settings');
    }, 2000);

    return () => {
      if (typeof id === 'number' && cancelIdleCallback) cancelIdleCallback(id);
    };
  }, [location.pathname]);

  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60000,       // 60s — stale-while-revalidate for field use
      gcTime: 600000,          // 10min cache — keeps data through offline gaps
      refetchInterval: 60000,  // Silent 60s background refresh
    }
  }
});

// Wrapped route component with transition
function PageWrapper({ children }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <PageTransition>{children}</PageTransition>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <RoutePrefetcher />
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<PageWrapper><Dashboard /></PageWrapper>} />
                <Route path="leads" element={<PageWrapper><LeadFinder /></PageWrapper>} />
                <Route path="plans" element={<PageWrapper><Plans /></PageWrapper>} />
                <Route path="ai" element={<PageWrapper><AIAssistant /></PageWrapper>} />
                <Route path="history" element={<PageWrapper><History /></PageWrapper>} />
                <Route path="vision" element={<PageWrapper><Vision /></PageWrapper>} />
                <Route path="settings" element={<PageWrapper><Settings /></PageWrapper>} />
                <Route path="plumbing" element={<PageWrapper><PlumbingVisualizer /></PageWrapper>} />
                <Route path="documents" element={<PageWrapper><Documents /></PageWrapper>} />
                <Route path="alerts" element={<PageWrapper><Alerts /></PageWrapper>} />
              </Route>
              <Route path="canvas" element={<Canvas />} />
            </Routes>
          </BrowserRouter>
          <ToastContainer />
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
