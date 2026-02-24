import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, Search, Command, ChevronLeft, Sun } from 'lucide-react';
import { useFieldMode } from '../../hooks/useFieldMode';
import Breadcrumbs from './Breadcrumbs';
import { NotificationBell } from '../notifications';

export default function StickyHeader({ 
  onMenuClick, 
  onCommandPaletteOpen, 
  onNotificationsOpen,
  notificationCount = 0,
  hasUrgent = false,
  showBreadcrumbs = true,
  transparent = false,
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { isFieldMode, toggleFieldMode } = useFieldMode();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Track scroll for shadow effect
  useEffect(() => {
    const mainContent = document.querySelector('main');
    if (!mainContent) return;

    const handleScroll = () => {
      setIsScrolled(mainContent.scrollTop > 10);
    };

    mainContent.addEventListener('scroll', handleScroll);
    return () => mainContent.removeEventListener('scroll', handleScroll);
  }, []);

  // Get page title based on route
  const getPageTitle = () => {
    const titles = {
      '/': 'Dashboard',
      '/plans': 'Plans',
      '/ai': 'AI Assistant',
      '/documents': 'Documents',
      '/vision': 'Vision',
      '/plumbing': '4D Plumbing',
      '/canvas': 'Canvas',
      '/history': 'History',
      '/settings': 'Settings',
      '/alerts': 'Alerts',
    };
    return titles[location.pathname] || 'Job Pulse';
  };

  const isHome = location.pathname === '/';

  return (
    <header 
      className="sticky top-0 z-30 transition-all duration-200"
      style={{
        background: transparent 
          ? 'transparent' 
          : isScrolled 
            ? 'rgba(10, 11, 13, 0.95)' 
            : 'rgba(10, 11, 13, 0.8)',
        backdropFilter: transparent ? 'none' : 'blur(12px)',
        borderBottom: isScrolled ? '1px solid #1F2430' : '1px solid transparent',
      }}
    >
      <div className="px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Menu button + Breadcrumbs/Back */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {isMobile && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-lg transition-colors flex-shrink-0"
                style={{ color: '#94A3B8' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            {/* Breadcrumbs or Back button */}
            <div className="hidden sm:block min-w-0">
              {showBreadcrumbs && !isHome ? (
                <Breadcrumbs />
              ) : (
                !isHome && (
                  <Link
                    to="/"
                    className="flex items-center gap-1.5 text-sm transition-colors"
                    style={{ color: '#94A3B8' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#F1F5F9'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Link>
                )
              )}
            </div>
            
            {/* Mobile: Just show page title */}
            <div className="sm:hidden">
              <h1 
                className="text-lg font-bold truncate"
                style={{ color: '#F1F5F9' }}
              >
                {getPageTitle()}
              </h1>
            </div>
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Field Mode Toggle - Only show on mobile or when explicitly enabled */}
            {(isMobile || isFieldMode) && (
              <button
                onClick={toggleFieldMode}
                className={`
                  relative flex items-center gap-2 px-3 py-2 rounded-lg font-semibold
                  transition-all duration-200 active:scale-95
                  ${isFieldMode 
                    ? 'bg-[#00ff88] text-black shadow-[0_0_20px_rgba(0,255,136,0.4)]' 
                    : 'bg-surface-800/50 text-text-secondary hover:text-text-primary border border-border hover:border-border-strong'
                  }
                `}
                style={{ minHeight: 40 }}
                aria-pressed={isFieldMode}
                aria-label={isFieldMode ? 'Disable Field Mode' : 'Enable Field Mode'}
                title={isFieldMode ? 'Field Mode On' : 'Field Mode'}
              >
                <Sun 
                  className={`w-4 h-4 ${isFieldMode ? 'animate-pulse' : ''}`}
                  strokeWidth={isFieldMode ? 2.5 : 2}
                />
                <span className="hidden md:inline text-sm">
                  {isFieldMode ? 'Field On' : 'Field'}
                </span>
                {isFieldMode && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#ff4444] rounded-full animate-pulse" />
                )}
              </button>
            )}

            {/* Global Search Trigger */}
            <button
              onClick={onCommandPaletteOpen}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
              style={{ 
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid #1F2430',
                color: '#94A3B8',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2D3548';
                e.currentTarget.style.color = '#F1F5F9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1F2430';
                e.currentTarget.style.color = '#94A3B8';
              }}
              title="Command Palette (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm hidden md:inline">Search...</span>
              <kbd 
                className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono rounded ml-2"
                style={{ 
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#64748B',
                }}
              >
                <Command className="w-3 h-3" />K
              </kbd>
            </button>

            {/* Mobile search button */}
            <button
              onClick={onCommandPaletteOpen}
              className="sm:hidden p-2 rounded-lg transition-colors"
              style={{ color: '#94A3B8' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            
            {/* Notifications */}
            <NotificationBell
              count={notificationCount}
              hasUrgent={hasUrgent}
              onClick={onNotificationsOpen}
              size="default"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
