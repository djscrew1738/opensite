import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './hooks/useTheme';
import Layout from './components/layout/Layout';

// Lazy load pages for better code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LeadFinder = lazy(() => import('./pages/LeadFinder'));
const Plans = lazy(() => import('./pages/Plans'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const Settings = lazy(() => import('./pages/Settings'));

// Loading component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-5">
        <div
          className="w-11 h-11 rounded-full mx-auto animate-spin"
          style={{
            border: '3px solid rgba(0, 53, 148, 0.12)',
            borderTopColor: '#003594',
          }}
        />
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.15em]"
          style={{ color: 'rgba(160, 155, 147, 0.5)' }}
        >
          Loading
        </p>
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
      gcTime: 300000 // 5 minutes cache
    }
  }
});

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="leads" element={<LeadFinder />} />
                <Route path="plans" element={<Plans />} />
                <Route path="ai" element={<AIAssistant />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
