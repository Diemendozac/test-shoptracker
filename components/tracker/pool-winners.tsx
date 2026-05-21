'use client'

import { Lock, Globe, TrendingUp, Crown } from 'lucide-react'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { PerformanceBadge } from '@/components/dashboard/performance-badge'
import { PhaseBadge } from '@/components/tracker/phase-badge'
import { Sparkline } from '@/components/tracker/sparkline'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PoolWinnersResponse, PoolWinnerProduct } from '@/app/(dashboard)/types'

interface PoolWinnersSectionProps {
  data: PoolWinnersResponse | undefined
  isLoading?: boolean
}

export function PoolWinnersSection({ data, isLoading }: PoolWinnersSectionProps) {
  if (isLoading) {
    return (
      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-5 w-5 animate-pulse rounded bg-secondary" />
          <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  if (data.locked) {
    return <LockedState />
  }

  if (data.winners.length === 0) {
    return (
      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <SectionHeader />
        <p className="mt-4 text-sm text-muted-foreground">
          El pool aún no tiene candidatos suficientes. Vuelve mañana después del sync automático.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-6">
      <SectionHeader count={data.winners.length} />
      <div className="mt-4 space-y-3">
        {data.winners.map((winner, i) => (
          <PoolWinnerRow key={winner.candidateId} winner={winner} position={i + 1} />
        ))}
      </div>
    </div>
  )
}

// ─── sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ count }: { count?: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Pool de Testeos</h2>
        {count !== undefined && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            Top {count}
          </span>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground">Señales más fuertes del pool</span>
    </div>
  )
}

function LockedState() {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card">
      {/* blurred preview */}
      <div className="relative">
        <div className="pointer-events-none select-none space-y-3 p-6 blur-sm">
          {[85, 72, 61].map((score, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-border/50 bg-secondary/30 px-4 py-3"
            >
              <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
              <div className="h-8 w-8 rounded-full bg-secondary" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-40 rounded bg-secondary" />
                <div className="h-2 w-24 rounded bg-secondary/60" />
              </div>
              <ScoreRing score={score} size="sm" showLabel={false} />
            </div>
          ))}
        </div>

        {/* lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/80 backdrop-blur-[2px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Señales del pool bloqueadas</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              El plan Básico desbloquea las señales del Pool de Testeos
            </p>
          </div>
          <Button size="sm" className="mt-1 gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Actualizar a Básico
          </Button>
        </div>
      </div>

      {/* header below the blurred area */}
      <div className="border-t border-border px-6 py-3">
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Pool de Testeos — requiere plan Básico</span>
        </div>
      </div>
    </div>
  )
}

function PoolWinnerRow({
  winner,
  position,
}: {
  winner: PoolWinnerProduct
  position: number
}) {
  const isFirst = position === 1
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors hover:bg-secondary/30',
        isFirst ? 'border-amber-500/30 bg-amber-500/5' : 'border-border/50 bg-secondary/20'
      )}
    >
      {/* position */}
      <div className="flex h-6 w-6 shrink-0 items-center justify-center">
        {isFirst ? (
          <Crown className="h-4 w-4 text-amber-500" />
        ) : (
          <span className="text-xs font-bold text-muted-foreground">#{position}</span>
        )}
      </div>

      {/* image */}
      {winner.productImage ? (
        <img
          src={winner.productImage}
          alt=""
          className="h-10 w-10 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="h-10 w-10 shrink-0 rounded-lg bg-secondary" />
      )}

      {/* info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{winner.productTitle}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {winner.storeName}
          </span>
          {winner.currentRank && (
            <span className="text-[10px] text-muted-foreground">#{winner.currentRank}</span>
          )}
        </div>
      </div>

      {/* sparkline — growth */}
      <div className="shrink-0">
        {(() => {
          const history = (winner.growthHistory ?? []).slice(-7)
          return history.length >= 2
            ? <Sparkline data={history} width={64} height={28} />
            : <div className="w-16 text-center text-[10px] text-muted-foreground/30">—</div>
        })()}
      </div>

      {/* growth */}
      {winner.growthPct != null && (
        <span
          className={cn(
            'shrink-0 text-xs font-semibold',
            winner.growthPct > 0 ? 'text-emerald-500' : 'text-rose-500'
          )}
        >
          {winner.growthPct > 0 ? '+' : ''}
          {winner.growthPct.toFixed(1)}%
        </span>
      )}

      {/* score ring */}
      <ScoreRing
        score={winner.performanceScore}
        size="sm"
        showLabel={false}
        confidence={winner.signalConfidence}
      />

      {/* phase + label badges */}
      <PhaseBadge phase={winner.cyclePhase} />
      <PerformanceBadge label={winner.performanceLabel} size="sm" />
    </div>
  )
}
