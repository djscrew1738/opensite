import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export function useLeadScoring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leadId) => api.leads.score(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  });
}
