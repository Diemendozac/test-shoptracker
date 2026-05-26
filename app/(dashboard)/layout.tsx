'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { useAppSelector } from '@/store/hooks'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
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
  }, [pathname])

  // Render nothing until client-side hydration — avoids server/client mismatch
  if (!mounted) return null

  if (!isAuthenticated) return null

  const isHome = pathname === '/home'

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar pinned={!isHome} />
        <main className={cn(
          'flex flex-1 flex-col transition-all duration-300',
          isHome ? 'pl-16' : 'pl-64',
        )}>
          <AppHeader />
          <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}
