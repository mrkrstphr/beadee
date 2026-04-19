import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { Comment } from '../types.js';
import { apiFetch } from '../util/apiFetch.js';
import { toast } from './useToast.js';

interface UseCommentsResult {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  addComment: (text: string) => Promise<void>;
}

export function useComments(issueId: string | null | undefined): UseCommentsResult {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<Comment[]>({
    queryKey: ['comments', issueId],
    queryFn: () => apiFetch<Comment[]>(`/issues/${issueId}/comments`),
    enabled: !!issueId,
  });

  const addComment = useCallback(
    async (text: string) => {
      if (!text?.trim() || !issueId) return;

      const optimistic: Comment = {
        id: `optimistic-${Date.now()}`,
        issue_id: issueId,
        author: 'You',
        text: text.trim(),
        created_at: new Date().toISOString(),
        optimistic: true,
      };

      queryClient.setQueryData<Comment[]>(['comments', issueId], (prev = []) => [
        ...prev,
        optimistic,
      ]);

      try {
        const saved = await apiFetch<Comment>(`/issues/${issueId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ text: text.trim() }),
        });
        queryClient.setQueryData<Comment[]>(['comments', issueId], (prev = []) =>
          prev.map((c) => (c.id === optimistic.id ? saved : c)),
        );
      } catch (err) {
        queryClient.setQueryData<Comment[]>(['comments', issueId], (prev = []) =>
          prev.filter((c) => c.id !== optimistic.id),
        );
        toast((err as Error).message, 'error');
        throw err;
      }
    },
    [issueId, queryClient],
  );

  return {
    comments: data ?? [],
    loading: isLoading && !!issueId,
    error: error ? (error as Error).message : null,
    addComment,
  };
}
