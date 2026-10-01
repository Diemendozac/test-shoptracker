'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { ExternalLink, Lock, Volume2, VolumeX, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { computeSignal } from '@/lib/signal'
import { describeAdStatus } from '@/lib/ad-status'
import { usePlanTier } from '@/lib/view-as'
import { useMediaQuery } from '@/hooks/use-media-query'
import type { RootState } from '@/store'
import { dashboardApi, useGetProductAdsQuery } from '@/app/(dashboard)/services/dashboardApi'
import type { Ad } from '@/app/(dashboard)/types'
import { SignalBadge } from '@/components/tracker/signal-badge'
import { proxiedImage } from '@/components/ads-library/library-ad-card'
import { firstUnseen, markStorySeen, storyVideos, useSeenStories } from '@/components/tracker/story-ring'
import type { RowProduct } from '@/components/tracker/product-row'

// Historias del Radar (CHANGE-142), solo en el celular. Cada producto con videos de anuncios es
// una historia; sus videos son los segmentos. Mismos gestos que Instagram:
//   toque a la derecha / izquierda   → video siguiente / anterior
//   mantener presionado              → pausa
//   deslizar a los lados             → producto siguiente / anterior, con el giro de cubo
//   deslizar hacia abajo             → cerrar
// Cada video se ve completo (decisión de Daniel: la oferta suele estar al final) y al terminar el
// último pasa solo al producto siguiente de la lista.
//
// Un solo <video> para toda la sesión, al que se le cambia el src: en el iPhone, el permiso para
// sonar se gana por elemento, así que al activar el sonido una vez sigue valiendo en los videos
// siguientes. Arranca sin sonido porque el navegador no deja reproducir con sonido sin un toque.

interface Entry { p: RowProduct; videos: Ad[] }

/** Un toque en curso: dónde empezó, si ya se decidió hacia dónde va y si es "mantener presionado". */
interface Gesture { x: number; y: number; t: number; mode: 'none' | 'h' | 'v' | 'ignore'; held: boolean; timer: number }

interface ProductStoriesProps {
  /** Los productos de la lista, en su orden. Se saltan los que no tienen videos. */
  products: RowProduct[]
  /** Producto con el que se abre; null = cerrado. */
  startId: string | null
  onClose: () => void
  onOpenProduct: (p: RowProduct) => void
}

const CUBE_MS = 340
const HOLD_MS = 200
const TAP_MAX_MS = 350

