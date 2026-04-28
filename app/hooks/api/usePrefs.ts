import { useCallback, useEffect, useRef } from 'react';
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: prefs } = useQuery({
    queryKey: ['prefs'],
    queryFn: fetchPrefs,
    staleTime: Infinity,
  });

  const { mutate } = useMutation({
    mutationFn: (value: number) => writePref(key, String(value)),
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['prefs'] });
    },
  });

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const setValue = useCallback(
    (value: number) => {
      queryClient.setQueryData<Record<string, string>>(['prefs'], (prev) => ({
        ...(prev ?? {}),
        [key]: String(value),
      }));
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => mutate(value), 500);
    },
    [key, mutate, queryClient],
  );

  const raw = prefs?.[key];
  const value = raw !== undefined ? Number(raw) : defaultValue;

  return [Number.isFinite(value) ? value : defaultValue, setValue];
}
