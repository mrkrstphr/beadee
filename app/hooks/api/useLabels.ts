import { useQuery } from '@tanstack/react-query';
import type { LabelItem } from '../../types.js';
import { apiFetch } from '../../util/apiFetch.js';

export function useLabels(): LabelItem[] {
  const { data } = useQuery<LabelItem[]>({
    queryKey: ['labels'],
    queryFn: () => apiFetch<LabelItem[]>('/labels'),
    staleTime: 60_000,
  });
  return data ?? [];
}
