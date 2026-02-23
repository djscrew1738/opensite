import { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { prefetchRoute } from '../../routes/prefetch';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard,
  HardHat,
  Users,
  Files,
  MoreHorizontal,
  X,
  Network,
  Settings,
  Command,
  Sparkles,
  History,
} from 'lucide-react';
import { colors, shadows } from '../../styles/tokens';
import { NotificationBellCompact } from '../notifications';

// Primary nav items (always visible) - simplified to 4 core
const primaryNav = [
  { path: '/',       icon: LayoutDashboard, label: 'Home',      shortcut: '1' },
  { path: '/jobs',   icon: HardHat,         label: 'Jobs',      shortcut: '2' },
  { path: '/leads',  icon: Users,           label: 'Leads',     shortcut: '3' },
];

// Secondary items (in More menu)
const moreNavItems = [
  { path: '/documents', icon: Files,      label: 'Documents',    shortcut: '4', section: 'Core' },
  { path: '/history',   icon: History,    label: 'History',      shortcut: '5', section: 'Core' },
  { path: '/canvas',    icon: Network,    label: 'Canvas',       shortcut: '6', section: 'Tools' },
  { path: '/settings',  icon: Settings,   label: 'Settings',     shortcut: '0', section: 'System' },
];

/**
 * MobileNav - Bottom navigation for mobile devices
 * 
 * Accessibility features:
 * - ARIA expanded states for menu buttons
 * - Focus trap in modal sheets
 * - Escape key handling
 * - Focus return on close
 * - aria-modal and aria-label attributes
 */
export default function MobileNav({ 
  alertCount = 0, 
  hasUrgent = false,
  onCommandPaletteOpen,
  onNotificationsOpen,
  onAIOpen,
  isAIOpen = false,
}) {
  const [showMore, setShowMore] = useState(false);
  const location = useLocation();
  const moreButtonRef = useRef(null);

  // Close menus on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMore(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Handle back button when menus are open
  useEffect(() => {
    const handleBackButton = (e) => {
      if (showMore) {
        e.preventDefault();
        setShowMore(false);
      }
    };

    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [showMore]);

  // Lock body scroll when menus are open
  useEffect(() => {
    if (showMore) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMore]);

  return (
    <>
      <nav className="mobile-nav" aria-label="Main navigation">
        <div className="flex items-center justify-around px-1 py-1.5">
          {primaryNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onTouchStart={() => prefetchRoute(item.path)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
              style={{ minWidth: '56px', minHeight: '48px' }}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className="w-[22px] h-[22px] transition-colors duration-200"
                    strokeWidth={isActive ? 2.5 : 1.75}
                    style={{
                      color: isActive ? colors.accent.blue : 'rgba(148, 163, 184, 0.5)',
                    }}
                    fill={isActive ? 'rgba(59, 130, 246, 0.15)' : 'none'}
                    aria-hidden="true"
                  />

                  <span
                    className="font-semibold leading-none transition-colors duration-200"
                    style={{
                      fontSize: '10px',
                      color: isActive ? colors.accent.blue : 'rgba(148, 163, 184, 0.4)',
                    }}
                  >
                    {item.label}
                  </span>

                  <div
                    className="rounded-full transition-all duration-200"
                    style={{
                      width: '3px',
                      height: '3px',
                      background: isActive ? colors.accent.blue : 'transparent',
                      transform: isActive ? 'scale(1)' : 'scale(0)',
                      boxShadow: isActive ? `0 0 6px ${colors.accent.glow}` : 'none',
                    }}
                    aria-hidden="true"
                  />
                </>
              )}
            </NavLink>
          ))}

          {/* AI Assistant Button */}
          <button
            onClick={() => {
              onAIOpen?.();
            }}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
            style={{ minWidth: '56px', minHeight: '48px' }}
            aria-label="AI Assistant"
          >
            <Sparkles
              className="w-[22px] h-[22px] transition-colors duration-200"
              strokeWidth={isAIOpen ? 2.5 : 1.75}
              style={{ color: isAIOpen ? colors.accent.blue : 'rgba(148, 163, 184, 0.5)' }}
              fill={isAIOpen ? 'rgba(59, 130, 246, 0.15)' : 'none'}
              aria-hidden="true"
            />
            <span
              className="font-semibold leading-none transition-colors duration-200"
              style={{
                fontSize: '10px',
                color: isAIOpen ? colors.accent.blue : 'rgba(148, 163, 184, 0.4)',
              }}
            >
              AI
            </span>
            <div
              className="rounded-full transition-all duration-200"
              style={{
                width: '3px',
                height: '3px',
                background: isAIOpen ? colors.accent.blue : 'transparent',
                transform: isAIOpen ? 'scale(1)' : 'scale(0)',
                boxShadow: isAIOpen ? `0 0 6px ${colors.accent.glow}` : 'none',
              }}
              aria-hidden="true"
            />
          </button>

          {/* Notifications Bell */}
          <NotificationBellCompact
            count={alertCount}
            hasUrgent={hasUrgent}
            onClick={onNotificationsOpen}
          />

          {/* More button */}
          <button
            ref={moreButtonRef}
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
            style={{ minWidth: '56px', minHeight: '48px' }}
            aria-expanded={showMore}
            aria-haspopup="dialog"
            aria-label="More options"
          >
            <MoreHorizontal
              className="w-[22px] h-[22px] transition-colors duration-200"
              strokeWidth={1.75}
              style={{ color: 'rgba(148, 163, 184, 0.5)' }}
              aria-hidden="true"
            />
            <span
              className="font-semibold leading-none transition-colors duration-200"
              style={{
                fontSize: '10px',
                color: 'rgba(148, 163, 184, 0.4)',
              }}
            >
              More
            </span>
            <div
              className="rounded-full"
              style={{
                width: '3px',
                height: '3px',
                background: 'transparent',
              }}
              aria-hidden="true"
            />
          </button>
        </div>
      </nav>

      {/* More Menu Sheet */}
      {showMore && createPortal(
        <MoreMenu 
          onClose={() => setShowMore(false)} 
          onCommandPaletteOpen={onCommandPaletteOpen}
          onAIOpen={onAIOpen}
        />,
        document.body
      )}
    </>
  );
}

