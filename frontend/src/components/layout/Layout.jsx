import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useState, useEffect } from 'react';

export default function Layout() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-concrete-texture">
      {/* Desktop/Tablet Sidebar */}
      {!isMobile && <Sidebar />}

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto ${isMobile ? 'pb-20' : ''}`}>
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileNav />}
    </div>
  );
}
