import { AlertCircle, FileWarning, X } from 'lucide-react';
import { getErrorDetails } from './utils/errorUtils';

/**
 * ErrorDisplay Component
 * Displays upload errors with suggestions
 * 
 * @param {Object} props
 * @param {Object} props.error - Error object with type, details, isWarning
 * @param {Function} props.onDismiss - Called when user dismisses error
 * @param {string} props.className - Additional classes
 */
export default function ErrorDisplay({ error, onDismiss, className = '' }) {
  if (!error) return null;

  const isWarning = error.isWarning;
  const errorInfo = getErrorDetails(error.type, error.details || {});

  const containerClasses = `
    flex items-start gap-3 p-4 rounded-lg mb-3 animate-in slide-in-from-top-2
    ${isWarning 
      ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800' 
      : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'
    }
    ${className}
  `;

  const iconColor = isWarning ? 'text-amber-600' : 'text-red-600';
  const titleColor = isWarning 
    ? 'text-amber-900 dark:text-amber-300' 
    : 'text-red-900 dark:text-red-300';
  const messageColor = isWarning 
    ? 'text-amber-700 dark:text-amber-400' 
    : 'text-red-700 dark:text-red-400';
  const suggestionColor = isWarning 
    ? 'text-amber-800 dark:text-amber-300' 
    : 'text-red-800 dark:text-red-300';
  const listColor = isWarning 
    ? 'text-amber-700 dark:text-amber-400' 
    : 'text-red-700 dark:text-red-400';

  return (
    <div className={containerClasses}>
      {isWarning ? (
        <FileWarning className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
      ) : (
        <AlertCircle className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
      )}
      
      <div className="flex-1 min-w-0">
        <h4 className={`font-medium text-sm ${titleColor}`}>
          {errorInfo.title}
        </h4>
        <p className={`text-sm mt-0.5 ${messageColor}`}>
          {errorInfo.message}
        </p>
        
        {errorInfo.suggestions?.length > 0 && (
          <div className="mt-2">
            <p className={`text-xs font-medium ${suggestionColor}`}>
              Suggestions:
            </p>
            <ul className={`text-xs mt-1 space-y-0.5 ${listColor}`}>
              {errorInfo.suggestions.map((suggestion, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="mt-0.5">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {!isWarning && onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 flex-shrink-0"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Compact error display for inline use
 */
export function CompactErrorDisplay({ error, onDismiss }) {
  if (!error) return null;

  const errorInfo = getErrorDetails(error.type, error.details || {});
  const isWarning = error.isWarning;

  return (
    <div 
      className={`
        flex items-start gap-2 px-3 py-2.5 rounded-lg
        ${isWarning 
          ? 'bg-amber-500/10 border border-amber-500/20' 
          : 'bg-red-500/10 border border-red-500/20'
        }
      `}
    >
      <AlertCircle 
        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isWarning ? 'text-amber-500' : 'text-red-500'}`} 
      />
      <p className={`text-xs flex-1 leading-relaxed ${isWarning ? 'text-amber-400' : 'text-red-400'}`}>
        {errorInfo.message}
      </p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`flex-shrink-0 p-0.5 rounded hover:opacity-80 transition-opacity ${isWarning ? 'text-amber-500' : 'text-red-500'}`}
          aria-label="Dismiss error"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
