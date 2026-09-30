'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { logout } from '@/app/(auth)/store/authSlice'
import { useGetPendingCandidatesQuery } from '@/app/(dashboard)/services/candidateApi'
import {
  Home,
  Radar,
  Store,
  Video,
  Settings,
  ShieldCheck,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { DropspyIcon } from '@/components/ui/dropspy-logo'
import { useGetMeQuery } from '@/app/(dashboard)/services/userApi'
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Menú plano con los nombres de la propuesta (CHANGE-132, Fase 1 del rediseño; vault:
// wiki/propuesta-app-por-pantalla.md). Resumen (/dashboard) sale del menú: el login lleva a
// Inicio, que muestra más. La ruta sigue existiendo. Explorar testeos pasa a llamarse Radar y
// Tiendas, Competidores. Pendientes se queda hasta decidir la detección automática (Fase 3).
// Mis testeos salió del menú en CHANGE-134: es el alcance "Mis tiendas" del Radar.
// Inicio pasó a llamarse Hoy en CHANGE-136 (también reemplaza a Resumen).
// Pendientes salió del menú en CHANGE-137: es el bloque "Nuevos por revisar" de Competidores,
// y el contador pasa al ítem Competidores.
// La barra inferior del celular (mobile-nav.tsx) usa esta misma lista.
export type NavKey = 'home' | 'radar' | 'stores' | 'ads'

export const NAV_ITEMS: { key: NavKey; name: string; short: string; href: string; icon: React.ElementType }[] = [
  { key: 'home',    name: 'Hoy',          short: 'Hoy',      href: '/home',        icon: Home },
  { key: 'radar',   name: 'Radar',        short: 'Radar',    href: '/pool',        icon: Radar },
  { key: 'stores',  name: 'Competidores', short: 'Tiendas',  href: '/stores',      icon: Store },
  { key: 'ads',     name: 'Anuncios',     short: 'Anuncios', href: '/ads-library', icon: Video },
]

/**
 * Qué ítem del menú está activo. Mis testeos pasó a ser el alcance "Mis tiendas" del Radar
 * (CHANGE-134), así que la ficha de producto (/tracker/[id]) siempre marca Radar.
 */
export function isNavActive(key: NavKey, pathname: string, _fromParam: string | null): boolean {
  switch (key) {
    case 'home':    return pathname.startsWith('/home')
    case 'radar':   return pathname.startsWith('/pool') || pathname.startsWith('/tracker')
    case 'stores':  return pathname.startsWith('/stores') || pathname.startsWith('/pendientes')
    case 'ads':     return pathname.startsWith('/ads-library')
  }
}

interface AppSidebarProps {
  pinned: boolean
  onTogglePinned: () => void
}

export function AppSidebar({ pinned, onTogglePinned }: AppSidebarProps) {
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

  const [hovered, setHovered] = useState(false)
  const expanded = pinned || hovered

  // Al fijar el menú se descarta el estado de hover
  useEffect(() => {
    if (pinned) setHovered(false)
  }, [pinned])

  const label = (text: string) => (
    <span className={cn(
      'overflow-hidden whitespace-nowrap transition-all duration-300',
      expanded ? 'max-w-[160px] opacity-100' : 'max-w-0 opacity-0',
    )}>
      {text}
    </span>
  )

  return (
    <aside
      // Solo desde 1024 px. Por debajo manda la barra inferior (mobile-nav.tsx).
      className={cn(
        'fixed inset-y-0 left-0 z-50 hidden flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out lg:flex',
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
      <nav aria-label="Principal" className="flex-1 space-y-1 px-2 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = isNavActive(item.key, pathname, fromParam)
          const showBadge = item.key === 'stores' && pendingCount > 0
          return (
            <Link key={item.key} href={item.href}
              aria-current={isActive ? 'page' : undefined}
              title={expanded ? undefined : item.name}
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
              {label(item.name)}
              {showBadge && (
                expanded ? (
                  <span className="ml-auto rounded-full bg-warning-subtle px-1.5 py-0.5 text-xs font-semibold leading-none text-warning-foreground tabular-nums">
                    {pendingCount}
                  </span>
                ) : (
                  <span aria-label={`${pendingCount} pendientes`} className="absolute right-3 top-2 h-2 w-2 rounded-full bg-warning" />
                )
              )}
            </Link>
          )
        })}
      </nav>

      {/* Admin link */}
      {isAdmin && (() => {
        const isActive = pathname.startsWith('/admin')
        return (
          <Link href="/admin"
            title={expanded ? undefined : 'Admin'}
            className={cn(
              'group mx-2 flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200',
              expanded ? 'gap-3 px-3' : 'justify-center',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground',
            )}
          >
            <ShieldCheck className={cn('h-4 w-4 shrink-0', isActive && 'text-sidebar-primary')} />
            {label('Admin')}
          </Link>
        )
      })()}

      {/* Plegar / fijar el menú (se recuerda en este navegador) */}
      <button
        type="button"
        onClick={onTogglePinned}
        aria-pressed={pinned}
        title={pinned ? 'Plegar menú' : 'Fijar menú'}
        className={cn(
          'mx-2 mb-1 flex items-center rounded-lg py-2 text-xs font-medium text-sidebar-muted-foreground transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground',
          expanded ? 'gap-3 px-3' : 'justify-center',
        )}
      >
        {pinned ? <PanelLeftClose className="h-4 w-4 shrink-0" /> : <PanelLeftOpen className="h-4 w-4 shrink-0" />}
        {label(pinned ? 'Plegar menú' : 'Fijar menú')}
      </button>

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
