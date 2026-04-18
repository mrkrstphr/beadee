import { useState, useCallback, useRef, useEffect } from 'react';
import type { Toast } from '../types.js';

type AddToastFn = (toast: Toast) => void;

let _addToast: AddToastFn | null = null;

export function toast(message: string, type: Toast['type'] = 'success'): void {
  _addToast?.({ message, type, id: Date.now() + Math.random() });
}

interface UseToastProviderResult {
  toasts: Toast[];
  dismiss: (id: number) => void;
}

export function useToastProvider(): UseToastProviderResult {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const add = useCallback(({ message, type, id }: Toast) => {
    setToasts((ts) => [...ts, { message, type, id }]);
    timers.current[id] = setTimeout(() => {
      setToasts((ts) => ts.filter((t) => t.id !== id));
      delete timers.current[id];
    }, 2500);
  }, []);

  useEffect(() => {
    _addToast = add;
    return () => {
      _addToast = null;
    };
  }, [add]);

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  return { toasts, dismiss };
}
