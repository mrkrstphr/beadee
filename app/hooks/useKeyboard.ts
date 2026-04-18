import { useEffect } from 'react';

type KeyBindings = Record<string, (e: KeyboardEvent) => void>;

export function useKeyboard(bindings: KeyBindings, active = true): void {
  useEffect(() => {
    if (!active) return;

    function handler(e: KeyboardEvent) {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (e.key !== 'Escape' && (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const fn = bindings[e.key];
      if (fn) {
        e.preventDefault();
        fn(e);
      }
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [bindings, active]);
}
