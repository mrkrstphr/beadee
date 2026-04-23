import { useQuery } from '@tanstack/react-query';
import type { EpicStatus } from '../../types.js';
import { apiFetch } from '../../util/apiFetch.js';

export function useEpicStatuses(): Map<string, EpicStatus> {
  const { data } = useQuery<EpicStatus[]>({
    queryKey: ['epicStatuses'],
    queryFn: () => apiFetch<EpicStatus[]>('/epic-status'),
    staleTime: 30_000,
  });

  const map = new Map<string, EpicStatus>();
  if (data) {
    for (const status of data) {
      map.set(status.epic_id, status);
    }
  }
  return map;
}
