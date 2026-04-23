import { useQuery } from '@tanstack/react-query';
import type { HealthData } from '../../types.js';
import { apiFetch } from '../../util/apiFetch.js';

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
