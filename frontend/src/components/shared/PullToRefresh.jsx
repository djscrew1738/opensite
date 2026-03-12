import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * PullToRefresh indicator
 *
 * Renders above the scroll container's first child.
 * Wire via usePullToRefresh:
 *
 * @example
 * const ptr = usePullToRefresh(refresh);
 * <div ref={ptr.ref} className="overflow-y-auto">
 *   <PullToRefresh {...ptr} />
 *   {children}
 * </div>
 */
export function PullToRefresh({ pullDistance = 0, isRefreshing = false, progress = 0, isPulling = false }) {
  const visible = isRefreshing || isPulling;
  const translateY = isRefreshing ? 48 : Math.min(pullDistance, 60);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="ptr"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: translateY }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          className="flex items-center justify-center overflow-hidden"
          aria-live="polite"
          aria-label={isRefreshing ? 'Refreshing…' : 'Pull to refresh'}
        >
          <div className="relative w-8 h-8">
            {/* Track circle */}
            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16" cy="16" r="12"
                fill="none"
                stroke="rgba(59,130,246,0.15)"
                strokeWidth="2.5"
              />
              {/* Progress arc */}
              <motion.circle
                cx="16" cy="16" r="12"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 12}`}
                animate={{
                  strokeDashoffset: isRefreshing
                    ? [2 * Math.PI * 12 * 0.75, 0, 2 * Math.PI * 12 * 0.75]
                    : 2 * Math.PI * 12 * (1 - progress),
                  rotate: isRefreshing ? [0, 360] : undefined,
                }}
                transition={isRefreshing
                  ? { duration: 0.9, repeat: Infinity, ease: 'linear' }
                  : { duration: 0.05, ease: 'linear' }
                }
              />
            </svg>

            {/* Arrow / spinner icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isRefreshing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                >
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 16 16">
                    <path
                      d="M8 2v3M8 11v3M2 8h3M11 8h3"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                    />
                  </svg>
                </motion.div>
              ) : (
                <motion.svg
                  className="w-3 h-3 text-blue-400"
                  fill="none" viewBox="0 0 12 12"
                  animate={{ y: progress >= 1 ? -1 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <path
                    d="M6 2v8M3 7l3 3 3-3"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  />
                </motion.svg>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PullToRefresh;
