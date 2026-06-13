'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useGetMeQuery } from '@/app/(dashboard)/services/userApi'

export type PlanOverride = 'real' | 'starter' | 'pro' | 'agency'

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

export function usePlanTier() {
  const { effectivePlan } = useViewAs()
  const isPro     = effectivePlan === 'pro' || effectivePlan === 'agency' || effectivePlan === 'admin'
  const isStarter = effectivePlan === 'starter'
  const canViewAds   = true                 // all plans: thumbnails + hover; only Pro gets Meta link
  const allowMetaLink = isPro               // badge clickable + Meta link
  return { isPro, isStarter, canViewAds, allowMetaLink }
}
