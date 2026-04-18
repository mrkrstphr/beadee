import type { Dispatch, SetStateAction } from 'react';
import { useState, useEffect } from 'react';

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) return JSON.parse(saved) as T;
    } catch (e) {
      console.warn(`Error reading localStorage key "${key}":`, e);
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn(`Error writing localStorage key "${key}":`, e);
    }
  }, [key, state]);

  return [state, setState];
}
