import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useCallback } from 'react';

/**
 * Hook for monitoring AI provider health, switching providers,
 * and getting provider-specific metadata
 */
export function useAIStatus(options = {}) {
  const queryClient = useQueryClient();
  const polling = options?.polling || false;

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
      // Invalidate related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['ai-providers-status'] });
      queryClient.invalidateQueries({ queryKey: ['ai-models-selector'] });
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] });
      return result;
    }
  });

  /**
   * Get metadata for a provider (icon name, color, label)
   * Returns keys that the UI can map to actual Lucide components
   */
  const getProviderInfo = useCallback((name) => {
    const infoMap = {
      ollama: {
        iconType: 'server',
        color: 'text-orange-500',
        label: 'Ollama (Local)'
      },
      openclaw: {
        iconType: 'zap',
        color: 'text-violet-500',
        label: 'OpenClaw Gateway'
      },
      groq: {
        iconType: 'zap',
        color: 'text-orange-400',
        label: 'Groq Cloud'
      },
      anthropic: {
        iconType: 'cloud',
        color: 'text-blue-500',
        label: 'Anthropic Claude'
      },
      openai: {
        iconType: 'cpu',
        color: 'text-emerald-500',
        label: 'OpenAI GPT'
      }
    };

    return infoMap[name] || {
      iconType: 'activity',
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
  const switchProvider = useCallback(async (name) => {
    try {
      const result = await switchMutation.mutateAsync(name);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [switchMutation]);

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
