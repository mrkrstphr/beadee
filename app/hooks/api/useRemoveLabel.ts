import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../util/apiFetch.js';

function removeLabel(issueId: string, label: string): Promise<unknown> {
  return apiFetch(`/issues/${issueId}/labels`, {
    method: 'DELETE',
    body: JSON.stringify({ label }),
  });
}

export function useRemoveLabel(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (label: string) => removeLabel(issueId, label),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
      void queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
}
