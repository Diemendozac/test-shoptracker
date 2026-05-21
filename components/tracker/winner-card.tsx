'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Crown, ChevronDown, ChevronUp, TrendingUp, Medal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PerformanceBadge } from '@/components/dashboard/performance-badge'
import { PhaseBadge } from '@/components/tracker/phase-badge'
import type { WinnerProduct } from '@/app/(dashboard)/types'

interface WinnerCardProps {
  winner: WinnerProduct
  runnersUp: WinnerProduct[]
}

function formatGrowth(pct: number | null) {
  if (pct == null) return '—'
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}

function formatScore(score: number) {
  return score.toFixed(0)
}

function ProductImage({
  src,
  alt,
  size = 'md',
}: {
  src: string | null
  alt: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const dims = { sm: 40, md: 72, lg: 96 }[size]
  if (!src) {
    return (
      <div
        className={cn(
          'shrink-0 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground text-xs',
          size === 'sm' && 'h-10 w-10',
          size === 'md' && 'h-18 w-18',
          size === 'lg' && 'h-24 w-24'
        )}
        style={{ width: dims, height: dims }}
      >
        ?
      </div>
    )
  }
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-lg bg-secondary"
      style={{ width: dims, height: dims }}
    >
      <Image src={src} alt={alt} fill className="object-cover" />
    </div>
  )
}

function RunnerRow({ product, position }: { product: WinnerProduct; position: number }) {
  const medals = [Medal, Medal, Medal]
  const medalColors = ['text-yellow-400', 'text-slate-400', 'text-orange-400']

  return (
    <div className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3">
      <span className={cn('text-sm font-bold w-5 text-center', medalColors[position] ?? 'text-muted-foreground')}>
        {position + 2}
      </span>
      <ProductImage src={product.productImage} alt={product.productTitle} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{product.productTitle}</p>
        <p className="text-xs text-muted-foreground">
          Rank #{product.currentRank ?? '—'} · Día {product.daysElapsed}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={cn(
            'text-xs font-semibold',
            product.growthPct != null && product.growthPct >= 0 ? 'text-rising' : 'text-declining'
          )}
        >
          {formatGrowth(product.growthPct)}
        </span>
        <PerformanceBadge label={product.performanceLabel} size="sm" showIcon={false} />
      </div>
    </div>
  )
}

export function WinnerCard({ winner, runnersUp }: WinnerCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mb-6 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-1">
      <div className="rounded-lg bg-card p-4">
        {/* Header */}
        <div className="mb-3 flex items-center gap-2">
          <Crown className="h-4 w-4 text-yellow-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Señal más fuerte esta semana
          </span>
        </div>

        {/* Winner row */}
        <div className="flex items-start gap-4">
          {/* Image with crown */}
          <div className="relative shrink-0">
            <ProductImage src={winner.productImage} alt={winner.productTitle} size="lg" />
            <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 shadow-md">
              <Crown className="h-3.5 w-3.5 text-yellow-900" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground leading-tight truncate">
              {winner.productTitle}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Rank #{winner.currentRank ?? '—'} · Día {winner.daysElapsed} · {winner.daysInBestseller}d en bestseller
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <PerformanceBadge label={winner.performanceLabel} size="md" />
              <PhaseBadge phase={winner.cyclePhase} size="md" />
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-sm font-semibold',
                  winner.growthPct != null && winner.growthPct >= 0 ? 'text-rising' : 'text-declining'
                )}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                {formatGrowth(winner.growthPct)}
              </span>
              <span className="text-xs text-muted-foreground">
                Señal: <span className="font-semibold text-foreground">~{formatScore(winner.performanceScore)}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                Confianza: <span className="font-semibold text-foreground">{Math.round(winner.signalConfidence * 100)}%</span>
              </span>
            </div>
          </div>

          {/* Ver más button */}
          {runnersUp.length > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="shrink-0 flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              {expanded ? (
                <>Ocultar <ChevronUp className="h-3.5 w-3.5" /></>
              ) : (
                <>Ver más <ChevronDown className="h-3.5 w-3.5" /></>
              )}
            </button>
          )}
        </div>

        {/* Runners-up comparison */}
        {expanded && runnersUp.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-border/50 pt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Señales más cercanas
            </p>
            {runnersUp.map((product, i) => (
              <RunnerRow key={product.candidateId} product={product} position={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
