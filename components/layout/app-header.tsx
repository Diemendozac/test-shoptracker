'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, FlaskConical, TrendingUp, X, ChevronDown, Check, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGetNotificationsQuery } from '@/app/(dashboard)/services/userApi'
import { useCurrency } from '@/store/hooks'
import { SUPPORTED_CURRENCIES, currencySymbol } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { useTrialStatus, useViewAs } from '@/lib/view-as'
import { useGetStoresQuery } from '@/app/(dashboard)/stores/services/storeApi'
import { DropspyIcon } from '@/components/ui/dropspy-logo'
import { CommandSearch } from '@/components/layout/command-search'

interface AppHeaderProps {
  title?: string
  description?: string
}

// ─── Notification panel ───────────────────────────────────────────────────────

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { data, isLoading } = useGetNotificationsQuery()
  const [tab, setTab] = useState<'pending' | 'alerts'>('pending')

  const pending = data?.pending ?? []
  const alerts  = data?.alerts  ?? []

  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-2xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold text-foreground">Notificaciones</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab('pending')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
            tab === 'pending'
              ? 'border-b-2 border-warning text-warning-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <FlaskConical className="h-3.5 w-3.5" />
          Pendientes
          {pending.length > 0 && (
            <span className="rounded-full bg-warning-subtle px-1.5 text-xs font-semibold text-warning-foreground">
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('alerts')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
            tab === 'alerts'
              ? 'border-b-2 border-primary text-primary-text'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Alertas
          {alerts.length > 0 && (
            <span className="rounded-full bg-primary-subtle px-1.5 text-xs font-semibold text-primary-text">
              {alerts.length}
            </span>
          )}
        </button>
      </div>

      {/* Body */}
      <div className="max-h-72 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        ) : tab === 'pending' ? (
          pending.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <FlaskConical className="h-8 w-8 opacity-20" />
              <p className="text-xs">No hay productos pendientes</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {pending.map((p) => (
                <Link
                  key={p.candidateId}
                  href="/tracker"
                  onClick={onClose}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-warning-subtle">
                    <FlaskConical className="h-3.5 w-3.5 text-warning-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{p.productTitle}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">{p.storeName}</span>
                      {p.firstSeenRank > 0 && (
                        <span className="text-xs text-muted-foreground tabular-nums">· #{p.firstSeenRank}</span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-warning-subtle px-2 py-0.5 text-xs font-medium text-warning-foreground">
                    Testear
                  </span>
                </Link>
              ))}
            </div>
          )
        ) : (
          alerts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <TrendingUp className="h-8 w-8 opacity-20" />
              <p className="text-xs">Sin alertas recientes</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {alerts.map((a) => (
                <Link
                  key={a.candidateId}
                  href={`/tracker/${a.candidateId}?storeId=${a.storeId}`}
                  onClick={onClose}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-subtle">
                    <TrendingUp className="h-3.5 w-3.5 text-primary-text" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{a.productTitle}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">{a.storeName}</span>
                      {a.growthPct !== 0 && (
                        <span className={cn(
                          'text-xs font-medium tabular-nums',
                          a.growthPct > 0 ? 'text-success-foreground' : 'text-danger-foreground'
                        )}>
                          {a.growthPct > 0 ? '+' : ''}{Math.round(a.growthPct)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary-subtle px-2 py-0.5 text-xs font-medium text-primary-text">
                    {a.performanceLabel}
                  </span>
                </Link>
              ))}
            </div>
          )
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <Link
          href="/tracker"
          onClick={onClose}
          className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Ver todos en Tracker →
        </Link>
      </div>
    </div>
  )
}

// ─── Currency selector ────────────────────────────────────────────────────────

function CurrencySelector() {
  const { currency: current, setCurrency } = useCurrency()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function select(code: string) {
    setCurrency(code)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border-hover hover:text-foreground"
      >
        <span className="font-semibold text-foreground">{currencySymbol(current)}</span>
        <span>{current}</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-36 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          {SUPPORTED_CURRENCIES.map((code) => (
            <button
              key={code}
              onClick={() => select(code)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-secondary/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="font-semibold text-foreground w-6">{currencySymbol(code)}</span>
                <span className="text-muted-foreground">{code}</span>
              </span>
              {code === current && <Check className="h-3 w-3 text-primary-text" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Días de prueba ───────────────────────────────────────────────────────────
// useTrialStatus().daysLeft ya existía pero ninguna pantalla lo mostraba: la persona se enteraba
// el día 7, con el bloqueo (CHANGE-131). Solo con la fecha de registro cargada, para no mostrar
// "7 días" mientras /users/me responde. Usa el plan real, así que el admin que simula la prueba
// no lo ve.
function TrialDaysLeft() {
  const { isTrial, isExpired, daysLeft } = useTrialStatus()
  const { signupDate } = useViewAs()
  if (!isTrial || isExpired || !signupDate) return null
  const urgent = daysLeft <= 2
  return (
    <Link
      href="/pricing"
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        urgent
          ? 'border-warning-border bg-warning-subtle text-warning-foreground hover:bg-warning-subtle/70'
          : 'border-primary-border bg-primary-subtle text-primary-text hover:bg-primary-subtle/70',
      )}
    >
      <Clock className="h-3.5 w-3.5 shrink-0" />
      {/* En el celular, la versión corta (CHANGE-132) */}
      {/* Texto corto en el celular y con el menú lateral abierto (1024–1535 px), donde la columna es angosta */}
      <span className="sm:hidden lg:inline 2xl:hidden">{daysLeft === 1 ? '1 día de prueba' : `${daysLeft} días de prueba`}</span>
      <span className="hidden sm:inline lg:hidden 2xl:inline">{daysLeft === 1 ? 'Te queda 1 día de prueba' : `Te quedan ${daysLeft} días de prueba`}</span>
      <span className="hidden font-semibold sm:inline lg:hidden 2xl:inline">· Ver planes</span>
    </Link>
  )
}

// ─── Último corte ─────────────────────────────────────────────────────────────
// La hora real de la última revisión de tus tiendas, en lugar de decir "tiempo real"
// (CHANGE-132). Sale del lastScrapedAt más reciente de tus tiendas activas. En ámbar si
// pasaron más de 2 días: el dato puede estar viejo. Sin tiendas, no se muestra.
function formatCut(d: Date): string {
  const now = new Date()
  const time = d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diffDays = Math.round((day(now) - day(d)) / 86_400_000)
  if (diffDays <= 0) return `hoy ${time}`
  if (diffDays === 1) return `ayer ${time}`
  return `hace ${diffDays} días`
}

function LastSync() {
  const { data: stores } = useGetStoresQuery()
  const latest = (stores ?? [])
    .filter((s) => s.isActive && s.lastScrapedAt)
    .map((s) => new Date(s.lastScrapedAt))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0]
  if (!latest) return null
  const stale = Date.now() - latest.getTime() > 2 * 86_400_000
  return (
    <span
      title="La última vez que revisamos tus tiendas"
      className={cn(
        'hidden shrink-0 items-center whitespace-nowrap rounded-full border px-3 py-1 text-xs md:inline-flex',
        stale
          ? 'border-warning-border bg-warning-subtle text-warning-foreground'
          : 'border-border bg-card text-muted-foreground',
      )}
    >
      <span className="hidden 2xl:inline">Último corte:&nbsp;</span>
      <span className="2xl:hidden">Corte:&nbsp;</span>
      {formatCut(latest)}
    </span>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function AppHeader({ title, description }: AppHeaderProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data } = useGetNotificationsQuery()

  const totalCount = (data?.pending.length ?? 0) + (data?.alerts.length ?? 0)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    // En el celular: fila flexible con el logo (no hay menú lateral) y sin el mensaje rotativo.
    // Desde 1024 px: las tres columnas de siempre (CHANGE-132).
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-card/85 bg-topbar-glow px-4 backdrop-blur-sm lg:grid lg:h-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden lg:flex-none">
        <Link href="/home" aria-label="Inicio" className="shrink-0 lg:hidden">
          <DropspyIcon size={26} gradient />
        </Link>
        <TrialDaysLeft />
        <LastSync />
      </div>

      {/* El mensaje rotativo (TopbarTicker, /insights) se quitó en CHANGE-136: cambiaba cada 5 s y
          no se alcanzaba a leer. Lo que importa del día ahora está en Hoy. */}

      <div className="flex shrink-0 items-center justify-end gap-1.5 lg:gap-2">
        <CommandSearch />
        <CurrencySelector />

        {/* Bell */}
        <div ref={ref} className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setOpen((v) => !v)}
          >
            <Bell className="h-4 w-4" />
            {totalCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold leading-none text-primary-foreground tabular-nums">
                {totalCount > 9 ? '9+' : totalCount}
              </span>
            )}
          </Button>

          {open && <NotificationPanel onClose={() => setOpen(false)} />}
        </div>
      </div>
    </header>
  )
}
