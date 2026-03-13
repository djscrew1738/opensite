/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * EMPTY STATE COMPONENT v2.0 — UI/UX Overhaul
 * Beautiful, contextual empty states with personality
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileX, 
  Search, 
  FolderOpen, 
  Inbox, 
  FileQuestion,
  Upload,
  Building2,
  Users,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Lightbulb,
  Plus
} from 'lucide-react';
import { Button } from './Button';
import { easings, durations, staggerItem } from '../../design-system';

// ═══════════════════════════════════════════════════════════════════════════════
// ICON MAP
// ═══════════════════════════════════════════════════════════════════════════════

const iconMap = {
  default: FileX,
  search: Search,
  folder: FolderOpen,
  inbox: Inbox,
  file: FileQuestion,
  upload: Upload,
  building: Building2,
  users: Users,
  clipboard: ClipboardList,
  error: AlertCircle,
  success: CheckCircle2,
  sparkles: Sparkles,
  idea: Lightbulb,
  add: Plus,
};

// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const EmptyState = ({
  icon: IconProp,
  iconName = 'default',
  title,
  description,
  action,
  secondaryAction,
  size = 'default',
  variant = 'default',
  className = '',
  animate = true,
  children,
}) => {
  const Icon = IconProp || iconMap[iconName] || iconMap.default;
  
  const sizeConfig = {
    sm: {
      iconSize: 'w-10 h-10',
      iconBg: 'p-2',
      titleSize: 'text-sm',
      descSize: 'text-xs',
    },
    default: {
      iconSize: 'w-12 h-12',
      iconBg: 'p-3',
      titleSize: 'text-base',
      descSize: 'text-sm',
    },
    lg: {
      iconSize: 'w-16 h-16',
      iconBg: 'p-4',
      titleSize: 'text-lg',
      descSize: 'text-base',
    },
    xl: {
      iconSize: 'w-20 h-20',
      iconBg: 'p-5',
      titleSize: 'text-xl',
      descSize: 'text-base',
    },
  };

  const variantConfig = {
    default: {
      iconBg: 'bg-[rgba(59,130,246,0.1)]',
      iconColor: 'text-[#3B82F6]',
      borderColor: 'border-[rgba(59,130,246,0.2)]',
    },
    success: {
      iconBg: 'bg-[rgba(16,185,129,0.1)]',
      iconColor: 'text-[#10B981]',
      borderColor: 'border-[rgba(16,185,129,0.2)]',
    },
    warning: {
      iconBg: 'bg-[rgba(245,158,11,0.1)]',
      iconColor: 'text-[#F59E0B]',
      borderColor: 'border-[rgba(245,158,11,0.2)]',
    },
    error: {
      iconBg: 'bg-[rgba(239,68,68,0.1)]',
      iconColor: 'text-[#EF4444]',
      borderColor: 'border-[rgba(239,68,68,0.2)]',
    },
    neutral: {
      iconBg: 'bg-[rgba(148,163,184,0.1)]',
      iconColor: 'text-[#94A3B8]',
      borderColor: 'border-[rgba(148,163,184,0.2)]',
    },
  };

  const sizes = sizeConfig[size];
  const variants = variantConfig[variant];

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: durations.slower,
        ease: easings.enterExpo,
        staggerChildren: 0.08,
      }
    },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: durations.medium,
        ease: easings.enterExpo,
      }
    },
  };

  const Wrapper = animate ? motion.div : 'div';
  const wrapperProps = animate ? {
    initial: 'initial',
    animate: 'animate',
    variants: containerVariants,
  } : {};

  return (
    <Wrapper
      className={`flex flex-col items-center justify-center text-center p-8 ${className}`}
      {...wrapperProps}
    >
      {/* Icon with animated ring */}
      <motion.div
        variants={animate ? itemVariants : undefined}
        className={`relative mb-5`}
      >
        {/* Glow effect */}
        <div 
          className={`absolute inset-0 rounded-2xl blur-xl opacity-50 ${variants.iconBg}`}
          style={{ transform: 'scale(1.2)' }}
        />
        
        {/* Icon container */}
        <motion.div
          whileHover={{ scale: 1.05, rotate: 2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className={`
            relative rounded-2xl ${sizes.iconBg} ${variants.iconBg} ${variants.borderColor} border
          `}
        >
          <Icon className={`${sizes.iconSize} ${variants.iconColor}`} strokeWidth={1.5} />
        </motion.div>

        {/* Decorative dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute -top-1 -right-1"
        >
          <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
        </motion.div>
      </motion.div>

      {/* Title */}
      {title && (
        <motion.h3
          variants={animate ? itemVariants : undefined}
          className={`${sizes.titleSize} font-semibold text-[#F8FAFC] mb-2`}
        >
          {title}
        </motion.h3>
      )}

      {/* Description */}
      {description && (
        <motion.p
          variants={animate ? itemVariants : undefined}
          className={`${sizes.descSize} text-[#94A3B8] max-w-sm mb-5 leading-relaxed`}
        >
          {description}
        </motion.p>
      )}

      {/* Custom content */}
      {children}

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          variants={animate ? itemVariants : undefined}
          className="flex items-center gap-3"
          aria-label="Empty state actions"
        >
          {action && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={action.icon}
              onClick={action.onClick}
              aria-label={action.label}
              data-empty-state-primary-action
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={secondaryAction.icon}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </Wrapper>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIALIZED EMPTY STATES
// ═══════════════════════════════════════════════════════════════════════════════

export const EmptySearch = ({
  query,
  onClear,
  className = '',
}) => (
  <EmptyState
    iconName="search"
    title="No results found"
    description={query ? `We couldn't find anything matching "${query}"` : 'Try adjusting your search terms'}
    action={onClear ? {
      label: 'Clear search',
      icon: Plus,
      onClick: onClear,
    } : undefined}
    variant="neutral"
    className={className}
  />
);

export const EmptyJobs = ({
  onCreate,
  className = '',
}) => (
  <EmptyState
    iconName="clipboard"
    title="No jobs yet"
    description="Get started by creating your first job. You can upload blueprints and get AI-powered estimates."
    action={onCreate ? {
      label: 'Create job',
      icon: Plus,
      onClick: onCreate,
    } : undefined}
    variant="default"
    className={className}
  />
);

export const EmptyUploads = ({
  onUpload,
  className = '',
}) => (
  <EmptyState
    iconName="upload"
    title="No files uploaded"
    description="Upload blueprints, plans, or documents to get started with AI analysis."
    action={onUpload ? {
      label: 'Upload files',
      icon: Upload,
      onClick: onUpload,
    } : undefined}
    variant="default"
    className={className}
  />
);

export const EmptyLeads = ({
  onFind,
  className = '',
}) => (
  <EmptyState
    iconName="building"
    title="No leads found"
    description="Discover new leads by searching for construction permits in your area."
    action={onFind ? {
      label: 'Find leads',
      icon: Search,
      onClick: onFind,
    } : undefined}
    variant="default"
    className={className}
  />
);

export const ErrorState = ({
  title = 'Something went wrong',
  description = 'We encountered an error while loading this content.',
  onRetry,
  className = '',
}) => (
  <EmptyState
    iconName="error"
    title={title}
    description={description}
    action={onRetry ? {
      label: 'Try again',
      icon: Plus,
      onClick: onRetry,
    } : undefined}
    variant="error"
    className={className}
  />
);

export const SuccessState = ({
  title = 'Success!',
  description,
  onContinue,
  className = '',
}) => (
  <EmptyState
    iconName="success"
    title={title}
    description={description}
    action={onContinue ? {
      label: 'Continue',
      icon: CheckCircle2,
      onClick: onContinue,
    } : undefined}
    variant="success"
    className={className}
  />
);

export const LoadingState = ({
  title = 'Loading...',
  description = 'Please wait while we fetch your data.',
  className = '',
}) => (
  <EmptyState
    iconName="sparkles"
    title={title}
    description={description}
    variant="default"
    className={className}
    animate={true}
  >
    <motion.div
      className="flex gap-1 mt-2"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
      <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
      <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
    </motion.div>
  </EmptyState>
);

// Legacy compatibility exports expected by older barrels/imports.
export const NoActiveJobsEmpty = EmptyJobs;
export const NoLeadsTodayEmpty = EmptyLeads;
export const NoInspectionsEmpty = EmptyState;
export const NoCanvasDocumentsEmpty = EmptyUploads;
export const NoAlertsEmpty = EmptyState;
export const NoSearchResultsEmpty = EmptySearch;
export const NoJobsEmptyState = EmptyJobs;
export const NoLeadsEmptyState = EmptyLeads;
export const NoDocumentsEmptyState = EmptyUploads;
export const NoSearchResultsEmptyState = EmptySearch;
export const NoCanvasNodesEmptyState = EmptyState;
export const NoProposalsEmptyState = EmptyState;
export const NoNotificationsEmptyState = EmptyState;
export const ErrorEmptyState = ErrorState;
export const NoPermitsEmptyState = EmptyState;
export const NoBlueprintsEmptyState = EmptyUploads;
export const NoHistoryEmptyState = EmptyState;

export default EmptyState;
