'use client'

import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PerformanceBadge } from './performance-badge'
import { ScoreRing } from './score-ring'
import type { DashboardItem } from '@/lib/types'
import { ExternalLink, Package, TrendingUp } from 'lucide-react'

interface StoreCardProps {
  item: DashboardItem
}

function StoreFavicon({ url, name }: { url?: string; name: string }) {
  const [failed, setFailed] = useState(false)
  const initials = name.slice(0, 2).toUpperCase()

  const faviconUrl = url
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=64`
    : null

  if (!faviconUrl || failed) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
        {initials}
      </div>
    )
  }

  return (
    <img
      src={faviconUrl}
      alt=""
      className="h-10 w-10 rounded-lg object-contain"
      onError={() => setFailed(true)}
    />
  )
}

export function StoreCard({ item }: StoreCardProps) {
  const { storeName, storeUrl, topCandidate } = item

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative p-5">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StoreFavicon url={storeUrl} name={storeName} />
            <div>
              <h3 className="font-semibold text-foreground">{storeName}</h3>
              <p className="text-xs text-muted-foreground">Top candidate</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {topCandidate ? (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <ScoreRing
                score={topCandidate.performanceScore}
                label={topCandidate.performanceLabel}
                size="md"
              />
              <div className="flex-1 space-y-2">
                <h4 className="font-medium leading-tight text-foreground">
                  {topCandidate.productTitle}
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  <PerformanceBadge label={topCandidate.performanceLabel} size="sm" />
                  <span className={cn(
                    'text-xs font-medium',
                    topCandidate.growthPct >= 0 ? 'text-rising' : 'text-declining'
                  )}>
                    {topCandidate.growthPct >= 0 ? '+' : ''}{Math.round(topCandidate.growthPct * 100)}% growth
                  </span>
                </div>
              </div>
            </div>

            {/* Action */}
            <Link
              href={`/tracker/${topCandidate.candidateId}`}
              className="flex items-center justify-center gap-2 rounded-lg bg-secondary py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <TrendingUp className="h-4 w-4" />
              View Details
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No candidates yet</p>
            <p className="text-xs text-muted-foreground/70">Waiting for new products</p>
          </div>
        )}
      </div>
    </div>
  )
}
