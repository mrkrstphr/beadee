import { useState, useEffect, useCallback, useRef } from 'react'

const API = '/api'
const FALLBACK_POLL_INTERVAL = 30000

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.error || `HTTP ${res.status}`), { status: res.status })
  }
  return res.json()
}

// ── useIssues ────────────────────────────────────────────────────────────────

export function useIssues(filters = {}, { onRefreshed } = {}) {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)
  const onRefreshedRef = useRef(onRefreshed)
  onRefreshedRef.current = onRefreshed

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.type)   params.set('type', filters.type)
    if (filters.search) params.set('search', filters.search)
    const qs = params.toString()
    return qs ? `/issues?${qs}` : '/issues'
  }, [filters.status, filters.type, filters.search])

  const fetchIssues = useCallback(async (isPoll = false) => {
    if (isPoll) setPolling(true)
    try {
      const data = await apiFetch(buildUrl())
      setIssues(data)
      const now = new Date()
      setLastUpdated(now)
      onRefreshedRef.current?.(now)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setPolling(false)
    }
  }, [buildUrl])

  const refetch = useCallback(() => fetchIssues(), [fetchIssues])

  useEffect(() => {
    setLoading(true)
    fetchIssues()

    let es = null
    let fallbackTimer = null
    let reconnectTimer = null

    function startFallbackPoll() {
      clearInterval(fallbackTimer)
      fallbackTimer = setInterval(() => {
        if (document.visibilityState === 'visible') fetchIssues(true)
      }, FALLBACK_POLL_INTERVAL)
    }

    function connectSSE() {
      if (es) { es.close(); es = null }
      es = new EventSource('/api/events')

      es.onopen = () => {
        clearTimeout(reconnectTimer)
      }

      es.onmessage = () => {
        if (document.visibilityState === 'visible') fetchIssues(true)
      }

      es.onerror = () => {
        es.close()
        es = null
        // Retry SSE after 5s; fallback poll keeps data fresh in the meantime
        reconnectTimer = setTimeout(connectSSE, 5000)
      }
    }

    connectSSE()
    startFallbackPoll()

    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchIssues(true)
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      es?.close()
      clearInterval(fallbackTimer)
      clearTimeout(reconnectTimer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [fetchIssues])

  return { issues, loading, polling, error, refetch, lastUpdated }
}

// ── useIssue ─────────────────────────────────────────────────────────────────

export function useIssue(id) {
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) { setIssue(null); return }
    let cancelled = false
    setLoading(true)
    apiFetch(`/issues/${id}`)
      .then(data => { if (!cancelled) { setIssue(data); setError(null) } })
      .catch(err => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  return { issue, loading, error }
}

// ── useHealth ────────────────────────────────────────────────────────────────

export function useHealth() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiFetch('/health')
      .then(data => { setHealth(data); setError(null) })
      .catch(err => setError(err.message))
  }, [])

  return { health, error }
}

// ── Mutation helpers ─────────────────────────────────────────────────────────

export async function createIssue(data) {
  return apiFetch('/issues', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateIssue(id, data) {
  return apiFetch(`/issues/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function closeIssue(id, reason) {
  return apiFetch(`/issues/${id}/close`, {
    method: 'POST',
    body: JSON.stringify(reason ? { reason } : {}),
  })
}

export async function addDep(issue, dependsOn) {
  return apiFetch('/deps', { method: 'POST', body: JSON.stringify({ issue, dependsOn }) })
}

export async function removeDep(issue, dependsOn) {
  return apiFetch('/deps', { method: 'DELETE', body: JSON.stringify({ issue, dependsOn }) })
}
