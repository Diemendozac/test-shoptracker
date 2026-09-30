'use client'

import Link from 'next/link'
import { MoreVertical, Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { computeSignal } from '@/lib/signal'
import { useGetStoreAdsCountQuery } from '@/app/(dashboard)/services/dashboardApi'
import { Button } from '@/components/ui/button'
import { SignalBadge } from '@/components/tracker/signal-badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { StoreResponse } from '@/app/(dashboard)/stores/types'
import type { TrackerCandidate } from '@/app/(dashboard)/types'
import type { StoreHealthRow } from '@/lib/today'

// Tarjeta de una tienda en Competidores (CHANGE-137, Fase 3a). Reemplaza la fila con estrellas
// de "Calidad", un número compuesto que no se explicaba. Ahora habla en hechos que se pueden
// comprobar: estado, productos nuevos, su mejor producto ahora y sus anuncios activos.

const TONE: Record<StoreHealthRow['tone'], string> = {
  ok: 'border-success-border bg-success-subtle text-success-foreground',
  warn: 'border-warning-border bg-warning-subtle text-warning-foreground',
  bad: 'border-danger-border bg-danger-subtle text-danger-foreground',
  none: 'border-border bg-secondary text-muted-foreground',
}

const COUNTRY: Record<string, string> = { CO: 'Colombia', MX: 'México', CL: 'Chile', PE: 'Perú', EC: 'Ecuador', AR: 'Argentina', US: 'Estados Unidos', ES: 'España' }

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
  const country = store.country ? COUNTRY[store.country] ?? store.country : null

  return (
    <article className={cn('grid content-start gap-3 rounded-xl border border-border bg-card p-4 shadow-card', quiet && 'opacity-90')}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Link href={`/stores/${store.storeId}`} className="block truncate text-sm font-semibold text-foreground hover:text-primary-text hover:underline">
            {store.storeName}
          </Link>
          <p className="truncate text-xs text-subtle-foreground">
            {[country, store.currency, store.pagoAnticipado ? 'Pago anticipado' : store.pagoAnticipado === false ? 'Contraentrega' : null].filter(Boolean).join(' · ') || store.baseUrl.replace(/^https?:\/\//, '')}
          </p>
        </div>
        <span className={cn('whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold', TONE[row.tone])}>{row.label}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="-mr-2 -mt-1 h-8 w-8" aria-label={`Opciones de ${store.storeName}`}>
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
        <div>
          <p className="font-display text-2xl font-semibold tabular-nums text-foreground">{row.newThisWeek}</p>
          <p className="text-xs text-subtle-foreground">{row.newThisWeek === 1 ? 'producto nuevo' : 'productos nuevos'} en 7 días</p>
        </div>
        <div className="flex items-end gap-1" aria-label={`Productos nuevos por semana: ${weeks.join(', ')}`} role="img">
          {weeks.map((n, i) => (
            <span key={i} className={cn('w-4 rounded-sm', i === 3 ? 'bg-primary' : 'bg-primary-subtle')} style={{ height: `${6 + (n / maxWeek) * 26}px` }} />
          ))}
        </div>
      </div>

      {best && bestSignal ? (
        <Link href={`/tracker/${best.candidateId}?storeId=${best.storeId}`}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-secondary/40">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-subtle-foreground">Su mejor producto ahora</p>
            <p className="truncate text-sm font-medium text-foreground">{best.productTitle}</p>
          </div>
          <SignalBadge signal={bestSignal} />
        </Link>
      ) : (
        <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-subtle-foreground">
          Todavía no hay productos en seguimiento de esta tienda.
        </p>
      )}

      <p className="text-xs text-muted-foreground tabular-nums">
        {adsCount == null ? ' ' : adsCount.totalActiveAds === 1 ? '1 anuncio activo' : `${adsCount.totalActiveAds} anuncios activos`}
        {quiet && <span className="text-danger-foreground"> · está quieta: considera liberar este cupo</span>}
      </p>
    </article>
  )
}
