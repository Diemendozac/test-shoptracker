'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useGetMeQuery } from '@/app/(dashboard)/services/userApi'

export type PlanOverride = 'real' | 'free' | 'starter' | 'pro' | 'agency'

interface ViewAsContextValue {
  effectivePlan: string
  realPlan: string
  viewAs: PlanOverride
  setViewAs: (plan: PlanOverride) => void
  isAdmin: boolean
  signupDate: string | null
}

const ViewAsContext = createContext<ViewAsContextValue>({
  effectivePlan: 'free',
  realPlan: 'free',
  viewAs: 'real',
  setViewAs: () => {},
  isAdmin: false,
  signupDate: null,
})

export function ViewAsProvider({ children }: { children: React.ReactNode }) {
  const { data: me } = useGetMeQuery()
  const [viewAs, setViewAsState] = useState<PlanOverride>('real')

  // Fallback restrictivo mientras /users/me carga o falla — nunca asumir un plan pago por defecto.
  const realPlan = me?.plan ?? 'free'
  const isAdmin = realPlan === 'admin'
  const signupDate = me?.createdAt ?? null

  // Restore persisted override on mount (admin only)
  useEffect(() => {
    if (!isAdmin) return
    const stored = localStorage.getItem('dropspy_view_as') as PlanOverride | null
    if (stored && stored !== 'real') setViewAsState(stored)
  }, [isAdmin])

  function setViewAs(plan: PlanOverride) {
    setViewAsState(plan)
    if (plan === 'real') localStorage.removeItem('dropspy_view_as')
    else localStorage.setItem('dropspy_view_as', plan)
  }

  const effectivePlan = isAdmin && viewAs !== 'real' ? viewAs : realPlan

  return (
    <ViewAsContext.Provider value={{ effectivePlan, realPlan, viewAs, setViewAs, isAdmin, signupDate }}>
      {children}
    </ViewAsContext.Provider>
  )
}

export function useViewAs() {
  return useContext(ViewAsContext)
}

export function useIsPro(): boolean {
  const { effectivePlan } = useViewAs()
  return effectivePlan === 'pro' || effectivePlan === 'agency' || effectivePlan === 'admin'
}

// maxPoolPage: última página (0-indexed) visible en el pool global antes de bloquear.
// 'free' = prueba gratis de 7 días — solo página 1. Ver docs/CHANGES.md CHANGE-074.
const MAX_POOL_PAGE: Record<string, number> = {
  free:    0,
  starter: 499,
  pro:     999,
  agency:  Infinity,
  admin:   Infinity,
}

const TRIAL_DAYS = 7

// Aproximación solo-frontend: no hay campo de expiración en el backend todavía
// (ver docs/CHANGES.md CHANGE-074 y CHANGE-076). Se calcula sobre createdAt del
// plan real (no el override de ViewAs, para no bloquear al admin haciendo QA).
export function useTrialStatus() {
  const { realPlan, signupDate } = useViewAs()
  const isFreePlan = realPlan === 'free'

  if (!isFreePlan || !signupDate) {
    return { isTrial: isFreePlan, isExpired: false, daysLeft: TRIAL_DAYS }
  }

  const daysElapsed = Math.floor((Date.now() - new Date(signupDate).getTime()) / (1000 * 60 * 60 * 24))
  const daysLeft = Math.max(0, TRIAL_DAYS - daysElapsed)

  return { isTrial: true, isExpired: daysElapsed >= TRIAL_DAYS, daysLeft }
}

export function usePlanTier() {
  const { effectivePlan } = useViewAs()
  const isPro     = effectivePlan === 'pro' || effectivePlan === 'agency' || effectivePlan === 'admin'
  const isStarter = effectivePlan === 'starter'
  const isTrial   = effectivePlan === 'free'
  const maxPoolPage    = MAX_POOL_PAGE[effectivePlan] ?? MAX_POOL_PAGE.free
  const canViewAds     = !isTrial           // trial: sin video ads; el resto ve thumbnail + hover
  const allowMetaLink  = isPro              // badge clickable + link a Meta Ads Library
  // La prueba SÍ puede agregar tiendas, rastrear y testear candidatos — lo que queda
  // bloqueado es la data calculada (score/tendencia/crecimiento) en Mis testeos.
  const canViewTrackerMetrics = !isTrial
  return { isPro, isStarter, isTrial, maxPoolPage, canViewAds, allowMetaLink, canViewTrackerMetrics }
}
