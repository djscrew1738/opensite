import { lazy, Suspense, useEffect, useRef, useState } from 'react';
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
const Canvas = lazy(pageImports.canvas);
const Alerts = lazy(pageImports.alerts);
const AIAssistant = lazy(pageImports.ai);

// Protected Route component
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
  const [prevPath, setPrevPath] = useState(location.pathname);
  const [transitionClass, setTransitionClass] = useState('page-transition-wrapper');

  useEffect(() => {
    if (location.pathname === prevPath) return;

    const paths = Object.keys(routePrefetchMap);
    const currentIdx = paths.indexOf(location.pathname);
    const prevIdx = paths.indexOf(prevPath);
    const direction = currentIdx > prevIdx ? 'page-slide-left' : 'page-slide-right';
    const nextClass = currentIdx === -1 || prevIdx === -1
      ? 'page-transition-wrapper'
      : direction;

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
    let idleId = null;
    let timeoutId = null;
    if (typeof requestIdleCallback === 'function') {
      idleId = requestIdleCallback(() => {
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
      }, { timeout: 2000 });
    } else {
      timeoutId = setTimeout(() => {
        prefetchRoute('/');
        prefetchRoute('/settings');
      }, 2000);
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

// Legacy route redirect component
function RedirectToJobs({ tab }) {
  return <Navigate to={`/jobs${tab ? `?tab=${tab}` : ''}`} replace />;
}

export default function App() {
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
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Protected App Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Layout />}>
                      {/* Core Pages */}
                      <Route index element={<PageWrapper><Dashboard /></PageWrapper>} />
                      <Route path="jobs" element={<PageWrapper><Jobs /></PageWrapper>} />
                      <Route path="leads" element={<PageWrapper><LeadFinder /></PageWrapper>} />
                      <Route path="documents" element={<PageWrapper><Documents /></PageWrapper>} />
                      
                      {/* AI Assistant */}
                      <Route path="ai" element={<PageWrapper><AIAssistant /></PageWrapper>} />
                      
                      {/* System */}
                      <Route path="settings" element={<PageWrapper><Settings /></PageWrapper>} />
                      
                      {/* Legacy Redirects */}
                      <Route path="plans" element={<RedirectToJobs tab="estimating" />} />
                      <Route path="plumbing" element={<RedirectToJobs tab="plumbing" />} />
                      <Route path="vision" element={<Navigate to="/documents?tab=vision" replace />} />
                      <Route path="alerts" element={<Navigate to="/?view=alerts" replace />} />
                      <Route path="history" element={<Navigate to="/" replace />} />
                    </Route>
                    
                    {/* Canvas - Full screen, no layout */}
                    <Route path="canvas" element={<Canvas />} />
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
