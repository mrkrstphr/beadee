import { useState, useEffect, useCallback } from 'react';
import { toast } from './useToast.js';
import type { Comment } from '../types.js';

const API = '/api';

interface ApiError extends Error {
  status?: number;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    const err: ApiError = Object.assign(new Error(body.error || `HTTP ${res.status}`), {
      status: res.status,
    });
    throw err;
  }
  return res.json() as Promise<T>;
}

interface UseCommentsResult {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  addComment: (text: string) => Promise<void>;
}

export function useComments(issueId: string | null | undefined): UseCommentsResult {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(
    async (signal: { aborted: boolean }) => {
      if (!issueId) {
        setComments([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<Comment[]>(`/issues/${issueId}/comments`);
        if (!signal.aborted) setComments(data);
      } catch (err) {
        if (!signal.aborted) setError((err as Error).message);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [issueId],
  );

  useEffect(() => {
    const signal = { aborted: false };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchComments(signal);
    return () => {
      signal.aborted = true;
    };
  }, [fetchComments]);

  const addComment = useCallback(
    async (text: string) => {
      if (!text?.trim()) return;

      const optimistic: Comment = {
        id: `optimistic-${Date.now()}`,
        issue_id: issueId!,
        author: 'You',
        text: text.trim(),
        created_at: new Date().toISOString(),
        optimistic: true,
      };
      setComments((cs) => [...cs, optimistic]);

      try {
        const saved = await apiFetch<Comment>(`/issues/${issueId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ text: text.trim() }),
        });
        setComments((cs) => cs.map((c) => (c.id === optimistic.id ? saved : c)));
      } catch (err) {
        setComments((cs) => cs.filter((c) => c.id !== optimistic.id));
        toast((err as Error).message, 'error');
        throw err;
      }
    },
    [issueId],
  );

  return { comments, loading, error, addComment };
}
