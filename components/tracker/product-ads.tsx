'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Ad } from '@/app/(dashboard)/types'
import { useGetProductAdsQuery } from '@/app/(dashboard)/services/dashboardApi'

// Re-export Ad type for external use
export type { Ad }

// ─── Mock data (development fallback) ─────────────────────────────────────────

export const mockAds: Ad[] = [
  {
    id: 'ad_001',
    ad_snapshot_url: 'https://www.facebook.com/ads/library/?id=123456789',
    thumbnail_url: 'https://picsum.photos/seed/ad1/400/700',
    status: 'active',
    days_running: 14,
    first_seen: '2024-01-08',
    last_seen: '2024-01-22',
    product_url: 'boniss.com/products/wireless-earbuds',
  },
  {
    id: 'ad_002',
    ad_snapshot_url: 'https://www.facebook.com/ads/library/?id=987654321',
    thumbnail_url: 'https://picsum.photos/seed/ad2/400/700',
    status: 'active',
    days_running: 7,
    first_seen: '2024-01-15',
    last_seen: '2024-01-22',
    product_url: 'boniss.com/products/wireless-earbuds',
  },
  {
    id: 'ad_003',
    ad_snapshot_url: 'https://www.facebook.com/ads/library/?id=456789123',
    thumbnail_url: 'https://picsum.photos/seed/ad3/400/400',
    status: 'active',
    days_running: 31,
    first_seen: '2023-12-22',
    last_seen: '2024-01-22',
    product_url: 'boniss.com/products/wireless-earbuds',
  },
  {
    id: 'ad_004',
    ad_snapshot_url: 'https://www.facebook.com/ads/library/?id=321654987',
    thumbnail_url: 'https://picsum.photos/seed/ad4/400/700',
    status: 'active',
    days_running: 3,
    first_seen: '2024-01-19',
    last_seen: '2024-01-22',
    product_url: 'boniss.com/products/wireless-earbuds',
  },
]

// ─── AdCard ───────────────────────────────────────────────────────────────────

function AdCard({ ad }: { ad: Ad }) {
  const [playing, setPlaying] = useState(false)
  const hasVideo = !!ad.video_url_r2

  const handleClick = () => {
    if (hasVideo) {
      setPlaying(true)
    } else {
      window.open(ad.ad_snapshot_url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div
      className="group relative block h-52 overflow-hidden rounded-lg border border-border bg-secondary transition-colors hover:border-foreground/25 cursor-pointer"
      onClick={!playing ? handleClick : undefined}
    >
      {playing && ad.video_url_r2 ? (
        <video
          src={ad.video_url_r2}
          autoPlay
          controls
          className="h-full w-full object-cover"
          onEnded={() => setPlaying(false)}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <>
          <img
            src={ad.thumbnail_url || 'https://picsum.photos/seed/placeholder/400/700'}
            alt=""
            className="h-full w-full object-cover"
          />

          <span className="absolute right-2 top-2 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
            Activo
          </span>

          <div className="absolute inset-x-0 bottom-0 bg-black/50 px-2.5 py-1.5">
            <span
              className={cn(
                'text-[11px] font-medium',
                ad.days_running >= 30 ? 'text-emerald-400' : 'text-white/80',
              )}
            >
              Corriendo {ad.days_running} días
            </span>
          </div>

          {/* Play button — visible on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
              {hasVideo ? (
                <svg className="h-5 w-5 translate-x-0.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function AdsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-52 animate-pulse rounded-lg bg-secondary" />
      ))}
    </div>
  )
}

// ─── ProductAdsSection ────────────────────────────────────────────────────────

interface ProductAdsSectionProps {
  candidateId: string
  isPro: boolean
}

export function ProductAdsSection({ candidateId, isPro }: ProductAdsSectionProps) {
  const { data, isLoading, isError } = useGetProductAdsQuery(candidateId)

  // Dev toggle: override plan state without changing the real user plan.
  const [devOverride, setDevOverride] = useState<boolean | null>(null)
  const effectiveIsPro = devOverride !== null ? devOverride : isPro

  if (isLoading) {
    return (
      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <h3 className="font-semibold text-foreground">Anuncios activos</h3>
        </div>
        <div className="p-6">
          <AdsSkeleton />
        </div>
      </div>
    )
  }

  // In development, fall back to mockAds when there's no real data yet
  const rawAds = isError || !data
    ? (process.env.NODE_ENV === 'development' ? mockAds : [])
    : data.ads

  const activeAds = rawAds.filter(a => a.status === 'active')
  if (activeAds.length === 0) return null

  const lastUpdated = data?.lastUpdated
    ? formatRelative(data.lastUpdated)
    : process.env.NODE_ENV === 'development' ? 'mock data' : ''

  return (
    <div id="ads" className="mt-6 overflow-hidden rounded-xl border border-border bg-card">

      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-foreground">Anuncios activos</h3>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600">
            {activeAds.length} activos
          </span>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">actualizado {lastUpdated}</span>
          )}

          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() =>
                setDevOverride(prev =>
                  prev === null ? !isPro : prev === isPro ? null : isPro,
                )
              }
              className="rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              [dev] {effectiveIsPro ? 'Pro ✓' : 'Free 🔒'}
            </button>
          )}
        </div>
      </div>

      <div className="relative p-6">
        <div
          className={cn(
            'grid grid-cols-2 gap-3',
            !effectiveIsPro && 'pointer-events-none select-none blur-sm',
          )}
        >
          {activeAds.map(ad => (
            <AdCard key={ad.id} ad={ad} />
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
    </div>
  )
}

// ─── AdStripPreview ───────────────────────────────────────────────────────────

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
  const activeAds = ads.filter(a => a.status === 'active')
  if (activeAds.length === 0) return null

  const previews  = activeAds.slice(0, 3)
  const remaining = activeAds.length - previews.length

  return (
    <Link
      href={`/tracker/${candidateId}?storeId=${storeId}#ads`}
      className="flex items-center gap-2 border-t border-border/50 px-4 py-2"
    >
      {previews.map(ad => (
        <div
          key={ad.id}
          className="relative h-7 w-7 shrink-0 overflow-hidden rounded bg-secondary"
        >
          <img
            src={ad.thumbnail_url}
            alt=""
            className={cn(
              'h-full w-full object-cover',
              !isPro && 'scale-110 blur-sm',
            )}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-0 w-0 border-y-[3px] border-l-[6px] border-y-transparent border-l-white/70" />
          </div>
        </div>
      ))}

      <span className="text-[11px] text-muted-foreground">
        {remaining > 0 && <span className="font-medium text-foreground">+{remaining} </span>}
        {activeAds.length} anuncios activos →
      </span>
    </Link>
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