export function ProductStories({ products, startId, onClose, onOpenProduct }: ProductStoriesProps) {
  const open = startId != null
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const { allowMetaLink } = usePlanTier()
  const seenMap = useSeenStories()

  // Anuncios de cada producto: los que cada fila del Radar ya pidió (no hay pedidos nuevos)
  const adsById = useSelector((state: RootState) => {
    const out: Record<string, Ad[] | undefined> = {}
    for (const p of products) out[p.candidateId] = dashboardApi.endpoints.getProductAds.select(p.candidateId)(state).data?.ads
    return out
  }, shallowEqual)
  const entries = useMemo<Entry[]>(
    () => products.map((p) => ({ p, videos: storyVideos(adsById[p.candidateId]) })).filter((e) => e.videos.length > 0),
    [products, adsById],
  )

  const [currentId, setCurrentId] = useState<string | null>(null)
  const [videoIdx, setVideoIdx] = useState(0)
  const [held, setHeld] = useState(false)
  const [muted, setMuted] = useState(true)
  const [angle, setAngle] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [width, setWidth] = useState(390)

  const activeId = currentId ?? startId
  const pos = entries.findIndex((e) => e.p.candidateId === activeId)
  const current = pos >= 0 ? entries[pos] : null
  const prev = pos > 0 ? entries[pos - 1] : null
  const next = pos >= 0 && pos < entries.length - 1 ? entries[pos + 1] : null
  const vi = current ? Math.min(videoIdx, current.videos.length - 1) : 0
  const ad = current?.videos[vi] ?? null

  useGetProductAdsQuery(open && activeId ? activeId : skipToken)

  const stageRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const pending = useRef<{ id: string; landing: 'unseen' | 'last' } | null>(null)
  const gesture = useRef<Gesture | null>(null)

  // Al abrir: arrancar en el primer video sin ver, bloquear el scroll de la página, foco en cerrar
  useLayoutEffect(() => {
    if (!open || !startId) return
    const start = entries.find((e) => e.p.candidateId === startId)
    setCurrentId(startId)
    setVideoIdx(start ? firstUnseen(start.videos, seenMap[startId]) : 0)
    setAngle(0); setAnimating(false); setDragY(0); setHeld(false)
    if (stageRef.current) setWidth(stageRef.current.clientWidth)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => { document.body.style.overflow = prevOverflow; setCurrentId(null) }
    // Solo al abrir: entries y seenMap cambian mientras se ven las historias
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, startId])

  useEffect(() => {
    if (!open) return
    const onResize = () => { if (stageRef.current) setWidth(stageRef.current.clientWidth) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [open])

  // Si el producto deja de estar en la lista (cambió la página o los filtros), se cierra
  useEffect(() => {
    if (open && currentId && !current) onClose()
  }, [open, currentId, current, onClose])

  // Visto en cuanto aparece, como en Instagram
  useEffect(() => {
    if (open && current && ad) markStorySeen(current.p.candidateId, ad.id)
  }, [open, current, ad])

  // Reproducir solo cuando la historia está quieta y nadie la está tocando
  const playing = open && !!ad && !held && angle === 0 && !animating && dragY === 0
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (playing) {
      v.play().catch((e: unknown) => {
        // Con sonido el navegador puede negarse; se sigue sin sonido en vez de quedar quieto
        if ((e as Error)?.name === 'NotAllowedError' && !v.muted) {
          v.muted = true
          setMuted(true)
          v.play().catch(() => {})
        }
      })
    } else {
      v.pause()
    }
  }, [playing, ad?.id])

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted
  }, [muted])

  // La barra del video actual se llena con su avance. Se escribe directo en el estilo: con estado
  // de React, el visor entero se volvería a dibujar 60 veces por segundo.
  useEffect(() => {
    if (!open) return
    let raf = 0
    const tick = () => {
      const v = videoRef.current, f = fillRef.current
      if (v && f && v.duration > 0) f.style.transform = `scaleX(${Math.min(1, v.currentTime / v.duration)})`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [open, activeId, vi])

  function switchTo(id: string, landing: 'unseen' | 'last') {
    const e = entries.find((x) => x.p.candidateId === id)
    if (!e) return onClose()
    setCurrentId(id)
    setVideoIdx(landing === 'last' ? e.videos.length - 1 : firstUnseen(e.videos, seenMap[id]))
    setAngle(0)
    setAnimating(false)
  }

  function goProduct(dir: 1 | -1, landing: 'unseen' | 'last' = 'unseen') {
    const target = dir > 0 ? next : prev
    if (!target) {
      if (dir > 0) onClose()
      else { setAnimating(true); setAngle(0) }
      return
    }
    if (reduceMotion) return switchTo(target.p.candidateId, landing)
    pending.current = { id: target.p.candidateId, landing }
    setAnimating(true)
    setAngle(dir > 0 ? -90 : 90)
  }

  function onCubeTransitionEnd() {
    const p = pending.current
    pending.current = null
    if (p) switchTo(p.id, p.landing)
    else setAnimating(false)
  }

  // Si el navegador no avisa el fin de la animación (pestaña oculta, ángulo ya en destino), se completa igual
  useEffect(() => {
    if (!animating) return
    const t = window.setTimeout(onCubeTransitionEnd, CUBE_MS + 120)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animating, angle])

  function goVideo(delta: 1 | -1) {
    if (!current) return
    const ni = vi + delta
    if (ni < 0) {
      if (prev) goProduct(-1, 'last')
      else if (videoRef.current) videoRef.current.currentTime = 0
      return
    }
    if (ni >= current.videos.length) return goProduct(1)
    setVideoIdx(ni)
  }

  // Teclado: Escape cierra, flechas pasan de video
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goVideo(1)
      if (e.key === 'ArrowLeft') goVideo(-1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  // ── Gestos ──
  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (animating || !current) return
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* el toque ya terminó */ }
    const g: Gesture = { x: e.clientX, y: e.clientY, t: performance.now(), mode: 'none', held: false, timer: 0 }
    g.timer = window.setTimeout(() => { g.held = true; setHeld(true) }, HOLD_MS)
    gesture.current = g
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current
    if (!g) return
    const dx = e.clientX - g.x, dy = e.clientY - g.y
    if (g.mode === 'none' && Math.hypot(dx, dy) > 10) {
      window.clearTimeout(g.timer)
      if (g.held) { g.held = false; setHeld(false) }
      g.mode = Math.abs(dx) > Math.abs(dy) ? 'h' : dy > 0 ? 'v' : 'ignore'
    }
    if (g.mode === 'h') {
      let a = (dx / width) * 90
      // Sin producto de ese lado, el cubo apenas cede
      if (a < 0 && !next) a = Math.max(a * 0.25, -12)
      if (a > 0 && !prev) a = Math.min(a * 0.25, 12)
      setAngle(Math.max(-90, Math.min(90, a)))
    }
    if (g.mode === 'v') setDragY(Math.max(0, dy))
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current
    gesture.current = null
    if (!g) return
    window.clearTimeout(g.timer)
    const dx = e.clientX - g.x, dy = e.clientY - g.y
    const dt = Math.max(1, performance.now() - g.t)
    // La pausa se ve desde los 200 ms, pero un toque de hasta 350 ms todavía cuenta como toque
    if (g.held) {
      setHeld(false)
      if (dt >= TAP_MAX_MS) return
    }
    if (g.mode === 'h') {
      const fast = Math.abs(dx) / dt > 0.5 && Math.abs(dx) > 30
      if ((dx < -width * 0.25 || (fast && dx < 0)) && next) return goProduct(1)
      if ((dx > width * 0.25 || (fast && dx > 0)) && prev) return goProduct(-1)
      setAnimating(true)
      setAngle(0)
      return
    }
    if (g.mode === 'v') {
      if (dy > 120) onClose()
      else setDragY(0)
      return
    }
    if (g.mode === 'none' && dt < TAP_MAX_MS) {
      const rect = e.currentTarget.getBoundingClientRect()
      goVideo(e.clientX - rect.left < rect.width * 0.3 ? -1 : 1)
    }
  }

  function onPointerCancel() {
    const g = gesture.current
    gesture.current = null
    if (g) window.clearTimeout(g.timer)
    setHeld(false)
    setDragY(0)
    if (angle !== 0) { setAnimating(true); setAngle(0) }
  }

  if (!open) return null

  const half = width / 2
  const cubeStyle: CSSProperties = {
    transformStyle: 'preserve-3d',
    transform: `translateZ(${-half}px) rotateY(${angle}deg)`,
    transition: animating ? `transform ${CUBE_MS}ms cubic-bezier(.25,.8,.25,1)` : 'none',
  }
  const turning = angle !== 0 || animating
  const shade = Math.abs(angle) / 90

  return (
    <div role="dialog" aria-modal="true" aria-label="Historias de anuncios" className="fixed inset-0 z-[70] bg-black text-white"
      style={{ opacity: dragY ? Math.max(0.4, 1 - dragY / 600) : 1 }}>
      <div
        ref={stageRef}
        className="absolute inset-0 touch-none select-none overflow-hidden [-webkit-touch-callout:none]"
        style={{
          perspective: `${width * 2.2}px`,
          transform: dragY ? `translateY(${dragY}px) scale(${1 - dragY / 1600})` : undefined,
          transition: dragY ? 'none' : 'transform 200ms ease-out',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="relative h-full w-full" style={cubeStyle} onTransitionEnd={(e) => { if (e.target === e.currentTarget) onCubeTransitionEnd() }}>
          {/* Cara de frente: el producto actual, con el único <video> */}
          <div className="absolute inset-0 overflow-hidden bg-black [backface-visibility:hidden]" style={{ transform: `rotateY(0deg) translateZ(${half}px)` }}>
            <video
              ref={videoRef}
              src={ad?.video_url_r2 ?? undefined}
              poster={ad?.thumbnail_url || undefined}
              muted={muted}
              playsInline
              preload="auto"
              onEnded={() => goVideo(1)}
              className="absolute inset-0 h-full w-full object-contain"
            />
            {current && ad && (
              <div className={cn('transition-opacity duration-200', held && 'opacity-0')}>
                <StoryTop entry={current} active={vi} fillRef={fillRef} muted={muted}
                  onToggleMute={() => setMuted((m) => !m)} onClose={onClose} closeRef={closeRef} />
                <StoryBottom ad={ad} allowMetaLink={allowMetaLink} onOpenProduct={() => onOpenProduct(current.p)} />
              </div>
            )}
            {turning && <div className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: shade * 0.55 }} />}
          </div>

          {/* Caras de los lados: solo mientras gira el cubo, con la portada del producto vecino */}
          {turning && next && <SideFace entry={next} seen={seenMap[next.p.candidateId]} rotate={90} half={half} shade={1 - shade} />}
          {turning && prev && <SideFace entry={prev} seen={seenMap[prev.p.candidateId]} rotate={-90} half={half} shade={1 - shade} />}
        </div>
      </div>
    </div>
  )
}

