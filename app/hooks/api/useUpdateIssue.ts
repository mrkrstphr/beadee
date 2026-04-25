import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Issue } from '../../types.js';
import { apiFetch } from '../../util/apiFetch.js';

export interface UpdateIssueData {
  title?: string;
  description?: string;
  status?: string;
  assignee?: string;
  priority?: number;
  estimate?: number | null;
  due?: string | null;
  notes?: string;
  design?: string;
  acceptance?: string;
  external_ref?: string;
  parent?: string;
  labels?: string[];
  claim?: boolean;
}

function updateIssue(id: string, data: UpdateIssueData): Promise<Issue> {
  return apiFetch<Issue>(`/issues/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function useUpdateIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIssueData }) => updateIssue(id, data),
    onSuccess: (_result, { id, data }) => {
      void queryClient.invalidateQueries({ queryKey: ['issues'] });
      void queryClient.invalidateQueries({ queryKey: ['issue', id] });
      void queryClient.invalidateQueries({ queryKey: ['children', id] });
      if ('status' in data || 'parent' in data) {
        void queryClient.invalidateQueries({ queryKey: ['epicStatuses'] });
      }
    },
  });
}
