'use client'

import { Trophy, Crown, Store, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGetPodiumQuery } from '@/app/(dashboard)/services/dashboardApi'
import type { PodiumWinner } from '@/app/(dashboard)/types'
import { HoverImagePreview } from '@/components/ui/image-preview'

const MEDAL_STYLES = [
  'bg-yellow-400 text-yellow-900',
  'bg-slate-400  text-slate-900',
  'bg-orange-400 text-orange-900',
  'bg-muted       text-muted-foreground',
  'bg-muted       text-muted-foreground',
]

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function WinnerRow({ winner, position }: { winner: PodiumWinner; position: number }) {
  return (
    <div className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
      <span className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
        MEDAL_STYLES[position],
      )}>
        {position + 1}
      </span>

      <HoverImagePreview
        src={winner.productImage}
        fallback={winner.productTitle.slice(0, 2).toUpperCase()}
        proxy
        size={36}
        previewSize={200}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">{winner.productTitle}</p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Store className="h-2.5 w-2.5" />
            {winner.storeName}
          </span>
          {winner.dateReachedTop && (
            <span className="flex items-center gap-0.5">
              <Calendar className="h-2.5 w-2.5" />
              {formatDate(winner.dateReachedTop)}
            </span>
          )}
          {winner.daysInTop > 0 && (
            <span className="rounded bg-primary/10 px-1 py-0.5 text-[9px] font-medium text-primary">
              {winner.daysInTop}d en top 10%
            </span>
          )}
        </div>
      </div>

      <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
        ~{Math.round(winner.performanceScore)}
      </span>
    </div>
  )
}

export function WinnerPodiumOverview() {
  const { data, isLoading } = useGetPodiumQuery({ days: 50 })
  const winners = data?.winners ?? []

  return (
    <div className={cn(
      'mb-8 rounded-xl border transition-all duration-300',
      winners.length > 0
        ? 'border-yellow-400/25 bg-gradient-to-br from-yellow-400/5 to-transparent'
        : 'border-border/50 bg-secondary/20',
    )}>
      {/* Header — always visible */}
      <div className="flex items-center gap-2 px-4 py-3">
        <Trophy className={cn('h-3.5 w-3.5 shrink-0', winners.length > 0 ? 'text-yellow-400' : 'text-muted-foreground/40')} />
        <span className={cn('text-xs font-semibold', winners.length > 0 ? 'text-foreground' : 'text-muted-foreground/60')}>
          Podio de winners
        </span>
        {winners.length > 0 && (
          <span className="ml-1 rounded-full bg-yellow-400/20 px-1.5 py-0.5 text-[9px] font-bold text-yellow-600">
            {winners.length}/5
          </span>
        )}
        <span className="ml-auto text-[10px] text-muted-foreground/50">
          últimos 50 días
        </span>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="space-y-2 border-t border-border/40 px-4 py-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-secondary/60" />
          ))}
        </div>
      ) : winners.length === 0 ? (
        /* Closed / empty state */
        <div className="flex items-center gap-2 border-t border-dashed border-border/30 px-4 py-3">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-5 w-5 rounded-full border border-dashed border-muted-foreground/20 bg-secondary/40"
              />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/50">
            Cuando un producto supere al 90% del catálogo, aparecerá aquí
          </p>
        </div>
      ) : (
        /* Winners list */
        <div className="divide-y divide-border/30 border-t border-border/40 px-4 py-2">
          {winners.map((w, i) => (
            <WinnerRow key={w.candidateId} winner={w} position={i} />
          ))}
        </div>
      )}
    </div>
  )
}
