import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Plus,
  Zap,
  Briefcase,
  LogOut,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { colors, shadows, radius, animation, zIndex } from '../../styles/tokens';
import { NotificationBellCompact } from '../notifications';

// ═══════════════════════════════════════════════════════════════
// Navigation Configuration
// ═══════════════════════════════════════════════════════════════

const primaryNav = [
  { path: '/',       icon: LayoutDashboard, label: 'Home' },
  { path: '/jobs',   icon: HardHat,         label: 'Jobs' },
  { path: '/jobs?tab=leads',  icon: Zap,    label: 'Leads' },
];

const moreNavItems = [
  { path: '/documents', icon: Files,      label: 'Documents', section: 'Core' },
  { path: '/history',   icon: History,    label: 'History',   section: 'Core' },
  { path: '/canvas',    icon: Network,    label: 'Canvas',    section: 'Tools' },
  { path: '/knowledge', icon: BookOpen,   label: 'Knowledge', section: 'Tools' },
  { path: '/settings',  icon: Settings,   label: 'Settings',  section: 'System' },
];

const triggerLogout = () => {
  // Logic to trigger logout - usually via a hook or context
  // We'll pass it down if needed or use a custom event
  window.dispatchEvent(new CustomEvent('app-logout'));
};

// ═══════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════

// Legacy shim — kept for call sites not yet migrated
const triggerHaptic = (type = 'light') => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    if (type === 'light') window.navigator.vibrate(10);
    else if (type === 'medium') window.navigator.vibrate(20);
    else if (type === 'success') window.navigator.vibrate([10, 30, 10]);
  }
};

/**
 * MobileNav - Bottom navigation for mobile devices
 * Enhanced with Industrial "Command Center" aesthetic
 */
