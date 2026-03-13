import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTabAnimation, useTabKeyboardNav } from './useTabAnimation';

/**
 * TabSystem - Unified tab component for the entire application
 * 
 * Features:
 * - Multiple visual variants (default, pills, underline, minimal)
 * - Directional animations
 * - Keyboard navigation (arrow keys, home, end)
 * - Badge support
 * - Disabled state support
 * - Responsive with optional icon-only on mobile
 * - Accessibility (ARIA) compliant
 * 
 * @example
 * <TabSystem
 *   defaultTab="overview"
 *   variant="default"
 *   animation="directional"
 *   persistKey="leadfinder-tab"
 * >
 *   <Tab id="overview" label="Overview" icon={LayoutDashboard}>
 *     <OverviewContent />
 *   </Tab>
 *   <Tab id="details" label="Details" icon={FileText} badge={3} disabled={!data}>
 *     <DetailsContent />
 *   </Tab>
 * </TabSystem>
 */

// Animation variants
const contentVariants = {
  enter: (direction) => ({
    x: direction === 'left' ? 20 : direction === 'right' ? -20 : 0,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction === 'left' ? -20 : direction === 'right' ? 20 : 0,
    opacity: 0,
  }),
};

const transition = {
  x: { type: 'spring', stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 },
};

// Variant styles configuration
const VARIANTS = {
  default: {
    list: 'border-b border-surface-200 dark:border-surface-700',
    tab: 'relative flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-4 font-semibold text-sm whitespace-nowrap transition-all duration-200',
    active: 'text-accent-600 dark:text-accent-400',
    inactive: 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200',
    indicator: 'absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-500 to-accent-600',
    disabled: 'opacity-40 cursor-not-allowed',
  },
  pills: {
    list: 'flex items-center gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl',
    tab: 'relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-fast whitespace-nowrap',
    active: 'text-surface-900 dark:text-surface-100',
    inactive: 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700',
    indicator: 'absolute inset-0 bg-white dark:bg-surface-600 rounded-lg shadow-sm',
    disabled: 'opacity-40 cursor-not-allowed',
  },
  underline: {
    list: 'border-b border-surface-200 dark:border-surface-700',
    tab: 'relative flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors',
    active: 'border-primary-500 text-primary-600 dark:text-primary-400',
    inactive: 'border-transparent text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 hover:border-surface-300',
    indicator: '', // Uses border on tab itself
    disabled: 'border-transparent text-surface-300 dark:text-surface-600 cursor-not-allowed',
  },
  minimal: {
    list: 'flex items-center gap-1',
    tab: 'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
    active: 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100',
    inactive: 'text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-850 hover:text-surface-700 dark:hover:text-surface-200',
    indicator: '',
    disabled: 'opacity-40 cursor-not-allowed',
  },
  filter: {
    list: 'flex gap-1.5 overflow-x-auto scrollbar-hide pb-1',
    tab: 'flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0',
    active: 'bg-accent-500 text-white',
    inactive: 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800',
    indicator: '',
    disabled: 'opacity-40 cursor-not-allowed',
  },
};

/**
 * TabList - The tab navigation bar
 */
