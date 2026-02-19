import { Save, Brain, FileDown, Loader } from 'lucide-react';
import ModelSelector from '../ai/ModelSelector';

export default function PlansActionBar({
  onSave,
  onAnalyze,
  onExport,
  isSaving,
  isAnalyzing,
  totalFixtures,
  selectedModel,
  onModelChange,
}) {
  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Action Buttons */}
        <div className="flex gap-2 flex-1">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || totalFixtures === 0}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? 'Saving...' : 'Save Estimate'}
          </button>

          <button
            type="button"
            onClick={onAnalyze}
            disabled={isAnalyzing || totalFixtures === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Brain className="w-4 h-4" />
            )}
            {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
          </button>

          <button
            type="button"
            onClick={onExport}
            disabled={totalFixtures === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Model Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-surface-500 dark:text-surface-400 whitespace-nowrap">AI Model:</label>
          <ModelSelector
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            showSizes={false}
            className="text-sm py-1"
          />
        </div>
      </div>
    </div>
  );
}
