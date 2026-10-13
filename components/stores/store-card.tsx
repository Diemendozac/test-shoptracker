'use client'

import Link from 'next/link'
import { Megaphone, MoreVertical, Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { computeSignal } from '@/lib/signal'
import { useGetStoreAdsCountQuery } from '@/app/(dashboard)/services/dashboardApi'
import { Button } from '@/components/ui/button'
import { SignalBadge } from '@/components/tracker/signal-badge'
import { countryName } from '@/components/ads-library/library-toolbar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { StoreResponse } from '@/app/(dashboard)/stores/types'
import type { TrackerCandidate } from '@/app/(dashboard)/types'
import type { StoreHealthRow } from '@/lib/today'

// Tarjeta de una tienda en Competidores (CHANGE-137, Fase 3a). Reemplaza la fila con estrellas
// de "Calidad", un número compuesto que no se explicaba. Ahora habla en hechos que se pueden
// comprobar: estado, productos nuevos, su mejor producto ahora y sus anuncios activos.
//
// CHANGE-143: la tarjeta es una grilla de una sola columna `minmax(0,1fr)`. Con la columna
// implícita (`auto`), un título largo con `truncate` la ensanchaba hasta meterse en la vecina.
// Sin `opacity-90` en las quietas: dejaba ver a través lo que se salía de la tarjeta de al lado.

const TONE: Record<StoreHealthRow['tone'], string> = {
  ok: 'border-success-border bg-success-subtle text-success-foreground',
  warn: 'border-warning-border bg-warning-subtle text-warning-foreground',
  bad: 'border-danger-border bg-danger-subtle text-danger-foreground',
  none: 'border-border bg-secondary text-muted-foreground',
}

/** Productos nuevos por semana en las últimas 4 semanas, del más viejo al más nuevo. */
function launchesByWeek(candidates: TrackerCandidate[]): number[] {
  const weeks = [0, 0, 0, 0]
  for (const c of candidates) {
    const w = Math.floor(c.daysElapsed / 7)
    if (w >= 0 && w < 4) weeks[3 - w]++
  }
  return weeks
}

export function StoreCard({ row, candidates, isAdmin, isSyncing, isDeleting, onEdit, onDelete, onSync }: {
  row: StoreHealthRow
  candidates: TrackerCandidate[]
  isAdmin: boolean
  isSyncing: boolean
  isDeleting: boolean
  onEdit: () => void
  onDelete: () => void
  onSync: () => void
}) {
  const store: StoreResponse = row.store
  const { data: adsCount } = useGetStoreAdsCountQuery(store.storeId)
  const best = [...candidates].sort((a, b) => (b.performanceScore ?? 0) - (a.performanceScore ?? 0))[0]
  const bestSignal = best ? computeSignal({ daysElapsed: best.daysElapsed, rankHistory: best.rankHistory, performanceScore: best.performanceScore }) : null
  const weeks = launchesByWeek(candidates)
  const maxWeek = Math.max(1, ...weeks)
  const quiet = row.tone === 'bad'
  const country = store.country ? countryName(store.country) : null
  const ads = adsCount?.totalActiveAds

  return (
    <article className="grid grid-cols-[minmax(0,1fr)] content-start gap-4 rounded-xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover motion-reduce:transition-none">
      <div className="flex items-start gap-3">
        <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-subtle font-display text-sm font-semibold uppercase text-primary-text">
          {store.storeName.trim().charAt(0) || '·'}
        </span>
        <div className="min-w-0 flex-1">
          <Link href={`/stores/${store.storeId}`} className="block truncate text-sm font-semibold text-foreground hover:text-primary-text hover:underline">
            {store.storeName}
          </Link>
          <p className="truncate text-xs text-subtle-foreground">
            {[country, store.currency, store.pagoAnticipado ? 'Pago anticipado' : store.pagoAnticipado === false ? 'Contraentrega' : null].filter(Boolean).join(' · ') || store.baseUrl.replace(/^https?:\/\//, '')}
          </p>
        </div>
        {/* "Activa" es lo normal: el distintivo solo aparece cuando hay algo que mirar */}
        {row.tone !== 'ok' && (
          <span className={cn('whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold', TONE[row.tone])}>{row.label}</span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="-mr-2 -mt-1 h-8 w-8 shrink-0" aria-label={`Opciones de ${store.storeName}`}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="gap-2" onClick={onEdit}>
              <Pencil className="h-4 w-4" />Editar tienda
            </DropdownMenuItem>
            {/* Solo admin (decisión de Daniel, CHANGE-137): dispara un scraping por clic */}
            {isAdmin && (
              <DropdownMenuItem className="gap-2" onClick={onSync} disabled={!store.isActive || isSyncing}>
                <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />Sincronizar ahora
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={onDelete} disabled={isDeleting}>
              <Trash2 className="h-4 w-4" />{isDeleting ? 'Dejando de seguir…' : 'Dejar de seguir'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-3xl font-semibold leading-none tabular-nums text-foreground">{row.newThisWeek}</p>
          <p className="mt-1 text-xs text-subtle-foreground">{row.newThisWeek === 1 ? 'producto nuevo' : 'productos nuevos'} en 7 días</p>
        </div>
        <figure className="grid shrink-0 justify-items-end gap-1">
          <div className="flex h-8 items-end gap-1" role="img" aria-label={`Productos nuevos por semana, de hace 4 semanas a esta: ${weeks.join(', ')}`}>
            {/* Semanas previas en gris --input (3,5:1 sobre la tarjeta); primary-subtle daba 1,2:1 */}
            {weeks.map((n, i) => (
              <span key={i} className={cn('w-3.5 rounded-sm', i === 3 ? 'bg-primary' : 'bg-input')} style={{ height: `${4 + (n / maxWeek) * 28}px` }} />
            ))}
          </div>
          <figcaption className="text-[11px] text-subtle-foreground">últimas 4 semanas</figcaption>
        </figure>
      </div>

      {best && bestSignal ? (
        <Link href={`/tracker/${best.candidateId}?storeId=${best.storeId}`}
          className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-lg border border-border bg-secondary/40 py-2.5 pl-2.5 pr-3 transition-colors hover:border-border-hover hover:bg-secondary motion-reduce:transition-none">
          {best.productImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/image-proxy?url=${encodeURIComponent(best.productImage)}`} alt="" loading="lazy" className="h-11 w-11 rounded-md bg-secondary object-cover" />
          ) : (
            <span aria-hidden className="h-11 w-11 rounded-md bg-secondary" />
          )}
          <div className="min-w-0">
            {/* En el celular, si el distintivo no cabe, baja de línea: el rótulo no se parte */}
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <span className="whitespace-nowrap text-[11px] font-medium text-subtle-foreground">Su mejor producto ahora</span>
              <SignalBadge signal={bestSignal} />
            </div>
            <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-foreground [overflow-wrap:anywhere]">{best.productTitle}</p>
          </div>
        </Link>
      ) : (
        <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-subtle-foreground">
          Todavía no hay productos en seguimiento de esta tienda.
        </p>
      )}

      <div className="grid gap-1.5 border-t border-border pt-3 text-xs">
        <div className="flex min-h-4 items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 tabular-nums text-muted-foreground">
            {ads != null && (
              <>
                <Megaphone aria-hidden className="h-3.5 w-3.5" />
                {ads === 0 ? 'Sin anuncios activos' : ads === 1 ? '1 anuncio activo' : `${ads} anuncios activos`}
              </>
            )}
          </span>
          <Link href={`/stores/${store.storeId}`} aria-label={`Ver tienda ${store.storeName}`} className="whitespace-nowrap font-semibold text-primary-text hover:underline">
            Ver tienda →
          </Link>
        </div>
        {quiet && <p className="text-danger-foreground">Está quieta: considera liberar este cupo.</p>}
      </div>
    </article>
  )
}
