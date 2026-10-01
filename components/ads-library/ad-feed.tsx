'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Lock, Pause, Play, Search, Volume2, VolumeX, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { describeAdStatus } from '@/lib/ad-status'
import { useMediaQuery } from '@/hooks/use-media-query'
import { advertiserLabel, proxiedImage } from '@/components/ads-library/library-ad-card'
import type { AdLibraryItem } from '@/app/(dashboard)/types'

// Feed de anuncios (CHANGE-141): la segunda vista de Anuncios en el celular. Un video por
// pantalla y se desliza hacia arriba para pasar al siguiente, como en TikTok o Reels, que es donde
// vive este usuario. Usa los mismos filtros y páginas que la cuadrícula.
//
// Datos y batería: solo se reproduce el video visible. Los vecinos (±2) tienen el <video> montado
// para que el cambio sea inmediato; el resto muestra la miniatura. Arranca sin sonido (los
// navegadores no dejan reproducir con sonido sin un toque); "Activar sonido" vale para todo el feed.
// Con "reducir movimiento" no se reproduce solo.
//
// Lo que no muestra: la señal del producto y su ficha. Los anuncios de la biblioteca no traen la
// tienda ni el historial de rank (pendiente de backend). Por eso el botón es "Buscar en el Radar".

const COUNTRY: Record<string, string> = { CO: 'Colombia', MX: 'México', CL: 'Chile', PE: 'Perú', EC: 'Ecuador', AR: 'Argentina', US: 'Estados Unidos', ES: 'España' }

interface AdFeedProps {
  ads: AdLibraryItem[]
  open: boolean
  startIndex: number
  total: number
  allowMetaLink: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onNeedMore: () => void
  onClose: () => void
}

export function AdFeed({ ads, open, startIndex, total, allowMetaLink, hasNextPage, isFetchingNextPage, onNeedMore, onClose }: AdFeedProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [active, setActive] = useState(startIndex)
  const [muted, setMuted] = useState(true)
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  // Al abrir: ir al anuncio tocado, bloquear el scroll de la página y llevar el foco al cierre
  useLayoutEffect(() => {
    if (!open) return
    setActive(startIndex)
    const el = scrollerRef.current
    if (el) el.scrollTop = startIndex * el.clientHeight
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => { document.body.style.overflow = prevOverflow }
  }, [open, startIndex])

  // Qué video está en pantalla: el que muestra al menos el 60 %
  useEffect(() => {
    const el = scrollerRef.current
    if (!open || !el) return
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index))
      }
    }, { root: el, threshold: 0.6 })
    el.querySelectorAll('[data-index]').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [open, ads.length])

  // Pedir más anuncios cuando faltan 3 para el final de lo cargado
  useEffect(() => {
    if (open && hasNextPage && !isFetchingNextPage && active >= ads.length - 3) onNeedMore()
  }, [open, active, ads.length, hasNextPage, isFetchingNextPage, onNeedMore])

  const go = useCallback((delta: number) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ top: (active + delta) * el.clientHeight, behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [active, reduceMotion])

  // Teclado (útil en computador): Escape cierra, flechas pasan de video
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') { e.preventDefault(); go(1) }
      if (e.key === 'ArrowUp') { e.preventDefault(); go(-1) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, go])

  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" aria-label="Feed de anuncios" className="fixed inset-0 z-[70] bg-[#05060D] text-white">
      {/* Barra superior, encima de los videos */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-4 pb-6"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Cerrar el feed"
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
          <X className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold">Feed</span>
        <span className="min-w-10 text-right text-xs tabular-nums text-white/70">{Math.min(active + 1, ads.length)} / {total.toLocaleString('es-CO')}</span>
      </div>

      <div ref={scrollerRef} className="h-[100dvh] snap-y snap-mandatory overflow-y-scroll overscroll-contain [scrollbar-width:none]">
        {ads.map((ad, i) => (
          <FeedSlide
            key={ad.id}
            ad={ad}
            index={i}
            isActive={i === active}
            isNear={Math.abs(i - active) <= 2}
            preloadNext={i === active + 1}
            autoplay={!reduceMotion}
            muted={muted}
            onToggleMute={() => setMuted((m) => !m)}
            allowMetaLink={allowMetaLink}
          />
        ))}
        {isFetchingNextPage && (
          <div className="flex h-24 items-center justify-center text-sm text-white/60">Cargando más anuncios…</div>
        )}
        {!hasNextPage && ads.length > 0 && (
          <div className="flex h-[40dvh] snap-start flex-col items-center justify-center gap-2 px-6 text-center text-sm text-white/70">
            <p>Viste todos los anuncios con estos filtros.</p>
            <button type="button" onClick={onClose} className="rounded-full bg-white/10 px-4 py-2 font-medium text-white">Volver a la cuadrícula</button>
          </div>
        )}
      </div>
    </div>
  )
}

