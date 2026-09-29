'use client'

// Tarjeta de la Biblioteca de anuncios. Es distinta de AdSlide (detalle y pool) a propósito:
// acá se navegan miles de anuncios de productos distintos, así que la tarjeta dice de qué
// producto es cada uno, muestra el copy cuando existe y usa 4:5 para que la primera fila
// entre entera en pantalla. Ver docs/redesign/biblioteca-anuncios/02-propuesta.md (1.2).

import { useState } from 'react'
import { ExternalLink, Lock, Package, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import { describeAdStatus } from '@/lib/ad-status'
import type { AdLibraryItem } from '@/app/(dashboard)/types'

/** Nombre a mostrar del anunciante: el de Meta, o el dominio del link, o un genérico. */
export function advertiserLabel(ad: Pick<AdLibraryItem, 'advertiser_name' | 'product_url'>): string {
  if (ad.advertiser_name?.trim()) return ad.advertiser_name.trim()
  if (ad.product_url) return ad.product_url.replace(/^https?:\/\//, '').split('/')[0] || 'Anunciante'
  return 'Anunciante'
}

/** El link viene del scraper y termina en un href: solo se acepta http(s) de facebook.com. */
export function safeMetaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    return (u.protocol === 'https:' || u.protocol === 'http:') && /(^|\.)facebook\.com$/.test(u.hostname) ? u.href : null
  } catch {
    return null
  }
}

export function proxiedImage(src: string | null | undefined): string | null {
  return src ? `/api/image-proxy?url=${encodeURIComponent(src)}` : null
}

/** Chip de días corriendo. `days_running` puede venir null aunque el tipo diga number. */
export function DaysChip({ ad, className }: { ad: Pick<AdLibraryItem, 'days_running' | 'status'>; className?: string }) {
  const days = typeof ad.days_running === 'number' ? ad.days_running : null
  if (days == null) return null
  return (
    <span
      className={cn(
        'rounded-full px-2 text-xs font-semibold leading-5 tabular-nums',
        days >= 30 ? 'bg-success-foreground text-white' : 'bg-sidebar/80 text-sidebar-foreground',
        className,
      )}
      title={ad.status === 'active' ? `Lleva ${days} días corriendo` : `Corrió al menos ${days} días`}
    >
      {days} d
    </span>
  )
}

/** Línea de estado: "● Activo desde 15 ene" · "● Activo visto hace 9 d" · "○ No visto desde el 27 sept" */
export function AdStatusLine({ ad, className }: { ad: AdLibraryItem; className?: string }) {
  const st = describeAdStatus(ad)
  return (
    <p className={cn('flex flex-wrap items-center gap-x-1.5 text-xs text-subtle-foreground', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 font-semibold',
          st.tone === 'ok' ? 'text-success-foreground' : 'text-warning-foreground',
        )}
        title={st.tone === 'warn' ? st.hint : undefined}
      >
        <span
          className={cn(
            'size-2 shrink-0 rounded-full',
            st.tone === 'ok' ? 'bg-success' : 'border-[1.5px] border-warning',
          )}
          aria-hidden
        />
        {st.label}
      </span>
      {st.detail && (
        <span className={cn(st.detailWarn && 'text-warning-foreground')} title={st.detailWarn ? st.hint : undefined}>
          {st.detail}
        </span>
      )}
    </p>
  )
}

export function LibraryAdCard({
  ad,
  allowMetaLink,
  canHoverPlay,
  onOpen,
}: {
  ad: AdLibraryItem
  allowMetaLink: boolean
  /** Escritorio con mouse y sin "reducir movimiento": el video corre sin sonido al pasar el mouse */
  canHoverPlay: boolean
  onOpen: (ad: AdLibraryItem, opener: HTMLElement) => void
}) {
  const [previewing, setPreviewing] = useState(false)
  const label = advertiserLabel(ad)
  const productImg = proxiedImage(ad.productImage)
  const hasVideo = !!ad.video_url_r2
  const metaUrl = safeMetaUrl(ad.ad_snapshot_url)

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-[border-color,box-shadow] hover:border-border-hover hover:shadow-card-hover">
      <button
        type="button"
        onClick={e => onOpen(ad, e.currentTarget)}
        onMouseEnter={() => { if (canHoverPlay && hasVideo) setPreviewing(true) }}
        onMouseLeave={() => setPreviewing(false)}
        aria-label={`Ver el anuncio de ${label}`}
        className="group relative block aspect-[4/5] w-full overflow-hidden bg-secondary"
      >
        {ad.thumbnail_url ? (
          <img src={ad.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-subtle-foreground">
            <Video className="size-6" aria-hidden />
          </span>
        )}
        {previewing && ad.video_url_r2 && (
          <video
            src={ad.video_url_r2}
            poster={ad.thumbnail_url || undefined}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {hasVideo && !previewing && (
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <span className="flex size-11 items-center justify-center rounded-full bg-sidebar/80 transition-transform group-hover:scale-105">
              <svg className="size-4 translate-x-px text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        )}

        <DaysChip ad={ad} className="absolute right-2 top-2" />
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <AdStatusLine ad={ad} />

        <p className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold leading-[18px] text-foreground" title={label}>{label}</span>
          {ad.country && (
            <span className="shrink-0 rounded-md border border-border bg-secondary px-1.5 text-xs font-medium leading-4 text-muted-foreground">
              {ad.country}
            </span>
          )}
        </p>

        {ad.body_text && (
          <p className="line-clamp-3 whitespace-pre-line text-[13px] leading-[18px] text-muted-foreground">
            {ad.body_text}
          </p>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-1">
          {ad.productTitle && (
            // En L1 no es link: el ítem no trae storeId y el detalle lo necesita (L2).
            <div
              className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-background p-2"
              title={ad.productNiche ? `${ad.productTitle} · ${ad.productNiche}` : ad.productTitle}
            >
              {productImg ? (
                <img src={productImg} alt="" loading="lazy" className="size-9 shrink-0 rounded-md border border-border object-cover" />
              ) : (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-subtle-foreground">
                  <Package className="size-4" aria-hidden />
                </span>
              )}
              <span className="line-clamp-2 min-w-0 text-xs font-semibold leading-4 text-foreground">{ad.productTitle}</span>
            </div>
          )}

          {!metaUrl ? null : allowMetaLink ? (
            <a
              href={metaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1 text-xs font-medium text-primary-text hover:underline"
            >
              Ver en Meta
              <ExternalLink className="size-3" aria-hidden />
            </a>
          ) : (
            <span className="inline-flex w-fit items-center gap-1 text-xs text-subtle-foreground" title="Disponible en Pro">
              <Lock className="size-3" aria-hidden />
              Meta · Pro
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
