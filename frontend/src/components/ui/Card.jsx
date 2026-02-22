import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { animation } from '../../styles/tokens';

export const Card = forwardRef(({
  children,
  className = '',
  padding = 'DEFAULT',
  variant = 'DEFAULT',
  isHoverable = false,
  isInteractive = false,
  onClick,
  ...props
}, ref) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    DEFAULT: 'p-6',
    lg: 'p-8',
  };
  
  const variantStyles = {
    DEFAULT: 'bg-surface-800 border border-border',
    elevated: 'bg-surface-700 border border-border-medium shadow-dark-lg',
    outlined: 'bg-transparent border border-border-heavy',
    ghost: 'bg-surface-800/50 border border-border-light',
  };
  
  const baseClasses = `
    rounded-2xl
    ${paddingStyles[padding]}
    ${variantStyles[variant]}
    ${isHoverable || isInteractive ? 'transition-all duration-fast ease-out hover:border-brand-400/30' : ''}
    ${isInteractive ? 'cursor-pointer hover:shadow-dark-glow' : ''}
    ${className}
  `;
  
  const content = (
    <div
      ref={ref}
      className={baseClasses}
      onClick={isInteractive ? onClick : undefined}
      {...props}
    >
      {children}
    </div>
  );
  
  if (isInteractive || isHoverable) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        {content}
      </motion.div>
    );
  }
  
  return content;
});

Card.displayName = 'Card';

// Card Header
export const CardHeader = forwardRef(({
  children,
  className = '',
  title,
  subtitle,
  action,
  icon: Icon,
  ...props
}, ref) => {
  return (
    <div ref={ref} className={`flex items-start justify-between gap-4 mb-4 ${className}`} {...props}>
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-brand-400" />
          </div>
        )}
        <div className="min-w-0">
          {title && (
            <h3 className="text-lg font-semibold text-text-primary truncate">
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

CardHeader.displayName = 'CardHeader';

// Card Content
export const CardContent = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div ref={ref} className={`text-text-secondary ${className}`} {...props}>
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';

// Card Footer
export const CardFooter = forwardRef(({
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

CardFooter.displayName = 'CardFooter';

export default Card;
