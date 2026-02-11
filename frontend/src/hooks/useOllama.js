import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useOllama() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ollama-status'],
    queryFn: () => api.health(),
    refetchInterval: 30000, // Poll every 30 seconds
    retry: false
  });

  return {
    connected: data?.ollama?.connected || false,
    model: data?.ollama?.model || 'Unknown',
    available: data?.ollama?.available || false,
    isLoading,
    refetch
  };
}
