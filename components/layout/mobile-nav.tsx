'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { Ellipsis, Settings, ShieldCheck, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logout } from '@/app/(auth)/store/authSlice'
import { useGetPendingCandidatesQuery } from '@/app/(dashboard)/services/candidateApi'
import { useGetMeQuery } from '@/app/(dashboard)/services/userApi'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { NAV_ITEMS, isNavActive, type NavKey } from '@/components/layout/app-sidebar'

// Barra inferior del celular (CHANGE-132). Antes el menú lateral de 256 px estaba fijo en todos
// los anchos y a 390 px tapaba media pantalla. Cuatro destinos a mano y "Más" con el resto.
const BAR: NavKey[] = ['home', 'radar', 'ads', 'stores']
const MORE: NavKey[] = ['pending']

export function MobileNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const fromParam = searchParams.get('from')
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { data: pending } = useGetPendingCandidatesQuery()
  const { data: me } = useGetMeQuery()
  const pendingCount = pending?.length ?? 0
  const isAdmin = me?.plan === 'admin'
  const [moreOpen, setMoreOpen] = useState(false)

  const byKey = Object.fromEntries(NAV_ITEMS.map((i) => [i.key, i]))
  const moreActive =
    MORE.some((k) => isNavActive(k, pathname, fromParam)) ||
    pathname.startsWith('/settings') || pathname.startsWith('/admin')

  function handleLogout() {
    setMoreOpen(false)
    dispatch(logout())
    router.push('/login')
  }

  const tab = 'flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors'

  return (
    <>
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-border bg-card/95 backdrop-blur-sm lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {BAR.map((key) => {
          const item = byKey[key]
          const active = isNavActive(key, pathname, fromParam)
          return (
            <Link key={key} href={item.href} aria-current={active ? 'page' : undefined}
              className={cn(tab, active ? 'text-primary-text' : 'text-muted-foreground hover:text-foreground')}>
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.short}</span>
            </Link>
          )
        })}
        <button type="button" onClick={() => setMoreOpen(true)} aria-haspopup="dialog"
          className={cn(tab, moreActive ? 'text-primary-text' : 'text-muted-foreground hover:text-foreground')}>
          <span className="relative">
            <Ellipsis className="h-5 w-5" />
            {pendingCount > 0 && (
              <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-warning" />
            )}
          </span>
          <span>Más</span>
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" aria-describedby={undefined} className="gap-0 rounded-t-2xl p-0 pb-[env(safe-area-inset-bottom,0px)]">
          <SheetTitle className="truncate border-b border-border py-4 pl-5 pr-12 text-sm">
            {user?.email ?? 'Tu cuenta'}
          </SheetTitle>
          <div className="grid gap-1 p-3">
            {MORE.map((key) => {
              const item = byKey[key]
              const active = isNavActive(key, pathname, fromParam)
              return (
                <Link key={key} href={item.href} onClick={() => setMoreOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={cn('flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium',
                    active ? 'bg-primary-subtle text-primary-text' : 'text-foreground hover:bg-secondary')}>
                  <item.icon className="h-4 w-4" />
                  {item.name}
                  {key === 'pending' && pendingCount > 0 && (
                    <span className="ml-auto rounded-full bg-warning-subtle px-1.5 py-0.5 text-xs font-semibold leading-none text-warning-foreground tabular-nums">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              )
            })}
            <Link href="/settings" onClick={() => setMoreOpen(false)}
              className={cn('flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium',
                pathname.startsWith('/settings') ? 'bg-primary-subtle text-primary-text' : 'text-foreground hover:bg-secondary')}>
              <Settings className="h-4 w-4" />
              Configuración
            </Link>
            {isAdmin && (
              <Link href="/admin" onClick={() => setMoreOpen(false)}
                className={cn('flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium',
                  pathname.startsWith('/admin') ? 'bg-primary-subtle text-primary-text' : 'text-foreground hover:bg-secondary')}>
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
            )}
            <button type="button" onClick={handleLogout}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-destructive hover:bg-danger-subtle">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
