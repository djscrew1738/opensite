import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import OfflineBanner from '../shared/OfflineBanner';
import { useState, useEffect } from 'react';
import { ErrorBoundary, SectionErrorBoundary } from '../ui/ErrorBoundary';

export default function Layout() {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ErrorBoundary componentName="App">
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-forge">
      {/* Offline detection banner */}
      <OfflineBanner />

      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}

      {/* Main Content */}
      <main
        className="flex-1 overflow-y-auto relative"
        style={{
          paddingBottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom, 0px))' : '0',
        }}
      >
        {/* Subtle radial depth gradient */}
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.02) 0%, transparent 50%)',
          }}
        />

        {/* Grain texture overlay */}
        <div className="bg-grain pointer-events-none fixed inset-0 z-[1] opacity-60" />

        <div className="min-h-full relative z-[2]">
          <SectionErrorBoundary>
            <div className="page-transition-wrapper">
              <Outlet />
            </div>
          </SectionErrorBoundary>
        </div>
      </main>

      {/* Mobile Floating Tab Bar */}
      {isMobile && <MobileNav />}
    </div>
    </ErrorBoundary>
  );
}
