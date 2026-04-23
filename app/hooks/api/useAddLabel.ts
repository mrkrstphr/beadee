import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../util/apiFetch.js';

function addLabel(issueId: string, label: string): Promise<unknown> {
  return apiFetch(`/issues/${issueId}/labels`, {
    method: 'POST',
    body: JSON.stringify({ label }),
  });
}

export function useAddLabel(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (label: string) => addLabel(issueId, label),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
      void queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
}
