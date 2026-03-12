import React, { useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTabKeyboardNav } from './useTabAnimation';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useHaptic } from '../../hooks/useHaptic';
import { useSwipe } from '../../hooks/useSwipe';

/**
 * MobileTabBar — Bottom navigation for mobile devices
 *
 * Features:
 * - Fixed bottom position with safe-area padding
 * - Spring-physics indicator that slides between tabs
 * - Semantic haptic feedback (tap / select)
 * - Animated icon bump on activation
 * - Accessible ARIA tablist pattern
 */

const MOBILE_VARIANTS = {
  default: {
    bar: 'fixed bottom-0 left-0 right-0 z-50 bg-[#0D0F12]/95 backdrop-blur-lg border-t border-[#1F2430] safe-area-pb',
    list: 'flex items-center justify-around px-2',
    tab: 'relative flex flex-col items-center justify-center py-2 px-3 min-w-[64px] transition-colors duration-150',
    active: 'text-[#3B82F6]',
    inactive: 'text-[#64748B]',
    icon: 'w-6 h-6',
    label: 'text-[10px] mt-1 font-medium',
    indicator: 'absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#3B82F6] rounded-full',
  },
  floating: {
    bar: 'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
    list: 'flex items-center gap-1 bg-[#0D0F12]/95 backdrop-blur-lg border border-[#1F2430] rounded-2xl px-2 py-2 shadow-xl',
    tab: 'relative flex flex-col items-center justify-center p-2 min-w-[56px] rounded-xl transition-colors duration-150',
    active: 'text-[#3B82F6] bg-[#3B82F6]/10',
    inactive: 'text-[#64748B]',
    icon: 'w-5 h-5',
    label: 'text-[9px] mt-0.5 font-medium',
    indicator: '',
  },
  pills: {
    bar: 'fixed bottom-0 left-0 right-0 z-50 bg-[#0D0F12]/95 backdrop-blur-lg border-t border-[#1F2430] safe-area-pb',
    list: 'flex items-center justify-center gap-2 px-4 py-3',
    tab: 'relative flex items-center gap-2 px-4 py-2.5 rounded-full transition-colors duration-150',
    active: 'text-[#0D0F12] bg-[#3B82F6]',
    inactive: 'text-[#94A3B8] bg-[#1F2430]',
    icon: 'w-4 h-4',
    label: 'text-xs font-medium',
    indicator: '',
  },
};

// Tighter spring for the active indicator sliding between tabs
const INDICATOR_SPRING = { type: 'spring', stiffness: 500, damping: 35, mass: 0.6 };

// Icon bump animation on tab activation
const iconVariants = {
  idle:   { scale: 1,    y: 0 },
  active: { scale: 1.12, y: -1.5 },
};
const iconTransition = { type: 'spring', stiffness: 600, damping: 30 };

function MobileTabButton({ tab, isActive, onClick, variant = 'default', showLabels = true }) {
  const styles = MOBILE_VARIANTS[variant] || MOBILE_VARIANTS.default;
  const Icon = tab.icon;
  const haptic = useHaptic();

  const handleClick = useCallback(() => {
    haptic.select();
    onClick(tab.id);
  }, [haptic, onClick, tab.id]);

  return (
    <motion.button
      role="tab"
      aria-selected={isActive}
      aria-disabled={tab.disabled}
      aria-controls={`tabpanel-${tab.id}`}
      id={`tab-${tab.id}`}
      tabIndex={isActive ? 0 : -1}
      disabled={tab.disabled}
      onClick={handleClick}
      // Tactile press scale — feels physical, not just visual
      whileTap={{ scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 700, damping: 35 }}
      className={`
        ${styles.tab}
        ${isActive ? styles.active : styles.inactive}
        ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}
      `}
    >
      {/* Sliding active indicator (default variant only) */}
      {variant === 'default' && isActive && (
        <motion.div
          layoutId="mobileTabIndicator"
          className={styles.indicator}
          transition={INDICATOR_SPRING}
        />
      )}

      {/* Icon with bump on activation */}
      <motion.div
        variants={iconVariants}
        animate={isActive ? 'active' : 'idle'}
        transition={iconTransition}
      >
        <Icon
          className={styles.icon}
          strokeWidth={isActive ? 2.5 : 1.8}
        />
      </motion.div>

      {/* Label */}
      {showLabels && (
        <motion.span
          className={styles.label}
          animate={{ opacity: isActive ? 1 : 0.7 }}
          transition={{ duration: 0.15 }}
        >
          {tab.shortLabel || tab.label}
        </motion.span>
      )}

      {/* Badge */}
      {tab.badge > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-[#EF4444] text-white text-[9px] font-bold rounded-full flex items-center justify-center"
        >
          {tab.badge > 99 ? '99+' : tab.badge}
        </motion.span>
      )}
    </motion.button>
  );
}

