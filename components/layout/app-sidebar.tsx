'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { logout } from '@/app/(auth)/store/authSlice'
import { useGetPendingCandidatesQuery } from '@/app/(dashboard)/services/candidateApi'
import {
  LayoutDashboard,
  FlaskConical,
  Store,
  Settings,
  ChevronDown,
  Building2,
  Globe,
  Clock,
  ShieldCheck,
  LogOut,
  Video,
} from 'lucide-react'
import { DropspyIcon } from '@/components/ui/dropspy-logo'
import { useGetMeQuery } from '@/app/(dashboard)/services/userApi'
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const TOP_NAV = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
]

const BOTTOM_NAV = [
  { name: 'Stores', href: '/stores', icon: Store },
]

const TESTEOS_ITEMS = [
  { name: 'Mis testeos',      href: '/tracker',      icon: Building2 },
  { name: 'Explorar testeos', href: '/pool',         icon: Globe },
  // Biblioteca de anuncios (2026-09-15, wiki scout-biblioteca-anuncios-propuesta) — pantalla
  // nueva, anuncios en sí (no candidatos), sin depender de tracking_status. Ver FIX-074/
  // ads-library en el backend.
  { name: 'Biblioteca de anuncios', href: '/ads-library', icon: Video },
  { name: 'Pendientes',       href: '/pendientes', icon: Clock },
]

interface AppSidebarProps {
  pinned: boolean
}

