import { useState, useEffect, useCallback, useRef } from 'react'

const API = '/api'
const POLL_INTERVAL = 5000

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

export function useIssues(filters = {}) {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.type)   params.set('type', filters.type)
    if (filters.search) params.set('search', filters.search)
    const qs = params.toString()
    return qs ? `/issues?${qs}` : '/issues'
  }, [filters.status, filters.type, filters.search])

  const fetchIssues = useCallback(async () => {
    try {
      const data = await apiFetch(buildUrl())
      setIssues(data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [buildUrl])

  const refetch = useCallback(() => fetchIssues(), [fetchIssues])

  useEffect(() => {
    setLoading(true)
    fetchIssues()

    const schedule = () => {
      timerRef.current = setTimeout(() => {
        if (document.visibilityState === 'visible') fetchIssues()
        schedule()
      }, POLL_INTERVAL)
    }
    schedule()

    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchIssues()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearTimeout(timerRef.current)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [fetchIssues])

  return { issues, loading, error, refetch, lastUpdated }
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
