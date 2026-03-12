/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TOAST COMPONENT — UI/UX Overhaul
 * Beautiful notifications with smooth animations
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from 'react';
import { useIsTouchDevice } from '../../hooks/useBreakpoint';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X,
  Loader2
} from 'lucide-react';
import { cx } from '../../design-system';

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST ITEM
// ═══════════════════════════════════════════════════════════════════════════════

const ToastItem = ({ 
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  onDismiss,
  action,
}) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-dismiss with progress bar
  useEffect(() => {
    if (duration === Infinity || isPaused) return;

    const startTime = Date.now();
    const endTime = startTime + duration;

    const updateProgress = () => {
      const now = Date.now();
      const remaining = endTime - now;
      const newProgress = Math.max(0, (remaining / duration) * 100);
      
      setProgress(newProgress);

      if (newProgress > 0) {
        requestAnimationFrame(updateProgress);
      } else {
        onDismiss(id);
      }
    };

    const animationFrame = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrame);
  }, [id, duration, isPaused, onDismiss]);

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    loading: Loader2,
  };

  const Icon = icons[type];

  const styles = {
    success: {
      borderLeft: '3px solid #10B981',
      background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(17, 19, 24, 0.95) 100%)',
    },
    error: {
      borderLeft: '3px solid #EF4444',
      background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.1) 0%, rgba(17, 19, 24, 0.95) 100%)',
    },
    warning: {
      borderLeft: '3px solid #F59E0B',
      background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.1) 0%, rgba(17, 19, 24, 0.95) 100%)',
    },
    info: {
      borderLeft: '3px solid #3B82F6',
      background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, rgba(17, 19, 24, 0.95) 100%)',
    },
    loading: {
      borderLeft: '3px solid #3B82F6',
      background: 'rgba(17, 19, 24, 0.95)',
    },
  };

  const iconColors = {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    loading: '#3B82F6',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ 
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      className={cx(
        'relative w-full max-w-sm rounded-xl overflow-hidden',
        'border border-[#2D3548]',
        'shadow-[0_10px_40px_rgba(0,0,0,0.5)]'
      )}
      style={styles[type]}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <Icon 
            className={cx(
              'w-5 h-5',
              type === 'loading' && 'animate-spin'
            )}
            style={{ color: iconColors[type] }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold text-[#F8FAFC] text-sm">
              {title}
            </h4>
          )}
          {message && (
            <p className={cx(
              'text-sm text-[#CBD5E1] mt-0.5',
              title && 'mt-1'
            )}>
              {message}
            </p>
          )}
          
          {/* Action button */}
          {action && (
            <button
              onClick={() => {
                action.onClick();
                onDismiss(id);
              }}
              className="mt-2 text-sm font-medium text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => onDismiss(id)}
          className="flex-shrink-0 p-1 rounded-lg text-[#64748B] hover:text-[#F8FAFC] hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      {duration !== Infinity && type !== 'loading' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgba(255,255,255,0.1)]">
          <motion.div
            className="h-full"
            style={{ 
              backgroundColor: iconColors[type],
              width: `${progress}%`,
            }}
            initial={{ width: '100%' }}
          />
        </div>
      )}

      {/* Loading indeterminate progress */}
      {type === 'loading' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden">
          <motion.div
            className="h-full bg-[#3B82F6]"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ width: '40%' }}
          />
        </div>
      )}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST CONTAINER
// ═══════════════════════════════════════════════════════════════════════════════

export const ToastContainer = ({
  toasts = [],
  onDismiss,
  position = 'bottom-right',
}) => {
  const isTouch = useIsTouchDevice();

  // On mobile/touch: always use bottom-center, raised above tab bar (80px)
  const resolvedPosition = isTouch ? 'bottom-center' : position;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  // Mobile: raise above tab bar (≈80px) + safe-area
  const mobileOffset = isTouch
    ? { bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', left: '50%', transform: 'translateX(-50%)' }
    : undefined;

  return (
    <div
      className={cx(
        'fixed z-[60] flex flex-col gap-2 pointer-events-none',
        !isTouch && positionClasses[resolvedPosition],
        isTouch && 'w-[calc(100%-2rem)]',
      )}
      style={{ maxWidth: isTouch ? 420 : undefined, ...mobileOffset }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem
              {...toast}
              onDismiss={onDismiss}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST PROVIDER HOOK
// ═══════════════════════════════════════════════════════════════════════════════

let toastListeners = [];
let toastId = 0;

const notify = (type, options) => {
  const id = ++toastId;
  const toast = {
    id,
    type,
    ...options,
  };
  
  toastListeners.forEach(listener => listener(toast));
  return id;
};

export const toast = {
  success: (message, options = {}) => notify('success', { message, ...options }),
  error: (message, options = {}) => notify('error', { message, ...options }),
  warning: (message, options = {}) => notify('warning', { message, ...options }),
  info: (message, options = {}) => notify('info', { message, ...options }),
  loading: (message, options = {}) => notify('loading', { message, duration: Infinity, ...options }),
  promise: async (promise, messages, options = {}) => {
    const id = notify('loading', { message: messages.loading, ...options });
    
    try {
      const result = await promise;
      toastListeners.forEach(listener => listener({
        id,
        type: 'success',
        message: messages.success,
        ...options,
      }));
      return result;
    } catch (error) {
      toastListeners.forEach(listener => listener({
        id,
        type: 'error',
        message: messages.error || error.message,
        ...options,
      }));
      throw error;
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// USE TOAST HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export const useToast = () => {
  const [toasts, setToasts] = React.useState([]);

  React.useEffect(() => {
    const handleToast = (newToast) => {
      setToasts(prev => {
        // Update existing toast or add new
        const exists = prev.find(t => t.id === newToast.id);
        if (exists) {
          return prev.map(t => t.id === newToast.id ? { ...t, ...newToast } : t);
        }
        return [...prev, newToast];
      });
    };

    toastListeners.push(handleToast);
    return () => {
      toastListeners = toastListeners.filter(l => l !== handleToast);
    };
  }, []);

  const dismiss = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const dismissAll = () => {
    setToasts([]);
  };

  return {
    toasts,
    dismiss,
    dismissAll,
    toast: {
      success: toast.success,
      error: toast.error,
      warning: toast.warning,
      info: toast.info,
      loading: toast.loading,
      promise: toast.promise,
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST PROVIDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const ToastProvider = ({ children, position = 'bottom-right' }) => {
  const { toasts, dismiss } = useToast();

  return (
    <>
      {children}
      <ToastContainer 
        toasts={toasts} 
        onDismiss={dismiss}
        position={position}
      />
    </>
  );
};

export default ToastProvider;
