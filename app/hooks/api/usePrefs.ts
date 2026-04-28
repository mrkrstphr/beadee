import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../util/apiFetch.js';

function fetchPrefs(): Promise<Record<string, string>> {
  return apiFetch('/prefs');
}

function writePref(key: string, value: string): Promise<{ ok: boolean }> {
  return apiFetch(`/prefs/${key}`, { method: 'POST', body: JSON.stringify({ value }) });
}

export function usePref(key: string, defaultValue: number): [number, (value: number) => void] {
  const queryClient = useQueryClient();

  const { data: prefs } = useQuery({
    queryKey: ['prefs'],
    queryFn: fetchPrefs,
    staleTime: Infinity,
  });

  const { mutate } = useMutation({
    mutationFn: (value: number) => writePref(key, String(value)),
    onMutate: (value) => {
      queryClient.setQueryData<Record<string, string>>(['prefs'], (prev) => ({
        ...prev,
        [key]: String(value),
      }));
    },
  });

  const raw = prefs?.[key];
  const value = raw !== undefined ? Number(raw) : defaultValue;

  return [Number.isFinite(value) ? value : defaultValue, mutate];
}
