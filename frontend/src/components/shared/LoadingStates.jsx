import { Loader2, Sparkles, HardHat } from 'lucide-react';

/**
 * LoadingStates — Polished loading components for consistent UX
 */

// Full page loading with shimmer
export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500/20 to-accent-600/10 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent-600 animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-2xl bg-accent-500/20 animate-pulse blur-xl" />
      </div>
      <p className="mt-6 text-sm font-medium text-surface-500 dark:text-surface-400">{message}</p>
    </div>
  );
}

// Card skeleton with shimmer
export function CardSkeleton({ count = 3, className = '' }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="card overflow-hidden"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="card-body space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
              <div className="flex-1 space-y-2">
                <div className="h-4 skeleton-shimmer rounded w-3/4" />
                <div className="h-3 skeleton-shimmer rounded w-1/2" />
              </div>
            </div>
            {/* Content */}
            <div className="space-y-2">
              <div className="h-3 skeleton-shimmer rounded w-full" />
              <div className="h-3 skeleton-shimmer rounded w-5/6" />
              <div className="h-3 skeleton-shimmer rounded w-4/6" />
            </div>
            {/* Footer */}
            <div className="pt-2 flex justify-between">
              <div className="h-8 skeleton-shimmer rounded w-20" />
              <div className="h-8 skeleton-shimmer rounded w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// List skeleton
export function ListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="card p-4 flex items-center gap-4"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <div className="w-10 h-10 rounded-xl skeleton-shimmer flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 skeleton-shimmer rounded w-1/3" />
            <div className="h-3 skeleton-shimmer rounded w-1/2" />
          </div>
          <div className="w-8 h-8 rounded-lg skeleton-shimmer flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="bg-surface-50 dark:bg-surface-800/50 p-4 border-b border-surface-200 dark:border-surface-700">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 skeleton-shimmer rounded flex-1" style={{ maxWidth: `${20 + (i % 3) * 5}%` }} />
          ))}
        </div>
      </div>
      {/* Rows */}
      <div className="divide-y divide-surface-200 dark:divide-surface-700">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="p-4 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <div 
                key={colIdx} 
                className="h-4 skeleton-shimmer rounded flex-1"
                style={{ 
                  maxWidth: `${15 + Math.random() * 20}%`,
                  animationDelay: `${rowIdx * 30 + colIdx * 10}ms`
                }} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Stat card skeleton
export function StatsSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 space-y-3" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="h-3 skeleton-shimmer rounded w-16" />
          <div className="h-8 skeleton-shimmer rounded w-24" />
          <div className="h-3 skeleton-shimmer rounded w-20" />
        </div>
      ))}
    </div>
  );
}