export function MobileTabBar({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  showLabels = true,
  hidden = false,
}) {
  const { isMobile } = useBreakpoint();
  const styles = MOBILE_VARIANTS[variant] || MOBILE_VARIANTS.default;
  const visibleTabs = tabs.filter(tab => !tab.hidden);

  const { handleKeyDown } = useTabKeyboardNav({
    tabs: visibleTabs.filter(t => !t.disabled),
    activeTab,
    onChange,
  });

  if (!isMobile || hidden) return null;

  return (
    <nav
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={styles.bar}
    >
      <div className={styles.list}>
        {visibleTabs.map((tab) => (
          <MobileTabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={onChange}
            variant={variant}
            showLabels={showLabels}
          />
        ))}
      </div>
    </nav>
  );
}

// ─── Content slide variants keyed by direction ───────────────────────────────

function getSlideVariants(direction) {
  const dist = 32; // px — subtle enough not to be jarring on small screens
  return {
    initial: { opacity: 0, x: direction > 0 ? dist : -dist },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: direction > 0 ? -dist / 2 : dist / 2 },
  };
}

const contentTransition = {
  duration: 0.22,
  ease: [0.25, 1, 0.5, 1], // fast-out
};

/**
 * ResponsiveTabs
 *
 * Desktop: standard horizontal tab bar.
 * Mobile:  swipeable content area + fixed bottom navigation.
 *
 * Swipe left  → next tab
 * Swipe right → previous tab
 */
export function ResponsiveTabs({
  children,
  defaultTab,
  desktopVariant = 'default',
  mobileVariant = 'default',
  mobileShowLabels = true,
  onTabChange,
  className = '',
}) {
  const { isMobile } = useBreakpoint();
  const haptic = useHaptic();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const directionRef = useRef(0); // -1 = going backward, +1 = going forward
  // Scroll memory: remember window.scrollY per tab so users don't lose position
  const scrollMemory = useRef(new Map());

  // All tab defs (no hidden)
  const tabs = useMemo(() => {
    return React.Children.toArray(children)
      .filter(child => child?.type?.displayName === 'Tab')
      .map(child => ({
        id:         child.props.id,
        label:      child.props.label,
        shortLabel: child.props.shortLabel,
        icon:       child.props.icon,
        badge:      child.props.badge,
        disabled:   child.props.disabled,
        hidden:     child.props.hidden,
      }))
      .filter(tab => !tab.hidden);
  }, [children]);

  const activeIndex  = tabs.findIndex(t => t.id === activeTab);
  const enabledTabs  = tabs.filter(t => !t.disabled);

  const navigateTo = useCallback((tabId) => {
    const newIndex = tabs.findIndex(t => t.id === tabId);
    directionRef.current = newIndex > activeIndex ? 1 : -1;
    // Save current scroll position before leaving
    scrollMemory.current.set(activeTab, window.scrollY);
    setActiveTab(tabId);
    onTabChange?.(tabId);
    // Restore saved scroll position for the destination tab after paint
    requestAnimationFrame(() => {
      const saved = scrollMemory.current.get(tabId);
      window.scrollTo({ top: saved ?? 0, behavior: 'instant' });
    });
  }, [tabs, activeIndex, activeTab, onTabChange]);

  const goNext = useCallback(() => {
    const currentEnabledIdx = enabledTabs.findIndex(t => t.id === activeTab);
    if (currentEnabledIdx < enabledTabs.length - 1) {
      haptic.tap();
      navigateTo(enabledTabs[currentEnabledIdx + 1].id);
    }
  }, [enabledTabs, activeTab, haptic, navigateTo]);

  const goPrev = useCallback(() => {
    const currentEnabledIdx = enabledTabs.findIndex(t => t.id === activeTab);
    if (currentEnabledIdx > 0) {
      haptic.tap();
      navigateTo(enabledTabs[currentEnabledIdx - 1].id);
    }
  }, [enabledTabs, activeTab, haptic, navigateTo]);

  // Swipe gesture on content area
  const swipeHandlers = useSwipe({
    onSwipeLeft:  goNext,
    onSwipeRight: goPrev,
    threshold: 40,
    timeout: 600,
  });

  const slideVariants = getSlideVariants(directionRef.current);

  // Active panel content
  const activeChild = React.Children.toArray(children).find(
    (child) => child?.type?.displayName === 'Tab' && child.props.id === activeTab && !child.props.hidden
  );

  return (
    <div className={className}>
      {/* Desktop */}
      {!isMobile && (
        <TabSystem
          defaultTab={defaultTab}
          variant={desktopVariant}
          onTabChange={navigateTo}
        >
          {children}
        </TabSystem>
      )}

      {/* Mobile */}
      {isMobile && (
        <>
          {/* Swipeable content area */}
          <div
            className="pb-20 overflow-hidden"
            {...swipeHandlers}
          >
            <AnimatePresence mode="wait" initial={false}>
              {activeChild && (
                <motion.div
                  key={activeTab}
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={contentTransition}
                  role="tabpanel"
                  id={`tabpanel-${activeTab}`}
                  aria-labelledby={`tab-${activeTab}`}
                >
                  {activeChild.props.children}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom navigation */}
          <MobileTabBar
            tabs={tabs}
            activeTab={activeTab}
            onChange={navigateTo}
            variant={mobileVariant}
            showLabels={mobileShowLabels}
          />
        </>
      )}
    </div>
  );
}

import { TabSystem } from './TabSystem';

export default MobileTabBar;
