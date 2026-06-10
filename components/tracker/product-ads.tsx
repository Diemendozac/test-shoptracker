'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Ad } from '@/app/(dashboard)/types'
import { useGetProductAdsQuery } from '@/app/(dashboard)/services/dashboardApi'

export type { Ad }

// ─── Mock data ────────────────────────────────────────────────────────────────

export const mockAds: Ad[] = [
  {
    id: 'ad_001', ad_snapshot_url: 'https://www.facebook.com/ads/library/?id=123456789',
    thumbnail_url: 'https://picsum.photos/seed/ad1/400/700', status: 'active',
    days_running: 14, first_seen: '2024-01-08', last_seen: '2024-01-22',
    product_url: 'boniss.com/products/wireless-earbuds',
  },
  {
    id: 'ad_002', ad_snapshot_url: 'https://www.facebook.com/ads/library/?id=987654321',
    thumbnail_url: 'https://picsum.photos/seed/ad2/400/700', status: 'active',
    days_running: 7, first_seen: '2024-01-15', last_seen: '2024-01-22',
    product_url: 'boniss.com/products/wireless-earbuds',
  },
  {
    id: 'ad_003', ad_snapshot_url: 'https://www.facebook.com/ads/library/?id=456789123',
    thumbnail_url: 'https://picsum.photos/seed/ad3/400/400', status: 'active',
    days_running: 31, first_seen: '2023-12-22', last_seen: '2024-01-22',
    product_url: 'boniss.com/products/wireless-earbuds',
  },
  {
    id: 'ad_004', ad_snapshot_url: 'https://www.facebook.com/ads/library/?id=321654987',
    thumbnail_url: 'https://picsum.photos/seed/ad4/400/700', status: 'active',
    days_running: 3, first_seen: '2024-01-19', last_seen: '2024-01-22',
    product_url: 'boniss.com/products/wireless-earbuds',
  },
]

// ─── FloatingVideoPanel ────────────────────────────────────────────────────────

