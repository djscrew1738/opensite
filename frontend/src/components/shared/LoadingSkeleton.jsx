import { motion } from 'framer-motion';

/**
 * LoadingSkeleton — Animated skeleton loaders for better perceived performance
 * Follows Dark Forge design system with shimmer effect
 */

const shimmerVariants = {
  animate: {
    x: ['-100%', '100%'],
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'linear'
    }
  }
};

function SkeletonBase({ className = '', animate = true }) {
  return (
    <div className={`relative overflow-hidden bg-surface-200 dark:bg-surface-800 rounded ${className}`}>
      {animate && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-surface-100/50 dark:via-surface-700/50 to-transparent"
          variants={shimmerVariants}
          animate="animate"
        />
      )}
    </div>
  );
}

/**
 * Text skeleton — For headings, paragraphs, labels
 */
export function TextSkeleton({ 
  lines = 1, 
  width = '100%',
  lineHeight = 'h-4',
  gap = 'gap-2',
  className = ''
}) {
  return (
    <div className={`flex flex-col ${gap} ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <SkeletonBase
          key={i}
          className={`${lineHeight} ${typeof width === 'string' ? width : width[i] || 'w-full'}`}
          style={{ width: typeof width === 'string' ? width : undefined }}
        />
      ))}
    </div>
  );
}

/**
 * Card skeleton — For content cards
 */
export function CardSkeleton({ 
  hasImage = false,
  imageHeight = 'h-48',
  lines = 3,
  className = ''
}) {
  return (
    <div className={`card p-0 overflow-hidden ${className}`}>
      {hasImage && (
        <SkeletonBase className={`w-full ${imageHeight} rounded-none`} />
      )}
      <div className="p-4 space-y-3">
        <SkeletonBase className="h-5 w-3/4" />
        <div className="space-y-2">
          {[...Array(lines)].map((_, i) => (
            <SkeletonBase 
              key={i} 
              className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Table skeleton — For data tables
 */
export function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  showHeader = true,
  className = ''
}) {
  return (
    <div className={`rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden ${className}`}>
      {showHeader && (
        <div className="bg-surface-100 dark:bg-surface-800 px-4 py-3 border-b border-surface-200 dark:border-surface-700">
          <div className="flex gap-4">
            {[...Array(columns)].map((_, i) => (
              <SkeletonBase key={i} className="h-4 flex-1" />
            ))}
          </div>
        </div>
      )}
      <div className="divide-y divide-surface-200 dark:divide-surface-700">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="px-4 py-4 flex gap-4 items-center">
            {[...Array(columns)].map((_, colIndex) => (
              <SkeletonBase 
                key={colIndex} 
                className={`h-4 ${colIndex === 0 ? 'flex-1' : 'w-24'}`} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Stats skeleton — For dashboard stats cards
 */
export function StatsSkeleton({ count = 4, className = '' }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="card p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <SkeletonBase className="h-4 w-24" />
              <SkeletonBase className="h-8 w-20" />
            </div>
            <SkeletonBase className="w-10 h-10 rounded-xl" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <SkeletonBase className="h-3 w-12" />
            <SkeletonBase className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * List skeleton — For list items
 */
export function ListSkeleton({ 
  items = 5,
  avatar = false,
  actions = false,
  className = ''
}) {
  return (
    <div className={`divide-y divide-surface-200 dark:divide-surface-700 ${className}`}>
      {[...Array(items)].map((_, i) => (
        <div key={i} className="py-4 flex items-center gap-4">
          {avatar && (
            <SkeletonBase className="w-10 h-10 rounded-full flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0 space-y-2">
            <SkeletonBase className="h-4 w-1/3" />
            <SkeletonBase className="h-3 w-1/2" />
          </div>
          {actions && (
            <SkeletonBase className="h-8 w-20 rounded-lg" />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Form skeleton — For form loading states
 */
export function FormSkeleton({ 
  fields = 4,
  hasSubmit = true,
  className = ''
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {[...Array(fields)].map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonBase className="h-4 w-24" />
          <SkeletonBase className="h-10 w-full" />
        </div>
      ))}
      {hasSubmit && (
        <div className="pt-4">
          <SkeletonBase className="h-11 w-32" />
        </div>
      )}
    </div>
  );
}

/**
 * Page skeleton — Full page loading state
 */
export function PageSkeleton({ className = '' }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBase className="h-8 w-48" />
          <SkeletonBase className="h-4 w-64" />
        </div>
        <SkeletonBase className="h-10 w-32 rounded-lg" />
      </div>
      
      {/* Stats */}
      <StatsSkeleton count={4} />
      
      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TableSkeleton rows={5} />
        </div>
        <div>
          <CardSkeleton hasImage lines={4} />
        </div>
      </div>
    </div>
  );
}

/**
 * Image skeleton — For image loading placeholders
 */
export function ImageSkeleton({ 
  aspectRatio = 'aspect-video',
  rounded = 'rounded-xl',
  className = ''
}) {
  return (
    <div className={`relative ${aspectRatio} ${rounded} overflow-hidden bg-surface-200 dark:bg-surface-800 ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-surface-100/30 dark:via-surface-700/30 to-transparent"
        animate={{
          x: ['-100%', '100%'],
          transition: {
            repeat: Infinity,
            duration: 1.5,
            ease: 'linear'
          }
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <svg className="w-10 h-10 text-surface-300 dark:text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    </div>
  );
}

export default {
  Text: TextSkeleton,
  Card: CardSkeleton,
  Table: TableSkeleton,
  Stats: StatsSkeleton,
  List: ListSkeleton,
  Form: FormSkeleton,
  Page: PageSkeleton,
  Image: ImageSkeleton
};
