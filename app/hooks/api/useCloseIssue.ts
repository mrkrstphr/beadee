import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../util/apiFetch.js';

function closeIssue(id: string, reason?: string): Promise<unknown> {
  return apiFetch(`/issues/${id}/close`, {
    method: 'POST',
    body: JSON.stringify(reason ? { reason } : {}),
  });
}

export function useCloseIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => closeIssue(id, reason),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['issues'] });
      void queryClient.invalidateQueries({ queryKey: ['issue', id] });
      void queryClient.invalidateQueries({ queryKey: ['epicStatuses'] });
    },
  });
}
