import { lazy, Suspense, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './hooks/useTheme';
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
};

const Dashboard = lazy(pageImports.dashboard);
const LeadFinder = lazy(pageImports.leads);
const Plans = lazy(pageImports.plans);
const AIAssistant = lazy(pageImports.ai);
const History = lazy(pageImports.history);
const Vision = lazy(pageImports.vision);
const Settings = lazy(pageImports.settings);

// Map routes to prefetch keys
const routePrefetchMap = {
  '/': 'dashboard',
  '/leads': 'leads',
  '/plans': 'plans',
  '/ai': 'ai',
  '/history': 'history',
  '/vision': 'vision',
  '/settings': 'settings',
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

// Lightweight skeleton loader — no full-screen spinner, just a subtle pulse
function PageLoader() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-surface-200/50 dark:bg-gray-800/50" />
      <div className="h-4 w-72 rounded bg-surface-200/30 dark:bg-gray-800/30" />
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="h-32 rounded-xl bg-surface-200/40 dark:bg-gray-800/40" />
        <div className="h-32 rounded-xl bg-surface-200/40 dark:bg-gray-800/40" />
        <div className="h-32 rounded-xl bg-surface-200/40 dark:bg-gray-800/40" />
      </div>
    </div>
  );
}

// Prefetch adjacent routes when a page loads
function RoutePrefetcher() {
  const location = useLocation();
  const prefetchedAdjacent = useRef(new Set());

  useEffect(() => {
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
      staleTime: 30000,
      gcTime: 300000
    }
  }
});

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <RoutePrefetcher />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
              <Route path="leads" element={<Suspense fallback={<PageLoader />}><LeadFinder /></Suspense>} />
              <Route path="plans" element={<Suspense fallback={<PageLoader />}><Plans /></Suspense>} />
              <Route path="ai" element={<Suspense fallback={<PageLoader />}><AIAssistant /></Suspense>} />
              <Route path="history" element={<Suspense fallback={<PageLoader />}><History /></Suspense>} />
              <Route path="vision" element={<Suspense fallback={<PageLoader />}><Vision /></Suspense>} />
              <Route path="settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