export function FloatingVideoPanel({ ad, top, left }: { ad: Ad; top: number; left: number }) {
  return (
    <div
      style={{
        position: 'fixed',
        top,
        left,
        width: 200,
        height: 356,
        zIndex: 50,
        borderRadius: 8,
        overflow: 'hidden',
        pointerEvents: 'none',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
      className="animate-in fade-in duration-150"
    >
      {ad.video_url_r2 ? (
        <video
          src={ad.video_url_r2}
          autoPlay muted loop playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <img
          src={ad.thumbnail_url}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  )
}

// ─── AdRow — fila de anuncio estilo Kalodata ───────────────────────────────────

function AdRow({
  ad,
  index,
  onHover,
  onLeave,
}: {
  ad: Ad
  index: number
  onHover: (ad: Ad, rect: DOMRect) => void
  onLeave: () => void
}) {
  const thumbRef = useRef<HTMLDivElement>(null)
  const hasVideo = !!ad.video_url_r2
  const label = ad.advertiser_name && ad.advertiser_name.length > 0
    ? ad.advertiser_name
    : ad.product_url
      ? ad.product_url.replace(/^https?:\/\//, '').split('/')[0]
      : `Anuncio ${index}`

  return (
    <div className="grid grid-cols-[28px_68px_1fr_56px_88px] items-center gap-3 px-4 py-3">

      {/* # */}
      <span className="text-xs font-medium text-muted-foreground tabular-nums">{index}</span>

      {/* Thumbnail 9:16 — hover triggers floating panel, click abre Meta */}
      <div
        ref={thumbRef}
        role="button"
        tabIndex={0}
        className="relative h-[100px] w-[56px] shrink-0 cursor-pointer overflow-hidden rounded-md bg-secondary"
        onMouseEnter={() => {
          if (thumbRef.current) onHover(ad, thumbRef.current.getBoundingClientRect())
        }}
        onMouseLeave={onLeave}
        onClick={() => window.open(ad.ad_snapshot_url, '_blank', 'noopener,noreferrer')}
        onKeyDown={e => { if (e.key === 'Enter') window.open(ad.ad_snapshot_url, '_blank', 'noopener,noreferrer') }}
      >
        <img
          src={ad.thumbnail_url || 'https://picsum.photos/seed/placeholder/400/700'}
          alt=""
          className="h-full w-full object-cover"
        />
        {hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
              <svg className="h-3 w-3 translate-x-0.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Desde {formatDate(ad.first_seen)}
        </p>
      </div>

      {/* Días */}
      <span className={cn(
        'text-sm font-bold tabular-nums',
        ad.days_running >= 30 ? 'text-emerald-600' : 'text-foreground/80',
      )}>
        {ad.days_running}d
      </span>

      {/* Ver en Meta */}
      <a
        href={ad.ad_snapshot_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground whitespace-nowrap"
      >
        Meta →
      </a>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function AdsSkeleton() {
  return (
    <div className="divide-y divide-border/50">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="h-3 w-5 animate-pulse rounded bg-secondary" />
          <div className="h-[100px] w-[56px] animate-pulse rounded-md bg-secondary" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-secondary" />
            <div className="h-2.5 w-20 animate-pulse rounded bg-secondary" />
          </div>
          <div className="h-3 w-8 animate-pulse rounded bg-secondary" />
          <div className="h-7 w-16 animate-pulse rounded-lg bg-secondary" />
        </div>
      ))}
    </div>
  )
}

// ─── ProductAdsSection ────────────────────────────────────────────────────────

type SortOption = 'impressions' | 'recent' | 'oldest'

interface ProductAdsSectionProps {
  candidateId: string
  isPro: boolean
}

export function ProductAdsSection({ candidateId, isPro }: ProductAdsSectionProps) {
  const { data, isLoading, isError } = useGetProductAdsQuery(candidateId)
  const [devOverride, setDevOverride] = useState<boolean | null>(null)
  const effectiveIsPro = devOverride !== null ? devOverride : isPro

  const [sortBy, setSortBy] = useState<SortOption>('impressions')
  const [hoveredAd, setHoveredAd] = useState<Ad | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ top: 0, left: 0 })

  const handleHover = useCallback((ad: Ad, rect: DOMRect) => {
    const panelH = 356
    const top = Math.max(8, Math.min(
      rect.top + rect.height / 2 - panelH / 2,
      window.innerHeight - panelH - 8,
    ))
    const panelW = 200
    const left = rect.right + 12 + panelW > window.innerWidth
      ? rect.left - panelW - 12
      : rect.right + 12
    setHoverPosition({ top, left })
    setHoveredAd(ad)
  }, [])

  const handleLeave = useCallback(() => setHoveredAd(null), [])

  if (isLoading) {
    return (
      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <h3 className="font-semibold text-foreground">Anuncios activos</h3>
        </div>
        <AdsSkeleton />
      </div>
    )
  }

  const rawAds = isError || !data
    ? (process.env.NODE_ENV === 'development' ? mockAds : [])
    : data.ads

  const activeAds = rawAds.filter(a => a.status === 'active')
  if (activeAds.length === 0) return null

  const lastUpdated = data?.lastUpdated ? formatRelative(data.lastUpdated) : ''

  const sorted = [...activeAds]
  if (sortBy === 'recent') sorted.sort((a, b) => new Date(b.first_seen).getTime() - new Date(a.first_seen).getTime())
  else if (sortBy === 'oldest') sorted.sort((a, b) => b.days_running - a.days_running)

  return (
    <div id="ads" className="mt-6 overflow-hidden rounded-xl border border-border bg-card">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-foreground">Anuncios activos</h3>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600">
            {activeAds.length} activos
          </span>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="rounded-md border border-border bg-secondary/50 px-2 py-1 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          >
            <option value="impressions">Impresiones</option>
            <option value="recent">Más recientes</option>
            <option value="oldest">Más duraderos</option>
          </select>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">actualizado {lastUpdated}</span>
          )}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => setDevOverride(prev => prev === null ? !isPro : prev === isPro ? null : isPro)}
              className="rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              [dev] {effectiveIsPro ? 'Pro ✓' : 'Free 🔒'}
            </button>
          )}
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[28px_68px_1fr_56px_88px] items-center gap-3 border-b border-border bg-secondary/20 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <span>#</span>
        <span>Ad</span>
        <span>Origen</span>
        <span>Días</span>
        <span />
      </div>

      {/* Rows */}
      <div className="relative">
        <div className={cn('divide-y divide-border/50', !effectiveIsPro && 'pointer-events-none select-none blur-sm')}>
          {sorted.map((ad, i) => (
            <AdRow
              key={ad.id}
              ad={ad}
              index={i + 1}
              onHover={handleHover}
              onLeave={handleLeave}
            />
          ))}
        </div>

        {!effectiveIsPro && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-b-xl bg-card/70">
            <Lock className="h-5 w-5 text-foreground/50" />
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                Los anuncios activos son exclusivos de Pro
              </p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Ve exactamente qué está pautando esta tienda y en qué productos.
              </p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href="/pricing">Upgrade a Pro →</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Floating video panel — outside blur wrapper, position:fixed escapes stacking context */}
      {hoveredAd && (
        <FloatingVideoPanel ad={hoveredAd} top={hoverPosition.top} left={hoverPosition.left} />
      )}
    </div>
  )
}

