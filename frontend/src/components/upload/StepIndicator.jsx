import { CheckCircle2, Loader2 } from 'lucide-react';

/**
 * StepIndicator Component
 * Displays a multi-step progress indicator
 * 
 * @param {Object} props
 * @param {Array} props.steps - Array of { key, label, icon } objects
 * @param {number} props.currentStep - Current step index (0-based)
 * @param {boolean} props.showLabels - Whether to show step labels
 */
export default function StepIndicator({ steps, currentStep, showLabels = true }) {
  return (
    <div className="space-y-2">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isPending = index > currentStep;

        return (
          <div 
            key={step.key}
            className={`
              flex items-center gap-3 p-2 rounded-lg transition-colors
              ${isActive ? 'bg-blue-100/50 dark:bg-blue-900/30' : ''}
              ${isCompleted ? 'opacity-60' : ''}
              ${isPending ? 'opacity-40' : ''}
            `}
          >
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
              ${isCompleted 
                ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400' 
                : isActive 
                  ? 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-blue-100/50 dark:bg-blue-900/20 text-blue-400 dark:text-blue-600'
              }
            `}>
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
              )}
            </div>
            
            {showLabels && (
              <span className={`
                text-sm font-medium
                ${isActive 
                  ? 'text-blue-900 dark:text-blue-200' 
                  : 'text-blue-700 dark:text-blue-400'
                }
              `}>
                {step.label}
              </span>
            )}
            
            {isActive && (
              <Loader2 className="w-3 h-3 text-blue-600 dark:text-blue-400 animate-spin ml-auto" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Horizontal step indicator variant
 */
export function HorizontalStepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.key} className={`flex items-center ${!isLast ? 'flex-1' : ''}`}>
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${isCompleted 
                ? 'bg-green-500 text-white' 
                : isActive 
                  ? 'bg-blue-500 text-white'
                  : 'bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400'
              }
            `}>
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            {!isLast && (
              <div className={`
                flex-1 h-0.5 mx-2
                ${isCompleted ? 'bg-green-500' : 'bg-surface-200 dark:bg-surface-700'}
              `} />
            )}
          </div>
        );
      })}
    </div>
  );
}
