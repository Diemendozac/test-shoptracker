'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { useAppSelector } from '@/store/hooks'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isAuthenticated) router.replace('/login')
  }, [mounted, isAuthenticated, router])

  // Render nothing until client-side hydration — avoids server/client mismatch
  if (!mounted) return null

  if (!isAuthenticated) return null

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex flex-1 flex-col pl-64">
          <AppHeader title="Shop Tracker" />
          <div className="flex-1 overflow-auto">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}
