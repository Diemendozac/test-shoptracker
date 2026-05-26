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

const MEDAL_STYLES = [
  { circle: 'bg-yellow-400 text-yellow-900',  border: 'border-yellow-400/40 bg-yellow-400/5' },
  { circle: 'bg-slate-300  text-slate-800',   border: 'border-border/60 bg-secondary/10' },
  { circle: 'bg-orange-400 text-orange-900',  border: 'border-border/60 bg-secondary/10' },
]

function WinnerRow({ winner, position }: { winner: PodiumWinner; position: number }) {
  const isFirst = position === 0
  const gp = winner.growthPct
  const medal = MEDAL_STYLES[position] ?? MEDAL_STYLES[2]

  return (
    <Link
      href={`/tracker/${winner.candidateId}?storeId=${winner.storeId}&from=podium`}
      className={cn(
        'group flex items-center gap-3 rounded-xl border p-3.5 transition-all hover:shadow-sm hover:brightness-105',
        isFirst ? medal.border : 'border-border/40 bg-secondary/5',
      )}
    >
      {/* Position badge */}
      <span className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
        medal.circle,
      )}>
        {position + 1}
      </span>

      {/* Product image — bigger */}
      <div className="shrink-0">
        <HoverImagePreview
          src={winner.productImage}
          fallback={winner.productTitle.slice(0, 2).toUpperCase()}
          proxy
          size={52}
          previewSize={240}
        />
      </div>

      {/* Info block */}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
          {winner.productTitle}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Store className="h-3 w-3 shrink-0" />
            {winner.storeName}
          </span>
          {winner.daysInTop > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
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
      </div>

      {/* Growth */}
      {gp != null && (
        <div className="shrink-0 text-right">
          <p className={cn(
            'text-sm font-bold tabular-nums',
            gp >= 0 ? 'text-emerald-500' : 'text-rose-500',
          )}>
            {gp >= 0 ? '+' : ''}{gp.toFixed(1)}%
          </p>
          <p className="text-[10px] text-muted-foreground">crecimiento</p>
        </div>
      )}

      {/* Score ring */}
      <ScoreRing score={winner.performanceScore} size="sm" showLabel />
    </Link>
  )
}

export function WinnerPodiumOverview() {
  const [days, setDays] = useState<7 | 14 | 30 | 50>(50)
  const { data, isLoading } = useGetPodiumQuery({ days })
  const winners = data?.winners ?? []

  return (
    <div className={cn(
      'mb-8 overflow-hidden rounded-xl border',
      winners.length > 0 ? 'border-yellow-400/25' : 'border-border/50 bg-secondary/20',
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
        <Trophy className={cn('h-4 w-4 shrink-0', winners.length > 0 ? 'text-yellow-400' : 'text-muted-foreground/40')} />
        <span className={cn('text-sm font-semibold', winners.length > 0 ? 'text-foreground' : 'text-muted-foreground/60')}>
          Podio de winners
        </span>
        {winners.length > 0 && (
          <span className="rounded-full bg-yellow-400/20 px-1.5 py-0.5 text-[9px] font-bold text-yellow-600">
            {winners.length}/3
          </span>
        )}

        {/* Day selector */}
        <div className="ml-auto flex items-center gap-1">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={(e) => { e.preventDefault(); setDays(d) }}
              className={cn(
                'rounded-md border px-2 py-0.5 text-[11px] font-medium transition-all',
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
        <div className="space-y-2 p-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[82px] animate-pulse rounded-xl bg-secondary/60" />
          ))}
        </div>
      ) : winners.length === 0 ? (
        <div className="flex items-center gap-2 border-t border-dashed border-border/30 px-4 py-4">
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 w-8 rounded-full border border-dashed border-muted-foreground/20 bg-secondary/40" />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/50">
            Cuando un producto supere al 90% del catálogo aparecerá aquí
          </p>
        </div>
      ) : (
        <div className="space-y-2 p-3">
          {/* TOP 3 label */}
          <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
            TOP {winners.length}
          </p>
          {winners.map((w, i) => (
            <WinnerRow key={w.candidateId} winner={w} position={i} />
          ))}
        </div>
      )}
    </div>
  )
}
