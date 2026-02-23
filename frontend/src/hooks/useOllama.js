import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useOllama() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ollama-status'],
    queryFn: () => api.health(),
    refetchInterval: 30000, // Poll every 30 seconds
    retry: false
  });

  // Backend returns AI status in data.ai with provider field
  const isOllamaActive = data?.provider === 'ollama' || data?.ai?.provider === 'ollama';
  
  return {
    connected: data?.ai?.connected || data?.ollama?.connected || false,
    model: data?.ai?.model || data?.ollama?.model || 'Unknown',
    available: data?.ai?.available !== undefined ? data.ai.available > 0 : data?.ollama?.available || false,
    isOllamaActive,
    isLoading,
    refetch
  };
}
