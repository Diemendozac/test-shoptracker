'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import { useAppSelector } from '@/store/hooks'

// La sesión vive en localStorage, así que el servidor no la conoce y su HTML sale como invitado.
// Para que la hidratación coincida, el primer render del cliente también es de invitado; lo de la
// sesión aparece recién después (mismo criterio que hooks/use-media-query.ts).
const subscribe = () => () => {}

export function useHasSession(): boolean {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false)
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  return hydrated && isAuthenticated
}

/** `session` si hay sesión; si no, `guest`. En el servidor y al hidratar, siempre `guest`. */
export function SessionSwitch({ guest, session }: { guest: ReactNode; session: ReactNode }) {
  const hasSession = useHasSession()
  return <>{hasSession ? session : guest}</>
}
