/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BUTTON COMPONENT v2.0 — UI/UX Overhaul
 * Enhanced with micro-interactions and refined visual feedback
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { forwardRef, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { 
  easings, 
  durations, 
  useReducedMotion,
  colors,
} from '../../design-system';

// ═══════════════════════════════════════════════════════════════════════════════
// VARIANT STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const variantStyles = {
  primary: {
    base: `
      bg-[#3B82F6] text-white
      shadow-[0_0_12px_rgba(59,130,246,0.3),0_4px_14px_rgba(59,130,246,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]
      hover:bg-[#2563EB]
      hover:shadow-[0_0_16px_rgba(59,130,246,0.4),0_6px_20px_rgba(59,130,246,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]
      active:bg-[#1D4ED8]
    `,
    disabled: 'bg-[#3B82F6]/50 text-white/50 shadow-none cursor-not-allowed',
  },
  secondary: {
    base: `
      bg-[rgba(24,28,36,0.6)] text-[#F8FAFC] border border-[#1F2430]
      backdrop-blur-sm
      hover:border-[#2D3548] hover:bg-[rgba(24,28,36,0.8)]
    `,
    disabled: 'bg-[rgba(24,28,36,0.3)] text-[#475569] border-[#161A22] cursor-not-allowed',
  },
  ghost: {
    base: `
      bg-transparent text-[#94A3B8] border border-[#2D3548]
      hover:bg-[rgba(59,130,246,0.08)] hover:text-[#3B82F6] hover:border-[rgba(59,130,246,0.3)]
    `,
    disabled: 'text-[#475569] hover:bg-transparent hover:border-[#2D3548] cursor-not-allowed',
  },
  danger: {
    base: `
      bg-[#EF4444] text-white
      shadow-[0_4px_14px_rgba(239,68,68,0.3)]
      hover:bg-[#DC2626] hover:shadow-[0_6px_20px_rgba(239,68,68,0.4)]
    `,
    disabled: 'bg-[#EF4444]/50 text-white/50 shadow-none cursor-not-allowed',
  },
  success: {
    base: `
      bg-[#10B981] text-white
      shadow-[0_4px_14px_rgba(16,185,129,0.3)]
      hover:bg-[#059669] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)]
    `,
    disabled: 'bg-[#10B981]/50 text-white/50 shadow-none cursor-not-allowed',
  },
  outline: {
    base: `
      bg-transparent text-[#F8FAFC] border border-[#1F2430]
      hover:bg-[rgba(24,28,36,0.6)] hover:border-[#2D3548]
    `,
    disabled: 'text-[#475569] border-[#161A22] cursor-not-allowed',
  },
};

const sizeStyles = {
  sm: 'h-9 px-3 text-xs gap-1.5',
  DEFAULT: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-base gap-2',
  icon: 'h-10 w-10 p-0',
  'icon-sm': 'h-8 w-8 p-0',
  'icon-lg': 'h-12 w-12 p-0',
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOTION VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════

const buttonMotion = {
  rest: { 
    scale: 1,
    transition: { 
      duration: durations.fast,
      ease: easings.default,
    }
  },
  hover: { 
    scale: 1.02,
    y: -1,
    transition: { 
      duration: durations.fast,
      ease: easings.spring,
    }
  },
  tap: { 
    scale: 0.97,
    y: 0,
    transition: { 
      duration: durations.fastest,
      ease: easings.exit,
    }
  },
};

const iconMotion = {
  rest: { rotate: 0 },
  hover: { 
    rotate: [-2, 2, -2, 0],
    transition: { 
      duration: 0.4,
      ease: easings.spring,
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// RIPPLE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const Ripple = ({ x, y, size, color }) => {
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0.5 }}
      animate={{ scale: 2.5, opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: easings.exit }}
      className="absolute rounded-full pointer-events-none"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        backgroundColor: color,
      }}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'DEFAULT',
  isLoading = false,
  isDisabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth = false,
  className = '',
  as: Component = 'button',
  type = 'button',
  href,
  target,
  rel,
  onClick,
  showRipple = true,
  ...props
}, ref) => {
  const buttonRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const [ripples, setRipples] = React.useState([]);
  
  const isDisabledState = isDisabled || isLoading;
  const isIconOnly = (size === 'icon' || size === 'icon-sm' || size === 'icon-lg') && !children;

  // Combine refs
  const setRefs = (element) => {
    buttonRef.current = element;
    if (typeof ref === 'function') {
      ref(element);
    } else if (ref) {
      ref.current = element;
    }
  };

  const handleClick = (event) => {
    if (isDisabledState) return;

    // Create ripple effect
    if (showRipple && !reducedMotion && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const newRipple = {
        x,
        y,
        size,
        id: Date.now(),
        color: variant === 'primary' ? 'rgba(255,255,255,0.3)' : 'rgba(59,130,246,0.3)',
      };
      
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }

    onClick?.(event);
  };

  const baseClasses = `
    relative inline-flex items-center justify-center
    font-semibold rounded-lg
    overflow-hidden
    transition-colors duration-200
    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0B0D]
    disabled:cursor-not-allowed
    touch-manipulation
    select-none
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
    <>
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <Ripple key={ripple.id} {...ripple} />
      ))}
      
      {/* Loading spinner */}
      {isLoading && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mr-2"
        >
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" aria-hidden="true" />
        </motion.span>
      )}
      
      {/* Left icon */}
      {!isLoading && LeftIcon && (
        <motion.span 
          className="flex-shrink-0 mr-2"
          variants={iconMotion}
          aria-hidden="true"
        >
          <LeftIcon className="w-4 h-4" />
        </motion.span>
      )}
      
      {/* Button text */}
      {children && (
        <span className={isIconOnly ? 'sr-only' : ''}>
          {children}
        </span>
      )}
      
      {/* Right icon */}
      {!isLoading && RightIcon && (
        <motion.span 
          className="flex-shrink-0 ml-2"
          variants={iconMotion}
          aria-hidden="true"
        >
          <RightIcon className="w-4 h-4" />
        </motion.span>
      )}
    </>
  );

  const buttonElement = (
    <Component
      ref={setRefs}
      disabled={isDisabledState}
      className={`${baseClasses} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
      onClick={handleClick}
      {...buttonProps}
      {...linkProps}
      {...props}
    >
      {content}
    </Component>
  );

  // Wrap in motion for enhanced interactions
  if (isDisabledState || reducedMotion) {
    return buttonElement;
  }

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      variants={buttonMotion}
      className={fullWidth ? 'w-full inline-flex' : 'inline-flex'}
    >
      {buttonElement}
    </motion.div>
  );
});

