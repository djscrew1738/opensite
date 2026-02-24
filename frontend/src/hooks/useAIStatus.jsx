import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useCallback } from 'react';
import { 
  Cpu, Zap, Cloud, Server, AlertCircle, 
  CheckCircle2, Activity
} from 'lucide-react';
import React from 'react';

/**
 * Hook for monitoring AI provider health, switching providers,
 * and getting provider-specific UI metadata
 */
export function useAIStatus(options = {}) {
  const queryClient = useQueryClient();
  const { polling = false } = options;

  // Fetch all providers and their health
  const { data, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['ai-providers-status'],
    queryFn: () => api.ai.getProviders(),
    refetchInterval: polling ? 30000 : false,
    retry: 1
  });

  const activeProvider = data?.active || 'ollama';
  const providers = data?.providers || [];
  const activeProviderData = providers.find(p => p.name === activeProvider);

  // Switch provider mutation
  const switchMutation = useMutation({
    mutationFn: (providerName) => api.ai.switchProvider(providerName),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers-status'] });
      queryClient.invalidateQueries({ queryKey: ['ai-models-selector'] });
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] });
      return result;
    }
  });

  /**
   * Get UI metadata for a provider (icon, color, label)
   */
  const getProviderInfo = useCallback((name) => {
    const info = {
      ollama: {
        icon: <Server className="w-4 h-4" />,
        color: 'text-orange-500',
        label: 'Ollama (Local)'
      },
      openclaw: {
        icon: <Zap className="w-4 h-4" />,
        color: 'text-violet-500',
        label: 'OpenClaw Gateway'
      },
      groq: {
        icon: <Zap className="w-4 h-4" />,
        color: 'text-orange-400',
        label: 'Groq Cloud'
      },
      anthropic: {
        icon: <Cloud className="w-4 h-4" />,
        color: 'text-blue-500',
        label: 'Anthropic Claude'
      },
      openai: {
        icon: <Cpu className="w-4 h-4" />,
        color: 'text-emerald-500',
        label: 'OpenAI GPT'
      }
    };

    return info[name] || {
      icon: <Activity className="w-4 h-4" />,
      color: 'text-slate-500',
      label: name
    };
  }, []);

  /**
   * Check if a specific provider is healthy
   */
  const isProviderReady = useCallback((name) => {
    const p = providers.find(provider => provider.name === name);
    return p?.health?.connected || false;
  }, [providers]);

  /**
   * Switch the active AI provider
   */
  const switchProvider = async (name) => {
    try {
      const result = await switchMutation.mutateAsync(name);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return {
    activeProvider,
    providers,
    activeProviderData,
    connected: activeProviderData?.health?.connected || false,
    model: activeProviderData?.defaultModel || 'Unknown',
    isFallback: activeProviderData?.isFallback || false,
    isLoading,
    isError,
    error,
    refetch,
    getProviderInfo,
    isProviderReady,
    switchProvider,
    isSwitching: switchMutation.isPending
  };
}

export default useAIStatus;