// Inline loading spinner
export function InlineLoader({ size = 'sm', className = '' }) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  
  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin text-accent-600 ${className}`} />
  );
}

// Content placeholder for async sections
export function ContentPlaceholder({ 
  icon: Icon, 
  title, 
  subtitle,
  action,
  className = '' 
}) {
  return (
    <div className={`card p-8 text-center ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-surface-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">
        {title}
      </h3>
      {subtitle && (
        <p className="text-sm text-surface-500 dark:text-surface-500 mt-1 max-w-sm mx-auto">
          {subtitle}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}

// AI thinking indicator
export function AIThinking({ message = 'AI is thinking...' }) {
  return (
    <div className="flex items-center gap-3 text-surface-500 dark:text-surface-400">
      <div className="relative">
        <Sparkles className="w-5 h-5 text-accent-500 animate-pulse" />
        <div className="absolute inset-0 bg-accent-500/30 rounded-full animate-ping" />
      </div>
      <span className="text-sm font-medium">{message}</span>
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

// StatCard skeleton — matches StatCard.jsx shape exactly
export function StatCardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="relative bg-surface-card rounded-2xl border border-border overflow-hidden"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {/* Slim left accent bar placeholder */}
          <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full skeleton-shimmer" />
          
          <div className="py-5 pl-[18px] pr-4">
            {/* Label + icon row */}
            <div className="flex items-center justify-between mb-4">
              <div className="h-2.5 skeleton-shimmer rounded w-16" />
              <div className="w-7 h-7 rounded-xl skeleton-shimmer flex-shrink-0" />
            </div>
            
            {/* Value — hero number */}
            <div className="h-9 skeleton-shimmer rounded w-20 mb-2.5" />
            
            {/* Subtext + trend row */}
            <div className="flex items-center justify-between gap-2">
              <div className="h-3 skeleton-shimmer rounded w-24" />
              <div className="h-3 skeleton-shimmer rounded w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// LeadCard skeleton — matches LeadCard.jsx shape exactly
export function LeadCardSkeleton({ count = 3 }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="relative overflow-hidden rounded-xl border border-border bg-surface-50 dark:bg-surface-800"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {/* Score gradient header placeholder */}
          <div className="h-1.5 w-full skeleton-shimmer" />
          
          <div className="p-4 space-y-4">
            {/* Header — name + company + score */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-5 skeleton-shimmer rounded w-3/4" />
                <div className="h-4 skeleton-shimmer rounded w-1/2" />
              </div>
              {/* Score display placeholder */}
              <div className="text-right shrink-0 space-y-1">
                <div className="h-8 skeleton-shimmer rounded w-12 ml-auto" />
                <div className="h-5 skeleton-shimmer rounded w-16 ml-auto" />
              </div>
            </div>

            {/* Contact Info — 3 rows */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md skeleton-shimmer flex-shrink-0" />
                <div className="h-4 skeleton-shimmer rounded flex-1" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md skeleton-shimmer flex-shrink-0" />
                <div className="h-4 skeleton-shimmer rounded w-32" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md skeleton-shimmer flex-shrink-0" />
                <div className="h-4 skeleton-shimmer rounded w-40" />
              </div>
            </div>

            {/* Project Info badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="h-6 skeleton-shimmer rounded w-24" />
              <div className="h-6 skeleton-shimmer rounded w-20" />
            </div>

            {/* Actions row */}
            <div className="flex items-center gap-2 pt-2 border-t border-surface-100 dark:border-surface-700">
              <div className="flex-1 h-8 skeleton-shimmer rounded" />
              <div className="w-10 h-8 skeleton-shimmer rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// JobCard skeleton — matches JobCard.jsx shape exactly
export function JobCardSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="relative overflow-hidden"
          style={{ 
            borderRadius: '12px',
            animationDelay: `${i * 25}ms`,
          }}
        >
          <div
            className="p-3.5 border border-border"
            style={{
              background: 'var(--surface-card)',
              borderRadius: '12px',
              boxShadow: 'inset 3px 0 0 var(--border-default)',
            }}
          >
            {/* Row 1: Builder badge + Job ID */}
            <div className="flex items-center justify-between mb-2">
              <div className="h-5 skeleton-shimmer rounded w-20" />
              <div className="h-4 skeleton-shimmer rounded w-16" />
            </div>

            {/* Row 2: Address */}
            <div className="h-5 skeleton-shimmer rounded w-full mb-3" />

            {/* Row 3: Phase track + phase name */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-2 skeleton-shimmer rounded-full" />
              <div className="h-4 skeleton-shimmer rounded w-20" />
              <div className="h-3 skeleton-shimmer rounded w-8" />
            </div>

            {/* Row 4: Action buttons */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-9 skeleton-shimmer rounded" />
              <div className="flex-1 h-9 skeleton-shimmer rounded" />
              <div className="flex-1 h-9 skeleton-shimmer rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Dashboard skeleton — matches JobPulseHome layout
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* ── 1. METRICS STRIP ─────────────────────── */}
      <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
        <div className="flex gap-3 w-max">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="snap-start flex-shrink-0 w-[140px] rounded-xl border border-border bg-surface-card p-3.5"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="w-8 h-8 rounded-lg skeleton-shimmer mb-2" />
              <div className="h-7 skeleton-shimmer rounded w-16 mb-1" />
              <div className="h-3 skeleton-shimmer rounded w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. TODAY'S FOCUS ──────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded skeleton-shimmer" />
          <div className="h-4 skeleton-shimmer rounded w-28" />
        </div>

        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-full flex items-center gap-3 rounded-lg border border-border bg-surface-card h-14 px-3"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="w-[3px] self-stretch rounded-full skeleton-shimmer flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="h-4 skeleton-shimmer rounded w-full" />
                <div className="h-3 skeleton-shimmer rounded w-2/3" />
              </div>
              <div className="h-4 skeleton-shimmer rounded w-20 flex-shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. PHASE TAB SWITCHER + JOB BOARD ─────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded skeleton-shimmer" />
          <div className="h-4 skeleton-shimmer rounded w-24" />
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 mb-4">
          <div className="flex gap-2 w-max">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="snap-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg skeleton-shimmer"
                style={{ 
                  width: i === 0 ? '60px' : '80px',
                  height: '32px',
                  animationDelay: `${i * 30}ms`
                }}
              />
            ))}
          </div>
        </div>

        {/* Job cards */}
        <JobCardSkeleton count={5} />
      </section>
    </div>
  );
}

// Generic shimmer block for flexible use
export function ShimmerBlock({ 
  width = '100%', 
  height = '1rem', 
  className = '',
  circle = false 
}) {
  return (
    <div
      className={`skeleton-shimmer ${circle ? 'rounded-full' : 'rounded'} ${className}`}
      style={{ width, height }}
    />
  );
}

export default PageLoader;