Button.displayName = 'Button';

// ═══════════════════════════════════════════════════════════════════════════════
// ICON BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

export const IconButton = forwardRef(({
  icon: Icon,
  'aria-label': ariaLabel,
  size = 'DEFAULT',
  variant = 'ghost',
  className = '',
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
      className={`rounded-lg ${className}`}
      {...props}
    >
      <Icon className="w-5 h-5" />
    </Button>
  );
});

IconButton.displayName = 'IconButton';

// ═══════════════════════════════════════════════════════════════════════════════
// BUTTON GROUP
// ═══════════════════════════════════════════════════════════════════════════════

export const ButtonGroup = ({
  children,
  className = '',
  attached = false,
  size = 'DEFAULT',
}) => {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div 
      className={`
        inline-flex items-center
        ${attached ? '' : 'gap-2'}
        ${className}
      `}
      role="group"
    >
      {childrenArray.map((child, index) => {
        if (!React.isValidElement(child)) return child;
        
        const isFirst = index === 0;
        const isLast = index === childrenArray.length - 1;
        
        let attachedClasses = '';
        if (attached) {
          if (isFirst) {
            attachedClasses = 'rounded-r-none';
          } else if (isLast) {
            attachedClasses = 'rounded-l-none -ml-px';
          } else {
            attachedClasses = 'rounded-none -ml-px';
          }
        }
        
        return React.cloneElement(child, {
          size: child.props.size || size,
          className: `${child.props.className || ''} ${attachedClasses}`,
        });
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FAB (FLOATING ACTION BUTTON)
// ═══════════════════════════════════════════════════════════════════════════════

export const FAB = forwardRef(({
  icon: Icon,
  'aria-label': ariaLabel,
  variant = 'primary',
  size = 'default',
  className = '',
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    default: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    default: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  const variantClasses = {
    primary: 'bg-[#3B82F6] text-white shadow-[0_4px_16px_rgba(59,130,246,0.4),0_0_40px_rgba(59,130,246,0.15)]',
    secondary: 'bg-[#181C24] text-[#F8FAFC] border border-[#2D3548] shadow-lg',
    success: 'bg-[#10B981] text-white shadow-[0_4px_16px_rgba(16,185,129,0.4)]',
  };

  return (
    <motion.button
      ref={ref}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ 
        scale: 1.05,
        boxShadow: '0 6px 24px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.25)',
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ 
        type: 'spring',
        stiffness: 400,
        damping: 17,
      }}
      className={`
        fixed z-40 rounded-full flex items-center justify-center
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      aria-label={ariaLabel}
      {...props}
    >
      <Icon className={iconSizes[size]} />
    </motion.button>
  );
});

FAB.displayName = 'FAB';

export default Button;
