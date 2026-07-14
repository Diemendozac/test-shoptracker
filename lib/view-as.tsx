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
}

const ViewAsContext = createContext<ViewAsContextValue>({
  effectivePlan: 'starter',
  realPlan: 'starter',
  viewAs: 'real',
  setViewAs: () => {},
  isAdmin: false,
})

export function ViewAsProvider({ children }: { children: React.ReactNode }) {
  const { data: me } = useGetMeQuery()
  const [viewAs, setViewAsState] = useState<PlanOverride>('real')

  const realPlan = me?.plan ?? 'starter'
  const isAdmin = realPlan === 'admin'

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
    <ViewAsContext.Provider value={{ effectivePlan, realPlan, viewAs, setViewAs, isAdmin }}>
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

export function usePlanTier() {
  const { effectivePlan } = useViewAs()
  const isPro     = effectivePlan === 'pro' || effectivePlan === 'agency' || effectivePlan === 'admin'
  const isStarter = effectivePlan === 'starter'
  const isTrial   = effectivePlan === 'free'
  const maxPoolPage    = MAX_POOL_PAGE[effectivePlan] ?? MAX_POOL_PAGE.free
  const canViewAds     = !isTrial           // trial: sin video ads; el resto ve thumbnail + hover
  const allowMetaLink  = isPro              // badge clickable + link a Meta Ads Library
  const canTrackStores = !isTrial           // trial: sin rastreador de tiendas
  return { isPro, isStarter, isTrial, maxPoolPage, canViewAds, allowMetaLink, canTrackStores }
}
