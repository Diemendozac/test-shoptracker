'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PerformanceBadge } from '@/components/dashboard/performance-badge'
import { Sparkline } from '@/components/tracker/sparkline'
import { topTierLabel } from '@/lib/top-tier'
import type { TrackerCandidate } from '@/app/(dashboard)/types'

// ── selection helpers ──────────────────────────────────────────────────────────

function consecutiveTop10Days(
  rankHistory: number[] | undefined,
  storeProductCount: number | null | undefined,
): number {
  if (!rankHistory || rankHistory.length === 0) return 0
  if (!storeProductCount || storeProductCount <= 0) return 0
  let count = 0
  for (let i = rankHistory.length - 1; i >= 0; i--) {
    if ((rankHistory[i] / storeProductCount) * 100 <= 10) count++
    else break
  }
  return count
}

function isPositiveSignal(c: TrackerCandidate): boolean {
  return c.performanceLabel === 'Rising' || (c.performanceScore ?? 0) >= 70
}

function selectHero(candidates: TrackerCandidate[]): TrackerCandidate | null {
  // Priority 1: confident rising signal
  const p1 = candidates
    .filter(c =>
      c.signalConfidence >= 0.5 &&
      c.daysElapsed >= 7 &&
      (c.growthPct ?? 0) > 0 &&
      isPositiveSignal(c),
    )
    .sort((a, b) => (b.growthPct ?? 0) - (a.growthPct ?? 0))[0]

  if (p1) return p1

  // Priority 2: most consecutive days in top 10% of their store
  const withTop10 = candidates
    .filter(c =>
      c.daysElapsed >= 3 &&
      c.performanceLabel !== 'Watching' &&
      c.performanceLabel !== 'Declining',
    )
    .map(c => ({ c, days: consecutiveTop10Days(c.rankHistory, c.storeProductCount) }))
    .filter(({ days }) => days >= 1)
    .sort((a, b) => b.days - a.days)

  return withTop10[0]?.c ?? null
}

// ── image sub-component ────────────────────────────────────────────────────────

function ProductImg({ src, title }: { src: string | null; title: string }) {
  const [failed, setFailed] = useState(false)
  const proxied = src ? `/api/image-proxy?url=${encodeURIComponent(src)}` : null

  if (!proxied || failed) {
    return (
      <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-muted-foreground">
        {title.slice(0, 2).toUpperCase()}
      </div>
    )
  }
  return (
    <img
      src={proxied}
      alt=""
      className="h-[72px] w-[72px] shrink-0 rounded-lg object-cover"
      onError={() => setFailed(true)}
    />
  )
}

// ── main component ─────────────────────────────────────────────────────────────

export function HeroSignalCard({ candidates }: { candidates: TrackerCandidate[] }) {
  const hero = selectHero(candidates)
  if (!hero) return null

  const topPct = hero.currentRank != null && hero.storeProductCount
    ? Math.round((hero.currentRank / hero.storeProductCount) * 100)
    : null

  const tier = topTierLabel(hero.rankHistory, hero.storeProductCount, hero.daysElapsed)
  const confidence = Math.round(hero.signalConfidence * 100)

  // Sparkline: prefer scoreHistory (goes up = good); fall back to inverted rankHistory
  const sparkData: number[] = (() => {
    if (hero.scoreHistory && hero.scoreHistory.length >= 2) return hero.scoreHistory.slice(-7)
    if (hero.rankHistory && hero.rankHistory.length >= 2) return hero.rankHistory.slice(-7).map(r => -r)
    return []
  })()

  const growth = hero.growthPct != null
    ? `${hero.growthPct >= 0 ? '+' : ''}${Math.min(Math.abs(hero.growthPct), 500).toFixed(0)}%`
    : null

  return (
    <div className="mb-6 rounded-xl border border-border/60 bg-card px-6 py-5">
      <div className="flex items-center gap-4">

        {/* Product image */}
        <ProductImg src={hero.productImage} title={hero.productTitle} />

        {/* Info block */}
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Señal más fuerte
          </p>

          <p className="truncate text-base font-medium leading-snug text-foreground">
            {hero.productTitle}
          </p>

          <p className="mt-0.5 text-xs text-muted-foreground">
            {hero.storeName}
            {topPct != null && <> · top {topPct}%</>}
            {hero.storeProductCount != null && <> de {hero.storeProductCount} productos</>}
            {' · '}{confidence}% confianza
            {tier && (
              <> · <span className="font-medium text-emerald-500">{tier}</span></>
            )}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <PerformanceBadge label={hero.performanceLabel} size="sm" />
            {growth && hero.growthPct != null && hero.growthPct > 0 && (
              <span className="text-sm font-semibold text-emerald-500">{growth}</span>
            )}
            <span className="text-xs text-muted-foreground">desde su peor posición</span>
          </div>
        </div>

        {/* Sparkline + CTA */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          {sparkData.length >= 2 && (
            <Sparkline data={sparkData} width={96} height={32} />
          )}
          <Link
            href={`/tracker/${hero.candidateId}?storeId=${hero.storeId}&from=tracker`}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Ver análisis <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

      </div>
    </div>
  )
}
