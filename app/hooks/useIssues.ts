import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import type { Comment, HealthData, Issue, LabelItem } from '../types.js';

const API = '/api';

interface SSEEvent {
  type: string;
  affectsAll?: boolean;
  affectsListView?: boolean;
  affectedIds?: string[];
}

type TickHandler = (event: SSEEvent) => void;

const sseSubscribers = new Set<TickHandler>();

function notifyAll(event: SSEEvent) {
  for (const fn of sseSubscribers) fn(event);
}

let notifyDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingEvent: SSEEvent | null = null;

function mergeEvents(a: SSEEvent, b: SSEEvent): SSEEvent {
  if (a.affectsAll || b.affectsAll) return { type: 'change', affectsAll: true };
  return {
    type: 'change',
    affectsListView: a.affectsListView || b.affectsListView,
    affectedIds: [...new Set([...(a.affectedIds ?? []), ...(b.affectedIds ?? [])])],
  };
}

function scheduleNotify(event: SSEEvent) {
  pendingEvent = pendingEvent ? mergeEvents(pendingEvent, event) : event;
  if (notifyDebounceTimer) clearTimeout(notifyDebounceTimer);
  notifyDebounceTimer = setTimeout(() => {
    const e = pendingEvent!;
    pendingEvent = null;
    notifyDebounceTimer = null;
    notifyAll(e);
  }, 100);
}

let sseInstance: EventSource | null = null;
let fallbackInterval: ReturnType<typeof setInterval> | null = null;
let sseReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let globalVisibilityListener: (() => void) | null = null;

const FALLBACK_POLL_INTERVAL = 300000;

function ensureSSE() {
  if (sseInstance) return;

  function connect() {
    sseInstance = new EventSource(`${API}/events`);
    sseInstance.onmessage = (e) => {
      let event: SSEEvent;
      try {
        event = JSON.parse(e.data as string) as SSEEvent;
      } catch {
        event = { type: 'change', affectsAll: true };
      }
      scheduleNotify(event);
    };
    sseInstance.onerror = () => {
      sseInstance!.close();
      sseInstance = null;
      sseReconnectTimer = setTimeout(connect, 5000);
    };
  }

  connect();

  fallbackInterval = setInterval(() => {
    if (document.visibilityState === 'visible')
      scheduleNotify({ type: 'change', affectsAll: true });
  }, FALLBACK_POLL_INTERVAL);

  globalVisibilityListener = () => {
    if (document.visibilityState === 'visible')
      scheduleNotify({ type: 'change', affectsAll: true });
  };
  document.addEventListener('visibilitychange', globalVisibilityListener);
}

function subscribeTick(fn: TickHandler): () => void {
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
    if (notifyDebounceTimer) clearTimeout(notifyDebounceTimer);
    if (globalVisibilityListener)
      document.removeEventListener('visibilitychange', globalVisibilityListener);
    fallbackInterval = null;
    sseReconnectTimer = null;
    notifyDebounceTimer = null;
    pendingEvent = null;
    globalVisibilityListener = null;
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

// SSE → QueryClient invalidation bridge (call once at app init)
let sseInvalidationSetup = false;
export function setupSSEInvalidation(invalidate: (event: SSEEvent) => void) {
  if (sseInvalidationSetup) return;
  sseInvalidationSetup = true;
  subscribeTick((event) => {
    if (document.visibilityState === 'visible') invalidate(event);
  });
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    sseInvalidationSetup = false;
  });
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
  const queryClient = useQueryClient();

  useEffect(() => {
    setupSSEInvalidation((event) => {
      if (event.affectsAll || event.affectsListView) {
        void queryClient.invalidateQueries({ queryKey: ['issues'] });
      }
      if (event.affectedIds?.length) {
        for (const id of event.affectedIds) {
          void queryClient.invalidateQueries({ queryKey: ['issue', id] });
          void queryClient.invalidateQueries({ queryKey: ['children', id] });
          void queryClient.invalidateQueries({ queryKey: ['comments', id] });
        }
      }
      if (event.affectsAll) {
        void queryClient.invalidateQueries({ queryKey: ['issue'] });
        void queryClient.invalidateQueries({ queryKey: ['children'] });
      }
    });
  }, [queryClient]);

  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  if (filters.search) params.set('search', filters.search);
  const qs = params.toString();
  const url = qs ? `/issues?${qs}` : '/issues';

  const {
    data,
    isFetching,
    isLoading,
    error,
    dataUpdatedAt,
    refetch: rqRefetch,
  } = useQuery<Issue[]>({
    queryKey: ['issues', filters.status ?? '', filters.type ?? '', filters.search ?? ''],
    queryFn: () => apiFetch<Issue[]>(url),
    placeholderData: (prev) => prev,
    notifyOnChangeProps: ['data', 'error', 'status', 'isFetching'],
  });

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;
  const onRefreshedRef = useRef(onRefreshed);
  useEffect(() => {
    onRefreshedRef.current = onRefreshed;
  });

  useEffect(() => {
    if (dataUpdatedAt && onRefreshedRef.current) {
      onRefreshedRef.current(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  const refetch = useCallback(() => {
    void rqRefetch();
  }, [rqRefetch]);

  return {
    issues: data ?? [],
    loading: isLoading,
    polling: isFetching && !isLoading,
    error: error ? (error as Error).message : null,
    refetch,
    lastUpdated,
  };
}

interface UseIssueResult {
  issue: Issue | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

export function useIssue(id: string | null | undefined): UseIssueResult {
  const { data, isLoading, error } = useQuery<Issue>({
    queryKey: ['issue', id],
    queryFn: () => apiFetch<Issue>(`/issues/${id}`),
    enabled: !!id,
    retry: (failureCount, err) => {
      if ((err as ApiError).status === 404) return false;
      return failureCount < 1;
    },
  });

  const apiErr = error as ApiError | null;
  return {
    issue: data ?? null,
    loading: isLoading && !!id,
    error: apiErr && apiErr.status !== 404 ? apiErr.message : null,
    notFound: apiErr?.status === 404,
  };
}

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

interface UseHealthResult {
  health: HealthData | null;
  error: string | null;
  loading: boolean;
}

export function useHealth(): UseHealthResult {
  const { data, isLoading, error } = useQuery<HealthData>({
    queryKey: ['health'],
    queryFn: () => apiFetch<HealthData>('/health'),
    staleTime: 60_000,
  });

  return {
    health: data ?? null,
    error: error ? (error as Error).message : null,
    loading: isLoading,
  };
}

export function useLabels(): LabelItem[] {
  const { data } = useQuery<LabelItem[]>({
    queryKey: ['labels'],
    queryFn: () => apiFetch<LabelItem[]>('/labels'),
    staleTime: 60_000,
  });
  return data ?? [];
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

export type { Comment };
