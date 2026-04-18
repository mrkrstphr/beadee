import { useState, useEffect, useCallback, useRef } from 'react';

const API = '/api';
const FALLBACK_POLL_INTERVAL = 30000;

// ── SSE singleton ─────────────────────────────────────────────────────────────
// One EventSource for the whole app lifetime. Subscribers register callbacks;
// on each change event all are notified. Falls back to a 30s interval poll.

const sseSubscribers = new Set();

function notifyAll() {
  for (const fn of sseSubscribers) fn();
}

let sseInstance = null;
let fallbackInterval = null;
let sseReconnectTimer = null;

function ensureSSE() {
  if (sseInstance) return;

  function connect() {
    sseInstance = new EventSource(`${API}/events`);
    sseInstance.onmessage = () => notifyAll();
    sseInstance.onerror = () => {
      sseInstance.close();
      sseInstance = null;
      sseReconnectTimer = setTimeout(connect, 5000);
    };
  }

  connect();

  fallbackInterval = setInterval(() => {
    if (document.visibilityState === 'visible') notifyAll();
  }, FALLBACK_POLL_INTERVAL);
}

function subscribeTick(fn) {
  sseSubscribers.add(fn);
  ensureSSE();
  return () => sseSubscribers.delete(fn);
}

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

// ── useIssues ────────────────────────────────────────────────────────────────

export function useIssues(filters = {}, { onRefreshed } = {}) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const timerRef = useRef(null);
  const onRefreshedRef = useRef(onRefreshed);
  onRefreshedRef.current = onRefreshed;

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
      try {
        const data = await apiFetch(buildUrl());
        setIssues(data);
        const now = new Date();
        setLastUpdated(now);
        onRefreshedRef.current?.(now);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setPolling(false);
      }
    },
    [buildUrl],
  );

  const refetch = useCallback(() => fetchIssues(), [fetchIssues]);

  useEffect(() => {
    setLoading(true);
    fetchIssues();

    // Subscribe to the shared SSE singleton — no per-instance connection
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

// ── useIssue ─────────────────────────────────────────────────────────────────

export function useIssue(id) {
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchIssue = useCallback(async () => {
    if (!id) {
      setIssue(null);
      return;
    }
    try {
      const data = await apiFetch(`/issues/${id}`);
      setIssue(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setIssue(null);
      return;
    }
    setLoading(true);
    fetchIssue();
    return subscribeTick(() => {
      if (document.visibilityState === 'visible') fetchIssue();
    });
  }, [id, fetchIssue]);

  return { issue, loading, error };
}

// ── useChildren ──────────────────────────────────────────────────────────────

export function useChildren(id) {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchChildren = useCallback(async () => {
    if (!id) {
      setChildren([]);
      return;
    }
    try {
      const data = await apiFetch(`/issues/${id}/children`);
      setChildren(Array.isArray(data) ? data : []);
    } catch {
      setChildren([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setChildren([]);
      return;
    }
    setLoading(true);
    fetchChildren();
    return subscribeTick(() => {
      if (document.visibilityState === 'visible') fetchChildren();
    });
  }, [id, fetchChildren]);

  return { children, loading };
}

// ── useHealth ────────────────────────────────────────────────────────────────

export function useHealth() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/health')
      .then((data) => {
        setHealth(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { health, error, loading };
}

// ── Mutation helpers ─────────────────────────────────────────────────────────

export async function createIssue(data) {
  return apiFetch('/issues', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateIssue(id, data) {
  return apiFetch(`/issues/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function closeIssue(id, reason) {
  return apiFetch(`/issues/${id}/close`, {
    method: 'POST',
    body: JSON.stringify(reason ? { reason } : {}),
  });
}

export async function deleteIssue(id) {
  return apiFetch(`/issues/${id}`, { method: 'DELETE' });
}

export async function addDep(issue, dependsOn) {
  return apiFetch('/deps', { method: 'POST', body: JSON.stringify({ issue, dependsOn }) });
}

export async function removeDep(issue, dependsOn) {
  return apiFetch('/deps', { method: 'DELETE', body: JSON.stringify({ issue, dependsOn }) });
}

export async function addLabel(issueId, label) {
  return apiFetch(`/issues/${issueId}/labels`, { method: 'POST', body: JSON.stringify({ label }) });
}

export async function removeLabel(issueId, label) {
  return apiFetch(`/issues/${issueId}/labels`, {
    method: 'DELETE',
    body: JSON.stringify({ label }),
  });
}

export function useLabels() {
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    apiFetch('/labels')
      .then((data) => setLabels(data))
      .catch(() => {});
  }, []);

  return labels;
}
