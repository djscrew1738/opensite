import { useState, useCallback } from 'react';
import { 
  Building2, 
  Home, 
  Layers, 
  Wrench, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle,
  Edit3,
  Save,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

const FIELD_CONFIG = {
  sqft: { 
    label: 'Square Feet', 
    icon: Building2, 
    placeholder: 'e.g., 2500',
    min: 100,
    max: 10000000,
    step: 1
  },
  units: { 
    label: 'Units', 
    icon: Home, 
    placeholder: 'e.g., 4',
    min: 1,
    max: 10000,
    step: 1
  },
  stories: { 
    label: 'Stories', 
    icon: Layers, 
    placeholder: 'e.g., 2',
    min: 1,
    max: 200,
    step: 1
  },
  bathrooms: { 
    label: 'Bathrooms', 
    icon: Wrench, 
    placeholder: 'e.g., 8',
    min: 0.5,
    max: 5000,
    step: 0.5
  },
  bedrooms: {
    label: 'Bedrooms',
    icon: Home,
    placeholder: 'e.g., 6',
    min: 0,
    max: 50000,
    step: 1
  }
};

const FIXTURE_FIELDS = {
  toilets: { label: 'Toilets', placeholder: '0' },
  lavatories: { label: 'Lavatories', placeholder: '0' },
  kitchenFaucets: { label: 'Kitchen Faucets', placeholder: '0' },
  barSinks: { label: 'Bar Sinks', placeholder: '0' },
  tubs: { label: 'Tubs', placeholder: '0' },
  showerBases: { label: 'Showers', placeholder: '0' },
  mudPans: { label: 'Mud Pans', placeholder: '0' },
  washingMachines: { label: 'Washing Machines', placeholder: '0' },
  waterSoftenerPreplumb: { label: 'Water Softener Pre-plumb', placeholder: '0' },
  hoseBibs: { label: 'Hose Bibs', placeholder: '0' },
  floorDrains: { label: 'Floor Drains', placeholder: '0' }
};

export default function ExtractedDataEditor({ 
  initialData = {},
  confidenceScores = {},
  warnings = [],
  suggestions = [],
  onSubmit,
  onCancel,
  isAnalyzing = false
}) {
  const [data, setData] = useState(() => ({
    sqft: initialData.sqft || '',
    units: initialData.units || '',
    stories: initialData.stories || '',
    bathrooms: initialData.bathrooms || '',
    bedrooms: initialData.bedrooms || '',
    toilets: initialData.toilets || '',
    lavatories: initialData.lavatories || '',
    kitchenFaucets: initialData.kitchenFaucets || '',
    barSinks: initialData.barSinks || '',
    tubs: initialData.tubs || '',
    showerBases: initialData.showerBases || '',
    mudPans: initialData.mudPans || '',
    washingMachines: initialData.washingMachines || '',
    waterSoftenerPreplumb: initialData.waterSoftenerPreplumb || '',
    hoseBibs: initialData.hoseBibs || '',
    floorDrains: initialData.floorDrains || ''
  }));

  const [showFixtures, setShowFixtures] = useState(false);
  const [editedFields, setEditedFields] = useState(new Set());
  const [showWarnings, setShowWarnings] = useState(warnings.length > 0);
  const [showSuggestions, setShowSuggestions] = useState(suggestions.length > 0);

  const handleChange = useCallback((field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
    setEditedFields(prev => new Set(prev).add(field));
  }, []);

  const handleReset = useCallback(() => {
    setData({
      sqft: initialData.sqft || '',
      units: initialData.units || '',
      stories: initialData.stories || '',
      bathrooms: initialData.bathrooms || '',
      bedrooms: initialData.bedrooms || '',
      toilets: initialData.toilets || '',
      lavatories: initialData.lavatories || '',
      kitchenFaucets: initialData.kitchenFaucets || '',
      barSinks: initialData.barSinks || '',
      tubs: initialData.tubs || '',
      showerBases: initialData.showerBases || '',
      mudPans: initialData.mudPans || '',
      washingMachines: initialData.washingMachines || '',
      waterSoftenerPreplumb: initialData.waterSoftenerPreplumb || '',
      hoseBibs: initialData.hoseBibs || '',
      floorDrains: initialData.floorDrains || ''
    });
    setEditedFields(new Set());
  }, [initialData]);

  const handleSubmit = useCallback(() => {
    // Convert empty strings to null/undefined and parse numbers
    const processed = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== '' && value !== null && value !== undefined) {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          processed[key] = num;
        }
      }
    }
    onSubmit?.(processed);
  }, [data, onSubmit]);

  const getConfidenceColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceIcon = (score) => {
    if (score >= 80) return <CheckCircle2 className="w-3 h-3" />;
    if (score >= 50) return <AlertTriangle className="w-3 h-3" />;
    return <AlertCircle className="w-3 h-3" />;
  };

  const hasData = Object.values(data).some(v => v !== '' && v !== null && v !== undefined);
  const editedCount = editedFields.size;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-blue-600" />
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
            Review Extracted Data
          </h4>
        </div>
        {editedCount > 0 && (
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
            {editedCount} field{editedCount !== 1 ? 's' : ''} edited
          </span>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && showWarnings && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <button
            onClick={() => setShowWarnings(!showWarnings)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-900 dark:text-amber-300">
                {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}
              </span>
            </div>
            {showWarnings ? <ChevronUp className="w-4 h-4 text-amber-600" /> : <ChevronDown className="w-4 h-4 text-amber-600" />}
          </button>
          {showWarnings && (
            <ul className="mt-2 space-y-1">
              {warnings.map((warning, i) => (
                <li key={i} className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1">
                  <span className="mt-0.5">•</span>
                  {warning}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && showSuggestions && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                {suggestions.length} Suggestion{suggestions.length !== 1 ? 's' : ''}
              </span>
            </div>
            {showSuggestions ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
          </button>
          {showSuggestions && (
            <ul className="mt-2 space-y-1">
              {suggestions.map((suggestion, i) => (
                <li key={i} className="text-xs text-blue-800 dark:text-blue-300 flex items-start gap-1">
                  <span className="mt-0.5">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Main Project Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(FIELD_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const confidence = confidenceScores[key];
          const isEdited = editedFields.has(key);
          const hasValue = data[key] !== '';

          return (
            <div key={key} className="relative">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {config.label}
              </label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={data[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={config.placeholder}
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  className={`
                    w-full pl-9 pr-10 py-2 text-sm rounded-lg border
                    bg-white dark:bg-gray-800
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    transition-colors
                    ${isEdited 
                      ? 'border-blue-400 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700'
                    }
                    ${hasValue && !isEdited ? 'text-gray-900 dark:text-gray-100' : ''}
                  `}
                />
                {confidence !== undefined && (
                  <div 
                    className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${getConfidenceColor(confidence)}`}
                    title={`Confidence: ${confidence}%`}
                  >
                    {getConfidenceIcon(confidence)}
                    {confidence}%
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixtures Toggle */}
      <button
        onClick={() => setShowFixtures(!showFixtures)}
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
      >
        {showFixtures ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        Fixture Counts
        {Object.values(data).filter((v, i) => 
          Object.keys(FIXTURE_FIELDS).includes(Object.keys(data)[i]) && v !== ''
        ).length > 0 && (
          <span className="text-xs text-gray-400">
            ({Object.entries(data).filter(([k, v]) => 
              FIXTURE_FIELDS[k] && v !== ''
            ).length} detected)
          </span>
        )}
      </button>

      {/* Fixture Fields */}
      {showFixtures && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          {Object.entries(FIXTURE_FIELDS).map(([key, config]) => {
            const confidence = confidenceScores[key];
            const isEdited = editedFields.has(key);

            return (
              <div key={key} className="relative">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {config.label}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={data[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={config.placeholder}
                    min={0}
                    className={`
                      w-full px-2 py-1.5 text-sm rounded border
                      bg-white dark:bg-gray-800
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${isEdited 
                        ? 'border-blue-400 dark:border-blue-600 bg-blue-50/50' 
                        : 'border-gray-200 dark:border-gray-700'
                      }
                    `}
                  />
                  {confidence !== undefined && (
                    <div 
                      className={`absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                        confidence >= 80 ? 'bg-green-500' : 
                        confidence >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      title={`Confidence: ${confidence}%`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSubmit}
          disabled={isAnalyzing || !hasData}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Analyze with AI
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          disabled={editedCount === 0 || isAnalyzing}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>

        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isAnalyzing}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Confidence Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span>Confidence:</span>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>High (80%+)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Medium (50-79%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Low (&lt;50%)</span>
        </div>
      </div>
    </div>
  );
}
