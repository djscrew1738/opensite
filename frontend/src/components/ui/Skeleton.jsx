/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SKELETON COMPONENT v2.0 — UI/UX Overhaul
 * Beautiful loading states with shimmer effects
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { motion } from 'framer-motion';
import { easings, durations, staggerItem } from '../../design-system';

// ═══════════════════════════════════════════════════════════════════════════════
// BASE SKELETON
// ═══════════════════════════════════════════════════════════════════════════════

export const Skeleton = ({
  className = '',
  width,
  height,
  circle = false,
  animate = true,
}) => {
  const baseClasses = `
    relative overflow-hidden
    bg-[#161A22]
    ${circle ? 'rounded-full' : 'rounded-lg'}
  `;

  const style = {
    width: width || '100%',
    height: height || '1em',
  };

  return (
    <div
      className={`${baseClasses} ${className}`}
      style={style}
    >
      {animate && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.08) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
          animate={{
            backgroundPosition: ['200% 0', '-200% 0'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON TEXT
// ═══════════════════════════════════════════════════════════════════════════════

export const SkeletonText = ({
  lines = 3,
  className = '',
  lastLineWidth = '60%',
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: i * 0.05,
            duration: durations.normal,
            ease: easings.enterExpo,
          }}
        >
          <Skeleton
            height="1em"
            width={i === lines - 1 ? lastLineWidth : '100%'}
          />
        </motion.div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON CARD
// ═══════════════════════════════════════════════════════════════════════════════

export const SkeletonCard = ({
  hasHeader = true,
  hasMedia = false,
  lines = 2,
  hasFooter = true,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durations.medium, ease: easings.enterExpo }}
      className={`bg-[#111318] rounded-xl p-5 border border-transparent ${className}`}
    >
      {/* Media placeholder */}
      {hasMedia && (
        <Skeleton
          height="160px"
          className="rounded-lg mb-4"
        />
      )}

      {/* Header */}
      {hasHeader && (
        <div className="flex items-center gap-3 mb-4">
          <Skeleton circle width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton height="1em" width="60%" />
            <Skeleton height="0.75em" width="40%" />
          </div>
        </div>
      )}

      {/* Content */}
      <SkeletonText lines={lines} />

      {/* Footer */}
      {hasFooter && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#1F2430]">
          <Skeleton height="2em" width="80px" />
          <Skeleton height="2em" width="60px" />
        </div>
      )}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON STAT CARD
// ═══════════════════════════════════════════════════════════════════════════════

export const SkeletonStatCard = ({ className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: durations.medium, ease: easings.enterExpo }}
      className={`bg-[#111318] rounded-xl p-5 border border-transparent ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Skeleton height="0.75em" width="40%" />
      </div>
      <Skeleton height="2em" width="60%" className="mb-2" />
      <Skeleton height="1em" width="30%" />
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON LIST
// ═══════════════════════════════════════════════════════════════════════════════

export const SkeletonList = ({
  items = 5,
  hasIcon = true,
  hasAction = true,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: i * 0.05,
            duration: durations.normal,
            ease: easings.enterExpo,
          }}
          className="flex items-center gap-3 p-3 rounded-lg bg-[#111318]/50"
        >
          {hasIcon && (
            <Skeleton circle width={36} height={36} />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton height="0.875em" width="40%" />
            <Skeleton height="0.75em" width="60%" />
          </div>
          {hasAction && (
            <Skeleton height="2em" width="60px" />
          )}
        </motion.div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON TABLE
// ═══════════════════════════════════════════════════════════════════════════════

export const SkeletonTable = ({
  rows = 5,
  columns = 4,
  hasHeader = true,
  className = '',
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {/* Header */}
      {hasHeader && (
        <div className="flex gap-4 p-3 bg-[#161A22] rounded-lg">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} height="0.875em" className="flex-1" />
          ))}
        </div>
      )}

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <motion.div
          key={rowIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: rowIndex * 0.03,
            duration: durations.fast,
          }}
          className="flex gap-4 p-3 bg-[#111318]/30 rounded-lg"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              height="0.875em" 
              className="flex-1"
              width={colIndex === 0 ? '80%' : undefined}
            />
          ))}
        </motion.div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON GRID
// ═══════════════════════════════════════════════════════════════════════════════

export const SkeletonGrid = ({
  items = 6,
  columns = 3,
  className = '',
}) => {
  return (
    <div 
      className={`grid gap-4 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: items }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: i * 0.05,
            duration: durations.normal,
            ease: easings.enterExpo,
          }}
        >
          <SkeletonCard hasHeader={false} lines={1} hasFooter={false} />
        </motion.div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON AVATAR GROUP
// ═══════════════════════════════════════════════════════════════════════════════

export const SkeletonAvatarGroup = ({
  count = 3,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: i * 0.05,
            duration: durations.fast,
            ease: easings.spring,
          }}
        >
          <Skeleton 
            circle 
            className={`${sizeClasses[size]} ring-2 ring-[#0A0B0D]`}
          />
        </motion.div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PULSE LOADER
// ═══════════════════════════════════════════════════════════════════════════════

export const PulseLoader = ({
  size = 'default',
  color = '#3B82F6',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    default: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={i}
          className={`${sizeClasses[size]} rounded-full`}
          style={{ backgroundColor: color }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SHIMMER CARD (for featured content)
// ═══════════════════════════════════════════════════════════════════════════════

export const ShimmerCard = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden bg-[#111318] rounded-xl ${className}`}>
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.05) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['200% 0', '-200% 0'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Content placeholder */}
      <div className="p-5 space-y-4">
        <Skeleton height="180px" className="rounded-lg" />
        <Skeleton height="1.25em" width="70%" />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
};

export default Skeleton;