export function AppSidebar({ pinned }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const fromParam = searchParams.get('from')
  const { user } = useAppSelector((s) => s.auth)
  const displayName = user?.email?.split('@')[0] ?? '—'
  const avatarLetter = displayName[0]?.toUpperCase() ?? '?'

  function handleLogout() {
    dispatch(logout())
    router.push('/login')
  }

  const { data: pending } = useGetPendingCandidatesQuery()
  const { data: me } = useGetMeQuery()
  const isAdmin = me?.plan === 'admin'
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
        'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out',
        expanded ? 'w-64' : 'w-16',
      )}
      onMouseEnter={() => !pinned && setHovered(true)}
      onMouseLeave={() => !pinned && setHovered(false)}
    >
      {/* Logo */}
      <Link
        href="/home"
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-sidebar-border transition-opacity hover:opacity-80',
          expanded ? 'gap-3 px-6' : 'justify-center',
        )}
      >
        <DropspyIcon size={30} gradient className="shrink-0" />
        <span className={cn(
          'overflow-hidden whitespace-nowrap transition-all duration-300',
          'font-display text-xl font-bold tracking-tight leading-none text-sidebar-foreground',
          expanded ? 'max-w-[160px] opacity-100' : 'max-w-0 opacity-0',
        )}>
          dropspy
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">

        {/* Top items */}
        {TOP_NAV.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}
              className={cn(
                'group relative flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200',
                expanded ? 'gap-3 px-3' : 'justify-center',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:-left-2 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r-full before:bg-grad-brand'
                  : 'text-sidebar-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground',
              )}
            >
              <item.icon className={cn('h-4 w-4 shrink-0 transition-colors',
                isActive ? 'text-sidebar-primary' : 'text-sidebar-muted-foreground group-hover:text-sidebar-foreground')} />
              <span className={cn(
                'overflow-hidden whitespace-nowrap transition-all duration-300',
                expanded ? 'max-w-[160px] opacity-100' : 'max-w-0 opacity-0',
              )}>
                {item.name}
              </span>
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
                ? 'text-sidebar-foreground hover:bg-sidebar-hover'
                : 'text-sidebar-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground',
            )}
          >
            <FlaskConical className={cn('h-4 w-4 shrink-0 transition-colors',
              inTesteos ? 'text-sidebar-primary' : 'text-sidebar-muted-foreground group-hover:text-sidebar-foreground')} />
            <span className={cn(
              'flex-1 overflow-hidden whitespace-nowrap text-left transition-all duration-300',
              expanded ? 'max-w-[120px] opacity-100' : 'max-w-0 opacity-0',
            )}>
              Testeos
            </span>
            <ChevronDown className={cn(
              'h-3.5 w-3.5 shrink-0 text-sidebar-muted-foreground transition-all duration-300',
              open && expanded ? 'rotate-180' : '',
              expanded ? 'opacity-100' : 'max-w-0 opacity-0 overflow-hidden',
            )} />
          </button>

          <div className={cn(
            'overflow-hidden transition-all duration-200',
            // max-h subido de 36 a 44 — se agregó un 4to item (Biblioteca de anuncios, 2026-09-15)
            (open && expanded) ? 'max-h-44 opacity-100' : 'max-h-0 opacity-0',
          )}>
            <div className="ml-3 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
              {TESTEOS_ITEMS.map((item) => {
                const isActive =
                  item.href === '/tracker'
                    ? pathname.startsWith('/tracker') && fromParam !== 'pool'
                    : item.href === '/pool'
                    ? pathname.startsWith('/pool') || (pathname.startsWith('/tracker') && fromParam === 'pool')
                    : pathname.startsWith(item.href)
                const isPendientes = item.href === '/pendientes'
                const showBadge = isPendientes && pendingCount > 0
                return (
                  <Link key={item.name} href={item.href}
                    className={cn(
                      'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-200',
                      isActive
                        ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground before:absolute before:-left-[13px] before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r-full before:bg-grad-brand'
                        : 'text-sidebar-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground',
                    )}
                  >
                    <item.icon className={cn('h-3.5 w-3.5 shrink-0',
                      isActive ? 'text-sidebar-primary' : 'text-sidebar-muted-foreground group-hover:text-sidebar-foreground')} />
                    {item.name}
                    <div className="ml-auto flex items-center gap-1.5">
                      {showBadge && (
                        <span className="rounded-full bg-warning-subtle px-1.5 py-0.5 text-xs font-semibold leading-none text-warning-foreground tabular-nums">
                          {pendingCount}
                        </span>
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
                'group relative flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200',
                expanded ? 'gap-3 px-3' : 'justify-center',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:-left-2 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r-full before:bg-grad-brand'
                  : 'text-sidebar-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground',
              )}
            >
              <item.icon className={cn('h-4 w-4 shrink-0 transition-colors',
                isActive ? 'text-sidebar-primary' : 'text-sidebar-muted-foreground group-hover:text-sidebar-foreground')} />
              <span className={cn(
                'overflow-hidden whitespace-nowrap transition-all duration-300',
                expanded ? 'max-w-[160px] opacity-100' : 'max-w-0 opacity-0',
              )}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Admin link */}
      {isAdmin && (() => {
        const isActive = pathname.startsWith('/admin')
        return (
          <Link href="/admin"
            className={cn(
              'group flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200 mx-2',
              expanded ? 'gap-3 px-3' : 'justify-center',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground',
            )}
          >
            <ShieldCheck className={cn('h-4 w-4 shrink-0', isActive && 'text-sidebar-primary')} />
            <span className={cn(
              'overflow-hidden whitespace-nowrap transition-all duration-300',
              expanded ? 'max-w-[160px] opacity-100' : 'max-w-0 opacity-0',
            )}>
              Admin
            </span>
          </Link>
        )
      })()}

      {/* User Section — click para desplegar acceso a Settings */}
      <div className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex w-full items-center rounded-lg bg-sidebar-hover text-left transition-all duration-300 hover:bg-sidebar-accent',
                expanded ? 'gap-3 px-3 py-2.5' : 'justify-center py-2',
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-primary">
                {avatarLetter}
              </div>
              <div className={cn(
                'flex min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300',
                expanded ? 'max-w-[160px] opacity-100' : 'max-w-0 opacity-0',
              )}>
                <span className="truncate whitespace-nowrap text-sm font-medium text-sidebar-foreground">{displayName}</span>
                <span className="truncate whitespace-nowrap text-xs text-sidebar-muted-foreground">{user?.email ?? ''}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuración
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
