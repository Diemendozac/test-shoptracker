'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, Search, FlaskConical, TrendingUp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGetNotificationsQuery } from '@/app/(dashboard)/services/userApi'
import { cn } from '@/lib/utils'

interface AppHeaderProps {
  title: string
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
              ? 'border-b-2 border-amber-500 text-amber-500'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <FlaskConical className="h-3.5 w-3.5" />
          Pendientes
          {pending.length > 0 && (
            <span className="rounded-full bg-amber-500/20 px-1.5 text-[10px] font-semibold text-amber-500">
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('alerts')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
            tab === 'alerts'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Alertas
          {alerts.length > 0 && (
            <span className="rounded-full bg-primary/20 px-1.5 text-[10px] font-semibold text-primary">
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
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                    <FlaskConical className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{p.productTitle}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">{p.storeName}</span>
                      {p.firstSeenRank > 0 && (
                        <span className="text-[10px] text-muted-foreground">· #{p.firstSeenRank}</span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-500">
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
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{a.productTitle}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">{a.storeName}</span>
                      {a.growthPct !== 0 && (
                        <span className={cn(
                          'text-[10px] font-medium',
                          a.growthPct > 0 ? 'text-emerald-400' : 'text-rose-400'
                        )}>
                          {a.growthPct > 0 ? '+' : ''}{Math.round(a.growthPct)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
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
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-sm">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>

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
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
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
