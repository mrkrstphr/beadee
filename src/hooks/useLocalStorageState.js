import { useState, useEffect } from 'react'

export function useLocalStorageState(key, defaultValue) {
  const [state, setState] = useState(defaultValue)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key)
      if (saved !== null) {
        setState(saved)
      }
    } catch (e) {
      console.warn(`Error reading localStorage key "${key}":`, e)
    }
    setIsLoaded(true)
  }, [key])

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(key, state)
      } catch (e) {
        console.warn(`Error writing localStorage key "${key}":`, e)
      }
    }
  }, [key, state, isLoaded])

  return [state, setState]
}
