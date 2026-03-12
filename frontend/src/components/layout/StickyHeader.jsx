import { useState, useEffect, memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, Command, ChevronLeft, Sun, Zap, Bell } from 'lucide-react';
import { useFieldMode } from '../../hooks/useFieldMode';
import Breadcrumbs from './Breadcrumbs';
import { NotificationBell } from '../notifications';
import { colors, shadows } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const PAGE_TITLES = {
  '/': 'Command Center',
  '/jobs': 'Job Operations',
  '/leads': 'Lead Intelligence',
  '/ai': 'AI Assistant',
  '/documents': 'Digital Archives',
  '/vision': 'Vision Analysis',
  '/plumbing': '4D Visualizer',
  '/canvas': 'System Map',
  '/history': 'Interaction Log',
  '/settings': 'System Config',
  '/alerts': 'Alert Monitor',
};

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Mobile Page title with logo integration
 */
const MobilePageTitle = memo(function MobilePageTitle({ title, isHome }) {
  return (
    <div className="flex items-center gap-2.5 overflow-hidden">
      <AnimatePresence mode="wait">
        {isHome ? (
          <motion.div
            key="logo"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-lg shadow-accent-500/20"
          >
            <Zap className="w-4 h-4 text-white" fill="currentColor" />
          </motion.div>
        ) : (
          <motion.div
            key="icon"
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -10, opacity: 0 }}
          >
            <Link to="/" className="p-1.5 -ml-1.5 rounded-full hover:bg-white/5 text-surface-400">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
      <h1 className="text-[17px] font-bold tracking-tight text-surface-50 truncate">
        {title}
      </h1>
    </div>
  );
});

/**
 * Field Mode toggle for mobile
 */
const FieldModeIndicator = memo(function FieldModeIndicator({ active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
        ${active 
          ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
          : 'bg-surface-elevated/50 text-surface-400 border border-surface-700/50'
        }
      `}
    >
      <Sun className={`w-5 h-5 ${active ? 'animate-pulse' : ''}`} strokeWidth={active ? 2.5 : 2} />
      {active && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-danger-500 rounded-full border-2 border-black" />
      )}
    </button>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export default function StickyHeader({ 
  onMenuClick, 
  onCommandPaletteOpen, 
  onNotificationsOpen,
  notificationCount = 0,
  hasUrgent = false,
  showBreadcrumbs = true,
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { isFieldMode, toggleFieldMode } = useFieldMode();

  const isHome = location.pathname === '/';
  const pageTitle = useMemo(() => PAGE_TITLES[location.pathname] || 'OpenSite', [location.pathname]);

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    const handleScroll = () => setIsScrolled(main.scrollTop > 10);
    main.addEventListener('scroll', handleScroll);
    return () => main.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`
        sticky top-0 z-40 w-full transition-all duration-300 px-4 py-2
        ${isScrolled 
          ? 'bg-surface-primary/90 border-b border-surface-700/50 shadow-lg' 
          : 'bg-transparent'
        }
        backdrop-blur-xl
      `}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-12">
        {/* Left: Navigation/Logo */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <MobilePageTitle title={pageTitle} isHome={isHome} />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Field Mode Toggle */}
          <FieldModeIndicator active={isFieldMode} onClick={toggleFieldMode} />

          {/* Search Trigger */}
          <button
            onClick={onCommandPaletteOpen}
            className="w-10 h-10 rounded-xl bg-surface-elevated/50 border border-surface-700/50 flex items-center justify-center text-surface-400 active:scale-95 transition-all"
          >
            <Search className="w-5 h-5" />
          </button>
          
          {/* Notifications Trigger */}
          <button
            onClick={onNotificationsOpen}
            className="relative w-10 h-10 rounded-xl bg-surface-elevated/50 border border-surface-700/50 flex items-center justify-center text-surface-400 active:scale-95 transition-all"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white ${hasUrgent ? 'bg-danger-500' : 'bg-accent-500'}`}>
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Scroll Progress Indicator (Subtle) */}
      {isScrolled && (
        <motion.div 
          layoutId="headerLine"
          className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-accent-500/50 to-transparent w-full"
        />
      )}
    </header>
  );
}

StickyHeader.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
  onCommandPaletteOpen: PropTypes.func.isRequired,
  onNotificationsOpen: PropTypes.func.isRequired,
  notificationCount: PropTypes.number,
  hasUrgent: PropTypes.bool,
  showBreadcrumbs: PropTypes.bool,
};
