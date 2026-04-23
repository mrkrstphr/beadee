import { useQuery } from '@tanstack/react-query';
import type { Comment } from '../../types.js';
import { apiFetch } from '../../util/apiFetch.js';

interface UseCommentsResult {
  comments: Comment[];
  loading: boolean;
  error: string | null;
}

export function useComments(issueId: string | null | undefined): UseCommentsResult {
  const { data, isLoading, error } = useQuery<Comment[]>({
    queryKey: ['comments', issueId],
    queryFn: () => apiFetch<Comment[]>(`/issues/${issueId}/comments`),
    enabled: !!issueId,
  });

  return {
    comments: data ?? [],
    loading: isLoading && !!issueId,
    error: error ? (error as Error).message : null,
  };
}
