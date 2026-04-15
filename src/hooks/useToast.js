import { useState, useCallback, useRef } from 'react'

let _addToast = null

/** Call from anywhere (outside React) to fire a toast. */
export function toast(message, type = 'success') {
  _addToast?.({ message, type, id: Date.now() + Math.random() })
}

export function useToastProvider() {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const add = useCallback(({ message, type, id }) => {
    setToasts(ts => [...ts, { message, type, id }])
    timers.current[id] = setTimeout(() => {
      setToasts(ts => ts.filter(t => t.id !== id))
      delete timers.current[id]
    }, 2500)
  }, [])

  // Register global accessor
  _addToast = add

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts(ts => ts.filter(t => t.id !== id))
  }, [])

  return { toasts, dismiss }
}