// ─── AdThumbnailHover — miniatura 56×56 con hover → floating panel ────────────

function AdThumbnailHover({
  ad,
  isPro,
  onHover,
  onLeave,
}: {
  ad: Ad
  isPro: boolean
  onHover: (ad: Ad, rect: DOMRect) => void
  onLeave: () => void
}) {
  const thumbRef = useRef<HTMLDivElement>(null)
  const hasVideo = !!ad.video_url_r2

  return (
    <div
      ref={thumbRef}
      className={cn(
        'relative h-[56px] w-[56px] shrink-0 overflow-hidden rounded-md bg-secondary',
        !isPro && 'pointer-events-none',
      )}
      onMouseEnter={() => {
        if (isPro && thumbRef.current) onHover(ad, thumbRef.current.getBoundingClientRect())
      }}
      onMouseLeave={onLeave}
    >
      <img
        src={ad.thumbnail_url || 'https://picsum.photos/seed/placeholder/400/700'}
        alt=""
        className={cn('h-full w-full object-cover', !isPro && 'scale-110 blur-sm')}
      />
      {hasVideo && isPro && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black/50">
            <svg className="h-2.5 w-2.5 translate-x-px text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AdStripPreview — 3 miniaturas en tracker table ───────────────────────────

interface AdStripPreviewProps {
  ads?: Ad[]
  isPro: boolean
  candidateId: string
  storeId: string
}

export function AdStripPreview({
  ads = mockAds,
  isPro,
  candidateId,
  storeId,
}: AdStripPreviewProps) {
  const [hoveredAd, setHoveredAd] = useState<Ad | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ top: 0, left: 0 })

  const handleHover = useCallback((ad: Ad, rect: DOMRect) => {
    const panelH = 356
    const top = Math.max(8, Math.min(
      rect.top + rect.height / 2 - panelH / 2,
      window.innerHeight - panelH - 8,
    ))
    const panelW = 200
    const left = rect.right + 12 + panelW > window.innerWidth
      ? rect.left - panelW - 12
      : rect.right + 12
    setHoverPosition({ top, left })
    setHoveredAd(ad)
  }, [])

  const handleLeave = useCallback(() => setHoveredAd(null), [])

  const activeAds = ads.filter(a => a.status === 'active')
  if (activeAds.length === 0) return null

  const previews  = activeAds.slice(0, 3)
  const remaining = activeAds.length - previews.length

  return (
    <>
      <Link
        href={`/tracker/${candidateId}?storeId=${storeId}#ads`}
        className="flex items-center gap-3 border-t border-border/40 px-4 py-2"
      >
        <div className="flex items-center gap-1.5">
          {previews.map(ad => (
            <AdThumbnailHover
              key={ad.id}
              ad={ad}
              isPro={isPro}
              onHover={handleHover}
              onLeave={handleLeave}
            />
          ))}
          {remaining > 0 && (
            <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-muted-foreground">
              +{remaining}
            </div>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground">
          {activeAds.length} anuncios activos →
        </span>
      </Link>

      {/* Floating video panel — position:fixed renders at viewport level, outside Link DOM */}
      {hoveredAd && isPro && (
        <FloatingVideoPanel ad={hoveredAd} top={hoverPosition.top} left={hoverPosition.left} />
      )}
    </>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelative(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime()
    const diffH  = Math.floor(diffMs / 3_600_000)
    const diffD  = Math.floor(diffH / 24)
    if (diffH < 1)  return 'hace menos de 1h'
    if (diffH < 24) return `hace ${diffH}h`
    return `hace ${diffD}d`
  } catch {
    return ''
  }
}

function formatDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return isoDate
  }
}
