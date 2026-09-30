'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'
import type { Ad } from '@/components/tracker/product-ads'
import { useGetProductAdsQuery } from '@/app/(dashboard)/services/dashboardApi'
import { usePlanTier } from '@/lib/view-as'
import { FloatingVideoPanel, useHoverPanel, AdvertiserBadge, uniqueAdvertisersFromAds } from '@/components/tracker/product-ads'

// Miniaturas de anuncios de un producto. Estaban dentro de pool-winners.tsx; se movieron sin
// cambios de comportamiento para que las use también la fila compartida (product-row.tsx,
// CHANGE-134). AdsCount es nuevo: solo el número de anuncios activos, para las vistas angostas.

// ─── AdsCell ─────────────────────────────────────────────────────────────────

const PLACEHOLDER = 'https://picsum.photos/seed/placeholder/400/700'

function AdThumb({
  ad, canViewAds, allowMetaLink, onHover, onLeave,
}: {
  ad: Ad
  canViewAds: boolean
  allowMetaLink: boolean
  onHover: (ad: Ad, rect: DOMRect) => void
  onLeave: () => void
}) {
  const thumbRef = useRef<HTMLDivElement>(null)
  const hasVideo = !!ad.video_url_r2
  // status real de ads v2 (2026-09-15) — antes esta card ni se mostraba si el ad no era
  // 'active' (AdsCell filtraba antes de llegar acá). Ahora sí llega, así que se marca en vez
  // de ocultarse: grayscale + label. Ver wiki scout-ads-status-real-propuesta, incidente FIX-073.
  const isInactive = ad.status !== 'active'
  return (
    <div
      ref={thumbRef}
      className={cn(
        'relative h-[56px] w-[40px] shrink-0 overflow-hidden rounded-md bg-secondary',
        canViewAds ? 'cursor-pointer' : 'pointer-events-none blur-sm',
        isInactive && 'opacity-60 grayscale',
      )}
      onMouseEnter={() => {
        if (canViewAds && thumbRef.current)
          onHover(ad, thumbRef.current.getBoundingClientRect())
      }}
      onMouseLeave={onLeave}
      onClick={() => allowMetaLink && window.open(ad.ad_snapshot_url, '_blank', 'noopener,noreferrer')}
    >
      <img src={ad.thumbnail_url || PLACEHOLDER} alt="" className="h-full w-full object-cover" />
      {hasVideo && canViewAds && !isInactive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black/50">
            <svg className="h-2.5 w-2.5 translate-x-px text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
      {isInactive && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/75 py-[1px] text-center">
          <span className="text-[6px] font-bold uppercase tracking-wide text-white">Inactivo</span>
        </div>
      )}
    </div>
  )
}

export function AdsCell({ candidateId }: { candidateId: string }) {
  const { data } = useGetProductAdsQuery(candidateId)
  const { hoveredAd, hoverPos, handleHover, handleLeave, handlePanelEnter, handlePanelLeave } = useHoverPanel()
  const { allowMetaLink } = usePlanTier()
  // El pool global (Explorar testeos) siempre muestra los video ads sin blur,
  // incluida la prueba gratis — a diferencia de Mis testeos. Ver CHANGE-082.
  const canViewAds = true

  // status real de ads v2 (2026-09-15) — antes filtraba status==='active' acá, lo que sacaba
  // al candidato entero de esta card (y, peor, de la paginación de hasVideo en el backend —
  // ver ScoreSummaryRepository). Ahora se muestran todos los ads, activos primero, para que
  // los que siguen corriendo aparezcan antes que los que ya terminaron. Incidente: FIX-073.
  const allAds = data?.ads ?? []
  if (allAds.length === 0) return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 40, height: 56, borderRadius: 4,
          border: '1px dashed var(--color-border)',
          opacity: 0.4,
        }} />
      ))}
    </div>
  )

  const sorted = [...allAds].sort(
    (a, b) => Number(a.status !== 'active') - Number(b.status !== 'active'),
  )
  const previews          = sorted.slice(0, 3)
  const remaining         = sorted.length - 3
  const uniqueAdvertisers = uniqueAdvertisersFromAds(allAds)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        {previews.map(ad => (
          <AdThumb
            key={ad.id} ad={ad}
            canViewAds={canViewAds} allowMetaLink={allowMetaLink}
            onHover={handleHover} onLeave={handleLeave}
          />
        ))}
        {remaining > 0 && (
          <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
            +{remaining}
          </span>
        )}
      </div>
      {uniqueAdvertisers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {uniqueAdvertisers.map(name => (
            <AdvertiserBadge
              key={name}
              advertiserName={name}
              allowMetaLink={allowMetaLink}
            />
          ))}
        </div>
      )}
      {hoveredAd && canViewAds && (
        <FloatingVideoPanel
          ad={hoveredAd} top={hoverPos.top} left={hoverPos.left}
          onMouseEnter={handlePanelEnter} onMouseLeave={handlePanelLeave}
        />
      )}
    </div>
  )
}

/** Número de anuncios activos. Comparte la consulta con AdsCell (RTK Query no la repite). */
export function AdsCount({ candidateId, className }: { candidateId: string; className?: string }) {
  const { data } = useGetProductAdsQuery(candidateId)
  const active = (data?.ads ?? []).filter((a) => a.status === 'active').length
  if (!data) return null
  return (
    <span className={cn('text-xs text-subtle-foreground tabular-nums', className)}>
      {active === 0 ? 'Sin anuncios activos' : active === 1 ? '1 anuncio activo' : `${active} anuncios activos`}
    </span>
  )
}
