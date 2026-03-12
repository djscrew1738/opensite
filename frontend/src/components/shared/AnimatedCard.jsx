/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANIMATED CARD COMPONENT — UI/UX Overhaul
 * Enhanced card with micro-interactions and polished animations
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { 
  cardAnimations, 
  useReducedMotion,
  cx 
} from '../../design-system';

/**
 * AnimatedCard — A card component with enhanced micro-interactions
 * 
 * @example
 * <AnimatedCard 
 *   isInteractive 
 *   variant="elevated"
 *   onClick={handleClick}
 * >
 *   <CardHeader title="Job Title" />
 *   <CardContent>Content here</CardContent>
 * </AnimatedCard>
 */
export const AnimatedCard = forwardRef(({
  children,
  className = '',
  variant = 'default',
  isInteractive = false,
  isHoverable = false,
  onClick,
  animateOnMount = true,
  delay = 0,
  style = {},
  ...props
}, ref) => {
  const reducedMotion = useReducedMotion();
  
  const baseClasses = cx(
    'relative overflow-hidden rounded-xl',
    'bg-[#111318]',
    'border border-transparent',
    'shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.03)]',
    (isHoverable || isInteractive) && 'transition-all duration-200',
    className
  );

  const variantStyles = {
    default: {},
    elevated: {
      backgroundColor: '#181C24',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
    },
    outlined: {
      backgroundColor: 'transparent',
      borderColor: '#2D3548',
    },
    glass: {
      backgroundColor: 'rgba(17, 19, 24, 0.7)',
      borderColor: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px) saturate(1.5)',
    },
  };

  const combinedStyle = {
    ...variantStyles[variant],
    ...style,
  };

  // Animation variants
  const motionVariants = {
    initial: animateOnMount && !reducedMotion ? { 
      opacity: 0, 
      y: 12,
      scale: 0.98,
    } : false,
    animate: animateOnMount && !reducedMotion ? { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
        delay,
      }
    } : false,
    hover: (isInteractive || isHoverable) && !reducedMotion ? {
      y: -3,
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      borderColor: 'rgba(45, 53, 72, 0.8)',
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1],
      }
    } : undefined,
    tap: isInteractive && !reducedMotion ? {
      scale: 0.99,
      y: -1,
      transition: {
        duration: 0.05,
      }
    } : undefined,
  };

  const content = (
    <div
      ref={ref}
      className={baseClasses}
      style={combinedStyle}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      {...props}
    >
      {/* Hover gradient overlay */}
      {(isHoverable || isInteractive) && (
        <motion.div 
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
          }}
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );

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

AnimatedCard.displayName = 'AnimatedCard';

/**
 * StatCard — Animated statistic card with count-up animation
 */
export const AnimatedStatCard = ({
  label,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  delay = 0,
  className = '',
}) => {
  const changeColors = {
    positive: 'text-[#10B981]',
    negative: 'text-[#EF4444]',
    neutral: 'text-[#94A3B8]',
  };

  return (
    <AnimatedCard 
      isHoverable 
      delay={delay}
      className={className}
    >
      {/* Background accent */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        }}
      />
      
      <div className="relative p-5">
        <div className="flex items-center gap-2 mb-3">
          {Icon && (
            <motion.div 
              className="p-2 rounded-lg bg-[rgba(59,130,246,0.1)]"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Icon className="w-4 h-4 text-[#3B82F6]" />
            </motion.div>
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            {label}
          </span>
        </div>
        
        <div className="flex items-baseline gap-2">
          <motion.span 
            className="text-2xl font-bold text-[#F8FAFC] tabular-nums"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.1, duration: 0.3 }}
          >
            {value}
          </motion.span>
          
          {change && (
            <motion.span 
              className={`text-sm font-medium ${changeColors[changeType]}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.2, duration: 0.3 }}
            >
              {change}
            </motion.span>
          )}
        </div>
      </div>
    </AnimatedCard>
  );
};

/**
 * JobCardEnhanced — Enhanced job card with swipe actions and micro-interactions
 */
export const JobCardEnhanced = ({
  job,
  index = 0,
  onClick,
  onUpdatePhase,
  onFlag,
  selected = false,
}) => {
  const { 
    id, 
    name, 
    builder, 
    phase = 'rough-in',
    status = 'active',
    updatedAt,
    estimate 
  } = job;

  const statusColors = {
    active: '#10B981',
    pending: '#F59E0B',
    completed: '#3B82F6',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.05,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      <AnimatedCard
        isInteractive
        onClick={onClick}
        className={selected ? 'border-[#3B82F6] bg-[rgba(59,130,246,0.05)]' : ''}
      >
        <div className="p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[#F8FAFC] truncate">
                {name || 'Untitled Job'}
              </h3>
              <p className="text-sm text-[#94A3B8] mt-0.5">
                {builder || 'No builder'}
              </p>
            </div>
            <div 
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ 
                backgroundColor: statusColors[status] || '#64748B',
                boxShadow: `0 0 8px ${statusColors[status] || '#64748B'}`,
              }}
            />
          </div>

          {/* Phase indicator */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-1.5 bg-[#1F2430] rounded-full overflow-hidden">
              <motion.div 
                className="h-full rounded-full"
                style={{ 
                  background: 'linear-gradient(90deg, #3B82F6, #06B6D4)',
                }}
                initial={{ width: 0 }}
                animate={{ width: '60%' }}
                transition={{ delay: index * 0.05 + 0.2, duration: 0.6 }}
              />
            </div>
            <span className="text-xs text-[#64748B] capitalize">{phase}</span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>#{id}</span>
            {estimate && (
              <span className="text-[#10B981] font-medium">
                ${estimate.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </AnimatedCard>
    </motion.div>
  );
};

export default AnimatedCard;