// ─── Partes de una historia ───────────────────────────────────────────────────

function ProductAvatar({ p, size }: { p: RowProduct; size: number }) {
  const src = proxiedImage(p.productImage)
  return (
    <span className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15 text-sm font-bold ring-1 ring-white/30" style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
      ) : p.productTitle.charAt(0)}
    </span>
  )
}

function Bars({ count, active, fillRef }: { count: number; active: number; fillRef?: React.Ref<HTMLSpanElement> }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="h-[2.5px] flex-1 overflow-hidden rounded-full bg-white/35">
          <span
            key={i === active ? `a${active}` : i}
            ref={i === active ? fillRef : undefined}
            className="block h-full w-full origin-left rounded-full bg-white"
            style={{ transform: `scaleX(${i < active ? 1 : 0})` }}
          />
        </span>
      ))}
    </div>
  )
}

function StoryHeader({ p, children }: { p: RowProduct; children?: React.ReactNode }) {
  const signal = computeSignal({ daysElapsed: p.daysElapsed, rankHistory: p.rankHistory, performanceScore: p.performanceScore })
  return (
    <div className="mt-2.5 flex items-center gap-2.5">
      <ProductAvatar p={p} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight">{p.productTitle}</p>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-white/75">
          <SignalBadge signal={signal} className="[&>span]:px-1.5 [&>span]:py-0 [&>span]:text-[11px]" />
          <span className="truncate">{p.storeName}</span>
        </div>
      </div>
      {children}
    </div>
  )
}

