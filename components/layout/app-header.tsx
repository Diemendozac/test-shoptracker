'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, Search, FlaskConical, TrendingUp, X, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGetNotificationsQuery } from '@/app/(dashboard)/services/userApi'
import { useCurrency } from '@/store/hooks'
import { TopbarTicker } from '@/components/layout/topbar-ticker'
import { SUPPORTED_CURRENCIES, currencySymbol } from '@/lib/currency'
import { cn } from '@/lib/utils'

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
    <header className="sticky top-0 z-40 grid h-16 grid-cols-3 items-center border-b border-border bg-card/85 bg-topbar-glow px-6 backdrop-blur-sm">
      <div />

      <TopbarTicker />

      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Search className="h-4 w-4" />
          <span className="sr-only">Buscar</span>
        </Button>

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
