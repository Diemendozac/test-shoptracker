'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { computeSignal } from '@/lib/signal'
import { HoverImagePreview } from '@/components/ui/image-preview'
import { Sparkline } from '@/components/tracker/sparkline'
import { SignalBadge } from '@/components/tracker/signal-badge'
import type { TodayEvent } from '@/lib/today'

// Cambios en tus tiendas desde el registro anterior de cada producto (CHANGE-136).

const EVENT_CHIP: Record<TodayEvent['kind'], string> = {
  top10: 'border-primary-border bg-primary-subtle text-primary-text',
  up: 'border-success-border bg-success-subtle text-success-foreground',
  new: 'border-warning-border bg-warning-subtle text-warning-foreground',
  down: 'border-danger-border bg-danger-subtle text-danger-foreground',
}

function eventText(e: TodayEvent): string {
  if (e.kind === 'top10') return 'Entró al top 10'
  if (e.kind === 'new') return 'Nuevo'
  if (e.kind === 'up') return `Subió ${e.change}`
  return `Bajó ${Math.abs(e.change ?? 0)}`
}

export function ChangesFeed({ events, limit = 8 }: { events: TodayEvent[]; limit?: number }) {
  const shown = events.slice(0, limit)
  return (
    <section className="rounded-xl border border-border bg-card shadow-card" aria-labelledby="hoy-cambios">
      <div className="flex items-baseline justify-between gap-3 border-b border-border px-5 py-3">
        <h2 id="hoy-cambios" className="text-sm font-semibold text-foreground">
          En tus tiendas <span className="font-normal text-subtle-foreground">· desde su registro anterior</span>
        </h2>
        <span className="text-xs tabular-nums text-subtle-foreground">
          {events.length === 1 ? '1 cambio' : `${events.length} cambios`}
        </span>
      </div>
      {shown.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">
          Ningún producto de tus tiendas se movió 3 puestos o más, ni apareció uno nuevo.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {shown.map((e) => {
            const c = e.candidate
            const signal = computeSignal({ daysElapsed: c.daysElapsed, rankHistory: c.rankHistory, performanceScore: c.performanceScore })
            return (
              <li key={c.candidateId}>
                <Link href={`/tracker/${c.candidateId}?storeId=${c.storeId}`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/40">
                  <HoverImagePreview src={c.productImage} fallback={c.productTitle.charAt(0)} size={44} proxy />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{c.productTitle}</p>
                    <p className="truncate text-xs text-subtle-foreground">
                      {c.storeName}{e.rank != null ? ` · #${e.rank}` : ''}
                    </p>
                  </div>
                  <span className={cn('hidden whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold sm:inline-flex', EVENT_CHIP[e.kind])}>
                    {eventText(e)}
                  </span>
                  <span className="hidden md:block">
                    <Sparkline data={signal.window.map((r) => -r)} width={56} height={24} />
                  </span>
                  <span className="hidden lg:block"><SignalBadge signal={signal} /></span>
                  <span className={cn('whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold sm:hidden', EVENT_CHIP[e.kind])}>
                    {eventText(e)}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
      <div className="border-t border-border px-5 py-3">
        <Link href="/pool?alcance=mis-tiendas" className="text-sm font-medium text-primary-text hover:underline">
          Ver todo en Mis tiendas →
        </Link>
      </div>
    </section>
  )
}