function FeedSlide({ ad, index, isActive, isNear, preloadNext, autoplay, muted, onToggleMute, allowMetaLink }: {
  ad: AdLibraryItem
  index: number
  isActive: boolean
  isNear: boolean
  preloadNext: boolean
  autoplay: boolean
  muted: boolean
  onToggleMute: () => void
  allowMetaLink: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [paused, setPaused] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const status = describeAdStatus(ad)
  const days = typeof ad.days_running === 'number' ? ad.days_running : null
  const label = advertiserLabel(ad)
  const country = ad.country ? COUNTRY[ad.country] ?? ad.country : null
  const metaUrl = allowMetaLink && ad.ad_snapshot_url ? ad.ad_snapshot_url : null
  const productImg = proxiedImage(ad.productImage)

  // Solo el visible se reproduce; al salir de pantalla se pausa. El botón de play sigue los eventos
  // del video (onPlay/onPause) y no la promesa de play(): el navegador también pausa y reanuda solo
  // (por ejemplo, al irse a otra app y volver) y el botón tiene que mostrar lo que de verdad pasa.
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (isActive && autoplay) v.play().catch(() => {})
    else v.pause()
  }, [isActive, autoplay])

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted
  }, [muted])

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }

  return (
    <section data-index={index} aria-label={ad.productTitle} className="relative flex h-[100dvh] snap-start snap-always items-center justify-center overflow-hidden">
      {ad.video_url_r2 && isNear ? (
        <video
          ref={videoRef}
          src={ad.video_url_r2}
          poster={ad.thumbnail_url || undefined}
          muted={muted}
          loop
          playsInline
          preload={isActive ? 'auto' : preloadNext ? 'metadata' : 'none'}
          onClick={togglePlay}
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
          className="h-full w-full object-contain"
        />
      ) : ad.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ad.thumbnail_url} alt="" className="h-full w-full object-contain" />
      ) : (
        <div className="h-full w-full bg-white/5" />
      )}

      {ad.video_url_r2 && isActive && paused && (
        <button type="button" onClick={togglePlay} aria-label="Reproducir"
          className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
          <Play className="h-7 w-7 translate-x-0.5" />
        </button>
      )}

      {ad.video_url_r2 && isActive && (
        <div className="absolute right-3 flex flex-col gap-3" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 200px)' }}>
          <button type="button" onClick={onToggleMute} aria-label={muted ? 'Activar sonido' : 'Silenciar'}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          {!paused && (
            <button type="button" onClick={togglePlay} aria-label="Pausar"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
              <Pause className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {/* Información del anuncio, abajo, sobre un degradado para que se lea encima de cualquier video */}
      <div className="absolute inset-x-0 bottom-0 grid gap-2 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-4 pt-16 pr-16"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {days != null && days > 0 && (
            <span className={cn('rounded-full px-2 py-0.5 font-semibold', days >= 30 ? 'bg-[#0D2A28] text-[#5EE3AB]' : 'bg-white/15 text-white')}>
              {days} {days === 1 ? 'día' : 'días'} al aire
            </span>
          )}
          <span className={cn('rounded-full px-2 py-0.5 font-medium', status.tone === 'ok' ? 'bg-white/15 text-white' : 'bg-white/10 text-white/70')} title={status.hint}>
            {status.label}{status.detail ? ` · ${status.detail}` : ''}
          </span>
        </div>
        {/* Foto del producto (CHANGE-142), como el avatar en TikTok: se reconoce el producto antes de leer el nombre */}
        <div className="flex items-center gap-2.5">
          {productImg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={productImg} alt="" className="h-10 w-10 shrink-0 rounded-lg bg-white/10 object-cover ring-1 ring-white/25"
              onError={(e) => { e.currentTarget.style.display = 'none' }} />
          )}
          <p className="min-w-0 text-base font-semibold leading-snug">{ad.productTitle}</p>
        </div>
        <p className="text-xs text-white/70">
          {[ad.productNiche, country].filter(Boolean).join(' · ')}
          {(ad.productNiche || country) && ' · '}
          {allowMetaLink ? label : (
            <span className="inline-flex items-center gap-1">{label}<Lock className="h-3 w-3" aria-label="El nombre del anunciante es del plan Pro" /></span>
          )}
        </p>
        {ad.body_text && (
          <button type="button" onClick={() => setExpanded((x) => !x)}
            className={cn('text-left text-sm leading-snug text-white/85', !expanded && 'line-clamp-2')}>
            {ad.body_text}
          </button>
        )}
        <div className="mt-1 flex flex-wrap gap-2">
          <Link href={`/pool?q=${encodeURIComponent(ad.productTitle)}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-[#10132A]">
            <Search className="h-4 w-4" />Buscar en el Radar
          </Link>
          {metaUrl && (
            <a href={metaUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-sm font-medium text-white">
              Ver en Meta <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
