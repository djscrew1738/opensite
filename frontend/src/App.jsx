import { lazy, Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './hooks/useTheme';
import { FieldModeProvider } from './hooks/useFieldMode';
import { ToastProvider } from './hooks/useToast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastContainer } from './components/shared';
import Layout from './components/layout/Layout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { pageImports, routePrefetchMap, prefetchRoute } from './routes/prefetch';
import { Login, Register } from './pages/Auth';

// Lazy load pages — store import functions for prefetching
const Dashboard = lazy(pageImports.dashboard);
const LeadFinder = lazy(pageImports.leads);
const Jobs = lazy(pageImports.jobs);
const Plans = lazy(pageImports.plans);
const History = lazy(pageImports.history);
const Vision = lazy(pageImports.vision);
const Settings = lazy(pageImports.settings);
const PlumbingVisualizer = lazy(pageImports.plumbing);
const Documents = lazy(pageImports.documents);
const JobDetail = lazy(pageImports.jobDetail);
const Canvas = lazy(pageImports.canvas);
const Alerts = lazy(pageImports.alerts);
const AIAssistant = lazy(pageImports.ai);

// Skeleton card widths for PageLoader
const SKELETON_CARD_WIDTHS = ['140px', '160px', '150px', '145px'];
const SKELETON_ITEM_COUNT = 4;

/**
 * Protected Route wrapper - redirects to login if not authenticated
 */
function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

/**
 * Page loading skeleton with Dark Forge design
 */
function PageLoader() {
  return (
    <div className="p-4 space-y-4 min-h-[60vh]">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg skeleton-shimmer" />
          <div className="h-3 w-72 rounded skeleton-shimmer" />
        </div>
        <div className="h-10 w-10 rounded-xl skeleton-shimmer" />
      </div>
      
      {/* Cards skeleton */}
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: SKELETON_ITEM_COUNT }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl skeleton-shimmer flex-shrink-0"
            style={{ 
              width: SKELETON_CARD_WIDTHS[i],
              animationDelay: `${i * 50}ms` 
            }}
          />
        ))}
      </div>
      
      {/* List items skeleton */}
      <div className="space-y-3 mt-4">
        {Array.from({ length: SKELETON_ITEM_COUNT }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-xl skeleton-shimmer"
            style={{ animationDelay: `${(i + SKELETON_ITEM_COUNT) * 50}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Page transition wrapper with directional animation
 */
function PageTransition({ children }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [prevPath, setPrevPath] = useState(location.pathname);
  const [transitionClass, setTransitionClass] = useState('page-transition-wrapper');

  useEffect(() => {
    if (location.pathname === prevPath) return;

    const paths = Object.keys(routePrefetchMap);
    const currentIdx = paths.indexOf(location.pathname);
    const prevIdx = paths.indexOf(prevPath);
    
    const hasValidTransition = currentIdx !== -1 && prevIdx !== -1;
    const direction = currentIdx > prevIdx ? 'page-slide-left' : 'page-slide-right';
    const nextClass = hasValidTransition ? direction : 'page-transition-wrapper';

    const timer = setTimeout(() => {
      setTransitionClass(nextClass);
      setDisplayChildren(children);
      setPrevPath(location.pathname);
    }, 30);
    
    return () => clearTimeout(timer);
  }, [location.pathname, children, prevPath]);

  return (
    <div className={`tab-content-wrapper ${transitionClass}`} key={location.pathname}>
      {displayChildren}
    </div>
  );
}

/**
 * Route prefetcher - prefetches adjacent routes when a page loads
 */
function RoutePrefetcher() {
  const location = useLocation();
  const prefetchedAdjacent = useRef(new Set());

  useEffect(() => {
    // Smooth scroll to top on route change
    const mainContent = document.querySelector('main');
    if (mainContent?.scrollTop > 0) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    if (prefetchedAdjacent.current.has(location.pathname)) return;
    prefetchedAdjacent.current.add(location.pathname);

    // After current page renders, prefetch likely next pages
    let idleId = null;
    let timeoutId = null;
    
    const prefetchAdjacentRoutes = () => {
      const paths = Object.keys(routePrefetchMap);
      const currentIdx = paths.indexOf(location.pathname);

      // Always prefetch commonly used pages
      const toPrefetch = new Set(['/', '/settings']);
      
      // Add adjacent routes
      if (currentIdx >= 0) {
        if (paths[currentIdx - 1]) toPrefetch.add(paths[currentIdx - 1]);
        if (paths[currentIdx + 1]) toPrefetch.add(paths[currentIdx + 1]);
      }

      toPrefetch.forEach(path => {
        if (path !== location.pathname) prefetchRoute(path);
      });
    };

    if (typeof requestIdleCallback === 'function') {
      idleId = requestIdleCallback(prefetchAdjacentRoutes, { timeout: 2000 });
    } else {
      timeoutId = setTimeout(prefetchAdjacentRoutes, 2000);
    }

    return () => {
      if (idleId !== null && typeof cancelIdleCallback === 'function') {
        cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [location.pathname]);

  return null;
}

/**
 * Query client configuration
 */
function useQueryClientConfig() {
  return useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 60000,       // 60s — stale-while-revalidate for field use
        gcTime: 600000,          // 10min cache — keeps data through offline gaps
        refetchInterval: 60000,  // Silent 60s background refresh
      }
    }
  }), []);
}

/**
 * Wrapped route component with transition and suspense
 */
function PageWrapper({ children }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <PageTransition>{children}</PageTransition>
    </Suspense>
  );
}

/**
 * Legacy redirect for old routes
 */
const LEGACY_REDIRECTS = [
  { path: 'plans', to: '/jobs', tab: 'estimating' },
  { path: 'plumbing', to: '/jobs', tab: 'plumbing' },
];

function LegacyRedirect({ to, tab }) {
  const search = tab ? `?tab=${tab}` : '';
  return <Navigate to={`${to}${search}`} replace />;
}

/**
 * Main App component
 */
export default function App() {
  const queryClient = useQueryClientConfig();

  return (
    <ErrorBoundary componentName="Root">
      <ThemeProvider>
        <FieldModeProvider>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              <AuthProvider>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <RoutePrefetcher />
                  <Routes>
                    {/* Auth Routes */}
                    <Route path="/login" element={
                      <ErrorBoundary componentName="Login">
                        <Login />
                      </ErrorBoundary>
                    } />
                    <Route path="/register" element={
                      <ErrorBoundary componentName="Register">
                        <Register />
                      </ErrorBoundary>
                    } />

                    {/* Protected App Routes */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/" element={<Layout />}>
                        {/* Core Pages */}
                        <Route index element={<PageWrapper><Dashboard /></PageWrapper>} />
                        <Route path="jobs" element={<PageWrapper><Jobs /></PageWrapper>} />
                        <Route path="jobs/:id" element={<PageWrapper><JobDetail /></PageWrapper>} />
                        <Route path="leads" element={<LegacyRedirect to="/jobs" tab="leads" />} />
                        <Route path="documents" element={<PageWrapper><Documents /></PageWrapper>} />
                        
                        {/* AI Assistant */}
                        <Route path="ai" element={<PageWrapper><AIAssistant /></PageWrapper>} />
                        
                        {/* System */}
                        <Route path="settings" element={<PageWrapper><Settings /></PageWrapper>} />
                        
                        {/* Legacy Redirects */}
                        {LEGACY_REDIRECTS.map(({ path, ...props }) => (
                          <Route 
                            key={path} 
                            path={path} 
                            element={<LegacyRedirect {...props} />} 
                          />
                        ))}
                        <Route path="vision" element={<Navigate to="/documents?tab=vision" replace />} />
                        <Route path="alerts" element={<Navigate to="/?view=alerts" replace />} />
                        <Route path="history" element={<Navigate to="/" replace />} />
                      </Route>
                      
                      {/* Canvas - Full screen, no layout */}
                      <Route path="canvas" element={
                        <ErrorBoundary componentName="Canvas">
                          <Suspense fallback={<PageLoader />}>
                            <Canvas />
                          </Suspense>
                        </ErrorBoundary>
                      } />
                    </Route>
                  </Routes>
                </BrowserRouter>
                <ToastContainer />
              </AuthProvider>
            </ToastProvider>
          </QueryClientProvider>
        </FieldModeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
