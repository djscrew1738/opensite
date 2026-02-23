import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

/**
 * AccessibleCard - A card component with full keyboard and screen reader support
 * 
 * Features:
 * - Keyboard navigation (Enter/Space to activate)
 * - Proper ARIA roles and labels
 * - Focus management
 * - Hover and active states
 * - Support for both interactive and static cards
 * 
 * @example
 * // Interactive card (clickable)
 * <AccessibleCard
 *   isInteractive
 *   onClick={() => navigate('/job/123')}
 *   onKeyDown={(e) => e.key === 'Delete' && deleteJob()}
 *   ariaLabel="Job: 123 Main St, Rough In phase"
 * >
 *   <h3>123 Main St</h3>
 *   <p>Rough In phase</p>
 * </AccessibleCard>
 * 
 * @example
 * // Static card with actions
 * <AccessibleCard>
 *   <h3>Job Details</h3>
 *   <button aria-label="Edit job">Edit</button>
 * </AccessibleCard>
 */
export const AccessibleCard = forwardRef(({
  children,
  className = '',
  isInteractive = false,
  isHoverable = false,
  onClick,
  onKeyDown,
  onFocus,
  onBlur,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  role,
  tabIndex,
  disabled = false,
  href,
  target,
  rel,
  as: Component = 'div',
  padding = 'DEFAULT',
  variant = 'DEFAULT',
  ...props
}, ref) => {
  // Determine if this is an interactive element
  const isClickable = isInteractive && onClick && !disabled;
  const isLink = !!href;
  
  // Determine the element to render
  let Element = Component;
  if (isLink) {
    Element = 'a';
  } else if (isClickable) {
    Element = 'button';
  }

  // Handle keyboard interaction for non-button elements
  const handleKeyDown = (e) => {
    if (isClickable && Element !== 'button') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick(e);
      }
    }
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  // Handle click
  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  // Padding styles
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    DEFAULT: 'p-5',
    lg: 'p-6',
  };

  // Variant styles
  const variantStyles = {
    DEFAULT: 'bg-surface-card border border-border',
    elevated: 'bg-surface-card border border-border-strong shadow-card',
    outlined: 'bg-transparent border-2 border-border-strong',
    ghost: 'bg-surface-card/50 border border-border',
  };

  // Base classes
  const baseClasses = `
    rounded-card
    ${paddingStyles[padding]}
    ${variantStyles[variant]}
    ${className}
  `;

  // Interactive classes
  const interactiveClasses = isClickable || isHoverable
    ? 'transition-all duration-fast ease-out hover:border-brand-400/30 cursor-pointer'
    : '';

  const hoverClasses = isClickable
    ? 'hover:shadow-dark-glow hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]'
    : '';

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : '';

  const focusClasses = isClickable
    ? 'focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:ring-offset-2 focus:ring-offset-surface-primary'
    : '';

  const combinedClasses = `
    ${baseClasses}
    ${interactiveClasses}
    ${hoverClasses}
    ${disabledClasses}
    ${focusClasses}
  `.trim();

  // ARIA attributes
  const ariaAttributes = {};
  if (ariaLabel) ariaAttributes['aria-label'] = ariaLabel;
  if (ariaLabelledBy) ariaAttributes['aria-labelledby'] = ariaLabelledBy;
  if (ariaDescribedBy) ariaAttributes['aria-describedby'] = ariaDescribedBy;
  if (disabled) ariaAttributes['aria-disabled'] = 'true';

  // Role and tabIndex
  const elementRole = role || (isClickable ? 'button' : undefined);
  const elementTabIndex = tabIndex !== undefined ? tabIndex : (isClickable && Element !== 'button' ? 0 : undefined);

  // Props for the element
  const elementProps = {
    ref,
    className: combinedClasses,
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    onFocus,
    onBlur,
    ...ariaAttributes,
    ...(elementRole && { role: elementRole }),
    ...(elementTabIndex !== undefined && { tabIndex: elementTabIndex }),
    ...(isLink && { href, target, rel: target === '_blank' ? 'noopener noreferrer' : rel }),
    ...props,
  };

  const content = <Element {...elementProps}>{children}</Element>;

  // Wrap in motion.div for hover animation if interactive
  if (isClickable || isHoverable) {
    return (
      <motion.div
        whileHover={!disabled ? { y: -2 } : undefined}
        whileTap={!disabled ? { scale: 0.99 } : undefined}
        transition={{ duration: 0.2 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
});

AccessibleCard.displayName = 'AccessibleCard';

/**
 * AccessibleCardHeader - Header section with proper heading structure
 */
export const AccessibleCardHeader = forwardRef(({
  children,
  title,
  subtitle,
  action,
  icon: Icon,
  className = '',
  titleId,
  ...props
}, ref) => {
  return (
    <div 
      ref={ref} 
      className={`flex items-start justify-between gap-4 mb-4 ${className}`} 
      {...props}
    >
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div 
            className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <Icon className="w-5 h-5 text-brand-400" />
          </div>
        )}
        <div className="min-w-0">
          {title && (
            <h3 
              id={titleId}
              className="text-lg font-semibold text-text-primary truncate"
            >
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-text-secondary mt-0.5">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
      {action && (
        <div className="flex-shrink-0">{action}</div>
      )}
    </div>
  );
});

AccessibleCardHeader.displayName = 'AccessibleCardHeader';

/**
 * AccessibleCardContent - Content section
 */
export const AccessibleCardContent = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div 
      ref={ref} 
      className={`text-text-secondary ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
});

AccessibleCardContent.displayName = 'AccessibleCardContent';

/**
 * AccessibleCardFooter - Footer section
 */
export const AccessibleCardFooter = forwardRef(({
  children,
  className = '',
  align = 'end',
  ...props
}, ref) => {
  const alignClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  };
  
  return (
    <div
      ref={ref}
      className={`flex items-center gap-3 mt-6 pt-4 border-t border-border ${alignClasses[align]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

AccessibleCardFooter.displayName = 'AccessibleCardFooter';

export default AccessibleCard;
