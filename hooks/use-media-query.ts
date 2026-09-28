import { useCallback, useSyncExternalStore } from 'react'

/**
 * true si la media query coincide. En el servidor (y en el primer render del cliente)
 * devuelve false, así el HTML hidratado coincide y no hay mismatch.
 * Ej.: useMediaQuery('(min-width: 1280px)')
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}
