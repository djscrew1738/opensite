import { useState, useMemo, useRef, useEffect, useCallback, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Cpu, ChevronDown, Server, Cloud, Zap, AlertCircle,
  CheckCircle2, RefreshCw, HardDrive, Gauge, Activity
} from 'lucide-react';
import { api } from '../../api/client';
import { useAIStatus } from '../../hooks';

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
      style={{ background: '#111318' }}
    >
      <Cpu className="w-4 h-4 text-[#64748B]" />
      <span className="text-[#64748B]">Loading models...</span>
    </div>
  );
});

/**
 * Selected model display in button
 */
const SelectedModelDisplay = memo(function SelectedModelDisplay({ 
  model, 
  isProviderReady, 
  isFallback, 
  allowFallback,
  showPerformance: _showPerformance 
}) {
  if (!model) {
    return (
      <>
        <Cpu className="w-4 h-4 text-[#64748B] shrink-0" />
        <span className="text-[#94A3B8]">Select model...</span>
      </>
    );
  }

  return (
    <>
      <div className={`w-2 h-2 rounded-full shrink-0 ${isProviderReady ? 'bg-emerald-500' : 'bg-red-500'}`} />
      <span className="font-medium text-[#F1F5F9] truncate">
        {model.label || model.name}
      </span>
      {isFallback && allowFallback && (
        <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-700 rounded-full shrink-0">
          Fallback
        </span>
      )}
    </>
  );
});

/**
 * Performance info display for selected model
 */
const ModelPerformanceInfo = memo(function ModelPerformanceInfo({ 
  model, 
  showPerformance 
}) {
  if (!showPerformance || !model?.context) return null;

  return (
    <span className="hidden sm:block text-xs text-[#64748B]">
      {Math.round(model.context / 1000)}k ctx
    </span>
  );
});

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
        ${isActive 
          ? 'bg-[#3B82F6]/10 text-[#3B82F6]' 
          : 'hover:bg-[#181C24]'
        }
        ${!isReady ? 'opacity-50' : ''}
      `}
    >
      <span className={isReady ? 'text-emerald-500' : 'text-red-500'}>
        {isReady ? '●' : '○'}
      </span>
      <span className={info.color}><ProviderIcon className="w-4 h-4" /></span>
      {provider.label?.split(' ')[0] || provider.name}
    </button>
  );
});

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
    <div className="flex gap-1 p-2 border-b border-[#1F2430] overflow-x-auto">
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

/**
 * Speed indicator icon
 */
const SpeedIcon = memo(function SpeedIcon({ speed }) {
  switch (speed) {
    case 'fast': return <Zap className="w-3 h-3 text-emerald-500" />;
    case 'medium': return <Gauge className="w-3 h-3 text-amber-500" />;
    case 'slow': return <Gauge className="w-3 h-3 text-red-500" />;
    default: return null;
  }
});

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
      className={`
        w-full flex items-center justify-between px-3 py-2 rounded-lg text-left
        transition-colors
        ${isSelected 
          ? 'bg-[#3B82F6]/5 border border-[#3B82F6]/30' 
          : 'hover:bg-[#181C24]'
        }
      `}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isSelected ? (
          <CheckCircle2 className="w-4 h-4 text-[#3B82F6] shrink-0" />
        ) : (
          <div className="w-4 h-4 rounded-full border-2 border-[#2A3040] shrink-0" />
        )}
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate ${isSelected ? 'text-[#3B82F6]' : 'text-[#F1F5F9]'}`}>
            {model.label || model.name}
          </p>
          {model.description && (
            <p className="text-xs text-[#94A3B8] truncate">{model.description}</p>
          )}
        </div>
        {badge && (
          <span className="px-1.5 py-0.5 text-[10px] bg-violet-100 text-violet-700 rounded-full shrink-0">
            {badge}
          </span>
        )}
      </div>

      {showPerformance && (
        <div className="flex items-center gap-2 shrink-0 text-xs text-[#64748B]">
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
      <p className="px-3 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
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
          <p className="px-3 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
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

/**
 * Empty state when no models available
 */
const EmptyModelsState = memo(function EmptyModelsState() {
  return (
    <div className="p-4 text-center">
      <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
      <p className="text-sm text-[#94A3B8]">No models available</p>
      <p className="text-xs text-[#64748B] mt-1">
        Check your AI provider configuration
      </p>
    </div>
  );
});

/**
 * Dropdown footer with refresh button
 */
const DropdownFooter = memo(function DropdownFooter({ onRefresh }) {
  return (
    <div className="p-2 border-t border-[#1F2430]">
      <button
        onClick={onRefresh}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#181C24] rounded-lg transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Refresh Models
      </button>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * Enhanced Model Selector with provider status, performance indicators,
 * and intelligent recommendations
 */
export function ModelSelector({
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
          border border-[#1F2430]
          bg-[#111318]
          hover:border-[#3B82F6]/40
          transition-all duration-200
          ${SIZE_CLASSES[size]}
          ${isOpen ? 'ring-2 ring-[#3B82F6]/20 border-[#3B82F6]' : ''}
        `}
      >
        <div className="flex items-center gap-2 min-w-0">
          <SelectedModelDisplay 
            model={selectedModel}
            isProviderReady={isProviderReady(activeProvider)}
            isFallback={isFallback}
            allowFallback={allowFallback}
            showPerformance={showPerformance}
          />
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <ModelPerformanceInfo model={selectedModel} showPerformance={showPerformance} />
          <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="
          absolute top-full left-0 right-0 mt-2 z-[60]
          bg-[#111318]
          border border-[#1F2430]
          rounded-xl shadow-xl
          max-h-[400px] overflow-y-auto
        ">
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
}

export default ModelSelector;