function TabList({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  showIcons = true,
  showLabels = true,
  responsive = true,
  className = '',
}) {
  const styles = VARIANTS[variant] || VARIANTS.default;
  const { handleKeyDown } = useTabKeyboardNav({
    tabs,
    activeTab,
    onChange,
  });

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={`${styles.list} ${className}`}
    >
      <div className="flex overflow-x-auto scrollbar-hide -mb-px">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isDisabled = tab.disabled;
          const Icon = tab.icon;
          const hasBadge = tab.badge !== undefined && tab.badge !== null && tab.badge !== 0;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-disabled={isDisabled}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              disabled={isDisabled}
              onClick={() => !isDisabled && onChange(tab.id)}
              className={`
                ${styles.tab}
                ${isActive ? styles.active : styles.inactive}
                ${isDisabled ? styles.disabled : 'cursor-pointer'}
              `}
            >
              {/* Active background for pills variant */}
              {variant === 'pills' && isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className={styles.indicator}
                  transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
                />
              )}
              
              {/* Tab content */}
              <span className="relative z-10 flex items-center gap-2">
                {showIcons && Icon && (
                  <Icon 
                    className="w-4 h-4 flex-shrink-0" 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                )}
                
                {showLabels && (
                  <>
                    {/* Desktop label */}
                    <span className={responsive ? 'hidden sm:inline' : ''}>
                      {tab.label}
                    </span>
                    {/* Mobile short label if provided */}
                    {responsive && tab.shortLabel && (
                      <span className="sm:hidden">{tab.shortLabel}</span>
                    )}
                    {responsive && !tab.shortLabel && (
                      <span className="sm:hidden">{tab.label}</span>
                    )}
                  </>
                )}

                {/* Badge */}
                {hasBadge && (
                  <span
                    className={`
                      font-mono text-xs tabular-nums px-1.5 py-0.5 rounded-full
                      ${isActive 
                        ? variant === 'filter' 
                          ? 'bg-white/20 text-white' 
                          : 'bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300'
                        : 'bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400'
                      }
                    `}
                  >
                    {tab.badge}
                  </span>
                )}
              </span>

              {/* Underline indicator for default/underline variants */}
              {(variant === 'default' || variant === 'underline') && isActive && (
                <motion.div
                  layoutId={variant === 'underline' ? 'activeUnderline' : 'activeTabDefault'}
                  className={styles.indicator}
                  transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * TabPanel - Content panel for a tab
 */
function TabPanel({ children, id, activeTab, direction, animation = 'directional' }) {
  const isActive = activeTab === id;

  if (animation === 'none') {
    return isActive ? (
      <div role="tabpanel" id={`tabpanel-${id}`} aria-labelledby={`tab-${id}`}>
        {children}
      </div>
    ) : null;
  }

  return (
    <AnimatePresence mode="wait" custom={direction}>
      {isActive && (
        <motion.div
          key={id}
          role="tabpanel"
          id={`tabpanel-${id}`}
          aria-labelledby={`tab-${id}`}
          custom={direction}
          variants={animation === 'directional' ? contentVariants : undefined}
          initial={animation === 'directional' ? 'enter' : { opacity: 0 }}
          animate={animation === 'directional' ? 'center' : { opacity: 1 }}
          exit={animation === 'directional' ? 'exit' : { opacity: 0 }}
          transition={transition}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * TabSystem - Main component
 */
export function TabSystem({
  children,
  defaultTab,
  activeTab: controlledActiveTab,
  variant = 'default',
  animation = 'directional',
  persistKey,
  syncUrl = false,
  onTabChange,
  showIcons = true,
  showLabels = true,
  responsive = true,
  className = '',
  listClassName = '',
  contentClassName = '',
}) {
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

  const {
    activeTab,
    direction,
    handleTabChange,
  } = useTabAnimation(tabs, {
    defaultTab,
    activeTab: controlledActiveTab,
    persistKey,
    syncUrl,
    onChange: onTabChange,
  });

  return (
    <div className={className}>
      <TabList
        tabs={tabs}
        activeTab={controlledActiveTab ?? activeTab}
        onChange={handleTabChange}
        variant={variant}
        showIcons={showIcons}
        showLabels={showLabels}
        responsive={responsive}
        className={listClassName}
      />
      
      <div className={contentClassName}>
        {React.Children.map(children, (child) => {
          if (child?.type?.displayName !== 'Tab') return null;
          
          return (
            <TabPanel
              id={child.props.id}
              activeTab={controlledActiveTab ?? activeTab}
              direction={direction}
              animation={animation}
            >
              {child.props.children}
            </TabPanel>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Tab - Individual tab definition (used as child of TabSystem)
 */
export function Tab({ id, label, shortLabel, icon, badge, disabled, hidden, children }) {
  // This is a definition component - rendering is handled by TabSystem
  return null;
}
Tab.displayName = 'Tab';

// Also export individual components for advanced use cases
export { TabList, TabPanel };
