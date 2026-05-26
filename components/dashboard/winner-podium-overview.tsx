'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trophy, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGetPodiumQuery } from '@/app/(dashboard)/services/dashboardApi'
import { ScoreRing } from '@/components/dashboard/score-ring'
import type { PodiumWinner } from '@/app/(dashboard)/types'
import { HoverImagePreview } from '@/components/ui/image-preview'

const DAY_OPTIONS = [7, 14, 30, 50] as const

// Medal colors for positions 0 (gold), 1 (silver), 2 (bronze)
const MEDALS = [
  {
    circle: 'bg-yellow-400 text-yellow-900',
    border: 'border-yellow-400/40 bg-yellow-400/5',
    badge:  'bg-yellow-400/20 text-yellow-600',
  },
  {
    circle: 'bg-slate-300 text-slate-800',
    border: 'border-border bg-card',
    badge:  'bg-secondary text-muted-foreground',
  },
  {
    circle: 'bg-orange-400 text-orange-900',
    border: 'border-border bg-card',
    badge:  'bg-orange-400/10 text-orange-600',
  },
]

// Podium step: #1 at top, #2 and #3 symmetric one step down
const PODIUM_MT = ['mt-0', 'mt-10', 'mt-10'] as const

function PodiumCard({ winner, position }: { winner: PodiumWinner; position: number }) {
  const medal = MEDALS[position] ?? MEDALS[2]
  const gp    = winner.growthPct
  const isFirst = position === 0

  return (
    <Link
      href={`/tracker/${winner.candidateId}?storeId=${winner.storeId}&from=podium`}
      className={cn(
        'group flex flex-col items-center rounded-xl border p-4 text-center transition-all hover:shadow-md hover:bg-secondary/30',
        medal.border,
        PODIUM_MT[position],
      )}
    >
      {/* Position badge */}
      <span className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-bold',
        isFirst ? 'h-10 w-10 text-lg' : 'h-8 w-8 text-sm',
        medal.circle,
      )}>
        {position + 1}
      </span>

      {/* Product image */}
      <div className="mt-3">
        <HoverImagePreview
          src={winner.productImage}
          fallback={winner.productTitle.slice(0, 2).toUpperCase()}
          proxy
          size={isFirst ? 120 : 90}
          previewSize={240}
        />
      </div>

      {/* Title */}
      <p className={cn(
        'mt-3 line-clamp-2 font-semibold leading-snug text-foreground group-hover:text-primary transition-colors',
        isFirst ? 'text-sm' : 'text-xs',
      )}>
        {winner.productTitle}
      </p>

      {/* Store + badges */}
      <div className="mt-2 flex flex-col items-center gap-1">
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Store className="h-3 w-3 shrink-0" />
          {winner.storeName}
        </span>
        {winner.daysInTop > 0 && (
          <span className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-medium',
            medal.badge,
          )}>
            {winner.daysInTop}d en top 10%
          </span>
        )}
        {winner.currentRank != null && (
          <span className="text-[10px] text-muted-foreground/60 tabular-nums">
            Rank #{winner.currentRank}
            {winner.storeProductCount ? ` · ${winner.storeProductCount} prods.` : ''}
          </span>
        )}
      </div>

      {/* Footer: growth + score */}
      <div className="mt-4 flex w-full items-center justify-between rounded-lg border border-border/50 bg-background/60 px-3 py-2">
        <div className="text-left">
          <p className={cn(
            'font-bold tabular-nums',
            isFirst ? 'text-base' : 'text-sm',
            gp != null && gp >= 0 ? 'text-emerald-500' : 'text-rose-500',
          )}>
            {gp != null ? `${gp >= 0 ? '+' : ''}${gp.toFixed(1)}%` : '—'}
          </p>
          <p className="text-[10px] text-muted-foreground">crecimiento</p>
        </div>
        <ScoreRing score={winner.performanceScore} size="sm" showLabel />
      </div>
    </Link>
  )
}

export function WinnerPodiumOverview() {
  const [days, setDays] = useState<7 | 14 | 30 | 50>(50)
  const { data, isLoading } = useGetPodiumQuery({ days })
  const winners = data?.winners ?? []

  return (
    <div className={cn(
      'mb-8 rounded-xl border',
      winners.length > 0 ? 'border-yellow-400/25' : 'border-border/50 bg-secondary/20',
    )}>
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Trophy className={cn('h-5 w-5 shrink-0', winners.length > 0 ? 'text-yellow-400' : 'text-muted-foreground/40')} />
            <span className={cn('text-base font-bold', winners.length > 0 ? 'text-foreground' : 'text-muted-foreground/60')}>
              Podio de Winners
            </span>
            {winners.length > 0 && (
              <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-[10px] font-bold text-yellow-600">
                {winners.length}/3
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground/60">
            Los productos con mayor crecimiento en el período seleccionado.
          </p>
        </div>

        {/* Day selector */}
        <div className="flex items-center gap-1">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={(e) => { e.preventDefault(); setDays(d) }}
              className={cn(
                'rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all',
                days === d
                  ? 'border-foreground/60 bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="grid grid-cols-[1fr_1.3fr_1fr] gap-3 px-5 pb-6 pt-2">
          {/* Skeleton order: left(#2) center(#1) right(#3) */}
          {[1, 0, 2].map((pos, i) => (
            <div
              key={i}
              className={cn(
                'animate-pulse rounded-xl bg-secondary/60',
                pos === 0 ? 'h-72 mt-0' : 'h-64 mt-10',
              )}
            />
          ))}
        </div>
      ) : winners.length === 0 ? (
        <div className="flex items-center gap-3 border-t border-dashed border-border/30 px-5 py-5">
          <div className="flex gap-1.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 w-8 rounded-full border border-dashed border-muted-foreground/20 bg-secondary/40" />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/50">
            Cuando un producto supere al 90% del catálogo aparecerá aquí
          </p>
        </div>
      ) : (
        /* Podium: [#2, #1, #3] left-center-right */
        <div className="grid grid-cols-[1fr_1.3fr_1fr] items-start gap-3 px-5 pb-6 pt-2">
          {/* Left: position #2 */}
          <div>
            {winners[1]
              ? <PodiumCard winner={winners[1]} position={1} />
              : <div className={cn('rounded-xl border border-dashed border-border/30', PODIUM_MT[1])} />
            }
          </div>
          {/* Center: position #1 */}
          <div>
            {winners[0] && <PodiumCard winner={winners[0]} position={0} />}
          </div>
          {/* Right: position #3 */}
          <div>
            {winners[2]
              ? <PodiumCard winner={winners[2]} position={2} />
              : <div className={cn('rounded-xl border border-dashed border-border/30', PODIUM_MT[2])} />
            }
          </div>
        </div>
      )}
    </div>
  )
}
