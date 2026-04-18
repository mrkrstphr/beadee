import { useState, useEffect, Dispatch, SetStateAction } from 'react';

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        setState(JSON.parse(saved) as T);
      }
    } catch (e) {
      console.warn(`Error reading localStorage key "${key}":`, e);
    }
    setIsLoaded(true);
  }, [key]);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch (e) {
        console.warn(`Error writing localStorage key "${key}":`, e);
      }
    }
  }, [key, state, isLoaded]);

  return [state, setState];
}
