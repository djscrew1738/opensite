import React from 'react';
import { motion } from 'framer-motion';

const variantStyles = {
  // Status variants
  active: 'bg-success-bg text-success border-success-border',
  pending: 'bg-warning-bg text-warning border-warning-border',
  overdue: 'bg-danger-bg text-danger border-danger-border',
  complete: 'bg-success-bg text-success border-success-border',
  warning: 'bg-warning-bg text-warning border-warning-border',
  critical: 'bg-danger-bg text-danger border-danger-border',
  draft: 'bg-surface-500 text-text-muted border-border',
  archived: 'bg-surface-500 text-text-muted border-border',
  
  // Brand variants
  primary: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
  secondary: 'bg-surface-500 text-text-secondary border-border-medium',
  ghost: 'bg-transparent text-text-muted border-border-light',
  
  // Phase variants - using brand color scale
  underground: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  roughin: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
  topout: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  trim: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  final: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  
  // Priority variants
  high: 'bg-danger-bg text-danger border-danger-border',
  medium: 'bg-warning-bg text-warning border-warning-border',
  low: 'bg-success-bg text-success border-success-border',
};

const sizeStyles = {
  sm: 'text-xs px-1.5 py-0.5 gap-1',
  DEFAULT: 'text-xs px-2 py-0.5 gap-1.5',
  lg: 'text-sm px-2.5 py-1 gap-1.5',
};

export const Badge = ({
  children,
  variant = 'secondary',
  size = 'DEFAULT',
  className = '',
  dot = false,
  dotColor,
  pulse = false,
  title,
  ...props
}) => {
  const dotColorClass = dotColor || {
    active: 'bg-success',
    pending: 'bg-warning',
    overdue: 'bg-danger',
    complete: 'bg-success',
    warning: 'bg-warning',
    critical: 'bg-danger',
    high: 'bg-danger',
    medium: 'bg-warning',
    low: 'bg-success',
  }[variant] || 'bg-brand-400';

  // Map variant to aria-label for status badges
  const statusLabels = {
    active: 'Status: Active',
    pending: 'Status: Pending',
    overdue: 'Status: Overdue',
    complete: 'Status: Complete',
    warning: 'Status: Warning',
    critical: 'Status: Critical',
    draft: 'Status: Draft',
    archived: 'Status: Archived',
  };

  const ariaLabel = statusLabels[variant] || title;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center
        font-semibold uppercase tracking-wider
        rounded-full border
        ${variantStyles[variant] || variantStyles.secondary}
        ${sizeStyles[size]}
        ${className}
      `}
      title={title}
      {...(ariaLabel && { 'aria-label': ariaLabel })}
      {...props}
    >
      {dot && (
        <span 
          className={`
            rounded-full flex-shrink-0
            ${size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5'}
            ${dotColorClass} 
            ${pulse ? 'animate-pulse' : ''}
          `}
        />
      )}
      <span className="truncate">{children}</span>
    </motion.span>
  );
};

// Status badge with built-in dot
export const StatusBadge = ({
  status,
  children,
  size = 'DEFAULT',
  showDot = true,
  ...props
}) => {
  const statusMap = {
    active: { variant: 'active', label: 'Active', pulse: true },
    pending: { variant: 'pending', label: 'Pending' },
    overdue: { variant: 'overdue', label: 'Overdue' },
    complete: { variant: 'complete', label: 'Complete' },
    completed: { variant: 'complete', label: 'Completed' },
    warning: { variant: 'warning', label: 'Warning' },
    critical: { variant: 'critical', label: 'Critical' },
    draft: { variant: 'draft', label: 'Draft' },
    archived: { variant: 'archived', label: 'Archived' },
  };

  const config = statusMap[status?.toLowerCase()] || { variant: 'secondary', label: status };

  return (
    <Badge 
      variant={config.variant} 
      dot={showDot} 
      pulse={config.pulse} 
      size={size}
      {...props}
    >
      {children || config.label}
    </Badge>
  );
};

// Phase badge for construction phases
export const PhaseBadge = ({
  phase,
  children,
  size = 'DEFAULT',
  ...props
}) => {
  const phaseMap = {
    underground: 'Underground',
    roughin: 'Rough In',
    topout: 'Top Out',
    trim: 'Trim',
    final: 'Final',
    completed: 'Final',
  };

  return (
    <Badge variant={phase?.toLowerCase()} size={size} {...props}>
      {children || phaseMap[phase?.toLowerCase()] || phase}
    </Badge>
  );
};

// Priority badge
export const PriorityBadge = ({
  priority,
  children,
  size = 'DEFAULT',
  ...props
}) => {
  const priorityMap = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    urgent: 'High',
    critical: 'High',
    normal: 'Medium',
    minor: 'Low',
  };

  const priorityValue = priority?.toLowerCase();
  const variant = ['high', 'urgent', 'critical'].includes(priorityValue) 
    ? 'high' 
    : ['low', 'minor'].includes(priorityValue) 
      ? 'low' 
      : 'medium';

  return (
    <Badge variant={variant} size={size} {...props}>
      {children || priorityMap[priorityValue] || priority}
    </Badge>
  );
};

// Count badge (for notifications, tabs, etc.)
export const CountBadge = ({
  count,
  max = 99,
  size = 'sm',
  variant = 'primary',
  className = '',
}) => {
  const displayCount = count > max ? `${max}+` : count;

  return (
    <span
      className={`
        inline-flex items-center justify-center
        font-semibold tabular-nums
        rounded-full
        ${variant === 'primary' ? 'bg-brand-500 text-white' : ''}
        ${variant === 'secondary' ? 'bg-surface-500 text-text-secondary' : ''}
        ${variant === 'danger' ? 'bg-danger text-white' : ''}
        ${size === 'sm' ? 'min-w-[1.25rem] h-5 px-1 text-xs' : ''}
        ${size === 'DEFAULT' ? 'min-w-[1.5rem] h-6 px-1.5 text-xs' : ''}
        ${className}
      `}
      aria-label={`${count} items`}
    >
      {displayCount}
    </span>
  );
};

export default Badge;
