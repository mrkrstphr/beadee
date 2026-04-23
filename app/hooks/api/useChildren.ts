import { useQuery } from '@tanstack/react-query';
import type { Issue } from '../../types.js';
import { apiFetch } from '../../util/apiFetch.js';

interface UseChildrenResult {
  children: Issue[];
  loading: boolean;
}

export function useChildren(id: string | null | undefined): UseChildrenResult {
  const { data, isLoading } = useQuery<Issue[]>({
    queryKey: ['children', id],
    queryFn: () => apiFetch<Issue[]>(`/issues/${id}/children`),
    enabled: !!id,
    placeholderData: (prev) => prev,
  });

  return {
    children: data ?? [],
    loading: isLoading && !!id,
  };
}
