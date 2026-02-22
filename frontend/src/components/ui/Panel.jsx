import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

export const Panel = forwardRef(({
  children,
  className = '',
  title,
  subtitle,
  icon: Icon,
  headerAction,
  footer,
  padding = 'DEFAULT',
  variant = 'DEFAULT',
  isCollapsible = false,
  isCollapsed = false,
  onToggleCollapse,
  ...props
}, ref) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    DEFAULT: 'p-5',
    lg: 'p-6',
  };
  
  const variantStyles = {
    DEFAULT: 'bg-surface-800 border border-border rounded-xl',
    elevated: 'bg-surface-700 border border-border-medium rounded-xl shadow-dark-md',
    ghost: 'bg-surface-800/50 border border-border-light rounded-xl',
  };
  
  return (
    <div
      ref={ref}
      className={`${variantStyles[variant]} ${className}`}
      {...props}
    >
      {/* Header */}
      {(title || Icon) && (
        <div className={`flex items-center justify-between gap-4 ${padding !== 'none' ? 'pb-4 mb-4 border-b border-border' : ''}`}>
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-brand-400" />
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-base font-semibold text-text-primary truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-text-secondary mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {headerAction && (
            <div className="flex-shrink-0">{headerAction}</div>
          )}
        </div>
      )}
      
      {/* Content */}
      <div className={`${paddingStyles[padding]} ${title || Icon ? '!pt-0 !pb-0' : ''}`}>
        {children}
      </div>
      
      {/* Footer */}
      {footer && (
        <div className={`mt-4 pt-4 border-t border-border ${paddingStyles[padding]} !pt-4`}>
          {footer}
        </div>
      )}
    </div>
  );
});

Panel.displayName = 'Panel';

// Stat Panel - For dashboard metrics
export const StatPanel = ({
  label,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  suffix,
  prefix,
  isLoading = false,
}) => {
  const changeColors = {
    positive: 'text-success',
    negative: 'text-danger',
    neutral: 'text-text-muted',
  };
  
  const changeIcon = {
    positive: '↑',
    negative: '↓',
    neutral: '→',
  };
  
  return (
    <Panel padding="lg" variant="elevated" className="h-full">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary uppercase tracking-wider">
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            {prefix && <span className="text-2xl font-semibold text-text-muted">{prefix}</span>}
            <span className="text-3xl font-bold text-text-primary font-mono tabular-nums">
              {isLoading ? '—' : value}
            </span>
            {suffix && <span className="text-lg text-text-muted">{suffix}</span>}
          </div>
          {change !== undefined && !isLoading && (
            <div className={`mt-2 flex items-center gap-1 text-sm font-medium ${changeColors[changeType]}`}>
              <span>{changeIcon[changeType]}</span>
              <span>{Math.abs(change)}%</span>
              <span className="text-text-muted font-normal ml-1">vs last week</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-brand-400" />
          </div>
        )}
      </div>
    </Panel>
  );
};

// Sidebar Panel - For side panels like in Canvas
export const SidebarPanel = ({
  children,
  title,
  isOpen = true,
  onClose,
  width = '320px',
  side = 'left',
}) => {
  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ x: side === 'left' ? -20 : 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`fixed top-20 ${side}-4 z-40 w-80 bg-surface-800 border border-border rounded-xl shadow-dark-lg overflow-hidden`}
      style={{ width }}
    >
      {title && (
        <div className="px-4 py-3 border-b border-border bg-surface-700/50">
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        </div>
      )}
      <div className="p-4 max-h-[calc(100vh-12rem)] overflow-auto">
        {children}
      </div>
    </motion.div>
  );
};

export default Panel;
