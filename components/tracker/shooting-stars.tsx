'use client'

import Link from 'next/link'
import { Crown, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { topTierLabel } from '@/lib/top-tier'
import type { TrackerCandidate } from '@/app/(dashboard)/types'

interface ShootingStarsProps {
  candidates: TrackerCandidate[]
  onRequestFullTable: () => void
  showFullTable: boolean
}

const RANK_STYLES = [
  { badge: 'bg-amber-400 text-amber-950',   ring: 'ring-amber-400/30',  label: 'TOP 1' },
  { badge: 'bg-slate-300 text-slate-800',   ring: 'ring-slate-300/20',  label: 'TOP 2' },
  { badge: 'bg-orange-400/80 text-orange-950', ring: 'ring-orange-400/20', label: 'TOP 3' },
  { badge: 'bg-secondary text-foreground',  ring: 'ring-border',        label: 'TOP 4' },
  { badge: 'bg-secondary text-foreground',  ring: 'ring-border',        label: 'TOP 5' },
]

function GrowthChip({ value }: { value: number | null }) {
  if (value == null) return null
  if (value > 0) return (
    <span className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-500">
      <TrendingUp className="h-3 w-3" />+{Math.round(value)}%
    </span>
  )
  if (value < 0) return (
    <span className="flex items-center gap-0.5 text-[11px] font-semibold text-red-400">
      <TrendingDown className="h-3 w-3" />{Math.round(value)}%
    </span>
  )
  return (
    <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
      <Minus className="h-3 w-3" />0%
    </span>
  )
}

export function ShootingStars({ candidates }: ShootingStarsProps) {
  const top5 = [...candidates]
    .sort((a, b) => (b.performanceScore ?? 0) - (a.performanceScore ?? 0))
    .slice(0, 5)

  if (top5.length === 0) return null

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Top productos</h2>
        <span className="text-xs text-muted-foreground">{candidates.length} candidatos activos</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {top5.map((c, i) => {
          const style = RANK_STYLES[i]
          const score = Math.round(c.performanceScore ?? 0)
          const isTop3 = i < 3

          return (
            <Link
              key={c.candidateId}
              href={`/tracker/${c.candidateId}?storeId=${c.storeId}`}
              className={cn(
                'group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200',
                'hover:shadow-md hover:-translate-y-0.5',
                isTop3 ? `ring-1 ${style.ring}` : 'border-border',
              )}
            >
              {/* Rank badge */}
              <div className={cn(
                'absolute left-2 top-2 z-10 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide',
                style.badge,
              )}>
                {i === 0 && <Crown className="mb-0.5 inline h-2.5 w-2.5" />}
                {' '}{style.label}
              </div>

              {/* Product image */}
              <div className="relative aspect-square w-full overflow-hidden bg-secondary">
                {c.productImage ? (
                  <img
                    src={`/api/image-proxy?url=${encodeURIComponent(c.productImage)}`}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-black text-muted-foreground">
                    {c.productTitle.trim().charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-2 p-3">
                <div>
                  <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground">
                    {c.productTitle}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{c.storeName}</p>
                </div>

                <div className="mt-auto flex items-center justify-between">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Score</p>
                    <p className={cn(
                      'text-sm font-bold tabular-nums',
                      score >= 60 ? 'text-emerald-500' : score >= 30 ? 'text-amber-400' : 'text-foreground',
                    )}>
                      {score}
                    </p>
                  </div>
                  <GrowthChip value={c.growthPct} />
                </div>

                {(() => {
                  const tier = topTierLabel(c.rankHistory, c.storeProductCount, c.daysElapsed)
                  return tier ? <p className="text-[10px] text-muted-foreground">{tier}</p> : null
                })()}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
