import { useState, useEffect, useCallback, useRef } from 'react';
import type { Issue, Comment, HealthData, LabelItem } from '../types.js';

const API = '/api';
const FALLBACK_POLL_INTERVAL = 30000;

const sseSubscribers = new Set<() => void>();

function notifyAll() {
  for (const fn of sseSubscribers) fn();
}

let sseInstance: EventSource | null = null;
let fallbackInterval: ReturnType<typeof setInterval> | null = null;
let sseReconnectTimer: ReturnType<typeof setTimeout> | null = null;

function ensureSSE() {
  if (sseInstance) return;

  function connect() {
    sseInstance = new EventSource(`${API}/events`);
    sseInstance.onmessage = () => notifyAll();
    sseInstance.onerror = () => {
      sseInstance!.close();
      sseInstance = null;
      sseReconnectTimer = setTimeout(connect, 5000);
    };
  }

  connect();

  fallbackInterval = setInterval(() => {
    if (document.visibilityState === 'visible') notifyAll();
  }, FALLBACK_POLL_INTERVAL);
}

function subscribeTick(fn: () => void): () => void {
  sseSubscribers.add(fn);
  ensureSSE();
  return () => sseSubscribers.delete(fn);
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (sseInstance) {
      sseInstance.close();
      sseInstance = null;
    }
    if (fallbackInterval) clearInterval(fallbackInterval);
    if (sseReconnectTimer) clearTimeout(sseReconnectTimer);
    fallbackInterval = null;
    sseReconnectTimer = null;
  });
}

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

interface UseIssuesFilters {
  status?: string;
  type?: string;
  search?: string;
}

interface UseIssuesOptions {
  onRefreshed?: (date: Date) => void;
}

interface UseIssuesResult {
  issues: Issue[];
  loading: boolean;
  polling: boolean;
  error: string | null;
  refetch: () => void;
  lastUpdated: Date | null;
}

export function useIssues(
  filters: UseIssuesFilters = {},
  { onRefreshed }: UseIssuesOptions = {},
): UseIssuesResult {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const onRefreshedRef = useRef(onRefreshed);

  useEffect(() => {
    onRefreshedRef.current = onRefreshed;
  });

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.type) params.set('type', filters.type);
    if (filters.search) params.set('search', filters.search);
    const qs = params.toString();
    return qs ? `/issues?${qs}` : '/issues';
  }, [filters.status, filters.type, filters.search]);

  const fetchIssues = useCallback(
    async (isPoll = false) => {
      if (isPoll) setPolling(true);
      else setLoading(true);
      try {
        const data = await apiFetch<Issue[]>(buildUrl());
        setIssues(data);
        const now = new Date();
        setLastUpdated(now);
        onRefreshedRef.current?.(now);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
        setPolling(false);
      }
    },
    [buildUrl],
  );

  const refetch = useCallback(() => fetchIssues(), [fetchIssues]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchIssues();

    const unsub = subscribeTick(() => {
      if (document.visibilityState === 'visible') fetchIssues(true);
    });

    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchIssues(true);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      unsub();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchIssues]);

  return { issues, loading, polling, error, refetch, lastUpdated };
}

interface UseIssueResult {
  issue: Issue | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

export function useIssue(id: string | null | undefined): UseIssueResult {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchIssue = useCallback(async () => {
    if (!id) {
      setIssue(null);
      setNotFound(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch<Issue>(`/issues/${id}`);
      setIssue(data);
      setError(null);
      setNotFound(false);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 404) {
        setNotFound(true);
        setError(null);
      } else {
        setError(apiErr.message);
        setNotFound(false);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchIssue();
    if (!id) return;
    return subscribeTick(() => {
      if (document.visibilityState === 'visible') fetchIssue();
    });
  }, [id, fetchIssue]);

  return { issue, loading, error, notFound };
}

interface UseChildrenResult {
  children: Issue[];
  loading: boolean;
}

export function useChildren(id: string | null | undefined): UseChildrenResult {
  const [children, setChildren] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChildren = useCallback(async () => {
    if (!id) {
      setChildren([]);
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch<Issue[]>(`/issues/${id}/children`);
      setChildren(Array.isArray(data) ? data : []);
    } catch {
      setChildren([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchChildren();
    if (!id) return;
    return subscribeTick(() => {
      if (document.visibilityState === 'visible') fetchChildren();
    });
  }, [id, fetchChildren]);

  return { children, loading };
}

interface UseHealthResult {
  health: HealthData | null;
  error: string | null;
  loading: boolean;
}

export function useHealth(): UseHealthResult {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<HealthData>('/health')
      .then((data) => {
        setHealth(data);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { health, error, loading };
}

interface CreateIssueData {
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

interface UpdateIssueData {
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

export async function createIssue(data: CreateIssueData): Promise<Issue> {
  return apiFetch<Issue>('/issues', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateIssue(id: string, data: UpdateIssueData): Promise<Issue> {
  return apiFetch<Issue>(`/issues/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function closeIssue(id: string, reason?: string): Promise<unknown> {
  return apiFetch(`/issues/${id}/close`, {
    method: 'POST',
    body: JSON.stringify(reason ? { reason } : {}),
  });
}

export async function deleteIssue(id: string): Promise<unknown> {
  return apiFetch(`/issues/${id}`, { method: 'DELETE' });
}

export async function addDep(issue: string, dependsOn: string): Promise<unknown> {
  return apiFetch('/deps', { method: 'POST', body: JSON.stringify({ issue, dependsOn }) });
}

export async function removeDep(issue: string, dependsOn: string): Promise<unknown> {
  return apiFetch('/deps', { method: 'DELETE', body: JSON.stringify({ issue, dependsOn }) });
}

export async function addLabel(issueId: string, label: string): Promise<unknown> {
  return apiFetch(`/issues/${issueId}/labels`, {
    method: 'POST',
    body: JSON.stringify({ label }),
  });
}

export async function removeLabel(issueId: string, label: string): Promise<unknown> {
  return apiFetch(`/issues/${issueId}/labels`, {
    method: 'DELETE',
    body: JSON.stringify({ label }),
  });
}

export function useLabels(): LabelItem[] {
  const [labels, setLabels] = useState<LabelItem[]>([]);

  useEffect(() => {
    apiFetch<LabelItem[]>('/labels')
      .then((data) => setLabels(data))
      .catch(() => {});
  }, []);

  return labels;
}

export type { Comment };
