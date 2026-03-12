import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTabKeyboardNav } from './useTabAnimation';
import { useBreakpoint } from '../../hooks/useBreakpoint';

/**
 * MobileTabBar - Bottom navigation for mobile devices
 * 
 * Features:
 * - Fixed bottom position on mobile
 * - Icon-only with optional labels
 * - Active indicator with animation
 * - Haptic feedback on tap (when available)
 * - Safe area support for notched devices
 */

const MOBILE_VARIANTS = {
  default: {
    bar: 'fixed bottom-0 left-0 right-0 z-50 bg-[#0D0F12]/95 backdrop-blur-lg border-t border-[#1F2430] safe-area-pb',
    list: 'flex items-center justify-around px-2',
    tab: 'relative flex flex-col items-center justify-center py-2 px-3 min-w-[64px] transition-all duration-200',
    active: 'text-[#3B82F6]',
    inactive: 'text-[#64748B]',
    icon: 'w-6 h-6',
    label: 'text-[10px] mt-1 font-medium',
    indicator: 'absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#3B82F6] rounded-full',
  },
  floating: {
    bar: 'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
    list: 'flex items-center gap-1 bg-[#0D0F12]/95 backdrop-blur-lg border border-[#1F2430] rounded-2xl px-2 py-2 shadow-xl',
    tab: 'relative flex flex-col items-center justify-center p-2 min-w-[56px] rounded-xl transition-all duration-200',
    active: 'text-[#3B82F6] bg-[#3B82F6]/10',
    inactive: 'text-[#64748B]',
    icon: 'w-5 h-5',
    label: 'text-[9px] mt-0.5 font-medium',
    indicator: '',
  },
  pills: {
    bar: 'fixed bottom-0 left-0 right-0 z-50 bg-[#0D0F12]/95 backdrop-blur-lg border-t border-[#1F2430] safe-area-pb',
    list: 'flex items-center justify-center gap-2 px-4 py-3',
    tab: 'relative flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200',
    active: 'text-[#0D0F12] bg-[#3B82F6]',
    inactive: 'text-[#94A3B8] bg-[#1F2430]',
    icon: 'w-4 h-4',
    label: 'text-xs font-medium',
    indicator: '',
  },
};

function MobileTabButton({
  tab,
  isActive,
  onClick,
  variant = 'default',
  showLabels = true,
  index,
  total,
}) {
  const styles = MOBILE_VARIANTS[variant] || MOBILE_VARIANTS.default;
  const Icon = tab.icon;

  const handleClick = () => {
    // Haptic feedback if available
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }
    onClick(tab.id);
  };

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-disabled={tab.disabled}
      aria-controls={`tabpanel-${tab.id}`}
      id={`tab-${tab.id}`}
      tabIndex={isActive ? 0 : -1}
      disabled={tab.disabled}
      onClick={handleClick}
      className={`
        ${styles.tab}
        ${isActive ? styles.active : styles.inactive}
        ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}
      `}
    >
      {/* Active indicator line (for default variant) */}
      {variant === 'default' && isActive && (
        <motion.div
          layoutId="mobileTabIndicator"
          className={styles.indicator}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
        />
      )}

      {/* Icon with animation */}
      <motion.div
        animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Icon
          className={styles.icon}
          strokeWidth={isActive ? 2.5 : 2}
        />
      </motion.div>

      {/* Label */}
      {showLabels && (
        <span className={styles.label}>
          {tab.shortLabel || tab.label}
        </span>
      )}

      {/* Badge */}
      {tab.badge > 0 && (
        <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-[#EF4444] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
          {tab.badge > 99 ? '99+' : tab.badge}
        </span>
      )}
    </button>
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

  const { handleKeyDown } = useTabKeyboardNav({
    tabs: tabs.filter(t => !t.hidden && !t.disabled),
    activeTab,
    onChange,
  });

  // Don't render on desktop unless explicitly shown
  if (!isMobile && hidden) return null;

  // Filter out hidden tabs
  const visibleTabs = tabs.filter(tab => !tab.hidden);

  return (
    <nav
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={styles.bar}
    >
      <div className={styles.list}>
        {visibleTabs.map((tab, index) => (
          <MobileTabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={onChange}
            variant={variant}
            showLabels={showLabels}
            index={index}
            total={visibleTabs.length}
          />
        ))}
      </div>
    </nav>
  );
}

/**
 * ResponsiveTabs - Switches between desktop tabs and mobile bottom bar
 */
export function ResponsiveTabs({
  children,
  defaultTab,
  desktopVariant = 'default',
  mobileVariant = 'default',
  mobileShowLabels = true,
  persistKey,
  onTabChange,
  className = '',
}) {
  const { isMobile } = useBreakpoint();
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  // Extract tab definitions from children
  const tabs = useMemo(() => {
    return React.Children.toArray(children)
      .filter(child => child?.type?.displayName === 'Tab')
      .map(child => ({
        id: child.props.id,
        label: child.props.label,
        shortLabel: child.props.shortLabel,
        icon: child.props.icon,
        badge: child.props.badge,
        disabled: child.props.disabled,
        hidden: child.props.hidden,
      }))
      .filter(tab => !tab.hidden);
  }, [children]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className={className}>
      {/* Desktop Tabs */}
      {!isMobile && (
        <TabSystem
          defaultTab={defaultTab}
          variant={desktopVariant}
          onTabChange={handleTabChange}
        >
          {children}
        </TabSystem>
      )}

      {/* Mobile Bottom Bar */}
      {isMobile && (
        <>
          {/* Content Area */}
          <div className="pb-20">
            {React.Children.map(children, (child) => {
              if (child?.type?.displayName !== 'Tab') return null;
              if (child.props.hidden) return null;
              if (child.props.id !== activeTab) return null;
              return (
                <div
                  role="tabpanel"
                  id={`tabpanel-${child.props.id}`}
                  aria-labelledby={`tab-${child.props.id}`}
                >
                  {child.props.children}
                </div>
              );
            })}
          </div>

          {/* Bottom Navigation */}
          <MobileTabBar
            tabs={tabs}
            activeTab={activeTab}
            onChange={handleTabChange}
            variant={mobileVariant}
            showLabels={mobileShowLabels}
          />
        </>
      )}
    </div>
  );
}

// Import TabSystem for desktop
import { TabSystem } from './TabSystem';

export default MobileTabBar;
