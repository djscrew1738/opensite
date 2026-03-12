/**
 * ModelSelector Component
 * Enhanced model selector with provider status, performance indicators,
 * and intelligent recommendations
 * 
 * @module components/ai/ModelSelector
 */

import { useState, useMemo, useRef, useEffect, useCallback, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Cpu, ChevronDown, Server, Cloud, Zap, AlertCircle,
  CheckCircle2, RefreshCw, HardDrive, Gauge, Activity
} from 'lucide-react';
import { api } from '../../api/client';
import { useAIStatus } from '../../hooks';
import { colors } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const SIZE_CLASSES = {
  sm: 'h-8 text-xs',
  md: 'h-10 text-sm',
  lg: 'h-12 text-base',
};

const PROVIDER_ICONS = {
  server: Server,
  zap: Zap,
  cloud: Cloud,
  cpu: Cpu,
  activity: Activity,
};

// ═══════════════════════════════════════════════════════════════
// Custom Hooks
// ═══════════════════════════════════════════════════════════════

/**
 * Hook to close dropdown on outside click
 * @param {React.RefObject} ref
 * @param {boolean} isOpen
 * @param {Function} onClose
 */
function useClickOutside(ref, isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return;
    
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose, ref]);
}

/**
 * Hook to fetch and manage AI models
 */
function useAIModels() {
  const { 
    providers, 
    activeProvider, 
    isProviderReady, 
    getProviderInfo,
    isFallback,
    switchProvider,
    isLoading: statusLoading,
  } = useAIStatus({ polling: true });

  const { 
    data: modelsData, 
    isLoading: modelsLoading, 
    refetch 
  } = useQuery({
    queryKey: ['ai-models-selector'],
    queryFn: () => api.ai.getModels(),
    staleTime: 60000,
  });

  const models = modelsData?.models || [];
  const recommendations = modelsData?.recommendations || {};

  // Group models by provider
  const groupedModels = useMemo(() => {
    const groups = {};
    
    models.forEach(model => {
      const provider = model.provider || activeProvider || 'ollama';
      if (!groups[provider]) {
        groups[provider] = [];
      }
      groups[provider].push(model);
    });

    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models.length, activeProvider]);

  // Handle provider switch
  const handleProviderSwitch = useCallback(async (providerName) => {
    if (providerName === activeProvider) return;
    
    const result = await switchProvider(providerName);
    if (result.success) {
      refetch();
    }
  }, [activeProvider, switchProvider, refetch]);

  return {
    providers,
    activeProvider,
    isProviderReady,
    getProviderInfo,
    isFallback,
    models,
    recommendations,
    groupedModels,
    handleProviderSwitch,
    isLoading: statusLoading || modelsLoading,
    refetch,
  };
}

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Loading state for model selector
 */
const ModelSelectorLoading = memo(function ModelSelectorLoading({ size }) {
  return (
    <div 
      className={`flex items-center gap-2 px-3 py-2 rounded-lg animate-pulse ${SIZE_CLASSES[size]}`}
      style={{ backgroundColor: colors.surface.card }}
    >
      <Cpu style={{ color: colors.text.muted }} />
      <span style={{ color: colors.text.muted }}>Loading models...</span>
    </div>
  );
});

ModelSelectorLoading.displayName = 'ModelSelectorLoading';

/**
 * Selected model display in button
 */
const SelectedModelDisplay = memo(function SelectedModelDisplay({ 
  model, 
  isProviderReady, 
  isFallback, 
  allowFallback,
}) {
  if (!model) {
    return (
      <>
        <Cpu className="w-4 h-4 shrink-0" style={{ color: colors.text.muted }} />
        <span style={{ color: colors.text.secondary }}>Select model...</span>
      </>
    );
  }

  return (
    <>
      <div 
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: isProviderReady ? colors.success.DEFAULT : colors.danger.DEFAULT }}
      />
      <span 
        className="font-medium truncate"
        style={{ color: colors.text.primary }}
      >
        {model.label || model.name}
      </span>
      {isFallback && allowFallback && (
        <span 
          className="px-1.5 py-0.5 text-xs rounded-full shrink-0"
          style={{ 
            backgroundColor: colors.warning.muted, 
            color: colors.warning.DEFAULT 
          }}
        >
          Fallback
        </span>
      )}
    </>
  );
});

