import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Issue } from '../../types.js';
import { apiFetch } from '../../util/apiFetch.js';

export interface CreateIssueData {
  title: string;
  description?: string;
  type?: string;
  priority?: number;
  estimate?: number | null;
  due?: string | null;
  notes?: string;
  design?: string;
  acceptance?: string;
  external_ref?: string;
  parent?: string;
  labels?: string[];
}

function createIssue(data: CreateIssueData): Promise<Issue> {
  return apiFetch<Issue>('/issues', { method: 'POST', body: JSON.stringify(data) });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIssueData) => createIssue(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
}
