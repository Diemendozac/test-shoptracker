'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/store/hooks'
import {
  LayoutDashboard,
  FlaskConical,
  Store,
  Settings,
  TrendingUp,
  ChevronDown,
  Building2,
  Globe,
} from 'lucide-react'

const TOP_NAV = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
]

const BOTTOM_NAV = [
  { name: 'Stores', href: '/stores', icon: Store },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const TESTEOS_ITEMS = [
  { name: 'Mis tiendas', href: '/tracker', icon: Building2 },
  { name: 'Todas',       href: '/pool',    icon: Globe },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAppSelector((s) => s.auth)
  const displayName = user?.email?.split('@')[0] ?? '—'
  const avatarLetter = displayName[0]?.toUpperCase() ?? '?'

  const inTesteos = pathname.startsWith('/tracker') || pathname.startsWith('/pool')
  const [open, setOpen] = useState(inTesteos)

  // Keep open when navigating to a testeos route
  useEffect(() => {
    if (inTesteos) setOpen(true)
  }, [inTesteos])

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <TrendingUp className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">ShopTracker</span>
          <span className="text-xs text-muted-foreground">Intelligence Platform</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {/* Top items */}
        {TOP_NAV.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )}
            >
              <item.icon className={cn('h-4 w-4 shrink-0 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary')} />
              {item.name}
              {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          )
        })}

        {/* Testeos accordion */}
        <div>
          <button
            onClick={() => setOpen((v) => !v)}
            className={cn(
              'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              inTesteos
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
            )}
          >
            <FlaskConical className={cn('h-4 w-4 shrink-0 transition-colors',
              inTesteos ? 'text-primary' : 'text-muted-foreground group-hover:text-primary')} />
            <span className="flex-1 text-left">Testeos</span>
            <ChevronDown className={cn(
              'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
              open && 'rotate-180',
            )} />
          </button>

          {/* Sub-items */}
          <div className={cn(
            'overflow-hidden transition-all duration-200',
            open ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0',
          )}>
            <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-3">
              {TESTEOS_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <Link key={item.name} href={item.href}
                    className={cn(
                      'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-200',
                      isActive
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                    )}
                  >
                    <item.icon className={cn('h-3.5 w-3.5 shrink-0',
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary')} />
                    {item.name}
                    {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom items */}
        {BOTTOM_NAV.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link key={item.name} href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )}
            >
              <item.icon className={cn('h-4 w-4 shrink-0 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary')} />
              {item.name}
              {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
            {avatarLetter}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
            <span className="text-xs text-muted-foreground">{user?.email ?? ''}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
