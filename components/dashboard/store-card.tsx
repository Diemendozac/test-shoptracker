'use client'

import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PerformanceBadge } from './performance-badge'
import type { DashboardItem } from '@/lib/types'
import { ArrowRight, Package } from 'lucide-react'
import { fmtCompact } from '@/lib/utils'
import { resolveDisplayLabel } from '@/lib/label-utils'

function ProductImage({ src, title }: { src: string | null; title: string }) {
  const [failed, setFailed] = useState(false)
  const proxySrc = src ? `/api/image-proxy?url=${encodeURIComponent(src)}` : null

  if (!proxySrc || failed) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-xs font-semibold text-muted-foreground">
        {title.slice(0, 2).toUpperCase()}
      </div>
    )
  }

  return (
    <img
      src={proxySrc}
      alt=""
      className="h-16 w-16 shrink-0 rounded-lg border border-border object-cover"
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
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary text-xs font-semibold text-muted-foreground">
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
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-card transition-[border-color,box-shadow] duration-200 hover:border-border-hover hover:shadow-card-hover">
      <div className="flex flex-1 flex-col p-5">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StoreFavicon url={storeUrl} name={storeName} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-foreground">{storeName}</h3>
                {status !== 'ACTIVA' && (
                  <span className={cn(
                    'rounded-full border px-2 py-0.5 text-xs font-semibold tracking-wide',
                    status === 'ZOMBIE'
                      ? 'border-danger-border bg-danger-subtle text-danger-foreground'
                      : 'border-warning-border bg-warning-subtle text-warning-foreground',
                  )}>
                    {status}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-xs text-muted-foreground">Mejor candidato</p>
                {pagoAnticipado && (
                  <span className="rounded-full border border-border bg-neutral-subtle px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    Pago anticipado
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {topCandidate ? (
          <div className="flex flex-1 flex-col gap-4">
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
                        className={cn('text-xs font-semibold tabular-nums', gp >= 0 ? 'text-success-foreground' : 'text-danger-foreground')}
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
              className="mt-auto flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              View Details
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Aún no hay candidatos</p>
            <p className="text-xs text-muted-foreground">Esperando productos nuevos</p>
          </div>
        )}
      </div>
    </div>
  )
}
