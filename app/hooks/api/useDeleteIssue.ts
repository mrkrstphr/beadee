import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../util/apiFetch.js';

function deleteIssue(id: string): Promise<unknown> {
  return apiFetch(`/issues/${id}`, { method: 'DELETE' });
}

export function useDeleteIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteIssue(id),
    onSuccess: (_result, id) => {
      void queryClient.invalidateQueries({ queryKey: ['issues'] });
      void queryClient.invalidateQueries({ queryKey: ['issue', id] });
    },
  });
}