export default function MobileNav({ 
  alertCount = 0, 
  hasUrgent = false,
  onCommandPaletteOpen,
  onNotificationsOpen,
  onAIOpen,
  isAIOpen = false,
  onQuickAddOpen,
  hidden = false,
}) {
  const [showMore, setShowMore] = useState(false);
  const location = useLocation();
  const moreButtonRef = useRef(null);
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isLeadsTab = location.pathname.startsWith('/jobs') && searchParams.get('tab') === 'leads';
  const isJobsTab = location.pathname.startsWith('/jobs') && !isLeadsTab;

  // Close menus on route change
  useEffect(() => {
    setShowMore(false);
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
    document.body.style.overflow = showMore ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showMore]);

  const activeIndex = useMemo(() => {
    if (location.pathname === '/') return 0;
    if (isJobsTab) return 1;
    if (isLeadsTab) return 2;
    return null;
  }, [location.pathname, isJobsTab, isLeadsTab]);

  if (hidden) return null;

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-3 sm:px-4 pointer-events-none"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 10px)',
          paddingLeft: 'max(env(safe-area-inset-left), 12px)',
          paddingRight: 'max(env(safe-area-inset-right), 12px)',
        }}
      >
        <nav 
          className="mobile-nav-container pointer-events-auto mx-auto max-w-md relative"
          style={{
            background: 'rgba(16, 19, 24, 0.85)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
            borderRadius: '24px',
            height: '72px',
          }}
        >
          {/* Blueprint Grid Overlay (Subtle) */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden rounded-[24px]"
            style={{
              backgroundImage: 'linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)',
              backgroundSize: '16px 16px'
            }}
          />

          <div className="flex items-center justify-between h-full px-2 relative z-10">
            {/* Nav Items */}
            {primaryNav.map((item, idx) => {
              const isActive = activeIndex === idx;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => triggerHaptic('light')}
                  className="flex flex-col items-center justify-center flex-1 h-full gap-1 rounded-2xl transition-all relative"
                >
                  <motion.div
                    animate={{ 
                      scale: isActive ? 1.1 : 1,
                      y: isActive ? -2 : 0
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <item.icon
                      className="w-6 h-6"
                      strokeWidth={isActive ? 2.5 : 1.75}
                      style={{
                        color: isActive ? colors.accent.blue : 'rgba(148, 163, 184, 0.5)',
                        filter: isActive ? `drop-shadow(0 0 8px ${colors.accent.blue}40)` : 'none'
                      }}
                    />
                  </motion.div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest transition-colors"
                    style={{
                      color: isActive ? colors.accent.blue : 'rgba(148, 163, 184, 0.4)',
                    }}
                  >
                    {item.label}
                  </span>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-accent-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                    />
                  )}
                </NavLink>
              );
            })}

            {/* AI Assistant FAB / Centerpiece */}
            <div className="flex-1 flex justify-center">
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onAIOpen?.();
                }}
                whileTap={{ scale: 0.87 }}
                transition={{ type: 'spring', stiffness: 700, damping: 35 }}
                className="relative w-14 h-14 -mt-10 rounded-full flex items-center justify-center transition-colors"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent.DEFAULT}, ${colors.accent.hover})`,
                  border: '4px solid #0A0B0D',
                  boxShadow: '0 8px 24px rgba(59, 130, 246, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
                }}
              >
                <motion.div
                  animate={{ rotate: isAIOpen ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                  <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
                </motion.div>
                
                {/* Outer Glow */}
                <div className="absolute inset-[-4px] rounded-full border border-accent-500/20 animate-pulse" />
              </button>
            </div>

            {/* Notification & More */}
            <div className="flex-1 flex items-center justify-center gap-1 h-full">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onNotificationsOpen?.();
                }}
                className="flex flex-col items-center justify-center flex-1 h-full gap-1 rounded-2xl relative"
              >
                <div className="relative">
                  <NotificationBellCompact count={alertCount} hasUrgent={hasUrgent} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-surface-400/40">Alerts</span>
              </button>

              <button
                ref={moreButtonRef}
                onClick={() => {
                  triggerHaptic('light');
                  setShowMore(true);
                }}
                className="flex flex-col items-center justify-center flex-1 h-full gap-1 rounded-2xl"
              >
                <MoreHorizontal className="w-6 h-6 text-surface-400/50" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-surface-400/40">Menu</span>
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* More Menu Sheet */}
      <AnimatePresence>
        {showMore && (
          <MoreMenuSheet 
            onClose={() => setShowMore(false)} 
            onCommandPaletteOpen={onCommandPaletteOpen}
            onAIOpen={onAIOpen}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function MoreMenuSheet({ onClose, onCommandPaletteOpen, onAIOpen }) {
  const location = useLocation();
  const { logout } = useAuth();
  
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md bg-surface-elevated rounded-t-[32px] overflow-hidden"
        style={{
          boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.6)',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-surface-muted/40" />
        </div>

        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-surface-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent-500" />
              Command Center
            </h2>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-surface-card flex items-center justify-center text-surface-400 active:bg-surface-elevated"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <QuickActionButton 
              icon={Command} 
              label="Commands" 
              sub="Search & Actions"
              color="blue"
              onClick={() => { onClose(); setTimeout(onCommandPaletteOpen, 200); }}
            />
            <QuickActionButton 
              icon={Sparkles} 
              label="Intelligence" 
              sub="AI Assistant"
              color="purple"
              onClick={() => { onClose(); setTimeout(onAIOpen, 200); }}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-surface-500 px-1">Navigation</h3>
            <div className="grid grid-cols-1 gap-2">
              {moreNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => { triggerHaptic('light'); onClose(); }}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                      isActive ? 'bg-accent-500/10 border border-accent-500/20' : 'bg-surface-card border border-transparent'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive ? 'bg-accent-500 text-white' : 'bg-surface-elevated text-surface-400'
                    }`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-bold ${isActive ? 'text-accent-500' : 'text-surface-100'}`}>{item.label}</p>
                      <p className="text-xs text-surface-500">{item.section}</p>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>

          <div className="mt-8 px-1">
            <button
              onClick={() => { triggerHaptic('medium'); logout(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-danger-500/10 border border-danger-500/20 text-danger-500 font-bold active:bg-danger-500/20"
            >
              <LogOut className="w-5 h-5" />
              Sign Out from Command Center
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

function QuickActionButton({ icon: Icon, label, sub, color, onClick }) {
  const colors = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/30 text-purple-400',
  };

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.93 }}
      transition={{ type: 'spring', stiffness: 600, damping: 32 }}
      className={`flex flex-col items-start gap-3 p-4 rounded-2xl border bg-gradient-to-br transition-colors text-left ${colors[color]}`}
    >
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="font-bold text-surface-100">{label}</p>
        <p className="text-[10px] uppercase tracking-wider opacity-60">{sub}</p>
      </div>
    </motion.button>
  );
}
