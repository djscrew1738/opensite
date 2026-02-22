import { useEffect, useRef, useCallback, useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Loader2, 
  X,
  Bell
} from 'lucide-react';
import { ToastType } from '../../hooks/useToast';

// Icon mapping for each toast type
const toastIcons = {
  [ToastType.SUCCESS]: CheckCircle,
  [ToastType.ERROR]: XCircle,
  [ToastType.WARNING]: AlertTriangle,
  [ToastType.INFO]: Info,
  [ToastType.LOADING]: Loader2,
};

// Color schemes for each toast type — Dark Forge
const toastStyles = {
  [ToastType.SUCCESS]: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/90',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-800 dark:text-emerald-200',
    icon: 'text-emerald-500 dark:text-emerald-400',
    progress: 'bg-emerald-500',
    shadow: 'shadow-emerald-500/20',
  },
  [ToastType.ERROR]: {
    bg: 'bg-red-50 dark:bg-red-950/90',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: 'text-red-500 dark:text-red-400',
    progress: 'bg-red-500',
    shadow: 'shadow-red-500/20',
  },
  [ToastType.WARNING]: {
    bg: 'bg-amber-50 dark:bg-amber-950/90',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-200',
    icon: 'text-amber-500 dark:text-amber-400',
    progress: 'bg-amber-500',
    shadow: 'shadow-amber-500/20',
  },
  [ToastType.INFO]: {
    bg: 'bg-blue-50 dark:bg-blue-950/90',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: 'text-blue-500 dark:text-blue-400',
    progress: 'bg-blue-500',
    shadow: 'shadow-blue-500/20',
  },
  [ToastType.LOADING]: {
    bg: 'bg-gray-50 dark:bg-gray-900/90',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-800 dark:text-gray-200',
    icon: 'text-blue-500 dark:text-blue-400',
    progress: 'bg-blue-500',
    shadow: 'shadow-blue-500/20',
  },
};

