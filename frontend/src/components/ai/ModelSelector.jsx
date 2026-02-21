import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Cpu, ChevronDown, Server, Cloud, Zap, AlertCircle,
  CheckCircle2, RefreshCw, HardDrive, Gauge
} from 'lucide-react';
import { api } from '../../api/client';
import { useAIStatus } from '../../hooks/useAIStatus';

/**
 * Enhanced Model Selector with provider status, performance indicators,
 * and intelligent recommendations
 */
export default function ModelSelector({
  value,
  onChange,
  showProvider = true,
  showPerformance = true,
  allowFallback = true,
  className = '',
  size = 'md',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    providers, 
    activeProvider, 
    isProviderReady, 
    getProviderInfo,
    isFallback,
    switchProvider,
    isLoading: statusLoading
  } = useAIStatus({ polling: true });

  // Fetch available models
  const { data: modelsData, isLoading: modelsLoading, refetch } = useQuery({
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
  }, [models, activeProvider]);

  // Get selected model details
  const selectedModel = useMemo(() => {
    return models.find(m => m.name === value);
  }, [models, value]);

  // Size classes
  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base',
  };

  // Handle provider switch
  const handleProviderSwitch = async (providerName) => {
    if (providerName === activeProvider) return;
    
    const result = await switchProvider(providerName);
    if (result.success) {
      refetch();
    }
  };

  if (statusLoading || modelsLoading) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 bg-surface-100 dark:bg-surface-800 rounded-lg animate-pulse ${sizeClasses[size]} ${className}`}>
        <Cpu className="w-4 h-4 text-surface-400" />
        <span className="text-surface-400">Loading models...</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between gap-3 px-3 rounded-lg
          border border-surface-200 dark:border-surface-700
          bg-white dark:bg-surface-800
          hover:border-accent-300 dark:hover:border-accent-600
          transition-all duration-200
          ${sizeClasses[size]}
          ${isOpen ? 'ring-2 ring-accent-500/20 border-accent-500' : ''}
        `}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedModel ? (
            <>
              <div className={`
                w-2 h-2 rounded-full shrink-0
                ${isProviderReady(activeProvider) ? 'bg-emerald-500' : 'bg-red-500'}
              `} />
              <span className="font-medium text-surface-900 dark:text-surface-100 truncate">
                {selectedModel.label || selectedModel.name}
              </span>
              {isFallback && allowFallback && (
                <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-700 rounded-full shrink-0">
                  Fallback
                </span>
              )}
            </>
          ) : (
            <>
              <Cpu className="w-4 h-4 text-surface-400 shrink-0" />
              <span className="text-surface-500">Select model...</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {showPerformance && selectedModel?.context && (
            <span className="hidden sm:block text-xs text-surface-400">
              {Math.round(selectedModel.context / 1000)}k ctx
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-surface-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="
            absolute top-full left-0 right-0 mt-2 z-50
            bg-white dark:bg-surface-800
            border border-surface-200 dark:border-surface-700
            rounded-xl shadow-xl
            max-h-[400px] overflow-y-auto
          ">
            {/* Provider Tabs */}
            {showProvider && providers.length > 1 && (
              <div className="flex gap-1 p-2 border-b border-surface-200 dark:border-surface-700 overflow-x-auto">
                {providers.map(provider => {
                  const info = getProviderInfo(provider.name);
                  const isReady = isProviderReady(provider.name);
                  const isActive = activeProvider === provider.name;
                  
                  return (
                    <button
                      key={provider.name}
                      onClick={() => handleProviderSwitch(provider.name)}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
                        whitespace-nowrap transition-colors
                        ${isActive 
                          ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300' 
                          : 'hover:bg-surface-100 dark:hover:bg-surface-700'
                        }
                        ${!isReady ? 'opacity-50' : ''}
                      `}
                    >
                      <span className={isReady ? 'text-emerald-500' : 'text-red-500'}>
                        {isReady ? '●' : '○'}
                      </span>
                      <span className={info.color}>{info.icon}</span>
                      {provider.label.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Models List */}
            <div className="p-2">
              {/* Recommended Models */}
              {recommendations.chat && recommendations.chat.length > 0 && (
                <div className="mb-3">
                  <p className="px-3 py-1 text-[10px] font-bold text-surface-400 uppercase tracking-wider">
                    Recommended
                  </p>
                  {recommendations.chat.slice(0, 3).map(modelName => {
                    const model = models.find(m => m.name === modelName);
                    if (!model) return null;
                    
                    return (
                      <ModelOption
                        key={model.name}
                        model={model}
                        isSelected={value === model.name}
                        onClick={() => {
                          onChange(model.name);
                          setIsOpen(false);
                        }}
                        showPerformance={showPerformance}
                        badge="Recommended"
                      />
                    );
                  })}
                </div>
              )}

              {/* All Models Grouped by Provider */}
              {Object.entries(groupedModels).map(([provider, providerModels]) => (
                <div key={provider} className="mb-2">
                  <p className="px-3 py-1 text-[10px] font-bold text-surface-400 uppercase tracking-wider">
                    {getProviderInfo(provider).label}
                  </p>
                  {providerModels.map(model => (
                    <ModelOption
                      key={model.name}
                      model={model}
                      isSelected={value === model.name}
                      onClick={() => {
                        onChange(model.name);
                        setIsOpen(false);
                      }}
                      showPerformance={showPerformance}
                    />
                  ))}
                </div>
              ))}

              {/* Empty State */}
              {models.length === 0 && (
                <div className="p-4 text-center">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm text-surface-600">No models available</p>
                  <p className="text-xs text-surface-400 mt-1">
                    Check your AI provider configuration
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-surface-200 dark:border-surface-700">
              <button
                onClick={() => {
                  refetch();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-surface-500 hover:text-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700 rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Models
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Model Option Component
function ModelOption({ model, isSelected, onClick, showPerformance, badge }) {
  const getSpeedIcon = (speed) => {
    switch (speed) {
      case 'fast': return <Zap className="w-3 h-3 text-emerald-500" />;
      case 'medium': return <Gauge className="w-3 h-3 text-amber-500" />;
      case 'slow': return <Gauge className="w-3 h-3 text-red-500" />;
      default: return null;
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center justify-between px-3 py-2 rounded-lg text-left
        transition-colors
        ${isSelected 
          ? 'bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800' 
          : 'hover:bg-surface-50 dark:hover:bg-surface-700'
        }
      `}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isSelected ? (
          <CheckCircle2 className="w-4 h-4 text-accent-600 shrink-0" />
        ) : (
          <div className="w-4 h-4 rounded-full border-2 border-surface-300 dark:border-surface-600 shrink-0" />
        )}
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate ${isSelected ? 'text-accent-700 dark:text-accent-300' : 'text-surface-900 dark:text-surface-100'}`}>
            {model.label || model.name}
          </p>
          {model.description && (
            <p className="text-xs text-surface-500 truncate">{model.description}</p>
          )}
        </div>
        {badge && (
          <span className="px-1.5 py-0.5 text-[10px] bg-violet-100 text-violet-700 rounded-full shrink-0">
            {badge}
          </span>
        )}
      </div>

      {showPerformance && (
        <div className="flex items-center gap-2 shrink-0 text-xs text-surface-400">
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
          {getSpeedIcon(model.speed)}
        </div>
      )}
    </button>
  );
}
