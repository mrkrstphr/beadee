import { useState, useEffect, useCallback } from 'react';
import { toast } from './useToast.js';

const API = '/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || `HTTP ${res.status}`), { status: res.status });
  }
  return res.json();
}

export function useComments(issueId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!issueId) {
      setComments([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiFetch(`/issues/${issueId}/comments`)
      .then((data) => {
        if (!cancelled) setComments(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [issueId]);

  const addComment = useCallback(
    async (text) => {
      if (!text?.trim()) return;

      // Optimistic update
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        issue_id: issueId,
        author: 'You',
        text: text.trim(),
        created_at: new Date().toISOString(),
        optimistic: true,
      };
      setComments((cs) => [...cs, optimistic]);

      try {
        const saved = await apiFetch(`/issues/${issueId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ text: text.trim() }),
        });
        // Replace optimistic entry with real one
        setComments((cs) => cs.map((c) => (c.id === optimistic.id ? saved : c)));
      } catch (err) {
        // Roll back optimistic entry
        setComments((cs) => cs.filter((c) => c.id !== optimistic.id));
        toast(err.message, 'error');
        throw err;
      }
    },
    [issueId],
  );

  return { comments, loading, error, addComment };
}
