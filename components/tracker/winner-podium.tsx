'use client'

import { useState } from 'react'
import { Trophy, Store, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGetPodiumQuery } from '@/app/(dashboard)/services/dashboardApi'
import type { PodiumWinner } from '@/app/(dashboard)/types'
import { HoverImagePreview } from '@/components/ui/image-preview'

const FILTERS = [
  { label: '7d',   days: 7 },
  { label: '10d',  days: 10 },
  { label: '30d',  days: 30 },
  { label: 'Todo', days: 0 },
]

const SLOT_STYLES = [
  { border: 'border-yellow-400/50', bg: 'bg-yellow-400/5',  badge: 'bg-yellow-400 text-yellow-900' },
  { border: 'border-slate-400/40',  bg: 'bg-slate-400/5',   badge: 'bg-slate-400  text-slate-900'  },
  { border: 'border-orange-400/40', bg: 'bg-orange-400/5',  badge: 'bg-orange-400 text-orange-900' },
]

function scoreColor(score: number) {
  if (score >= 60) return '#10b981'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

function ScoreRing({ score }: { score: number }) {
  const color = scoreColor(score)
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className="flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-bold"
        style={{ borderColor: color, color }}
      >
        {Math.round(score)}
      </div>
      <span className="text-[9px] text-muted-foreground">score</span>
    </div>
  )
}

function FilledSlot({ winner, position }: { winner: PodiumWinner; position: number }) {
  const style = SLOT_STYLES[position]
  const total = winner.storeProductCount

  return (
    <div className={cn(
      'flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors hover:bg-secondary/10',
      style.border, style.bg,
    )}>
      {/* Position badge */}
      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold', style.badge)}>
        {position + 1}
      </div>

      {/* Product image */}
      <HoverImagePreview
        src={winner.productImage}
        fallback={winner.productTitle.slice(0, 2).toUpperCase()}
        proxy
        size={44}
        previewSize={220}
      />

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{winner.productTitle}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Store className="h-3 w-3" />
            {winner.storeName}
          </span>
          {winner.daysInTop > 0 && (
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {winner.daysInTop}d en top 10%
            </span>
          )}
          {winner.currentRank != null && (
            <span className="text-muted-foreground/70">
              Rank #{winner.currentRank}{total ? ` · ${total} prods.` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Growth + Score */}
      <div className="shrink-0 flex items-center gap-3">
        {winner.growthPct != null && (
          <div className="text-right">
            <p className={cn(
              'flex items-center justify-end gap-0.5 text-sm font-bold',
              winner.growthPct >= 0 ? 'text-emerald-500' : 'text-rose-500',
            )}>
              <TrendingUp className="h-3.5 w-3.5" />
              {winner.growthPct >= 0 ? '+' : ''}{Math.round(winner.growthPct)}%
            </p>
            <p className="text-[10px] text-muted-foreground">crecimiento</p>
          </div>
        )}
        <ScoreRing score={winner.performanceScore} />
      </div>
    </div>
  )
}

function EmptySlot({ position }: { position: number }) {
  const style = SLOT_STYLES[position]
  return (
    <div className={cn(
      'flex items-center gap-3 rounded-xl border border-dashed px-4 py-3',
      style.border,
    )}>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 text-xs font-bold text-muted-foreground/40">
        {position + 1}
      </div>
      <div className="h-11 w-11 shrink-0 rounded-xl border border-dashed border-muted-foreground/20 bg-secondary/30" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-36 rounded bg-secondary/60" />
        <div className="h-2.5 w-24 rounded bg-secondary/40" />
      </div>
    </div>
  )
}

export function WinnerPodium() {
  const [days, setDays] = useState(0)
  const { data, isLoading } = useGetPodiumQuery({ days })

  const winners = data?.winners ?? []
  const slots = Array.from({ length: 3 }, (_, i) => winners[i] ?? null)

  return (
    <div className="mb-6 rounded-2xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/5 to-transparent p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <h2 className="text-sm font-semibold text-foreground">Podio de Winners</h2>
          <span className="rounded-full bg-yellow-400/15 px-2 py-0.5 text-[10px] font-medium text-yellow-600">
            Top 10% del catálogo
          </span>
        </div>
        <div className="flex rounded-lg border border-border bg-secondary/30 p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.days}
              onClick={() => setDays(f.days)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                days === f.days
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slots */}
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[62px] animate-pulse rounded-xl bg-secondary/50" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {slots.map((winner, i) =>
            winner
              ? <FilledSlot key={winner.candidateId} winner={winner} position={i} />
              : <EmptySlot key={i} position={i} />
          )}
        </div>
      )}

      {winners.length === 0 && !isLoading && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {days === 0
            ? 'Ningún producto ha superado el 90% del catálogo todavía'
            : `Ningún winner en los últimos ${days} días — prueba un período más amplio`}
        </p>
      )}
    </div>
  )
}
