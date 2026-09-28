'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { useAppSelector } from '@/store/hooks'
import { ViewAsProvider } from '@/lib/view-as'
import { ViewAsBar } from '@/components/admin/ViewAsBar'
import { OnboardingModal } from '@/components/onboarding/onboarding-modal'
import { TrialExpiredGate } from '@/components/dashboard/trial-expired-gate'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const [mounted, setMounted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isAuthenticated) router.replace('/login')
  }, [mounted, isAuthenticated, router])

  // Reset scroll position on route change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [])

  // Render nothing until client-side hydration — avoids server/client mismatch
  if (!mounted) return null

  if (!isAuthenticated) return null

  return (
    <ViewAsProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar pinned={true} />
          <main className="flex flex-1 flex-col transition-all duration-300 pl-64">
            <AppHeader />
            {/* overflow-x-clip recorta igual que hidden pero NO crea un contenedor de scroll:
                así `sticky` en los hijos se ata a la ventana, que es la que scrollea. Con
                overflow-y-auto/overflow-x-hidden el sticky quedaba atado a este div, que nunca
                scrollea, y no hacía nada (ver docs/redesign/detalle-producto/01-diagnostico.md, P6). */}
            <div ref={scrollRef} className="flex-1 overflow-x-clip">
              <TrialExpiredGate>{children}</TrialExpiredGate>
            </div>
          </main>
        </div>
        <ViewAsBar />
        <OnboardingModal />
      </SidebarProvider>
    </ViewAsProvider>
  )
}
