import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import type { Issue } from '../../types.js';
import { API, type ApiError, apiFetch } from '../../util/apiFetch.js';

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
let visibilityListener: (() => void) | null = null;

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
    scheduleNotify({ type: 'change', affectsAll: true });
  }, FALLBACK_POLL_INTERVAL);

  visibilityListener = () => {
    if (document.visibilityState !== 'visible') return;
    try {
      if (localStorage.getItem('beadee-refetch-on-focus') === 'false') return;
    } catch {
      return;
    }
    scheduleNotify({ type: 'change', affectsAll: true });
  };
  document.addEventListener('visibilitychange', visibilityListener);
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
    if (visibilityListener) document.removeEventListener('visibilitychange', visibilityListener);
    fallbackInterval = null;
    sseReconnectTimer = null;
    notifyDebounceTimer = null;
    pendingEvent = null;
    visibilityListener = null;
  });
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
  includeParentEpics?: boolean;
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
        void queryClient.invalidateQueries({ queryKey: ['epicStatuses'] });
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
        void queryClient.invalidateQueries({ queryKey: ['comments'] });
      }
    });
  }, [queryClient]);

  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  if (filters.search) params.set('search', filters.search);
  if (filters.includeParentEpics) params.set('includeParentEpics', '1');
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
    queryKey: [
      'issues',
      filters.status ?? '',
      filters.type ?? '',
      filters.search ?? '',
      filters.includeParentEpics ? '1' : '',
    ],
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
