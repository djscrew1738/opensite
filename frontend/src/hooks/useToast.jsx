import { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react';

// Toast types with their styles and icons
export const ToastType = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  LOADING: 'loading',
};

// Default toast configuration
const DEFAULT_CONFIG = {
  duration: 4000,
  position: 'bottom-right',
  dismissible: true,
  pauseOnHover: true,
  pauseOnFocusLoss: true,
};

// Mobile-specific configuration
const MOBILE_CONFIG = {
  duration: 5000,
  position: 'top-center',
  dismissible: true,
  pauseOnHover: false, // Less useful on touch devices
  pauseOnFocusLoss: true,
};

// Create context
const ToastContext = createContext(null);

// Generate unique ID for each toast
let toastIdCounter = 0;
const generateId = () => `toast-${++toastIdCounter}-${Date.now()}`;

// Detect mobile device
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
};

// Detect touch device
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());
  const [mobile, setMobile] = useState(false);
  const [touch, setTouch] = useState(false);

  // Detect device capabilities on mount
  useEffect(() => {
    setMobile(isMobile());
    setTouch(isTouchDevice());

    const handleResize = () => setMobile(isMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const dismissToast = useCallback((id) => {
    clearToastTimer(id);
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (!toast) return prev;
      
      // Mark toast as dismissing for exit animation
      return prev.map((t) => 
        t.id === id ? { ...t, dismissing: true } : t
      );
    });

    // Remove from DOM after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, [clearToastTimer]);

  // Set timer for a specific toast
  const setToastTimer = useCallback((id, duration) => {
    clearToastTimer(id);
    const timer = setTimeout(() => {
      dismissToast(id);
    }, duration);
    timersRef.current.set(id, timer);
  }, [clearToastTimer, dismissToast]);

  // Add a new toast
  const addToast = useCallback((message, options = {}) => {
    const deviceConfig = mobile ? MOBILE_CONFIG : DEFAULT_CONFIG;
    const config = { ...deviceConfig, ...options };
    
    const id = generateId();
    const newToast = {
      id,
      message,
      type: options.type || ToastType.INFO,
      duration: config.duration,
      position: config.position,
      dismissible: config.dismissible,
      pauseOnHover: config.pauseOnHover,
      pauseOnFocusLoss: config.pauseOnFocusLoss,
      createdAt: Date.now(),
      progress: 100,
      paused: false,
    };

    setToasts((prev) => {
      // Limit max toasts to prevent overflow
      const maxToasts = mobile ? 3 : 5;
      const filtered = prev.length >= maxToasts ? prev.slice(1) : prev;
      return [...filtered, newToast];
    });

    // Set auto-dismiss timer if duration > 0
    if (config.duration > 0) {
      setToastTimer(id, config.duration);
    }

    return id;
  }, [mobile, setToastTimer]);
  
  // Dismiss all toasts
  const dismissAll = useCallback(() => {
    timersRef.current.forEach((timer, id) => {
      clearTimeout(timer);
    });
    timersRef.current.clear();
    setToasts([]);
  }, []);

  // Update toast message or options
  const updateToast = useCallback((id, updates) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  // Pause toast timer (on hover/focus loss)
  const pauseToast = useCallback((id) => {
    const toast = toasts.find((t) => t.id === id);
    if (!toast || !toast.pauseOnHover || toast.paused) return;

    clearToastTimer(id);
    updateToast(id, { paused: true, pausedAt: Date.now() });
  }, [toasts, clearToastTimer, updateToast]);

  // Resume toast timer
  const resumeToast = useCallback((id) => {
    const toast = toasts.find((t) => t.id === id);
    if (!toast || !toast.paused) return;

    const remainingTime = toast.duration - (toast.pausedAt - toast.createdAt);
    updateToast(id, { paused: false, pausedAt: null });
    
    if (remainingTime > 0) {
      setToastTimer(id, remainingTime);
    } else {
      dismissToast(id);
    }
  }, [toasts, updateToast, setToastTimer, dismissToast]);

  // Convenience methods for different toast types
  const success = useCallback((message, options) => 
    addToast(message, { ...options, type: ToastType.SUCCESS }),
    [addToast]
  );

  const error = useCallback((message, options) => 
    addToast(message, { ...options, type: ToastType.ERROR, duration: 6000 }),
    [addToast]
  );

  const warning = useCallback((message, options) => 
    addToast(message, { ...options, type: ToastType.WARNING }),
    [addToast]
  );

  const info = useCallback((message, options) => 
    addToast(message, { ...options, type: ToastType.INFO }),
    [addToast]
  );

  const loading = useCallback((message, options) => 
    addToast(message, { ...options, type: ToastType.LOADING, duration: 0 }),
    [addToast]
  );

  // Promise-based toast for async operations
  const promise = useCallback(async (promise, messages, options = {}) => {
    const { loading: loadingMsg, success: successMsg, error: errorMsg } = messages;
    
    const id = addToast(loadingMsg, { type: ToastType.LOADING, duration: 0, ...options });
    
    try {
      const result = await promise;
      updateToast(id, { 
        message: typeof successMsg === 'function' ? successMsg(result) : successMsg, 
        type: ToastType.SUCCESS,
        duration: DEFAULT_CONFIG.duration 
      });
      setToastTimer(id, DEFAULT_CONFIG.duration);
      return result;
    } catch (err) {
      updateToast(id, { 
        message: typeof errorMsg === 'function' ? errorMsg(err) : errorMsg || err.message, 
        type: ToastType.ERROR,
        duration: 6000 
      });
      setToastTimer(id, 6000);
      throw err;
    }
  }, [addToast, updateToast, setToastTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const value = {
    toasts,
    addToast,
    dismissToast,
    dismissAll,
    updateToast,
    pauseToast,
    resumeToast,
    success,
    error,
    warning,
    info,
    loading,
    promise,
    isMobile: mobile,
    isTouch: touch,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

// Custom hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default useToast;
