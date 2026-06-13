'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Ad, TrackerCandidate } from '@/app/(dashboard)/types'
import { useGetProductAdsQuery } from '@/app/(dashboard)/services/dashboardApi'
import { usePlanTier } from '@/lib/view-as'

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

export function FloatingVideoPanel({
  ad, top, left, onMouseEnter, onMouseLeave,
}: {
  ad: Ad; top: number; left: number
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}) {
  const [muted, setMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  function toggleMute() {
    const next = !muted
    setMuted(next)
    if (videoRef.current) videoRef.current.muted = next
  }

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
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
      className="animate-in fade-in duration-150"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {ad.video_url_r2 ? (
        <>
          <video
            ref={videoRef}
            src={ad.video_url_r2}
            autoPlay muted loop playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <button
            onClick={toggleMute}
            className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
          >
            {muted
              ? <VolumeX className="h-3.5 w-3.5" />
              : <Volume2 className="h-3.5 w-3.5" />
            }
          </button>
        </>
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

// ─── useHoverPanel — hover compartido con delay para FloatingVideoPanel ────────

export function useHoverPanel() {
  const [hoveredAd, setHoveredAd]     = useState<Ad | null>(null)
  const [hoverPos, setHoverPos]       = useState({ top: 0, left: 0 })
  const leaveTimer                    = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (leaveTimer.current) clearTimeout(leaveTimer.current) }, [])

  const handleHover = useCallback((ad: Ad, rect: DOMRect) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    const panelH = 356, panelW = 200, gap = 8
    // Center horizontally over the thumbnail, clamped to viewport
    const left = Math.max(gap, Math.min(
      rect.left + rect.width / 2 - panelW / 2,
      window.innerWidth - panelW - gap,
    ))
    // Above by default; flip below if not enough space
    const topAbove = rect.top - panelH - gap
    const top = topAbove >= gap ? topAbove : rect.bottom + gap
    setHoverPos({ top, left })
    setHoveredAd(ad)
  }, [])

  const handleLeave      = useCallback(() => { leaveTimer.current = setTimeout(() => setHoveredAd(null), 150) }, [])
  const handlePanelEnter = useCallback(() => { if (leaveTimer.current) clearTimeout(leaveTimer.current) }, [])
  const handlePanelLeave = useCallback(() => setHoveredAd(null), [])

  return { hoveredAd, hoverPos, handleHover, handleLeave, handlePanelEnter, handlePanelLeave }
}

// ─── AdRow — fila de anuncio estilo Kalodata ───────────────────────────────────

function AdRow({
  ad,
  index,
  count = 1,
  allowMetaLink,
  showOrigin,
  onHover,
  onLeave,
}: {
  ad: Ad
  index: number
  count?: number
  allowMetaLink: boolean
  showOrigin: boolean
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

      {/* Thumbnail 9:16 — hover triggers floating panel, click abre Meta si allowMetaLink */}
      <div
        ref={thumbRef}
        role="button"
        tabIndex={0}
        className={cn(
          'relative h-[100px] w-[56px] shrink-0 overflow-hidden rounded-md bg-secondary',
          allowMetaLink ? 'cursor-pointer' : 'cursor-default',
        )}
        onMouseEnter={() => {
          if (thumbRef.current) onHover(ad, thumbRef.current.getBoundingClientRect())
        }}
        onMouseLeave={onLeave}
        onClick={() => allowMetaLink && window.open(ad.ad_snapshot_url, '_blank', 'noopener,noreferrer')}
        onKeyDown={e => { if (e.key === 'Enter' && allowMetaLink) window.open(ad.ad_snapshot_url, '_blank', 'noopener,noreferrer') }}
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
        {count > 1 && (
          <div className="absolute bottom-1 right-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white">
            ×{count}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="min-w-0">
        {showOrigin && (
          <p className="truncate text-sm font-medium text-foreground">{label}</p>
        )}
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

      {/* Ver en Meta — solo visible si allowMetaLink */}
      {allowMetaLink ? (
        <a
          href={ad.ad_snapshot_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground whitespace-nowrap"
        >
          Meta →
        </a>
      ) : (
        <div className="flex items-center justify-center gap-1 rounded-lg border border-border/40 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground/30 whitespace-nowrap cursor-not-allowed">
          Meta →
        </div>
      )}
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
}

type DevPlan = 'free' | 'starter' | 'pro'
const DEV_CYCLE: DevPlan[] = ['free', 'starter', 'pro']

export function ProductAdsSection({ candidateId }: ProductAdsSectionProps) {
  const { data, isLoading, isError } = useGetProductAdsQuery(candidateId)
  const [devPlan, setDevPlan] = useState<DevPlan | null>(null)

  const plan = usePlanTier()
  const effectivePlan: { isPro: boolean; isStarter: boolean; canViewAds: boolean; allowMetaLink: boolean } =
    devPlan
      ? {
          isPro:        devPlan === 'pro',
          isStarter:    devPlan === 'starter',
          canViewAds:   devPlan !== 'free',
          allowMetaLink: devPlan === 'pro',
        }
      : plan

  const { canViewAds, allowMetaLink } = effectivePlan

  const searchParams = useSearchParams()
  const isFromPool = searchParams.get('from') === 'pool'
  const showOrigin = !isFromPool

  const [sortBy, setSortBy] = useState<SortOption>('impressions')
  const { hoveredAd, hoverPos, handleHover, handleLeave, handlePanelEnter, handlePanelLeave } = useHoverPanel()

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

  const activeAds = rawAds.filter(a => a.status === 'active' && !isTestAd(a))
  if (activeAds.length === 0) return null

  const lastUpdated = data?.lastUpdated ? formatRelative(data.lastUpdated) : ''
  const uniqueAdvertisers = uniqueAdvertisersFromAds(activeAds)

  const sorted = [...activeAds]
  if (sortBy === 'recent') sorted.sort((a, b) => new Date(b.first_seen).getTime() - new Date(a.first_seen).getTime())
  else if (sortBy === 'oldest') sorted.sort((a, b) => b.days_running - a.days_running)

  // Dedup by video: same thumbnail = same creative. Badge shows count.
  const dedupedMap = new Map<string, { ad: Ad; count: number }>()
  for (const ad of sorted) {
    const key = (ad.thumbnail_url ?? ad.video_url_r2 ?? ad.ad_snapshot_url ?? '').split('?')[0]
    if (dedupedMap.has(key)) {
      dedupedMap.get(key)!.count++
    } else {
      dedupedMap.set(key, { ad, count: 1 })
    }
  }
  const deduped = [...dedupedMap.values()]

  return (
    <div id="ads" className="mt-6 overflow-hidden rounded-xl border border-border bg-card">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-foreground">Anuncios activos</h3>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600">
            {activeAds.length} activos
          </span>
          {uniqueAdvertisers.map(name => (
            <AdvertiserBadge
              key={name}
              advertiserName={name}
              allowMetaLink={allowMetaLink}
            />
          ))}
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
              onClick={() => setDevPlan(prev => {
                const idx = prev ? DEV_CYCLE.indexOf(prev) : -1
                return idx >= DEV_CYCLE.length - 1 ? null : DEV_CYCLE[idx + 1]
              })}
              className="rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              [dev] {devPlan ?? 'real'}
            </button>
          )}
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[28px_68px_1fr_56px_88px] items-center gap-3 border-b border-border bg-secondary/20 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <span>#</span>
        <span>Ad</span>
        <span>{showOrigin ? 'Origen' : ''}</span>
        <span>Días</span>
        <span />
      </div>

      {/* Rows */}
      <div className="relative">
        <div className={cn('divide-y divide-border/50', !canViewAds && 'pointer-events-none select-none blur-sm')}>
          {deduped.map(({ ad, count }, i) => (
            <AdRow
              key={ad.id}
              ad={ad}
              index={i + 1}
              count={count}
              allowMetaLink={allowMetaLink}
              showOrigin={showOrigin}
              onHover={handleHover}
              onLeave={handleLeave}
            />
          ))}
        </div>

        {!canViewAds && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-b-xl bg-card/70">
            <Lock className="h-5 w-5 text-foreground/50" />
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                Los anuncios activos requieren plan Starter o superior
              </p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Ve exactamente qué está pautando esta tienda y en qué productos.
              </p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href="/pricing">Upgrade →</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Floating video panel — outside blur wrapper, position:fixed escapes stacking context */}
      {hoveredAd && (
        <FloatingVideoPanel
          ad={hoveredAd} top={hoverPos.top} left={hoverPos.left}
          onMouseEnter={handlePanelEnter} onMouseLeave={handlePanelLeave}
        />
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
  const { hoveredAd, hoverPos, handleHover, handleLeave, handlePanelEnter, handlePanelLeave } = useHoverPanel()

  const activeAds = ads.filter(a => a.status === 'active' && !isTestAd(a))
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
        <FloatingVideoPanel
          ad={hoveredAd} top={hoverPos.top} left={hoverPos.left}
          onMouseEnter={handlePanelEnter} onMouseLeave={handlePanelLeave}
        />
      )}
    </>
  )
}

// ─── AdvertiserBadge — badge clicable al centro de anuncios de Meta ──────────

export function uniqueAdvertisersFromAds(ads: Ad[]): string[] {
  return [...new Set(ads.map(a => a.advertiser_name).filter(Boolean))] as string[]
}

export function AdvertiserBadge({ advertiserName, allowMetaLink }: { advertiserName: string; allowMetaLink: boolean }) {
  const href = allowMetaLink
    ? `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&search_type=keyword_unordered&q=${encodeURIComponent(advertiserName)}`
    : '#'

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={allowMetaLink ? undefined : 'Disponible en Pro — ver centro de anuncios del anunciante'}
      onClick={e => {
        e.stopPropagation()
        if (!allowMetaLink) e.preventDefault()
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 7px',
        borderRadius: 4,
        fontSize: 11,
        background: '#1877F2',
        color: '#fff',
        textDecoration: 'none',
        cursor: allowMetaLink ? 'pointer' : 'default',
        border: 'none',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
      <span style={allowMetaLink ? undefined : { filter: 'blur(3px)', pointerEvents: 'none' }}>
        {advertiserName}
      </span>
      {!allowMetaLink && (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, opacity: 0.9 }}>
          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
        </svg>
      )}
    </a>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isTestAd(ad: Ad): boolean {
  return (
    ad.thumbnail_url?.includes('picsum.photos') ||
    ad.ad_snapshot_url?.includes('TEST') ||
    ad.id?.startsWith('ad_00')  // mock IDs from mockAds constant
  ) ?? false
}

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

// ─── StoreVideosGrid ──────────────────────────────────────────────────────────
// One card per candidate that has active ads. Click → Meta (pro/agency/admin).
// Starter sees thumbnails but click is blocked. Product image is a decorative
// overlay in the bottom-left corner.

interface StoreVideoCardProps {
  candidate: TrackerCandidate
  allowMetaLink: boolean
  canViewAds: boolean
  onHover: (ad: Ad, rect: DOMRect) => void
  onLeave: () => void
  onHasAd: () => void
}

function StoreVideoCard({ candidate, allowMetaLink, canViewAds, onHover, onLeave, onHasAd }: StoreVideoCardProps) {
  const { data } = useGetProductAdsQuery(candidate.candidateId)
  const cardRef = useRef<HTMLDivElement>(null)

  const firstAd = data?.ads.find(a => a.status === 'active' && !isTestAd(a))

  useEffect(() => {
    if (firstAd) onHasAd()
  }, [firstAd]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!firstAd) return null

  const hasVideo = !!firstAd.video_url_r2

  function handleClick() {
    if (allowMetaLink) window.open(firstAd!.ad_snapshot_url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={e => { if (e.key === 'Enter') handleClick() }}
      onMouseEnter={() => {
        if (canViewAds && cardRef.current)
          onHover(firstAd, cardRef.current.getBoundingClientRect())
      }}
      onMouseLeave={onLeave}
      className={cn(
        'relative shrink-0 w-[100px] h-[178px] rounded-xl overflow-hidden bg-secondary group',
        allowMetaLink ? 'cursor-pointer' : 'cursor-default',
      )}
    >
      {/* Video thumbnail */}
      <img
        src={firstAd.thumbnail_url || 'https://picsum.photos/seed/placeholder/400/700'}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Play indicator */}
      {hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
            <svg className="h-4 w-4 translate-x-0.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
      )}

      {/* Lock overlay for starter */}
      {!allowMetaLink && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
          <Lock className="h-4 w-4 text-white opacity-0 group-hover:opacity-70 transition-opacity" />
        </div>
      )}

      {/* Product image overlay — bottom-left corner */}
      {candidate.productImage && (
        <div className="absolute bottom-2 left-2 h-8 w-8 rounded-md overflow-hidden border border-white/30 bg-black/40 shadow-md">
          <img
            src={candidate.productImage}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Days running badge */}
      {firstAd.days_running > 0 && (
        <div className="absolute top-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          {firstAd.days_running}d
        </div>
      )}
    </div>
  )
}

export function StoreVideosGrid({ candidates }: { candidates: TrackerCandidate[] }) {
  const { allowMetaLink, canViewAds } = usePlanTier()
  const { hoveredAd, hoverPos, handleHover, handleLeave, handlePanelEnter, handlePanelLeave } = useHoverPanel()
  const [hasAnyAd, setHasAnyAd] = useState(false)
  const handleHasAd = useCallback(() => setHasAnyAd(true), [])

  if (candidates.length === 0) return null

  return (
    <div className={cn('space-y-3', !hasAnyAd && 'hidden')}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Videos de la tienda</h2>
        {!allowMetaLink && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3" />
            Clic a Meta disponible en Pro
          </span>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {candidates.map(c => (
          <StoreVideoCard
            key={c.candidateId}
            candidate={c}
            allowMetaLink={allowMetaLink}
            canViewAds={canViewAds}
            onHasAd={handleHasAd}
            onHover={handleHover}
            onLeave={handleLeave}
          />
        ))}
      </div>

      {hoveredAd && canViewAds && (
        <FloatingVideoPanel
          ad={hoveredAd} top={hoverPos.top} left={hoverPos.left}
          onMouseEnter={handlePanelEnter} onMouseLeave={handlePanelLeave}
        />
      )}
    </div>
  )
}
