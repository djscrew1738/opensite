import { memo, useEffect, useState, useMemo } from 'react';
import { 
  Loader2, 
  Upload, 
  FileSearch, 
  BrainCircuit, 
  Calculator, 
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import StepIndicator from './StepIndicator';
import { formatDuration } from './utils';

const STEPS = [
  { key: 'upload', label: 'Uploading', icon: Upload },
  { key: 'extract', label: 'Extracting Data', icon: FileSearch },
  { key: 'analyze', label: 'AI Analysis', icon: BrainCircuit },
  { key: 'calculate', label: 'Calculating', icon: Calculator },
  { key: 'complete', label: 'Complete', icon: CheckCircle2 },
];

/**
 * Determine current step based on progress percentage
 */
function getCurrentStep(progress) {
  if (progress < 20) return 0;
  if (progress < 40) return 1;
  if (progress < 70) return 2;
  if (progress < 90) return 3;
  return 4;
}

const UploadProgress = memo(function UploadProgress({
  progress = 0, 
  status = 'processing',
  error = null,
  fileName = '',
  estimatedTime = null,
  onCancel,
  showDetails = true
}) {
  const [elapsed, setElapsed] = useState(0);

  // Track elapsed time
  useEffect(() => {
    if (status === 'completed' || status === 'error') return;
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const currentStep = useMemo(() => getCurrentStep(progress), [progress]);

  // Error state
  if (status === 'error' && error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-red-900 dark:text-red-300 mb-1">Analysis Failed</h4>
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Completed state
  if (status === 'completed') {
    return (
      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-green-900 dark:text-green-300">Analysis Complete</h4>
            <p className="text-sm text-green-700 dark:text-green-400">
              {fileName && <span className="truncate">{fileName}</span>}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Processing state
  return (
    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-blue-900 dark:text-blue-300">
            {currentStep < 4 ? 'AI Analysis in Progress' : 'Finalizing...'}
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            {fileName && <span className="truncate block">{fileName}</span>}
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 mb-2">
          <span>{progress}%</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(elapsed)}
          </span>
        </div>
        <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      {showDetails && (
        <StepIndicator 
          steps={STEPS} 
          currentStep={currentStep}
          showLabels={true}
        />
      )}

      {/* Estimated time */}
      {estimatedTime && progress < 100 && (
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-4 text-center">
          Estimated time remaining: {formatDuration(estimatedTime - elapsed)}
        </p>
      )}
    </div>
  );
});

export default UploadProgress;
