'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ExternalLink, Lock, Video, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Ad, TrackerCandidate } from '@/app/(dashboard)/types'
import { useGetProductAdsQuery } from '@/app/(dashboard)/services/dashboardApi'
import { usePlanTier } from '@/lib/view-as'
import { formatShortDate } from '@/lib/format-date'

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
        // z-60, no 50 (2026-09-15) — ViewAsBar (components/admin/ViewAsBar.tsx) también usa
        // z-50, fixed en el borde inferior. Con el mismo nivel, gana el que esté después en el
        // DOM — inconsistente, y ViewAsBar termina tapando el panel cuando el hover abre cerca
        // del borde inferior. Encontrado en la Biblioteca de anuncios (grid más alto = más
        // frecuente ahí), pero afecta a cualquier pantalla que use este panel.
        zIndex: 60,
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

// ─── AdSlide — card 9:16 para carrusel de anuncios ────────────────────────────

// Exportado para reuso en la Biblioteca de anuncios (2026-09-15) — misma card, mismo
// tratamiento de status ya corregido, sin duplicar el componente.
export function AdSlide({
  ad,
  index,
  count = 1,
  allowMetaLink,
  onHover,
  onLeave,
}: {
  ad: Ad
  index: number
  count?: number
  allowMetaLink: boolean
  onHover: (ad: Ad, rect: DOMRect) => void
  onLeave: () => void
}) {
  const thumbRef = useRef<HTMLDivElement>(null)
  const hasVideo = !!ad.video_url_r2
  const label = ad.advertiser_name?.length
    ? ad.advertiser_name
    : ad.product_url
      ? ad.product_url.replace(/^https?:\/\//, '').split('/')[0]
      : `Anuncio ${index}`
  // status real de ads v2 (2026-09-15) — antes esta card asumía 'Activo' hardcodeado sin mirar
  // ad.status, porque nada en el sistema podía escribir 'inactive'. Ahora sí puede, y esta card
  // ya no se oculta cuando pasa (ver ProductAdsSection abajo) — se relabelea. Incidente FIX-073.
  const isInactive = ad.status !== 'active'
  const isLongRunning = !isInactive && ad.days_running >= 30
  const openMeta = () => {
    if (allowMetaLink) window.open(ad.ad_snapshot_url, '_blank', 'noopener,noreferrer')
  }

  // La card se adapta a su propio ancho (container query), no al viewport: la misma
  // card sirve en el panel del pool (~110 px), en la página (~170 px) y en la Biblioteca.
  // Ver docs/redesign/detalle-producto/02-propuesta.md, "tarjeta de anuncio v2".
  return (
    <div className="@container flex w-full min-w-0 flex-col">

      {/* Creative 9:16 */}
      <div
        ref={thumbRef}
        role="button"
        tabIndex={0}
        aria-label={allowMetaLink ? `Ver anuncio de ${label} en Meta` : `Creativo del anuncio de ${label}`}
        className={cn(
          'relative w-full overflow-hidden rounded-lg bg-secondary aspect-[9/16]',
          allowMetaLink ? 'cursor-pointer' : 'cursor-default',
          isInactive && 'grayscale',
        )}
        onMouseEnter={() => {
          if (thumbRef.current) onHover(ad, thumbRef.current.getBoundingClientRect())
        }}
        onMouseLeave={onLeave}
        onClick={openMeta}
        onKeyDown={e => {
          if (e.key === 'Enter') openMeta()
        }}
      >
        {ad.thumbnail_url ? (
          <img src={ad.thumbnail_url} alt="" className="h-full w-full object-cover" />
        ) : (
          // Sin miniatura: placeholder neutro. Antes se mostraba una foto de stock al azar
          // (picsum) como si fuera el creativo.
          <div className="flex h-full w-full items-center justify-center text-subtle-foreground">
            <Video className="h-6 w-6" aria-hidden />
          </div>
        )}

        {/* Play icon for videos */}
        {hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar/80">
              <svg className="h-3.5 w-3.5 translate-x-px text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* ×N (mismo creativo en N anuncios) y días corriendo: 12 px sobre tinta al 80 % (AA sobre cualquier creativo) */}
        {count > 1 && (
          <span
            className="absolute left-1.5 top-1.5 rounded-full bg-sidebar/80 px-1.5 text-xs font-semibold leading-5 text-sidebar-foreground tabular-nums"
            title={`${count} anuncios con este creativo`}
          >
            ×{count}
          </span>
        )}
        <span
          className={cn(
            'absolute right-1.5 top-1.5 rounded-full px-1.5 text-xs font-semibold leading-5 tabular-nums',
            isLongRunning ? 'bg-success-foreground text-white' : 'bg-sidebar/80 text-sidebar-foreground',
          )}
          title={`${isInactive ? 'Corrió' : 'Lleva'} ${ad.days_running} días`}
        >
          {ad.days_running} d
        </span>
      </div>

      {/* Metadatos: pueden pasar a dos líneas, nunca se encima uno sobre otro */}
      <p className="mt-2 flex flex-wrap gap-x-1.5 text-xs text-subtle-foreground @max-[159px]:flex-col">
        <span className={cn(
          'inline-flex items-center gap-1.5 font-semibold',
          isInactive ? 'text-subtle-foreground' : 'text-success-foreground',
        )}>
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', isInactive ? 'bg-input' : 'bg-success')} aria-hidden />
          {isInactive ? 'Terminado' : 'Activo'}
        </span>
        <span>desde {formatDate(ad.first_seen)}</span>
      </p>
      <p className="mt-0.5 truncate text-xs font-medium text-foreground" title={label}>{label}</p>

      {allowMetaLink ? (
        <a
          href={ad.ad_snapshot_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-flex w-fit items-center gap-1 text-xs font-medium text-primary-text hover:underline"
          onClick={e => e.stopPropagation()}
        >
          Ver en Meta
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      ) : (
        <span className="mt-1.5 inline-flex w-fit items-center gap-1 text-xs text-subtle-foreground" title="Disponible en Pro">
          <Lock className="h-3 w-3" aria-hidden />
          Meta · Pro
        </span>
      )}
      {ad.body_text && (
        <p className="mt-1.5 line-clamp-3 text-xs leading-4 text-muted-foreground @max-[159px]:hidden">
          {ad.body_text}
        </p>
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
  /** Sin tarjeta propia (borde, fondo, padding): para usar dentro de otra superficie, p. ej. el panel del pool */
  embedded?: boolean
  /** compact: tarjetas desde 104 px (panel). comfortable: 96 px en móvil y 152 px desde md (página) */
  density?: 'compact' | 'comfortable'
}

type DevPlan = 'free' | 'starter' | 'pro'
const DEV_CYCLE: DevPlan[] = ['free', 'starter', 'pro']

// Columnas que entran según el ancho (auto-fill), nunca un número fijo: con grid-cols-6
// cada columna medía ~45 px en el panel y los textos se partían o se encimaban.
const GRID_BY_DENSITY = {
  compact: 'grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-3',
  comfortable: 'grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2.5 md:grid-cols-[repeat(auto-fill,minmax(152px,1fr))] md:gap-4',
} as const
const MAX_ADVERTISERS_COMPACT = 3

export function ProductAdsSection({ candidateId, embedded = false, density = 'comfortable' }: ProductAdsSectionProps) {
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

  const [sortBy, setSortBy] = useState<SortOption>('impressions')
  const [expanded, setExpanded] = useState(false)
  const { hoveredAd, hoverPos, handleHover, handleLeave, handlePanelEnter, handlePanelLeave } = useHoverPanel()

  const shell = cn('relative', !embedded && 'mt-6 rounded-xl border border-border bg-card p-6 shadow-card')
  const title = (
    <h3 className={cn('font-semibold text-foreground', embedded ? 'text-sm' : 'font-display text-lg')}>Anuncios</h3>
  )

  if (isLoading) {
    return (
      <section id="ads" aria-label="Anuncios" className={shell}>
        {title}
        <AdsSkeleton />
      </section>
    )
  }

  const rawAds = isError || !data
    ? (process.env.NODE_ENV === 'development' ? mockAds : [])
    : data.ads

  // status real de ads v2 (2026-09-15) — antes esta sección filtraba solo-activos y ocultaba
  // el resto por completo. Ahora se muestran todos (activos primero), cada uno con su status
  // real en vez de ocultarse. Incidente FIX-073, wiki scout-ads-status-real-propuesta.
  const allAds = rawAds.filter(a => !isTestAd(a))
  if (allAds.length === 0) {
    // Si la API falló no afirmamos nada; si respondió vacío, "sin anuncios" también es un dato
    if (isError) return null
    return (
      <section id="ads" aria-label="Anuncios" className={shell}>
        <div className="flex items-baseline gap-2">
          {title}
          <span className="text-xs text-muted-foreground">0 activos</span>
        </div>
        <p className="mt-3 rounded-lg border border-dashed border-border px-4 py-4 text-center text-xs text-subtle-foreground">
          No detectamos anuncios de este producto en la biblioteca de Meta.
        </p>
      </section>
    )
  }
  const activeAds = allAds.filter(a => a.status === 'active')
  const endedCount = allAds.length - activeAds.length

  const lastUpdated = data?.lastUpdated ? formatRelative(data.lastUpdated) : ''
  const uniqueAdvertisers = uniqueAdvertisersFromAds(allAds)
  const shownAdvertisers = density === 'compact' ? uniqueAdvertisers.slice(0, MAX_ADVERTISERS_COMPACT) : uniqueAdvertisers
  const hiddenAdvertisers = uniqueAdvertisers.length - shownAdvertisers.length

  const counts = [
    `${activeAds.length} activo${activeAds.length !== 1 ? 's' : ''}`,
    endedCount > 0 ? `${endedCount} terminado${endedCount !== 1 ? 's' : ''}` : null,
    !embedded && uniqueAdvertisers.length > 0
      ? `${uniqueAdvertisers.length} anunciante${uniqueAdvertisers.length !== 1 ? 's' : ''}`
      : null,
  ].filter(Boolean).join(' · ')

  const sortFn = (a: Ad, b: Ad) => {
    if (sortBy === 'recent') return new Date(b.first_seen).getTime() - new Date(a.first_seen).getTime()
    if (sortBy === 'oldest') return b.days_running - a.days_running
    return 0 // 'impressions' — orden que ya viene del backend
  }
  // Activos primero siempre, inactivos después — dentro de cada grupo se respeta el sort elegido.
  const sorted = [...allAds].sort((a, b) => {
    const activeDiff = Number(a.status !== 'active') - Number(b.status !== 'active')
    return activeDiff !== 0 ? activeDiff : sortFn(a, b)
  })

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

  const INITIAL = 6
  const visible = expanded ? deduped : deduped.slice(0, INITIAL)
  const hiddenCount = deduped.length - INITIAL

  return (
    <section id="ads" aria-label="Anuncios" className={shell}>

      {/* Header: título + conteos · orden. Hace wrap en vez de aplastarse. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
          {title}
          <span className="text-xs text-muted-foreground tabular-nums">{counts}</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            aria-label="Ordenar anuncios"
            className="h-8 rounded-lg border border-input bg-card px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="impressions">Impresiones</option>
            <option value="recent">Más recientes</option>
            <option value="oldest">Más duraderos</option>
          </select>
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => setDevPlan(prev => {
                const idx = prev ? DEV_CYCLE.indexOf(prev) : -1
                return idx >= DEV_CYCLE.length - 1 ? null : DEV_CYCLE[idx + 1]
              })}
              className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              [dev] {devPlan ?? 'real'}
            </button>
          )}
        </div>
      </div>

      <div className={cn(!canViewAds && 'pointer-events-none select-none blur-sm')} aria-hidden={!canViewAds || undefined}>
        {/* Anunciantes (mismo gating que siempre: borrosos y sin link fuera de Pro) + actualizado */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {shownAdvertisers.map(name => (
            <AdvertiserBadge key={name} advertiserName={name} allowMetaLink={allowMetaLink} variant="neutral" />
          ))}
          {hiddenAdvertisers > 0 && (
            <span className="inline-flex h-7 items-center rounded-full border border-border bg-secondary px-2.5 text-xs font-medium text-muted-foreground">
              +{hiddenAdvertisers}
            </span>
          )}
          {lastUpdated && (
            <span className="ml-auto text-xs text-subtle-foreground">actualizado {lastUpdated}</span>
          )}
        </div>

        <div className={cn('mt-4 grid', GRID_BY_DENSITY[density])}>
          {visible.map(({ ad, count }, idx) => (
            <AdSlide
              key={ad.id}
              ad={ad}
              index={idx + 1}
              count={count}
              allowMetaLink={allowMetaLink}
              onHover={handleHover}
              onLeave={handleLeave}
            />
          ))}
        </div>

        {deduped.length > INITIAL && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-3 inline-flex h-8 items-center rounded-lg border border-input bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            {expanded ? 'Ver menos' : `Ver ${hiddenCount} anuncios más`}
          </button>
        )}
      </div>

      {!canViewAds && (
        <div className="absolute inset-x-0 bottom-0 top-12 flex flex-col items-center justify-center gap-3 rounded-b-xl bg-card/85 px-4 text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-subtle">
            <Lock className="h-4 w-4 text-primary-text" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Anuncios bloqueados en la prueba gratis</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Mira qué está pautando esta tienda y en qué productos. Se ven desde el plan Básico.
            </p>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href="/pricing">Ver planes</Link>
          </Button>
        </div>
      )}

      {hoveredAd && (
        <FloatingVideoPanel
          ad={hoveredAd} top={hoverPos.top} left={hoverPos.left}
          onMouseEnter={handlePanelEnter} onMouseLeave={handlePanelLeave}
        />
      )}
    </section>
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
      {/* Sin miniatura queda el fondo neutro: nada de fotos de stock al azar */}
      {ad.thumbnail_url && (
        <img
          src={ad.thumbnail_url}
          alt=""
          className={cn('h-full w-full object-cover', !isPro && 'scale-110 blur-sm')}
        />
      )}
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

export function AdvertiserBadge({
  advertiserName,
  allowMetaLink,
  variant = 'facebook',
}: {
  advertiserName: string
  allowMetaLink: boolean
  /** 'facebook' (default): azul de FB, el de las tablas. 'neutral': chip de Radar para la sección de anuncios. */
  variant?: 'facebook' | 'neutral'
}) {
  const href = allowMetaLink
    ? `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&search_type=keyword_unordered&q=${encodeURIComponent(advertiserName)}`
    : '#'

  // Mismo gating en las dos variantes: sin allowMetaLink, nombre borroso y sin link.
  if (variant === 'neutral') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={allowMetaLink ? undefined : 'Disponible en Pro — ver centro de anuncios del anunciante'}
        aria-label={allowMetaLink ? `Ver anuncios de ${advertiserName} en Meta` : 'Anunciante disponible en Pro'}
        onClick={e => {
          e.stopPropagation()
          if (!allowMetaLink) e.preventDefault()
        }}
        className={cn(
          'inline-flex h-7 min-w-0 max-w-[180px] shrink-0 items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 text-xs font-medium text-foreground transition-colors',
          allowMetaLink ? 'hover:border-border-hover hover:bg-accent' : 'cursor-default',
        )}
      >
        <svg className="h-3 w-3 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        <span className={cn('truncate', !allowMetaLink && 'pointer-events-none select-none blur-[3px]')}>
          {advertiserName}
        </span>
        {!allowMetaLink && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />}
      </a>
    )
  }

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

// Fecha local y null-safe (ver lib/format-date.ts): "25 ago", "—" si falta
const formatDate = (isoDate: string | null | undefined) => formatShortDate(isoDate)

// ─── StoreVideosGrid ──────────────────────────────────────────────────────────
// One card per candidate that has active ads. Click → Meta (pro/agency/admin).
// Starter sees thumbnails but click is blocked. Product image is a decorative
// overlay in the bottom-left corner.

interface StoreVideoCardProps {
  ad: Ad
  productImage?: string | null
  label?: string
  count: number
  allowMetaLink: boolean
  canViewAds: boolean
  onHover: (ad: Ad, rect: DOMRect) => void
  onLeave: () => void
}

function StoreVideoCard({ ad, productImage, label, count, allowMetaLink, canViewAds, onHover, onLeave }: StoreVideoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const hasVideo = !!ad.video_url_r2

  function handleClick() {
    if (allowMetaLink) window.open(ad.ad_snapshot_url, '_blank', 'noopener,noreferrer')
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
          onHover(ad, cardRef.current.getBoundingClientRect())
      }}
      onMouseLeave={onLeave}
      className={cn(
        'relative shrink-0 w-[100px] h-[178px] rounded-xl overflow-hidden bg-secondary group',
        allowMetaLink ? 'cursor-pointer' : 'cursor-default',
      )}
    >
      {/* Video thumbnail */}
      {ad.thumbnail_url && (
        <img
          src={ad.thumbnail_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

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

      {/* Top row: ×N count (left) + days running (right) */}
      <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
        {count > 1 ? (
          <div className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white">
            ×{count}
          </div>
        ) : <div />}
        {ad.days_running > 0 && (
          <div className="rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {ad.days_running}d
          </div>
        )}
      </div>

      {/* Bottom row: product image (left) + label (right) */}
      <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-1">
        {productImage ? (
          <div className="h-8 w-8 shrink-0 rounded-md overflow-hidden border border-white/30 bg-black/40 shadow-md">
            <img src={productImage} alt="" className="h-full w-full object-cover" />
          </div>
        ) : <div />}
        {label && (
          <div className="rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-sm max-w-[56px] truncate">
            {label}
          </div>
        )}
      </div>
    </div>
  )
}

interface StoreVideosForCandidateProps {
  candidate: TrackerCandidate
  onAds: (candidateId: string, ads: Ad[], candidate: TrackerCandidate) => void
}

function StoreVideosForCandidate({ candidate, onAds }: StoreVideosForCandidateProps) {
  const { data } = useGetProductAdsQuery(candidate.candidateId)

  useEffect(() => {
    if (!data?.ads) return
    const activeAds = data.ads.filter((a: Ad) => a.status === 'active' && !isTestAd(a))
    if (activeAds.length > 0) onAds(candidate.candidateId, activeAds, candidate)
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export function StoreVideosGrid({ candidates }: { candidates: TrackerCandidate[] }) {
  const { allowMetaLink, canViewAds } = usePlanTier()
  const { hoveredAd, hoverPos, handleHover, handleLeave, handlePanelEnter, handlePanelLeave } = useHoverPanel()
  const [candidateAds, setCandidateAds] = useState<Map<string, { ads: Ad[]; candidate: TrackerCandidate }>>(new Map())

  const handleCandidateAds = useCallback((candidateId: string, ads: Ad[], candidate: TrackerCandidate) => {
    setCandidateAds(prev => {
      const next = new Map(prev)
      next.set(candidateId, { ads, candidate })
      return next
    })
  }, [])

  const dedupedAndSorted = useMemo(() => {
    const creativeMap = new Map<string, { ad: Ad; candidate: TrackerCandidate; count: number }>()
    for (const { ads, candidate } of candidateAds.values()) {
      for (const ad of ads) {
        const key = (ad.thumbnail_url ?? ad.video_url_r2 ?? ad.ad_snapshot_url ?? '').split('?')[0]
        const existing = creativeMap.get(key)
        if (existing) {
          existing.count++
        } else {
          creativeMap.set(key, { ad, candidate, count: 1 })
        }
      }
    }
    return [...creativeMap.values()].sort((a, b) => b.count - a.count)
  }, [candidateAds])

  if (candidates.length === 0) return null

  const hasAnyAd = dedupedAndSorted.length > 0

  return (
    <div className={cn('space-y-3', !hasAnyAd && 'hidden')}>
      {/* Invisible fetchers — one per candidate, renders null */}
      {candidates.map(c => (
        <StoreVideosForCandidate key={c.candidateId} candidate={c} onAds={handleCandidateAds} />
      ))}

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
        {dedupedAndSorted.map(({ ad, candidate, count }) => (
          <StoreVideoCard
            key={ad.ad_snapshot_url}
            ad={ad}
            productImage={candidate.productImage}
            label={candidate.performanceLabel}
            count={count}
            allowMetaLink={allowMetaLink}
            canViewAds={canViewAds}
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