SelectedModelDisplay.displayName = 'SelectedModelDisplay';

/**
 * Performance info display for selected model
 */
const ModelPerformanceInfo = memo(function ModelPerformanceInfo({ 
  model, 
  showPerformance 
}) {
  if (!showPerformance || !model?.context) return null;

  return (
    <span 
      className="hidden sm:block text-xs"
      style={{ color: colors.text.muted }}
    >
      {Math.round(model.context / 1000)}k ctx
    </span>
  );
});

ModelPerformanceInfo.displayName = 'ModelPerformanceInfo';

/**
 * Provider tab button
 */
const ProviderTab = memo(function ProviderTab({ 
  provider, 
  isActive, 
  isReady, 
  info, 
  onClick 
}) {
  const ProviderIcon = PROVIDER_ICONS[info.iconType] || Activity;
  
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
        whitespace-nowrap transition-colors
        ${!isReady ? 'opacity-50' : ''}
      `}
      style={{
        backgroundColor: isActive ? colors.accent.muted : 'transparent',
        color: isActive ? colors.accent.DEFAULT : colors.text.secondary,
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = colors.surface.elevated;
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <span style={{ color: isReady ? colors.success.DEFAULT : colors.danger.DEFAULT }}>
        {isReady ? '●' : '○'}
      </span>
      <span className={info.color}><ProviderIcon className="w-4 h-4" /></span>
      {provider.label?.split(' ')[0] || provider.name}
    </button>
  );
});

ProviderTab.displayName = 'ProviderTab';

/**
 * Provider tabs section
 */
const ProviderTabs = memo(function ProviderTabs({ 
  providers, 
  activeProvider, 
  isProviderReady, 
  getProviderInfo,
  onProviderSwitch 
}) {
  if (providers.length <= 1) return null;

  return (
    <div 
      className="flex gap-1 p-2 overflow-x-auto"
      style={{ borderBottom: `1px solid ${colors.border.default}` }}
    >
      {providers.map(provider => (
        <ProviderTab
          key={provider.name}
          provider={provider}
          isActive={activeProvider === provider.name}
          isReady={isProviderReady(provider.name)}
          info={getProviderInfo(provider.name)}
          onClick={() => onProviderSwitch(provider.name)}
        />
      ))}
    </div>
  );
});

ProviderTabs.displayName = 'ProviderTabs';

/**
 * Speed indicator icon
 */
const SpeedIcon = memo(function SpeedIcon({ speed }) {
  const iconColor = {
    fast: colors.success.DEFAULT,
    medium: colors.warning.DEFAULT,
    slow: colors.danger.DEFAULT,
  }[speed];

  switch (speed) {
    case 'fast': return <Zap className="w-3 h-3" style={{ color: iconColor }} />;
    case 'medium': return <Gauge className="w-3 h-3" style={{ color: iconColor }} />;
    case 'slow': return <Gauge className="w-3 h-3" style={{ color: iconColor }} />;
    default: return null;
  }
});

SpeedIcon.displayName = 'SpeedIcon';

/**
 * Individual model option in dropdown
 */
const ModelOption = memo(function ModelOption({ 
  model, 
  isSelected, 
  onClick, 
  showPerformance, 
  badge 
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors"
      style={{
        backgroundColor: isSelected ? `${colors.accent.DEFAULT}0D` : 'transparent',
        border: isSelected ? `1px solid ${colors.accent.DEFAULT}4D` : '1px solid transparent',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = colors.surface.elevated;
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isSelected ? (
          <CheckCircle2 style={{ color: colors.accent.DEFAULT }} />
        ) : (
          <div 
            className="w-4 h-4 rounded-full border-2 shrink-0"
            style={{ borderColor: colors.border.strong }}
          />
        )}
        <div className="min-w-0">
          <p 
            className="text-sm font-medium truncate"
            style={{ color: isSelected ? colors.accent.DEFAULT : colors.text.primary }}
          >
            {model.label || model.name}
          </p>
          {model.description && (
            <p 
              className="text-xs truncate"
              style={{ color: colors.text.secondary }}
            >
              {model.description}
            </p>
          )}
        </div>
        {badge && (
          <span 
            className="px-1.5 py-0.5 text-xs rounded-full shrink-0"
            style={{ 
              backgroundColor: `${colors.accent.purple}1A`, 
              color: colors.accent.purple 
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {showPerformance && (
        <div 
          className="flex items-center gap-2 shrink-0 text-xs"
          style={{ color: colors.text.muted }}
        >
          {model.context && (
            <span className="hidden sm:block">
              {Math.round(model.context / 1000)}k
            </span>
          )}
          {model.size && (
            <span className="hidden sm:flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              {(model.size / (1024 ** 3)).toFixed(1)}GB
            </span>
          )}
          <SpeedIcon speed={model.speed} />
        </div>
      )}
    </button>
  );
});

ModelOption.displayName = 'ModelOption';

/**
 * Recommended models section
 */
const RecommendedModels = memo(function RecommendedModels({ 
  recommendations, 
  models, 
  currentValue,
  showPerformance,
  onSelect 
}) {
  if (!recommendations.chat?.length) return null;

  const recommendedModels = recommendations.chat
    .slice(0, 3)
    .map(name => models.find(m => m.name === name))
    .filter(Boolean);

  if (recommendedModels.length === 0) return null;

  return (
    <div className="mb-3">
      <p 
        className="px-3 py-1 text-xs font-bold uppercase tracking-wider"
        style={{ color: colors.text.muted }}
      >
        Recommended
      </p>
      {recommendedModels.map(model => (
        <ModelOption
          key={model.name}
          model={model}
          isSelected={currentValue === model.name}
          onClick={() => onSelect(model.name)}
          showPerformance={showPerformance}
          badge="Recommended"
        />
      ))}
    </div>
  );
});

RecommendedModels.displayName = 'RecommendedModels';

/**
 * Grouped models list
 */
const GroupedModelsList = memo(function GroupedModelsList({ 
  groupedModels, 
  currentValue,
  showPerformance,
  getProviderInfo,
  onSelect 
}) {
  if (Object.keys(groupedModels).length === 0) return null;

  return (
    <>
      {Object.entries(groupedModels).map(([provider, providerModels]) => (
        <div key={provider} className="mb-2">
          <p 
            className="px-3 py-1 text-xs font-bold uppercase tracking-wider"
            style={{ color: colors.text.muted }}
          >
            {getProviderInfo(provider).label}
          </p>
          {providerModels.map(model => (
            <ModelOption
              key={model.name}
              model={model}
              isSelected={currentValue === model.name}
              onClick={() => onSelect(model.name)}
              showPerformance={showPerformance}
            />
          ))}
        </div>
      ))}
    </>
  );
});

GroupedModelsList.displayName = 'GroupedModelsList';

/**
 * Empty state when no models available
 */
const EmptyModelsState = memo(function EmptyModelsState() {
  return (
    <div className="p-4 text-center">
      <AlertCircle 
        className="w-8 h-8 mx-auto mb-2" 
        style={{ color: colors.warning.DEFAULT }}
      />
      <p className="text-sm" style={{ color: colors.text.secondary }}>
        No models available
      </p>
      <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
        Check your AI provider configuration
      </p>
    </div>
  );
});

EmptyModelsState.displayName = 'EmptyModelsState';

/**
 * Dropdown footer with refresh button
 */
const DropdownFooter = memo(function DropdownFooter({ onRefresh }) {
  return (
    <div 
      className="p-2"
      style={{ borderTop: `1px solid ${colors.border.default}` }}
    >
      <button
        onClick={onRefresh}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors"
        style={{ color: colors.text.secondary }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.surface.elevated;
          e.currentTarget.style.color = colors.text.primary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = colors.text.secondary;
        }}
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Refresh Models
      </button>
    </div>
  );
});

DropdownFooter.displayName = 'DropdownFooter';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * ModelSelector - Enhanced model selector with provider status
 * 
 * @param {{
 *   value?: string,
 *   onChange: (value: string) => void,
 *   showProvider?: boolean,
 *   showPerformance?: boolean,
 *   allowFallback?: boolean,
 *   className?: string,
 *   size?: 'sm' | 'md' | 'lg'
 * }} props
 */
const ModelSelector = memo(function ModelSelector({
  value,
  onChange,
  showProvider = true,
  showPerformance = true,
  allowFallback = true,
  className = '',
  size = 'md',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const {
    providers,
    activeProvider,
    isProviderReady,
    getProviderInfo,
    isFallback,
    models,
    recommendations,
    groupedModels,
    handleProviderSwitch,
    isLoading,
    refetch,
  } = useAIModels();

  // Close on outside click
  useClickOutside(containerRef, isOpen, () => setIsOpen(false));

  // Get selected model details
  const selectedModel = useMemo(() => {
    return models.find(m => m.name === value);
  }, [models, value]);

  // Handle model selection
  const handleSelect = useCallback((modelName) => {
    onChange(modelName);
    setIsOpen(false);
  }, [onChange]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
    setIsOpen(false);
  }, [refetch]);

  if (isLoading) {
    return <ModelSelectorLoading size={size} />;
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Main Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={selectedModel 
          ? `AI model: ${selectedModel.label || selectedModel.name}` 
          : 'Select AI model'
        }
        className={`
          w-full flex items-center justify-between gap-3 px-3 rounded-lg
          transition-all duration-200
          ${SIZE_CLASSES[size]}
        `}
        style={{
          backgroundColor: colors.surface.card,
          border: `1px solid ${isOpen ? colors.accent.DEFAULT : colors.border.default}`,
          boxShadow: isOpen ? `0 0 0 2px ${colors.accent.muted}` : 'none',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.borderColor = `${colors.accent.DEFAULT}66`;
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.borderColor = colors.border.default;
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <SelectedModelDisplay 
            model={selectedModel}
            isProviderReady={isProviderReady(activeProvider)}
            isFallback={isFallback}
            allowFallback={allowFallback}
          />
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <ModelPerformanceInfo model={selectedModel} showPerformance={showPerformance} />
          <ChevronDown 
            className="w-4 h-4 transition-transform"
            style={{ color: colors.text.muted, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 z-[60] rounded-xl shadow-xl max-h-[400px] overflow-y-auto"
          style={{
            backgroundColor: colors.surface.card,
            border: `1px solid ${colors.border.default}`,
          }}
        >
          {/* Provider Tabs */}
          {showProvider && (
            <ProviderTabs
              providers={providers}
              activeProvider={activeProvider}
              isProviderReady={isProviderReady}
              getProviderInfo={getProviderInfo}
              onProviderSwitch={handleProviderSwitch}
            />
          )}

          {/* Models List */}
          <div className="p-2">
            <RecommendedModels
              recommendations={recommendations}
              models={models}
              currentValue={value}
              showPerformance={showPerformance}
              onSelect={handleSelect}
            />

            <GroupedModelsList
              groupedModels={groupedModels}
              currentValue={value}
              showPerformance={showPerformance}
              getProviderInfo={getProviderInfo}
              onSelect={handleSelect}
            />

            {models.length === 0 && <EmptyModelsState />}
          </div>

          <DropdownFooter onRefresh={handleRefresh} />
        </div>
      )}
    </div>
  );
});

ModelSelector.displayName = 'ModelSelector';

export { ModelSelector };
export default ModelSelector;
