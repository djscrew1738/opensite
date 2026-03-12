/**
 * PageHeader Component
 * Polished page header with entrance animation
 * Follows industrial control room aesthetic
 * 
 * Features:
 * - Smooth fade-in animation
 * - Optional subtitle
 * - Action button slot
 * - Responsive typography
 * 
 * @module components/shared/PageHeader
 */

import { useState, useEffect, memo } from 'react';
import { colors } from '../../styles/tokens';

/**
 * PageHeader - Polished page header with entrance animation
 * @param {{
 *   title: string;
 *   subtitle?: string;
 *   children?: React.ReactNode;
 *   className?: string;
 *   delay?: number;
 * }} props
 */
export const PageHeader = memo(function PageHeader({ 
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
        {/* Page Title */}
        <h1 
          className="text-2xl md:text-3xl font-bold tracking-tight"
          style={{ color: colors.text.primary }}
        >
          {title}
        </h1>
        {subtitle && (
          <p 
            className="text-sm mt-1"
            style={{ color: colors.text.secondary }}
          >
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
});

PageHeader.displayName = 'PageHeader';

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
export const TabNavigation = memo(function TabNavigation({ 
  tabs, 
  activeTab, 
  onChange, 
  className = '' 
}) {
  return (
    <div 
      className={`border-b ${className}`}
      style={{ borderColor: colors.border.default }}
    >
      <div className="flex overflow-x-auto scrollbar-hide -mb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className="relative flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-4 font-semibold text-sm whitespace-nowrap transition-all duration-200 ease-out"
              style={{
                color: isActive ? colors.accent.DEFAULT : colors.text.muted,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = colors.text.secondary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = colors.text.muted;
                }
              }}
            >
              {Icon && <Icon style={{ width: '16px', height: '16px' }} strokeWidth={isActive ? 2.5 : 2} />}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel || tab.label}</span>
              
              {/* Active indicator */}
              {isActive && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ 
                    background: `linear-gradient(to right, ${colors.accent.DEFAULT}, ${colors.accent.hover})`,
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
});

TabNavigation.displayName = 'TabNavigation';

export default PageHeader;
