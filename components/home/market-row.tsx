'use client'

import Link from 'next/link'
import { computeSignal } from '@/lib/signal'
import { useViewAs } from '@/lib/view-as'
import { useGetPoolWinnersQuery } from '@/app/(dashboard)/services/dashboardApi'
import { SignalBadge } from '@/components/tracker/signal-badge'
import { AdsCount } from '@/components/tracker/ads-cell'

// Ganando en el mercado (CHANGE-136): los 5 primeros del Radar con video, en una fila.
// Mismos parámetros que la pantalla del pool: el admin (sin simular otro plan) ve todo; el resto,
// solo productos con video. Reemplaza "Mejores testeos" de Inicio, que traía un carrusel de videos
// por producto.

export function MarketRow() {
  const { effectivePlan } = useViewAs()
  const { data, isLoading } = useGetPoolWinnersQuery({
    page: 0, size: 5, hasVideo: effectivePlan === 'admin' ? undefined : true,
  })
  const winners = data && !data.locked ? data.winners.slice(0, 5) : []

  return (
    <section aria-labelledby="hoy-mercado" className="grid gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="hoy-mercado" className="text-sm font-semibold text-foreground">
          Ganando en el mercado <span className="font-normal text-subtle-foreground">· Radar</span>
        </h2>
        <Link href="/pool" className="text-sm font-medium text-primary-text hover:underline">Ver el Radar →</Link>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-56 animate-pulse rounded-xl bg-secondary" />)}
        </div>
      ) : winners.length === 0 ? (
        <p className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          El Radar todavía no tiene productos para mostrar. Vuelve después del próximo corte.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {winners.map((w) => {
            const signal = computeSignal({ daysElapsed: w.daysElapsed, rankHistory: w.rankHistory, performanceScore: w.performanceScore })
            return (
              <Link key={w.candidateId} href={`/tracker/${w.candidateId}?storeId=${w.storeId}&from=pool`}
                className="grid content-start gap-2 rounded-xl border border-border bg-card p-3 shadow-card transition-[border-color,box-shadow] hover:border-border-hover hover:shadow-card-hover">
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-secondary">
                  {w.productImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/image-proxy?url=${encodeURIComponent(w.productImage)}`} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-subtle-foreground">{w.productTitle.charAt(0)}</span>
                  )}
                </div>
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{w.productTitle}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <SignalBadge signal={signal} />
                  {signal.rank != null && (
                    <span className="text-xs tabular-nums text-muted-foreground">
                      #{signal.rank}
                      {signal.rankChange != null && signal.rankChange !== 0 && (
                        <span className={signal.rankChange > 0 ? 'text-success-foreground' : 'text-danger-foreground'}>
                          {' '}{signal.rankChange > 0 ? `↑${signal.rankChange}` : `↓${-signal.rankChange}`}
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <AdsCount candidateId={w.candidateId} />
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
