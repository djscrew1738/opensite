import { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Save, Brain, FileDown, Loader, RotateCcw } from 'lucide-react';
import { ModelSelector } from '../ai/ModelSelector';

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Individual action button with loading state support
 */
const ActionButton = memo(function ActionButton({
  onClick,
  disabled,
  isLoading,
  loadingText,
  children,
  variant = 'primary',
  icon: Icon,
  ariaLabel,
}) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-800';
  
  const variantClasses = {
    primary: 'bg-accent-600 hover:bg-accent-500 text-white focus:ring-accent-500',
    secondary: 'bg-surface-700 hover:bg-surface-600 text-surface-100 border border-surface-600 focus:ring-surface-500',
    danger: 'bg-danger-600 hover:bg-danger-500 text-white focus:ring-danger-500',
    ghost: 'bg-transparent hover:bg-surface-700 text-surface-400 hover:text-surface-200',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {isLoading ? (
        <Loader className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon className="w-4 h-4" aria-hidden="true" />
      )}
      {isLoading ? loadingText : children}
    </button>
  );
});

/**
 * Model selector wrapper with label
 */
const ModelSelectorWrapper = memo(function ModelSelectorWrapper({ 
  selectedModel, 
  onModelChange 
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <label 
        htmlFor="ai-model-selector"
        className="text-xs font-medium text-surface-600 dark:text-surface-400 whitespace-nowrap"
      >
        AI Model:
      </label>
      <div className="w-36 sm:w-40 md:w-48">
        <ModelSelector
          id="ai-model-selector"
          value={selectedModel}
          onChange={onModelChange}
          showPerformance={false}
          size="sm"
          className="w-full"
        />
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * PlansActionBar - Action buttons for Plans/Estimate page
 * 
 * Provides:
 * - Save Estimate button
 * - AI Analysis button
 * - Export button
 * - Model selector dropdown
 * 
 * @param {Object} props
 * @param {Function} props.onSave - Save estimate callback
 * @param {Function} props.onAnalyze - AI analysis callback
 * @param {Function} props.onExport - Export callback
 * @param {Function} props.onReset - Reset callback (optional)
 * @param {boolean} props.isSaving - Whether saving is in progress
 * @param {boolean} props.isAnalyzing - Whether analysis is in progress
 * @param {number} props.totalFixtures - Total fixtures count (disables buttons if 0)
 * @param {string} props.selectedModel - Currently selected AI model
 * @param {Function} props.onModelChange - Model change callback
 */
function PlansActionBar({
  onSave,
  onAnalyze,
  onExport,
  onReset,
  isSaving,
  isAnalyzing,
  totalFixtures,
  selectedModel,
  onModelChange,
}) {
  const hasFixtures = totalFixtures > 0;

  // Memoized handlers to prevent unnecessary re-renders
  const handleSave = useCallback(() => onSave?.(), [onSave]);
  const handleAnalyze = useCallback(() => onAnalyze?.(), [onAnalyze]);
  const handleExport = useCallback(() => onExport?.(), [onExport]);
  const handleReset = useCallback(() => onReset?.(), [onReset]);
  const handleModelChange = useCallback((model) => onModelChange?.(model), [onModelChange]);

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Action Buttons */}
        <div className="flex gap-2 flex-1 flex-wrap">
          <ActionButton
            onClick={handleSave}
            disabled={isSaving || !hasFixtures}
            isLoading={isSaving}
            loadingText="Saving..."
            icon={Save}
            variant="primary"
            ariaLabel="Save estimate"
          >
            Save
          </ActionButton>

          <ActionButton
            onClick={handleAnalyze}
            disabled={isAnalyzing || !hasFixtures}
            isLoading={isAnalyzing}
            loadingText="Analyzing..."
            icon={Brain}
            variant="secondary"
            ariaLabel="Run AI analysis"
          >
            AI Analysis
          </ActionButton>

          <ActionButton
            onClick={handleExport}
            disabled={!hasFixtures}
            icon={FileDown}
            variant="secondary"
            ariaLabel="Export estimate"
          >
            Export
          </ActionButton>

          {onReset && (
            <ActionButton
              onClick={handleReset}
              icon={RotateCcw}
              variant="ghost"
              ariaLabel="Reset estimate"
            >
              Reset
            </ActionButton>
          )}
        </div>

        {/* Model Selector */}
        <div className="border-t sm:border-t-0 sm:border-l border-surface-700 pt-3 sm:pt-0 sm:pl-3">
          <ModelSelectorWrapper 
            selectedModel={selectedModel} 
            onModelChange={handleModelChange} 
          />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PropTypes
// ═══════════════════════════════════════════════════════════════

PlansActionBar.propTypes = {
  onSave: PropTypes.func.isRequired,
  onAnalyze: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  onReset: PropTypes.func,
  isSaving: PropTypes.bool,
  isAnalyzing: PropTypes.bool,
  totalFixtures: PropTypes.number.isRequired,
  selectedModel: PropTypes.string,
  onModelChange: PropTypes.func.isRequired,
};

PlansActionBar.defaultProps = {
  isSaving: false,
  isAnalyzing: false,
  selectedModel: '',
};

ActionButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  loadingText: PropTypes.string,
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'ghost']),
  icon: PropTypes.elementType,
  ariaLabel: PropTypes.string.isRequired,
};

ModelSelectorWrapper.propTypes = {
  selectedModel: PropTypes.string,
  onModelChange: PropTypes.func.isRequired,
};

export default memo(PlansActionBar);