function StoryTop({ entry, active, fillRef, muted, onToggleMute, onClose, closeRef }: {
  entry: Entry
  active: number
  fillRef: React.Ref<HTMLSpanElement>
  muted: boolean
  onToggleMute: () => void
  onClose: () => void
  closeRef: React.Ref<HTMLButtonElement>
}) {
  return (
    <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/65 via-black/25 to-transparent px-2.5 pb-10"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
      <Bars count={entry.videos.length} active={active} fillRef={fillRef} />
      <StoryHeader p={entry.p}>
        {/* Los botones no inician gestos del visor */}
        <div className="flex items-center" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
          <button type="button" onClick={onToggleMute} aria-label={muted ? 'Activar sonido' : 'Silenciar'}
            className="flex h-10 w-10 items-center justify-center rounded-full">
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Cerrar las historias"
            className="flex h-10 w-10 items-center justify-center rounded-full">
            <X className="h-6 w-6" />
          </button>
        </div>
      </StoryHeader>
    </div>
  )
}

function StoryBottom({ ad, allowMetaLink, onOpenProduct }: { ad: Ad; allowMetaLink: boolean; onOpenProduct: () => void }) {
  const status = describeAdStatus(ad)
  const days = typeof ad.days_running === 'number' ? ad.days_running : null
  const metaUrl = allowMetaLink && ad.ad_snapshot_url?.startsWith('https://') ? ad.ad_snapshot_url : null
  return (
    <div className="absolute inset-x-0 bottom-0 grid gap-2 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 pt-14"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)' }}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {days != null && days > 0 && (
          <span className={cn('rounded-full px-2 py-0.5 font-semibold', days >= 30 ? 'bg-[#0D2A28] text-[#5EE3AB]' : 'bg-white/15 text-white')}>
            {days} {days === 1 ? 'día' : 'días'} al aire
          </span>
        )}
        <span className={cn('rounded-full px-2 py-0.5 font-medium', status.tone === 'ok' ? 'bg-white/15 text-white' : 'bg-white/10 text-white/70')}>
          {status.label}{status.detail ? ` · ${status.detail}` : ''}
        </span>
        {/* El anunciante es de Pro (FIX-077/081): sin Pro no se muestra el nombre */}
        <span className="inline-flex items-center gap-1 text-white/75">
          {allowMetaLink && ad.advertiser_name?.trim() ? ad.advertiser_name.trim() : <>Anunciante<Lock className="h-3 w-3" aria-label="El nombre del anunciante es del plan Pro" /></>}
        </span>
      </div>
      {ad.body_text && <p className="line-clamp-2 text-sm leading-snug text-white/85">{ad.body_text}</p>}
      <div className="mt-1 flex flex-wrap gap-2" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
        <button type="button" onClick={onOpenProduct}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#10132A]">
          Ver producto
        </button>
        {metaUrl && (
          <a href={metaUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-sm font-medium text-white">
            Ver en Meta <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  )
}

/** Cara lateral del cubo: la portada del producto vecino, sin video, mientras se gira. */
function SideFace({ entry, seen, rotate, half, shade }: { entry: Entry; seen: string[] | undefined; rotate: number; half: number; shade: number }) {
  const start = firstUnseen(entry.videos, seen)
  const poster = entry.videos[start]?.thumbnail_url
  return (
    <div className="absolute inset-0 overflow-hidden bg-black [backface-visibility:hidden]" style={{ transform: `rotateY(${rotate}deg) translateZ(${half}px)` }}>
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" className="absolute inset-0 h-full w-full object-contain" />
      )}
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/65 to-transparent px-2.5 pb-10" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
        <Bars count={entry.videos.length} active={start} />
        <StoryHeader p={entry.p} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: shade * 0.55 }} />
    </div>
  )
}
