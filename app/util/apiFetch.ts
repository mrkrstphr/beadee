export interface ApiError extends Error {
  status?: number;
}

export const API = '/api';

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
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
