import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const variantStyles = {
  primary: {
    base: 'bg-brand-500 hover:bg-brand-400 text-white shadow-dark-sm',
    active: 'bg-brand-600',
    disabled: 'bg-brand-500/50 text-white/50 shadow-none',
  },
  secondary: {
    base: 'bg-surface-600 hover:bg-surface-500 text-text-primary border border-border-medium',
    active: 'bg-surface-400',
    disabled: 'bg-surface-600/50 text-text-disabled border-border-light',
  },
  ghost: {
    base: 'hover:bg-surface-600 text-text-secondary hover:text-text-primary',
    active: 'bg-surface-500',
    disabled: 'text-text-disabled hover:bg-transparent',
  },
  danger: {
    base: 'bg-danger-dark hover:bg-danger text-white shadow-dark-sm',
    active: 'bg-danger-muted',
    disabled: 'bg-danger-dark/50 text-white/50 shadow-none',
  },
  success: {
    base: 'bg-success-dark hover:bg-success text-white shadow-dark-sm',
    active: 'bg-success-muted',
    disabled: 'bg-success-dark/50 text-white/50 shadow-none',
  },
  outline: {
    base: 'bg-transparent hover:bg-surface-600 text-text-primary border border-border-medium hover:border-border-heavy',
    active: 'bg-surface-500',
    disabled: 'text-text-disabled border-border-light hover:bg-transparent',
  },
};

const sizeStyles = {
  sm: 'h-10 px-4 text-xs gap-1.5',
  DEFAULT: 'h-12 px-6 text-sm gap-2',
  lg: 'h-14 px-8 text-base gap-2',
  icon: 'h-12 w-12 p-0',
  'icon-sm': 'h-10 w-10 p-0',
  'icon-lg': 'h-14 w-14 p-0',
};

export const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'DEFAULT',
  isLoading = false,
  isDisabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  as: Component = 'button',
  type = 'button',
  href,
  target,
  rel,
  ...props
}, ref) => {
  const isDisabledState = isDisabled || isLoading;
  const isIconOnly = (size === 'icon' || size === 'icon-sm' || size === 'icon-lg') && !children;

  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-xl
    transition-all duration-fast ease-out
    focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:ring-offset-2 focus:ring-offset-surface-bg
    disabled:cursor-not-allowed
    active:scale-[0.98]
    touch-manipulation
  `;

  const variantClass = isDisabledState
    ? variantStyles[variant].disabled
    : variantStyles[variant].base;

  const sizeClass = sizeStyles[size];
  const widthClass = fullWidth ? 'w-full' : '';

  // Handle anchor tag props
  const linkProps = href ? {
    href,
    target,
    rel: target === '_blank' ? 'noopener noreferrer' : rel,
  } : {};

  // Handle button type
  const buttonProps = Component === 'button' ? { type } : {};

  const content = (
    <Component
      ref={ref}
      disabled={isDisabledState}
      className={`${baseClasses} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
      {...buttonProps}
      {...linkProps}
      {...props}
    >
      {isLoading && (
        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" aria-hidden="true" />
      )}
      {!isLoading && leftIcon && (
        <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>
      )}
      {children && (
        <span className={isIconOnly ? 'sr-only' : ''}>
          {children}
        </span>
      )}
      {!isLoading && rightIcon && (
        <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>
      )}
    </Component>
  );

  // Wrap in motion.div for hover effects, but not for disabled state
  if (isDisabledState) {
    return content;
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={fullWidth ? 'w-full inline-flex' : 'inline-flex'}
    >
      {content}
    </motion.div>
  );
});

Button.displayName = 'Button';

// Icon Button - simplified API for icon-only buttons
export const IconButton = forwardRef(({
  icon,
  'aria-label': ariaLabel,
  size = 'DEFAULT',
  variant = 'ghost',
  ...props
}, ref) => {
  const sizeMap = {
    sm: 'icon-sm',
    DEFAULT: 'icon',
    lg: 'icon-lg',
  };

  return (
    <Button
      ref={ref}
      size={sizeMap[size]}
      variant={variant}
      aria-label={ariaLabel}
      {...props}
    >
      {icon}
    </Button>
  );
});

IconButton.displayName = 'IconButton';

// Button Group - for grouping related buttons
export const ButtonGroup = ({
  children,
  className = '',
  attached = false,
}) => {
  return (
    <div 
      className={`
        inline-flex items-center
        ${attached ? '' : 'gap-2'}
        ${className}
      `}
      role="group"
    >
      {children}
    </div>
  );
};

export default Button;