/**
 * Focus trap hook for modal accessibility
 */
function useFocusTrap(isActive, containerRef, onEscape) {
  const previouslyFocusedElement = useRef(null);

  useEffect(() => {
    if (isActive) {
      // Store the currently focused element
      previouslyFocusedElement.current = document.activeElement;
      
      // Focus the first focusable element in the modal
      const focusableElements = containerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements?.length > 0) {
        focusableElements[0].focus();
      }

      // Handle escape key
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onEscape?.();
        }
        if (e.key === 'Tab') {
          const focusable = Array.from(containerRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) || []);
          if (focusable.length === 0) return;
          
          const firstFocusable = focusable[0];
          const lastFocusable = focusable[focusable.length - 1];
          
          if (e.shiftKey && document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          } else if (!e.shiftKey && document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        // Restore focus when modal closes
        previouslyFocusedElement.current?.focus();
      };
    }
  }, [isActive, containerRef, onEscape]);
}

function MoreMenu({ onClose, onCommandPaletteOpen, onAIOpen }) {
  const location = useLocation();
  const containerRef = useRef(null);
  
  useFocusTrap(true, containerRef, onClose);

  // Group items by section
  const groupedItems = moreNavItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="More menu"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundColor: colors.surface.overlay,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />
      
      {/* Sheet */}
      <div
        className="absolute left-0 right-0 bottom-0"
        style={{
          background: colors.surface.elevated,
          borderTop: `1px solid ${colors.border.default}`,
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          boxShadow: shadows.sheet,
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex items-center justify-center pt-3 pb-2">
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: colors.border.strong,
            }}
          />
        </div>

        {/* Header */}
        <div 
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: `1px solid ${colors.border.default}` }}
        >
          <h2 
            className="text-lg font-bold"
            style={{ color: colors.text.primary }}
          >
            Menu
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
            style={{ color: colors.text.secondary }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="px-5 py-4 space-y-2">
          <button
            onClick={() => {
              onClose();
              onAIOpen?.();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
            style={{ 
              background: 'rgba(16, 185, 129, 0.1)',
              border: `1px solid rgba(16, 185, 129, 0.3)`,
              color: '#10B981',
            }}
          >
            <Sparkles className="w-5 h-5" aria-hidden="true" />
            <span className="font-semibold flex-1 text-left">AI Assistant</span>
            <kbd 
              className="font-mono text-xs px-2 py-1 rounded"
              style={{ 
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34D399',
              }}
            >
              ⌘/
            </kbd>
          </button>
          
          <button
            onClick={() => {
              onClose();
              setTimeout(onCommandPaletteOpen, 100);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
            style={{ 
              background: colors.accent.muted,
              border: `1px solid ${colors.accent.glow}`,
              color: colors.accent.blue,
            }}
          >
            <Command className="w-5 h-5" aria-hidden="true" />
            <span className="font-semibold flex-1 text-left">Command Palette</span>
            <kbd 
              className="font-mono text-xs px-2 py-1 rounded"
              style={{ 
                background: 'rgba(59, 130, 246, 0.15)',
                color: colors.accent.light || '#60A5FA',
              }}
            >
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Sections */}
        <div className="px-5 pb-5 space-y-4">
          {Object.entries(groupedItems).map(([section, items]) => (
            <div key={section}>
              <h3 
                className="text-xs font-bold uppercase tracking-wider mb-2 px-1"
                style={{ color: 'rgba(148, 163, 184, 0.4)' }}
              >
                {section}
              </h3>
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
                      style={{
                        background: isActive ? colors.accent.muted : 'transparent',
                        color: isActive ? colors.accent.blue : colors.text.secondary,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                          e.currentTarget.style.color = colors.text.primary;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = colors.text.secondary;
                        }
                      }}
                    >
                      <item.icon 
                        className="w-5 h-5" 
                        strokeWidth={isActive ? 2.5 : 2}
                        aria-hidden="true"
                      />
                      <span className="font-medium flex-1">{item.label}</span>
                      <kbd 
                        className="font-mono text-xs px-1.5 py-0.5 rounded"
                        style={{ 
                          background: 'rgba(255,255,255,0.04)',
                          color: 'rgba(148, 163, 184, 0.4)',
                        }}
                      >
                        {item.shortcut}
                      </kbd>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
