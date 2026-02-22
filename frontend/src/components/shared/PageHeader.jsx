import { useState, useEffect } from 'react';

/**
 * PageHeader — Polished page header with entrance animation
 * Follows industrial control room aesthetic
 * 
 * Features:
 * - Smooth fade-in animation
 * - Optional subtitle
 * - Action button slot
 * - Responsive typography
 */
export function PageHeader({ 
  title, 
  subtitle, 
  children,
  className = '',
  delay = 0 
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <header 
      className={`
        flex flex-col sm:flex-row sm:items-center justify-between gap-3 
        transition-all duration-500 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}
        ${className}
      `}
    >
      <div className="flex-1 min-w-0">
        {/* Page Title - Design System: text-2xl md:text-3xl font-bold tracking-tight */}
        <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-100 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {children}
        </div>
      )}
    </header>
  );
}

/**
 * TabNavigation — Polished tab navigation with animations
 * Uses design system font weights and colors
 * 
 * @deprecated Use TabSystem from '../tabs' instead. This component will be removed in a future version.
 * @example
 * // Old way (deprecated):
 * <TabNavigation tabs={tabs} activeTab={active} onChange={setActive} />
 * 
 * // New way (recommended):
 * <TabSystem defaultTab="overview" variant="default" animation="directional">
 *   <Tab id="overview" label="Overview" icon={Icon}>{content}</Tab>
 *   <Tab id="details" label="Details" icon={Icon}>{content}</Tab>
 * </TabSystem>
 */
export function TabNavigation({ 
  tabs, 
  activeTab, 
  onChange, 
  className = '' 
}) {
  return (
    <div className={`border-b border-surface-200 dark:border-surface-700 ${className}`}>
      <div className="flex overflow-x-auto scrollbar-hide -mb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`
                relative flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-4 
                font-semibold text-sm whitespace-nowrap 
                transition-all duration-200 ease-out
                ${isActive 
                  ? 'text-accent-600 dark:text-accent-400' 
                  : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'
                }
              `}
            >
              {Icon && <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel || tab.label}</span>
              
              {/* Active indicator */}
              {isActive && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-500 to-accent-600"
                  style={{ 
                    animation: 'slideInFromLeft 0.2s ease-out',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PageHeader;
