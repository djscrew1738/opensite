import { 
  AlertTriangle, RefreshCw, WifiOff, 
  ServerCrash, ArrowLeft, HelpCircle 
} from 'lucide-react';

/**
 * ErrorStates — Polished error handling components
 */

// Generic error state
export function ErrorState({ 
  title = 'Something went wrong', 
  subtitle = 'An unexpected error occurred',
  error,
  onRetry,
  onBack,
  className = '' 
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="relative mb-5">
        <div className="w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
          <span className="text-white text-xs font-semibold">!</span>
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-surface-800 dark:text-surface-200">
        {title}
      </h3>
      
      <p className="text-sm text-surface-500 dark:text-surface-500 mt-2 max-w-xs mx-auto">
        {subtitle}
      </p>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30 max-w-sm">
          <p className="text-xs text-red-600 dark:text-red-400 font-mono break-all">
            {error.message || error}
          </p>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
        {onRetry && (
          <button 
            onClick={onRetry} 
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        )}
        {onBack && (
          <button 
            onClick={onBack} 
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        )}
      </div>
    </div>
  );
}

// Network error state
export function NetworkErrorState({ 
  onRetry,
  className = '' 
}) {
  return (
    <ErrorState
      icon={WifiOff}
      title="Connection lost"
      subtitle="Unable to connect to the server. Please check your internet connection."
      onRetry={onRetry}
      className={className}
    />
  );
}

// Server error state
export function ServerErrorState({ 
  onRetry,
  className = '' 
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="w-20 h-20 rounded-3xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mb-5">
        <ServerCrash className="w-10 h-10 text-orange-500" />
      </div>
      
      <h3 className="text-xl font-bold text-surface-800 dark:text-surface-200">
        Server error
      </h3>
      
      <p className="text-sm text-surface-500 dark:text-surface-500 mt-2 max-w-xs mx-auto">
        Our servers are experiencing issues. We're working on it!
      </p>
      
      <div className="flex items-center gap-2 mt-4 text-xs text-surface-400">
        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
        Status: Degraded performance
      </div>
      
      {onRetry && (
        <button 
          onClick={onRetry} 
          className="btn-primary mt-6 inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
}

// Inline error for forms
export function InlineError({ 
  message, 
  onRetry,
  className = '' 
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 ${className}`}>
      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
      <p className="text-sm text-red-700 dark:text-red-300 flex-1">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      )}
    </div>
  );
}

// Warning banner
export function WarningBanner({ 
  message,
  onDismiss,
  action,
  actionLabel = 'Learn more'
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30">
      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-amber-800 dark:text-amber-200">{message}</p>
        {action && (
          <button 
            onClick={action}
            className="text-sm font-medium text-amber-700 dark:text-amber-300 hover:text-amber-800 mt-2 inline-flex items-center gap-1"
          >
            {actionLabel}
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-amber-400 hover:text-amber-600 flex-shrink-0"
        >
          ×
        </button>
      )}
    </div>
  );
}

// Not found state
export function NotFoundState({ 
  item = 'Page',
  onBack,
  className = '' 
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="w-24 h-24 rounded-3xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-5">
        <HelpCircle className="w-12 h-12 text-surface-400" />
      </div>
      
      <h3 className="text-2xl font-bold text-surface-800 dark:text-surface-200">
        {item} not found
      </h3>
      
      <p className="text-sm text-surface-500 dark:text-surface-500 mt-2 max-w-xs mx-auto">
        The {item.toLowerCase()} you're looking for doesn't exist or has been moved.
      </p>
      
      {onBack && (
        <button 
          onClick={onBack} 
          className="btn-primary mt-6 inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back
        </button>
      )}
    </div>
  );
}

export default ErrorState;
