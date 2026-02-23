import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useAIStatus() {
  const { data, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['ai-health'],
    queryFn: () => api.ai.getProviders(),
    refetchInterval: 30000,
    retry: 1
  });

  const activeProvider = data?.active || 'ollama';
  const providers = data?.providers || [];
  const activeProviderData = providers.find(p => p.name === activeProvider);
  
  return {
    activeProvider,
    providers,
    activeProviderData,
    connected: activeProviderData?.health?.connected || false,
    model: activeProviderData?.defaultModel || 'Unknown',
    isLoading,
    isError,
    error,
    refetch
  };
}