// Individual Toast Component
export function Toast({
  toast,
  onDismiss,
  onPause,
  onResume,
  index,
  total,
  isMobile,
}) {
  const { 
    id, 
    message, 
    type, 
    duration, 
    dismissible, 
    pauseOnHover,
    paused,
    dismissing,
  } = toast;

  const [progress, setProgress] = useState(100);
  const progressRef = useRef(100);
  const animationRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const pausedTimeRef = useRef(0);
  const toastRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const styles = toastStyles[type];
  const Icon = toastIcons[type];

  // Calculate position styles for stacking
  const getPositionStyles = () => {
    if (isMobile) {
      // Mobile: Stack from top with slight overlap
      const offset = index * 8;
      const scale = 1 - (total - index - 1) * 0.03;
      return {
        transform: `translateY(${offset}px) scale(${Math.max(scale, 0.9)}) translateX(${swipeOffset}px)`,
        zIndex: total - index,
        opacity: dismissing ? 0 : 1 - (total - index - 1) * 0.15,
      };
    }
    // Desktop: Stack from bottom-right
    const offset = index * 12;
    return {
      transform: `translateY(-${offset}px) translateX(${swipeOffset}px)`,
      zIndex: total - index,
    };
  };

  // Progress bar animation
  useEffect(() => {
    if (type === ToastType.LOADING || duration <= 0 || paused) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current - pausedTimeRef.current;
      const remaining = Math.max(0, duration - elapsed);
      const newProgress = (remaining / duration) * 100;

      if (newProgress !== progressRef.current) {
        progressRef.current = newProgress;
        setProgress(newProgress);
      }

      if (remaining > 0) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [duration, type, paused]);

  // Handle pause/resume tracking
  useEffect(() => {
    if (paused) {
      pausedTimeRef.current += Date.now() - (toast.pausedAt || Date.now());
    }
  }, [paused, toast.pausedAt]);

  // Touch handlers for swipe-to-dismiss (mobile)
  const handleTouchStart = useCallback((e) => {
    if (!isMobile) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(true);
  }, [isMobile]);

  const handleTouchMove = useCallback((e) => {
    if (!isMobile || !isSwiping) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - touchStartX.current;
    const deltaY = touchY - touchStartY.current;

    // Only handle horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
      setSwipeOffset(deltaX);
    }
  }, [isMobile, isSwiping]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile) return;
    setIsSwiping(false);

    // Dismiss if swiped far enough
    if (Math.abs(swipeOffset) > 100) {
      onDismiss();
    } else {
      // Spring back
      setSwipeOffset(0);
    }
  }, [isMobile, swipeOffset, onDismiss]);

  // Mouse handlers for desktop
  const handleMouseEnter = () => {
    if (!isMobile && pauseOnHover) {
      onPause();
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile && pauseOnHover) {
      onResume();
    }
  };

  // Handle dismiss button click
  const handleDismissClick = (e) => {
    e.stopPropagation();
    onDismiss();
  };

  // Vibration for mobile (haptic feedback)
  useEffect(() => {
    if (isMobile && navigator.vibrate && type !== ToastType.LOADING) {
      // Light vibration pattern for notifications
      navigator.vibrate(type === ToastType.ERROR ? [50, 100, 50] : 50);
    }
  }, [isMobile, type]);

  return (
    <div
      ref={toastRef}
      role="alert"
      aria-live={type === ToastType.ERROR ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={`
        relative flex items-start gap-3 
        px-4 py-3.5 
        rounded-xl 
        border 
        shadow-lg backdrop-blur-md
        ${styles.bg} ${styles.border} ${styles.shadow}
        transition-all duration-300 ease-out
        ${dismissing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
        ${isMobile ? 'w-full max-w-[calc(100vw-2rem)] mx-4' : 'w-[380px] max-w-[90vw]'}
        ${isSwiping ? 'transition-none' : ''}
        cursor-pointer
        select-none
        touch-pan-y
      `}
      style={getPositionStyles()}
      onClick={() => dismissible && onDismiss()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 mt-0.5 ${styles.icon}`}>
        <Icon 
          className={`w-5 h-5 ${type === ToastType.LOADING ? 'animate-spin' : ''}`} 
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 pr-2 ${styles.text}`}>
        <p className="text-sm font-medium leading-relaxed break-words">
          {message}
        </p>
      </div>

      {/* Close button */}
      {dismissible && (
        <button
          onClick={handleDismissClick}
          className={`
            flex-shrink-0 -mr-1 -mt-1 p-1.5 rounded-lg
            opacity-60 hover:opacity-100
            transition-opacity
            ${styles.text}
            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500
          `}
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Progress bar */}
      {duration > 0 && type !== ToastType.LOADING && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-xl"
          aria-hidden="true"
        >
          <div
            className={`h-full ${styles.progress} transition-all duration-100 ease-linear`}
            style={{ 
              width: `${progress}%`,
              opacity: paused ? 0.5 : 1,
            }}
          />
        </div>
      )}

      {/* Loading spinner for loading state */}
      {type === ToastType.LOADING && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-xl"
          aria-hidden="true"
        >
          <div 
            className={`h-full ${styles.progress} animate-loading-bar`}
            style={{ width: '30%' }}
          />
        </div>
      )}
    </div>
  );
}

// Toast Container Component
export function ToastContainer() {
  const { toasts, dismissToast, pauseToast, resumeToast, isMobile } = useToast();

  if (toasts.length === 0) return null;

  // Mobile: Center at top with padding
  // Desktop: Fixed at bottom-right
  const containerClasses = isMobile
    ? 'fixed top-0 left-0 right-0 z-[9999] flex flex-col items-center pt-4 px-2 pointer-events-none'
    : 'fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none';

  return (
    <div 
      className={containerClasses}
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast, index) => (
        <div 
          key={toast.id} 
          className="pointer-events-auto"
          style={{ 
            marginBottom: isMobile ? '8px' : '0',
          }}
        >
          <Toast
            toast={toast}
            index={index}
            total={toasts.length}
            isMobile={isMobile}
            onDismiss={() => dismissToast(toast.id)}
            onPause={() => pauseToast(toast.id)}
            onResume={() => resumeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

// Re-export for convenience
import { useToast } from '../../hooks/useToast';
export { useToast };

export default Toast;
