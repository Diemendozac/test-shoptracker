'use client'

import { useId, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useGetProductAdsQuery } from '@/app/(dashboard)/services/dashboardApi'
import type { Ad } from '@/app/(dashboard)/types'
import { proxiedImage } from '@/components/ads-library/library-ad-card'

// Historias del Radar (CHANGE-142), solo en el celular. La foto de cada producto con videos de
// anuncios lleva un anillo como el de Instagram, partido en un segmento por video. Lo visto se
// pone gris; un video nuevo vuelve a tener color. Tocar la foto abre product-stories.tsx.
//
// Lo visto vive en este navegador (localStorage), no en el servidor: no se sincroniza entre el
// teléfono y el computador.

// ─── Videos de un producto, en el orden de las historias ─────────────────────

/** Solo los anuncios con video. Activos primero; dentro de cada grupo, los que llevan más días al aire. */
export function storyVideos(ads: Ad[] | undefined): Ad[] {
  return (ads ?? [])
    .filter((a) => !!a.video_url_r2)
    .sort((a, b) =>
      Number(a.status !== 'active') - Number(b.status !== 'active') ||
      (b.days_running ?? 0) - (a.days_running ?? 0))
}

/** Dónde arranca un producto: en el primer video sin ver, o en el primero si ya se vio todo. */
export function firstUnseen(videos: Ad[], seen: string[] | undefined): number {
  if (!seen?.length) return 0
  const i = videos.findIndex((v) => !seen.includes(v.id))
  return i === -1 ? 0 : i
}

// ─── Lo visto (localStorage) ─────────────────────────────────────────────────

type SeenMap = Record<string, string[]>
const KEY = 'dropspy:historias-vistas'
const MAX_PRODUCTS = 400
const MAX_PER_PRODUCT = 60
const EMPTY: SeenMap = {}
let cache: SeenMap | null = null
const listeners = new Set<() => void>()

function readSeen(): SeenMap {
  if (cache) return cache
  try { cache = JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {} } catch { cache = {} }
  return cache as SeenMap
}

export function markStorySeen(candidateId: string, adId: string) {
  const current = readSeen()
  if (current[candidateId]?.includes(adId)) return
  // El producto recién visto pasa al final; si hay demasiados, se olvidan los más viejos
  const next: SeenMap = { ...current }
  delete next[candidateId]
  next[candidateId] = [...(current[candidateId] ?? []), adId].slice(-MAX_PER_PRODUCT)
  const keys = Object.keys(next)
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX_PRODUCTS))) delete next[k]
  cache = next
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* sin almacenamiento: queda en memoria */ }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function useSeenStories(): SeenMap {
  return useSyncExternalStore(subscribe, readSeen, () => EMPTY)
}

// ─── Anillo ──────────────────────────────────────────────────────────────────

const STROKE = 3
const GAP = 2.5
/** Con más videos, los segmentos ya no se distinguen: se dibuja el anillo entero. */
const MAX_SEGMENTS = 12

function arc(c: number, r: number, from: number, to: number): string {
  const rad = (d: number) => (d * Math.PI) / 180
  const x0 = c + r * Math.cos(rad(from)), y0 = c + r * Math.sin(rad(from))
  const x1 = c + r * Math.cos(rad(to)), y1 = c + r * Math.sin(rad(to))
  return `M ${x0} ${y0} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1} ${y1}`
}

function StoryRing({ size, seen }: { size: number; seen: boolean[] }) {
  const gradId = useId()
  const c = size / 2
  const r = size / 2 - STROKE / 2
  const n = seen.length
  const segmented = n > 1 && n <= MAX_SEGMENTS
  const gapDeg = n <= 3 ? 10 : n <= 6 ? 7 : 5
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="pointer-events-none absolute inset-0" aria-hidden>
      {/* El degradado de la marca (--grad-brand: violeta, azul, cian, 135°): la misma idea que el
          anillo de Instagram, tres colores vivos que dicen "hay algo nuevo", pero con colores de Dropspy */}
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2={size} y2={size} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C5CFF" />
          <stop offset="50%" stopColor="#4F7BFF" />
          <stop offset="100%" stopColor="#22C3E6" />
        </linearGradient>
      </defs>
      {segmented ? (
        seen.map((isSeen, i) => {
          const from = -90 + (i * 360) / n + gapDeg / 2
          return (
            <path key={i} d={arc(c, r, from, from + 360 / n - gapDeg)} fill="none" strokeWidth={STROKE} strokeLinecap="round"
              stroke={isSeen ? undefined : `url(#${gradId})`} className={cn(isSeen && 'stroke-border-hover')} />
          )
        })
      ) : (
        <circle cx={c} cy={c} r={r} fill="none" strokeWidth={STROKE}
          stroke={seen.every(Boolean) ? undefined : `url(#${gradId})`} className={cn(seen.every(Boolean) && 'stroke-border-hover')} />
      )}
    </svg>
  )
}

// ─── Foto del producto con su anillo ─────────────────────────────────────────

/**
 * Foto redonda del producto en la tarjeta del Radar (celular). Con videos, lleva el anillo y es un
 * botón que abre las historias; sin videos, es solo la foto. `badge` va encima (la bandera del país).
 */
export function StoryAvatar({ candidateId, title, image, size, onOpen, badge }: {
  candidateId: string
  title: string
  image: string | null
  size: number
  onOpen: (candidateId: string) => void
  badge?: ReactNode
}) {
  const { data } = useGetProductAdsQuery(candidateId)
  const videos = useMemo(() => storyVideos(data?.ads), [data])
  const seenIds = useSeenStories()[candidateId]
  const src = proxiedImage(image)
  const photoSize = size - 2 * (STROKE + GAP)

  const photo = (
    <span className="absolute flex items-center justify-center overflow-hidden rounded-full bg-secondary text-xl font-bold text-muted-foreground"
      style={{ width: photoSize, height: photoSize, top: STROKE + GAP, left: STROKE + GAP }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
      ) : title.charAt(0)}
    </span>
  )

  if (videos.length === 0) {
    return <span className="relative block shrink-0 self-start" style={{ width: size, height: size }}>{photo}{badge}</span>
  }

  const unseen = videos.filter((v) => !seenIds?.includes(v.id)).length
  return (
    <button type="button" onClick={() => onOpen(candidateId)}
      aria-label={`Ver ${videos.length === 1 ? 'el video' : `los ${videos.length} videos`} de anuncios de ${title}${unseen > 0 && unseen < videos.length ? ` (${unseen} sin ver)` : ''}`}
      className="relative block shrink-0 self-start rounded-full outline-offset-2 active:scale-95 transition-transform" style={{ width: size, height: size }}>
      <StoryRing size={size} seen={videos.map((v) => !!seenIds?.includes(v.id))} />
      {photo}
      {badge}
    </button>
  )
}
