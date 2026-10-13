// Pantalla Hoy (CHANGE-136, Fase 2e): qué cambió en tus tiendas desde el registro anterior de
// cada producto. Lógica pura, sin React, para poder probarla sola.
//
// Un "registro" es un día en que el producto estuvo en el ranking de más vendidos (el historial
// de rank no guarda los días fuera del ranking). Por eso se dice "desde su registro anterior" y
// no "desde ayer".
//
// Eventos (un producto tiene a lo sumo uno, el más importante):
//   top10  pasó de fuera del top 10 a estar dentro.
//   up     subió 3 o más puestos.
//   new    lleva 1 día o menos en seguimiento (apareció en el último corte).
//   down   bajó 3 o más puestos.

import type { TrackerCandidate } from '@/app/(dashboard)/types'
import type { StoreResponse } from '@/app/(dashboard)/stores/types'

export type TodayEventKind = 'top10' | 'up' | 'new' | 'down'

export interface TodayEvent {
  kind: TodayEventKind
  candidate: TrackerCandidate
  /** Puestos ganados desde el registro anterior (positivo = subió). */
  change: number | null
  rank: number | null
}

export const MOVE_THRESHOLD = 3

const ORDER: Record<TodayEventKind, number> = { top10: 0, up: 1, new: 2, down: 3 }

export function todayEvents(candidates: TrackerCandidate[]): TodayEvent[] {
  const events: TodayEvent[] = []
  for (const c of candidates) {
    const ranks = (c.rankHistory ?? []).filter((r) => typeof r === 'number' && r > 0)
    const now = ranks.length > 0 ? ranks[ranks.length - 1] : (c.currentRank ?? null)
    const prev = ranks.length > 1 ? ranks[ranks.length - 2] : null
    const change = now != null && prev != null ? prev - now : null

    if (c.daysElapsed <= 1) {
      events.push({ kind: 'new', candidate: c, change: null, rank: now })
    } else if (now != null && prev != null && now <= 10 && prev > 10) {
      events.push({ kind: 'top10', candidate: c, change, rank: now })
    } else if (change != null && change >= MOVE_THRESHOLD) {
      events.push({ kind: 'up', candidate: c, change, rank: now })
    } else if (change != null && change <= -MOVE_THRESHOLD) {
      events.push({ kind: 'down', candidate: c, change, rank: now })
    }
  }
  return events.sort((a, b) => {
    if (a.kind !== b.kind) return ORDER[a.kind] - ORDER[b.kind]
    if (a.kind === 'up') return (b.change ?? 0) - (a.change ?? 0)
    if (a.kind === 'down') return (a.change ?? 0) - (b.change ?? 0)
    return (a.rank ?? Infinity) - (b.rank ?? Infinity)
  })
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

function joinEs(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? ''
  return `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}`
}

/** El titular del día. Si no pasó nada, lo dice sin rellenar. */
export function todayHeadline(events: TodayEvent[]): string {
  const top10 = events.filter((e) => e.kind === 'top10').length
  const up = events.filter((e) => e.kind === 'up').length + top10
  const fresh = events.filter((e) => e.kind === 'new').length
  const down = events.filter((e) => e.kind === 'down').length
  if (up + fresh + down === 0) return 'Sin cambios fuertes en tus tiendas desde el último corte.'

  const parts: string[] = []
  if (up > 0) {
    const intoTop10 = top10 > 0 ? ` (${top10 === up && up === 1 ? 'entró' : top10 === 1 ? '1 entró' : `${top10} entraron`} al top 10)` : ''
    parts.push(`${plural(up, 'producto subió', 'productos subieron')} ${MOVE_THRESHOLD} puestos o más${intoTop10}`)
  }
  if (fresh > 0) parts.push(plural(fresh, 'producto nuevo apareció', 'productos nuevos aparecieron'))
  if (down > 0) parts.push(plural(down, 'bajó fuerte', 'bajaron fuerte'))
  const text = joinEs(parts)
  return `En tus tiendas: ${text}.`
}

export type StoreHealthTone = 'ok' | 'warn' | 'bad' | 'none'

export interface StoreHealthRow {
  store: StoreResponse
  newThisWeek: number
  label: string
  tone: StoreHealthTone
}

const TIER: Record<string, { label: string; tone: StoreHealthTone }> = {
  ACTIVA: { label: 'Activa', tone: 'ok' },
  MODERADA: { label: 'Moderada', tone: 'warn' },
  INACTIVA: { label: 'Inactiva', tone: 'bad' },
  ZOMBIE: { label: 'Sin movimiento', tone: 'bad' },
}

/** Una fila por tienda activa: estado y productos nuevos en los últimos 7 días. Primero las quietas. */
export function storeHealth(stores: StoreResponse[], candidates: TrackerCandidate[]): StoreHealthRow[] {
  const fresh = new Map<string, number>()
  for (const c of candidates) {
    if (c.daysElapsed <= 7) fresh.set(c.storeId, (fresh.get(c.storeId) ?? 0) + 1)
  }
  const toneOrder: Record<StoreHealthTone, number> = { bad: 0, warn: 1, none: 2, ok: 3 }
  return stores
    .filter((s) => s.isActive)
    .map((s) => {
      const tier = s.inactivityTier ? TIER[s.inactivityTier] : undefined
      const newThisWeek = fresh.get(s.storeId) ?? 0
      // CHANGE-143: una tienda que lanzó productos en los últimos 7 días no está quieta, aunque el
      // backend diga INACTIVA o ZOMBIE. Su puntaje (StoreSyncService.updateInactivityScore) cuenta
      // los productos recién lanzados como "no suben", así que lanzar mucho la hace ver inactiva.
      // Sin esto, la app pedía soltar el cupo de las tiendas que más prueban. Propuesta para Diego
      // en docs/redesign/competidores/propuesta-backend.md.
      const contradicted = tier?.tone === 'bad' && newThisWeek > 0
      return {
        store: s,
        newThisWeek,
        label: contradicted ? 'Activa' : tier?.label ?? 'Sin datos',
        tone: contradicted ? 'ok' : tier?.tone ?? 'none',
      }
    })
    .sort((a, b) => toneOrder[a.tone] - toneOrder[b.tone] || b.newThisWeek - a.newThisWeek)
}
