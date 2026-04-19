import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { Toast } from '../types.js';

type AddToastFn = (toast: Toast) => void;

interface ToastContextValue {
  toasts: Toast[];
  add: AddToastFn;
  dismiss: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

// Module-level ref kept in sync by ToastProvider so the imperative
// toast() helper works for non-hook call sites (event handlers, hooks).
let _addToast: AddToastFn | null = null;

export function toast(message: string, type: Toast['type'] = 'success'): void {
  _addToast?.({ message, type, id: Date.now() + Math.random() });
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

interface UseToastProviderResult {
  toasts: Toast[];
  add: AddToastFn;
  dismiss: (id: number) => void;
}

export function useToastProvider(): UseToastProviderResult {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const add = useCallback(({ message, type, id }: Toast) => {
    setToasts((ts) => [...ts, { message, type, id }]);
    timersRef.current[id] = setTimeout(() => {
      setToasts((ts) => ts.filter((t) => t.id !== id));
      delete timersRef.current[id];
    }, 2500);
  }, []);

  useEffect(() => {
    _addToast = add;
    return () => {
      _addToast = null;
    };
  }, [add]);

  const dismiss = useCallback((id: number) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  return { toasts, add, dismiss };
}
