'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/store/hooks'
import { useGetPendingCandidatesQuery } from '@/app/(dashboard)/services/candidateApi'
import {
  LayoutDashboard,
  FlaskConical,
  Store,
  Settings,
  TrendingUp,
  ChevronDown,
  Building2,
  Globe,
  Clock,
} from 'lucide-react'

const TOP_NAV = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
]

const BOTTOM_NAV = [
  { name: 'Stores', href: '/stores', icon: Store },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const TESTEOS_ITEMS = [
  { name: 'Mis testeos',      href: '/tracker',    icon: Building2 },
  { name: 'Explorar testeos', href: '/pool',       icon: Globe },
  { name: 'Pendientes',       href: '/pendientes', icon: Clock },
]

interface AppSidebarProps {
  pinned: boolean
}

export function AppSidebar({ pinned }: AppSidebarProps) {
  const pathname = usePathname()
  const { user } = useAppSelector((s) => s.auth)
  const displayName = user?.email?.split('@')[0] ?? '—'
  const avatarLetter = displayName[0]?.toUpperCase() ?? '?'

  const { data: pending } = useGetPendingCandidatesQuery()
  const pendingCount = pending?.length ?? 0

  const inTesteos = pathname.startsWith('/tracker') || pathname.startsWith('/pool') || pathname.startsWith('/pendientes')
  const [open, setOpen] = useState(inTesteos)
  const [hovered, setHovered] = useState(false)

  const expanded = pinned || hovered

  useEffect(() => {
    if (inTesteos) setOpen(true)
  }, [inTesteos])

  // Collapse hover state when sidebar becomes pinned
  useEffect(() => {
    if (pinned) setHovered(false)
  }, [pinned])

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out',
        expanded ? 'w-64' : 'w-16',
      )}
      onMouseEnter={() => !pinned && setHovered(true)}
      onMouseLeave={() => !pinned && setHovered(false)}
    >
      {/* Logo */}
      <Link
        href="/home"
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-border transition-opacity hover:opacity-80',
          expanded ? 'gap-3 px-6' : 'justify-center',
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
          <TrendingUp className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className={cn(
          'flex flex-col overflow-hidden transition-all duration-300',
          expanded ? 'max-w-[160px] opacity-100' : 'max-w-0 opacity-0',
        )}>
          <span className="whitespace-nowrap text-sm font-semibold text-foreground">ShopTracker</span>
          <span className="whitespace-nowrap text-xs text-muted-foreground">Intelligence Platform</span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">

        {/* Top items */}
        {TOP_NAV.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}
              className={cn(
                'group flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200',
                expanded ? 'gap-3 px-3' : 'justify-center',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )}
            >
              <item.icon className={cn('h-4 w-4 shrink-0 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary')} />
              <span className={cn(
                'overflow-hidden whitespace-nowrap transition-all duration-300',
                expanded ? 'max-w-[160px] opacity-100' : 'max-w-0 opacity-0',
              )}>
                {item.name}
              </span>
              {isActive && expanded && <div className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
            </Link>
          )
        })}

        {/* Testeos accordion */}
        <div>
          <button
            onClick={() => expanded && setOpen((v) => !v)}
            className={cn(
              'group flex w-full items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200',
              expanded ? 'gap-3 px-3' : 'justify-center',
              inTesteos
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
            )}
          >
            <FlaskConical className={cn('h-4 w-4 shrink-0 transition-colors',
              inTesteos ? 'text-primary' : 'text-muted-foreground group-hover:text-primary')} />
            <span className={cn(
              'flex-1 overflow-hidden whitespace-nowrap text-left transition-all duration-300',
              expanded ? 'max-w-[120px] opacity-100' : 'max-w-0 opacity-0',
            )}>
              Testeos
            </span>
            <ChevronDown className={cn(
              'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-all duration-300',
              open && expanded ? 'rotate-180' : '',
              expanded ? 'opacity-100' : 'max-w-0 opacity-0 overflow-hidden',
            )} />
          </button>

          <div className={cn(
            'overflow-hidden transition-all duration-200',
            (open && expanded) ? 'max-h-36 opacity-100' : 'max-h-0 opacity-0',
          )}>
            <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-3">
              {TESTEOS_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href)
                const isPendientes = item.href === '/pendientes'
                const showBadge = isPendientes && pendingCount > 0
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
                    <div className="ml-auto flex items-center gap-1.5">
                      {showBadge && (
                        <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white">
                          {pendingCount}
                        </span>
                      )}
                      {isActive && !showBadge && (
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </div>
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
                'group flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200',
                expanded ? 'gap-3 px-3' : 'justify-center',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )}
            >
              <item.icon className={cn('h-4 w-4 shrink-0 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary')} />
              <span className={cn(
                'overflow-hidden whitespace-nowrap transition-all duration-300',
                expanded ? 'max-w-[160px] opacity-100' : 'max-w-0 opacity-0',
              )}>
                {item.name}
              </span>
              {isActive && expanded && <div className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-border p-3">
        <div className={cn(
          'flex items-center rounded-lg bg-secondary/50 transition-all duration-300',
          expanded ? 'gap-3 px-3 py-2.5' : 'justify-center py-2',
        )}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
            {avatarLetter}
          </div>
          <div className={cn(
            'flex min-w-0 flex-col overflow-hidden transition-all duration-300',
            expanded ? 'max-w-[160px] opacity-100' : 'max-w-0 opacity-0',
          )}>
            <span className="truncate whitespace-nowrap text-sm font-medium text-foreground">{displayName}</span>
            <span className="whitespace-nowrap text-xs text-muted-foreground">{user?.email ?? ''}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
