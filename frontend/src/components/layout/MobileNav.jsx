import { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { LayoutDashboard, HardHat, Files, Zap, Sparkles } from 'lucide-react';
import { colors } from '../../styles/tokens';

const primaryNav = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/jobs', icon: HardHat, label: 'Jobs' },
  { path: '/documents', icon: Files, label: 'Documents' },
  { path: '/jobs?tab=leads', icon: Zap, label: 'Leads' },
];

const NAV_COLUMNS = [1, 2, 4, 5];

const triggerHaptic = (type = 'light') => {
  if (typeof window === 'undefined' || !window.navigator?.vibrate) return;
  if (type === 'light') window.navigator.vibrate(10);
  else if (type === 'medium') window.navigator.vibrate(20);
  else if (type === 'success') window.navigator.vibrate([10, 30, 10]);
};

export default function MobileNav({
  onAIOpen,
  isAIOpen = false,
  hidden = false,
}) {
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isLeadsTab = location.pathname.startsWith('/jobs') && searchParams.get('tab') === 'leads';
  const isJobsTab = location.pathname.startsWith('/jobs') && !isLeadsTab;
  const isDocumentsTab = location.pathname.startsWith('/documents');

  const activeIndex = useMemo(() => {
    if (location.pathname === '/') return 0;
    if (isJobsTab) return 1;
    if (isDocumentsTab) return 2;
    if (isLeadsTab) return 3;
    return null;
  }, [location.pathname, isJobsTab, isDocumentsTab, isLeadsTab]);

  if (hidden) return null;

  return (
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
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden rounded-[24px]"
          style={{
            backgroundImage: 'linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        <div className="grid grid-cols-[1fr_1fr_auto_1fr_1fr] items-center h-full px-2 relative z-10">
          {primaryNav.map((item, idx) => {
            const isActive = activeIndex === idx;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => triggerHaptic('light')}
                className="flex flex-col items-center justify-center h-full gap-1 rounded-2xl transition-all relative"
                style={{ gridColumnStart: NAV_COLUMNS[idx] }}
              >
                <Motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Icon
                    className="w-6 h-6"
                    strokeWidth={isActive ? 2.5 : 1.75}
                    style={{
                      color: isActive ? colors.accent.blue : 'rgba(148, 163, 184, 0.5)',
                      filter: isActive ? `drop-shadow(0 0 8px ${colors.accent.blue}40)` : 'none',
                    }}
                  />
                </Motion.div>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest transition-colors"
                  style={{
                    color: isActive ? colors.accent.blue : 'rgba(148, 163, 184, 0.4)',
                  }}
                >
                  {item.label}
                </span>

                {isActive && (
                  <Motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-accent-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                  />
                )}
              </NavLink>
            );
          })}

          <div className="col-start-3 flex justify-center">
            <button
              onClick={() => {
                triggerHaptic('medium');
                onAIOpen?.();
              }}
              className="relative w-14 h-14 -mt-10 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: `linear-gradient(135deg, ${colors.accent.DEFAULT}, ${colors.accent.hover})`,
                border: '4px solid #0A0B0D',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
              }}
              aria-label="Open AI assistant"
              type="button"
            >
              <Motion.div
                animate={{ rotate: isAIOpen ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
              </Motion.div>
              <div className="absolute inset-[-4px] rounded-full border border-accent-500/20 animate-pulse" />
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
