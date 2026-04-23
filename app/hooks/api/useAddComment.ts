import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Comment } from '../../types.js';
import { apiFetch } from '../../util/apiFetch.js';
import { toast } from '../useToast.js';

export function useAddComment(issueId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (text: string) =>
      apiFetch<Comment>(`/issues/${issueId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text: text.trim() }),
      }),
    onMutate: (text) => {
      const optimistic: Comment = {
        id: `optimistic-${Date.now()}`,
        issue_id: issueId!,
        author: 'You',
        text: text.trim(),
        created_at: new Date().toISOString(),
        optimistic: true,
      };
      queryClient.setQueryData<Comment[]>(['comments', issueId], (prev = []) => [
        ...prev,
        optimistic,
      ]);
      return { optimisticId: optimistic.id };
    },
    onSuccess: (saved, _text, ctx) => {
      queryClient.setQueryData<Comment[]>(['comments', issueId], (prev = []) =>
        prev.map((c) => (c.id === ctx.optimisticId ? saved : c)),
      );
    },
    onError: (err, _text, ctx) => {
      queryClient.setQueryData<Comment[]>(['comments', issueId], (prev = []) =>
        prev.filter((c) => c.id !== ctx?.optimisticId),
      );
      toast((err as Error).message, 'error');
    },
  });
}
