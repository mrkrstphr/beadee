import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../util/apiFetch.js';

function addDep(issue: string, dependsOn: string): Promise<unknown> {
  return apiFetch('/deps', { method: 'POST', body: JSON.stringify({ issue, dependsOn }) });
}

export function useAddDependency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issue, dependsOn }: { issue: string; dependsOn: string }) =>
      addDep(issue, dependsOn),
    onSuccess: (_result, { issue }) => {
      void queryClient.invalidateQueries({ queryKey: ['issue', issue] });
      void queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
}
