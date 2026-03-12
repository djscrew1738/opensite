/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CARD COMPONENT v2.0 — UI/UX Overhaul
 * Enhanced with micro-interactions and refined visual feedback
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { 
  easings, 
  durations,
  cardAnimations,
  useReducedMotion,
  cx,
} from '../../design-system';

// ═══════════════════════════════════════════════════════════════════════════════
// CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const Card = forwardRef(({
  children,
  className = '',
  padding = 'DEFAULT',
  variant = 'DEFAULT',
  isHoverable = false,
  isInteractive = false,
  onClick,
  animateOnMount = true,
  delay = 0,
  ...props
}, ref) => {
  const reducedMotion = useReducedMotion();
  
  const paddingStyles = {
    none: '',
    xs: 'p-3',
    sm: 'p-4',
    DEFAULT: 'p-5',
    lg: 'p-6',
    xl: 'p-8',
  };
  
  const variantStyles = {
    DEFAULT: `
      bg-[#111318] 
      border border-transparent
      shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.03)]
    `,
    elevated: `
      bg-[#181C24] 
      border border-[#1F2430]
      shadow-[0_4px_6px_-1px_rgba(0,0,0,0.4),0_2px_4px_-2px_rgba(0,0,0,0.3)]
    `,
    outlined: `
      bg-transparent 
      border border-[#2D3548]
    `,
    ghost: `
      bg-[rgba(17,19,24,0.5)] 
      border border-[rgba(255,255,255,0.05)]
    `,
    glass: `
      bg-[rgba(17,19,24,0.7)]
      border border-[rgba(255,255,255,0.05)]
      backdrop-blur-xl
      shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.03)]
    `,
  };
  
  const baseClasses = cx(
    'relative overflow-hidden rounded-xl',
    paddingStyles[padding],
    variantStyles[variant],
    (isHoverable || isInteractive) && 'transition-all duration-200',
    (isHoverable || isInteractive) && 'hover:border-[#2D3548]',
    isInteractive && 'cursor-pointer',
    className
  );
  
  const content = (
    <div
      ref={ref}
      className={baseClasses}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      {...props}
    >
      {/* Subtle gradient overlay on hover */}
      {(isHoverable || isInteractive) && (
        <div 
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.03) 0%, transparent 50%)',
          }}
        />
      )}
      
      {/* Corner accent for elevated variant */}
      {variant === 'elevated' && (
        <div 
          className="absolute top-0 right-0 w-20 h-20 opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
          }}
        />
      )}
      
      {children}
    </div>
  );
  
  // Animation variants
  const motionVariants = {
    initial: animateOnMount && !reducedMotion ? { opacity: 0, y: 12 } : false,
    animate: animateOnMount && !reducedMotion ? { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: durations.slower,
        ease: easings.enterExpo,
        delay,
      }
    } : false,
    hover: isInteractive || isHoverable ? {
      y: -3,
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      borderColor: 'rgba(45, 53, 72, 0.8)',
      transition: {
        duration: durations.fast,
        ease: easings.default,
      }
    } : undefined,
    tap: isInteractive ? {
      scale: 0.99,
      y: -1,
      transition: {
        duration: durations.fastest,
      }
    } : undefined,
  };
  
  if (reducedMotion && !(isInteractive || isHoverable)) {
    return content;
  }
  
  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover={motionVariants.hover}
      whileTap={motionVariants.tap}
      variants={motionVariants}
      className="h-full"
    >
      {content}
    </motion.div>
  );
});

Card.displayName = 'Card';

// ═══════════════════════════════════════════════════════════════════════════════
// CARD HEADER
// ═══════════════════════════════════════════════════════════════════════════════

export const CardHeader = forwardRef(({
  children,
  className = '',
  title,
  subtitle,
  action,
  icon: Icon,
  badge,
  ...props
}, ref) => {
  return (
    <div 
      ref={ref} 
      className={cx('flex items-start justify-between gap-4 mb-4', className)} 
      {...props}
    >
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <motion.div 
            className="w-10 h-10 rounded-xl bg-[rgba(59,130,246,0.1)] flex items-center justify-center flex-shrink-0"
            whileHover={{ scale: 1.05, rotate: 2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Icon className="w-5 h-5 text-[#3B82F6]" />
          </motion.div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {title && (
              <h3 className="text-base font-semibold text-[#F8FAFC] truncate">
                {title}
              </h3>
            )}
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm text-[#94A3B8] mt-0.5">
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

// ═══════════════════════════════════════════════════════════════════════════════
// CARD CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

export const CardContent = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div 
      ref={ref} 
      className={cx('text-[#CBD5E1]', className)} 
      {...props}
    >
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';

// ═══════════════════════════════════════════════════════════════════════════════
// CARD FOOTER
// ═══════════════════════════════════════════════════════════════════════════════

export const CardFooter = forwardRef(({
  children,
  className = '',
  align = 'end',
  divider = true,
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
      className={cx(
        'flex items-center gap-3 mt-5',
        divider && 'pt-4 border-t border-[#1F2430]',
        alignClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

CardFooter.displayName = 'CardFooter';

// ═══════════════════════════════════════════════════════════════════════════════
// CARD MEDIA
// ═══════════════════════════════════════════════════════════════════════════════

export const CardMedia = forwardRef(({
  src,
  alt,
  className = '',
  aspectRatio = 'video',
  overlay,
  ...props
}, ref) => {
  const aspectClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    wide: 'aspect-[21/9]',
  };

  return (
    <div 
      ref={ref}
      className={cx(
        'relative overflow-hidden rounded-t-xl -mx-5 -mt-5 mb-4',
        aspectClasses[aspectRatio],
        className
      )}
      {...props}
    >
      <img 
        src={src} 
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
      />
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      )}
    </div>
  );
});

CardMedia.displayName = 'CardMedia';

// ═══════════════════════════════════════════════════════════════════════════════
// CARD BADGE
// ═══════════════════════════════════════════════════════════════════════════════

export const CardBadge = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variantClasses = {
    default: 'bg-[rgba(59,130,246,0.12)] text-[#3B82F6] border-[rgba(59,130,246,0.2)]',
    success: 'bg-[rgba(16,185,129,0.12)] text-[#10B981] border-[rgba(16,185,129,0.2)]',
    warning: 'bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border-[rgba(245,158,11,0.2)]',
    danger: 'bg-[rgba(239,68,68,0.12)] text-[#EF4444] border-[rgba(239,68,68,0.2)]',
    neutral: 'bg-[rgba(148,163,184,0.12)] text-[#94A3B8] border-[rgba(148,163,184,0.2)]',
  };

  return (
    <span className={cx(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STAT CARD (Specialized Card for Stats)
// ═══════════════════════════════════════════════════════════════════════════════

export const StatCard = forwardRef(({
  label,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  trend,
  className = '',
  ...props
}, ref) => {
  const changeColors = {
    positive: 'text-[#10B981]',
    negative: 'text-[#EF4444]',
    neutral: 'text-[#94A3B8]',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <Card 
      ref={ref} 
      isHoverable 
      className={cx('relative overflow-hidden', className)}
      {...props}
    >
      {/* Background gradient accent */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
        }}
      />
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          {Icon && <Icon className="w-4 h-4 text-[#64748B]" />}
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            {label}
          </span>
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[#F8FAFC] tabular-nums">
            {value}
          </span>
          
          {change && (
            <span className={cx('text-sm font-medium', changeColors[changeType])}>
              {trend && trendIcons[trend]}
              {change}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

export default Card;
