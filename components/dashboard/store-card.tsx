'use client'

import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PerformanceBadge } from './performance-badge'
import type { DashboardItem } from '@/lib/types'
import { ExternalLink, Package, TrendingUp } from 'lucide-react'
import { fmtCompact } from '@/lib/utils'
import { resolveDisplayLabel } from '@/lib/label-utils'

function ProductImage({ src, title }: { src: string | null; title: string }) {
  const [failed, setFailed] = useState(false)
  const proxySrc = src ? `/api/image-proxy?url=${encodeURIComponent(src)}` : null

  if (!proxySrc || failed) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-muted-foreground">
        {title.slice(0, 2).toUpperCase()}
      </div>
    )
  }

  return (
    <img
      src={proxySrc}
      alt=""
      className="h-16 w-16 shrink-0 rounded-lg object-cover"
      onError={() => setFailed(true)}
    />
  )
}

interface StoreCardProps {
  item: DashboardItem
}

function StoreFavicon({ url, name }: { url?: string; name: string }) {
  const [failed, setFailed] = useState(false)
  const initials = name.slice(0, 2).toUpperCase()

  const domain = url ? url.replace(/^https?:\/\//, '').replace(/\/$/, '') : null
  const faviconUrl = domain
    ? `/api/favicon?domain=${encodeURIComponent(domain)}`
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


function getDashboardStoreStatus(item: { lastScrapedAt?: string | null; inactivityTier: string | null }) {
  const hoursAgo = item.lastScrapedAt
    ? (Date.now() - new Date(item.lastScrapedAt).getTime()) / (1000 * 60 * 60)
    : Infinity
  if (hoursAgo < 24) return 'ACTIVA'
  if (item.inactivityTier === 'ZOMBIE' || hoursAgo > 7 * 24) return 'ZOMBIE'
  return 'INACTIVA'
}

export function StoreCard({ item }: StoreCardProps) {
  const { storeId, storeName, storeUrl, topCandidate, pagoAnticipado } = item
  const status = getDashboardStoreStatus(item)

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
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{storeName}</h3>
                {status !== 'ACTIVA' && (
                  <span className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                    status === 'ZOMBIE' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-600',
                  )}>
                    {status}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-muted-foreground">Mejor candidato</p>
                {pagoAnticipado && (
                  <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                    Pago anticipado
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {topCandidate ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <ProductImage src={topCandidate.productImage} title={topCandidate.productTitle} />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <h4 className="line-clamp-2 text-sm font-medium leading-tight text-foreground">
                  {topCandidate.productTitle}
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  <PerformanceBadge label={resolveDisplayLabel(topCandidate.performanceLabel, topCandidate.performanceScore, topCandidate.growthPct, topCandidate.daysElapsed, topCandidate.scoreHistory, topCandidate.growthHistory)} size="sm" />
                  {(() => {
                    const gp = topCandidate.growthPct ?? 0
                    const capped = gp > 500
                    const display = capped ? '+500%' : `${gp >= 0 ? '+' : ''}${Math.round(gp)}%`
                    return (
                      <span
                        className={cn('text-xs font-medium', gp >= 0 ? 'text-rising' : 'text-declining')}
                        title={capped ? 'Crecimiento extraordinario — pocos días de datos' : undefined}
                      >
                        {display} growth
                      </span>
                    )
                  })()}
                </div>
              </div>
            </div>

            {/* Action */}
            <Link
              href={`/stores/${storeId}`}
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
            <p className="text-sm font-medium text-muted-foreground">Aún no hay candidatos</p>
            <p className="text-xs text-muted-foreground/70">Esperando productos nuevos</p>
          </div>
        )}
      </div>
    </div>
  )
}
