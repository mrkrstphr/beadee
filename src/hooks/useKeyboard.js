import { useEffect } from 'react'

/**
 * Register keyboard shortcuts. Skips when focus is in an input/textarea/select.
 *
 * @param {Record<string, (e: KeyboardEvent) => void>} bindings - key → handler
 * @param {boolean} [active=true] - enable/disable the whole set
 */
export function useKeyboard(bindings, active = true) {
  useEffect(() => {
    if (!active) return

    function handler(e) {
      // Don't fire in inputs unless it's Escape
      const tag = document.activeElement?.tagName
      if (e.key !== 'Escape' && (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT')) return
      // Don't fire if modifier keys held (except Shift for ?)
      if (e.ctrlKey || e.metaKey || e.altKey) return

      const fn = bindings[e.key]
      if (fn) {
        e.preventDefault()
        fn(e)
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [bindings, active])
}
