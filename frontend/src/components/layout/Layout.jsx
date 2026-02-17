import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useState, useEffect } from 'react';

const pageNames = {
  '/': 'Dashboard',
  '/leads': 'Lead Finder',
  '/pricing': 'Pricing',
  '/takeoff': 'Takeoff',
  '/ai': 'AI Assistant',
  '/settings': 'Settings',
};

export default function Layout() {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentPage = pageNames[location.pathname] || 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-concrete-texture">
      {/* Desktop/Tablet Sidebar */}
      {!isMobile && <Sidebar />}

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto relative ${isMobile ? 'pb-20' : ''}`}>
        {/* Top vignette gradient */}
        <div
          className="pointer-events-none fixed top-0 left-0 right-0 h-24 z-[1]"
          style={{
            background: 'linear-gradient(to bottom, rgba(10,9,8,0.3), transparent)',
          }}
        />

        {/* Grain texture overlay — reduced intensity */}
        <div className="bg-grain pointer-events-none fixed inset-0 z-[1] opacity-80" />

        <div className="min-h-full relative z-[2]">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileNav />}
    </div>
  );
}
