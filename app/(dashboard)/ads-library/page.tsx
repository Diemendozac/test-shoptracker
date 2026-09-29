'use client'

// Biblioteca de anuncios (2026-09-15, wiki scout-biblioteca-anuncios-propuesta) — pantalla
// nueva, separada de "Explorar testeos": lista anuncios en sí (no candidatos), sin depender de
// que el candidato siga en tracking activo. Depende de FIX-074 (status/days_running reales) —
// ver docs/FIXES.md en el backend para el detalle de esa parte.
//
// Rediseño L1 (2026-09-29, docs/redesign/biblioteca-anuncios/): arranca en Activos, cada
// tarjeta dice de qué producto es, el estado no afirma "Terminado" cuando solo sabemos que el
// anuncio no se vio, el video se abre en un modal y la paginación pasa a "Cargar más".

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import {
  useGetAdsLibraryPagesInfiniteQuery,
  useGetAdsLibraryQuery,
  useGetPoolCountriesQuery,
} from '@/app/(dashboard)/services/dashboardApi'
import { usePlanTier, useViewAs } from '@/lib/view-as'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LibraryAdCard } from '@/components/ads-library/library-ad-card'
import { AdVideoDialog } from '@/components/ads-library/ad-video-dialog'
import {
  DEFAULT_FILTERS,
  LibraryToolbar,
  RUNTIME_MIN_DAYS,
  type LibraryFilters,
} from '@/components/ads-library/library-toolbar'
import type { AdLibraryItem } from '@/app/(dashboard)/types'

const PAGE_SIZE = 24

// 2 columnas en pantallas chicas; desde md, tantas columnas de ≥196 px como entren.
const GRID = 'grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(196px,1fr))] md:gap-5'

const STATUS_WORD: Record<LibraryFilters['status'], string> = {
  active: 'activos',
  inactive: 'no vistos',
  all: '',
}

const fmt = (n: number) => n.toLocaleString('es-CO')

// Feedback de Daniel viendo datos reales (2026-09-15): al ordenar por days_running desc, una
// sola marca con varios anuncios de duración parecida terminaba ocupando varias columnas
// seguidas de la misma fila. Esto no reordena por relevancia — solo intercala por advertiser
// (round-robin, priorizando siempre el bucket con más anuncios restantes) para que la misma
// marca no quede pegada. Cuando una marca domina más de la mitad de la página, no es
// matemáticamente posible evitar toda repetición — se minimiza, no se garantiza al 100%.
// Con "Cargar más" se aplica por página: así cargar la siguiente no reordena lo que ya se ve.
function diversifyByAdvertiser(items: AdLibraryItem[]): AdLibraryItem[] {
  const buckets = new Map<string, AdLibraryItem[]>()
  for (const item of items) {
    const key = item.advertiser_name || item.candidateId
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(item)
  }
  const result: AdLibraryItem[] = []
  let lastKey: string | null = null
  while (result.length < items.length) {
    const candidates = [...buckets.entries()].filter(([, arr]) => arr.length > 0)
    if (candidates.length === 0) break
    candidates.sort((a, b) => b[1].length - a[1].length)
    const [key, arr] = candidates.find(([k]) => k !== lastKey) ?? candidates[0]
    result.push(arr.shift()!)
    lastKey = key
  }
  return result
}

function CardSkeletons({ count, animate }: { count: number; animate: boolean }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 overflow-hidden rounded-xl border border-border bg-card pb-3.5">
          <div className={cn('aspect-[4/5] w-full bg-secondary', animate && 'animate-pulse')} />
          <div className={cn('mx-3 h-2.5 rounded-full bg-secondary', animate && 'animate-pulse')} />
          <div className={cn('mx-3 h-2.5 rounded-full bg-secondary', animate && 'animate-pulse')} />
          <div className={cn('mx-3 h-2.5 w-1/2 rounded-full bg-secondary', animate && 'animate-pulse')} />
        </div>
      ))}
    </>
  )
}

// Bloqueo para quien no es Pro: dice qué trae la Biblioteca y lleva a planes. Detrás van
// tarjetas vacías, nunca anuncios reales difuminados (el blur se saca con el inspector).
function LockedLibrary({ total }: { total?: number }) {
  return (
    <div className="relative">
      <div className={cn(GRID, 'opacity-70')} aria-hidden>
        <CardSkeletons count={10} animate={false} />
      </div>
      <div className="absolute inset-x-0 top-12 flex justify-center px-4">
        <div className="flex max-w-md flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-card-hover">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary-subtle text-primary-text">
            <Lock className="size-5" aria-hidden />
          </span>
          <h2 className="font-display text-xl font-semibold leading-7 text-foreground">La Biblioteca de anuncios es del plan Pro</h2>
          <p className="text-sm text-muted-foreground">
            {total ? `${fmt(total)} anuncios` : 'Anuncios'} de Meta de productos que Dropspy siguió, con cuánto
            llevan corriendo y el producto que venden.
          </p>
          <Button asChild variant="brand">
            <Link href="/pricing">Ver planes</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AdsLibraryPage() {
  const { allowMetaLink, isPro: planIsPro } = usePlanTier()
  const { isAdmin } = useViewAs()
  // Video sin sonido al pasar el mouse: solo con mouse real y sin "reducir movimiento".
  const canHoverPlay = useMediaQuery('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')

  const [filters, setFilters] = useState<LibraryFilters>(DEFAULT_FILTERS)
  const [selected, setSelected] = useState<AdLibraryItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const openerRef = useRef<HTMLElement | null>(null)

  const queryArgs = useMemo(() => {
    const minDaysRunning = RUNTIME_MIN_DAYS[filters.runtime]
    return {
      size: PAGE_SIZE,
      ...(filters.status !== 'all' && { status: filters.status }),
      ...(minDaysRunning != null && { minDaysRunning }),
      ...(filters.niches.length > 0 && { niche: filters.niches }),
      ...(filters.country && { country: filters.country }),
    }
  }, [filters])

  const {
    data, isLoading, isError, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch,
  } = useGetAdsLibraryPagesInfiniteQuery(queryArgs)
  // Cifras del encabezado: no cambian con los filtros.
  const { data: allCount } = useGetAdsLibraryQuery({ size: 1 })
  const { data: activeCount } = useGetAdsLibraryQuery({ size: 1, status: 'active' })
  // Mismos códigos de país que el filtro del pool.
  const { data: countriesData } = useGetPoolCountriesQuery()

  // El backend decide (data.isPro). La barra "Vista" solo cuenta para el admin: así el admin
  // puede ver el bloqueo, y un usuario Pro no ve un bloqueo falso mientras carga /users/me.
  const isPro = data?.pages[0]?.isPro ?? allCount?.isPro
  const locked = isPro === false || (isAdmin && !planIsPro)

  const ads = useMemo(() => {
    const seen = new Set<string>()
    const out: AdLibraryItem[] = []
    for (const page of data?.pages ?? []) {
      for (const ad of diversifyByAdvertiser(page.ads ?? [])) {
        // Con paginación por offset y datos que cambian, una página nueva puede repetir un anuncio.
        if (seen.has(ad.id)) continue
        seen.add(ad.id)
        out.push(ad)
      }
    }
    return out
  }, [data])
  const total = data?.pages[data.pages.length - 1]?.total ?? 0
  const remaining = Math.max(0, total - ads.length)
  const isDefaultFilters = JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS)

  function updateFilters(next: Partial<LibraryFilters>) {
    setFilters(f => ({ ...f, ...next }))
  }

  function openAd(ad: AdLibraryItem, opener: HTMLElement) {
    openerRef.current = opener
    setSelected(ad)
    setDialogOpen(true)
  }

  return (
    <div className="p-7 max-md:p-4">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div className="min-w-0">
          <h1 className="font-display text-[26px] font-semibold leading-8 tracking-tight text-foreground">
            Biblioteca de anuncios
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Anuncios de Meta de los productos que Dropspy siguió. Los que llevan más tiempo corriendo suelen ser los que venden.
          </p>
        </div>
        {!!allCount?.total && (
          <dl className="flex gap-5">
            <div className="flex flex-col-reverse">
              <dt className="text-xs text-muted-foreground">anuncios</dt>
              <dd className="font-display text-xl font-semibold leading-6 tabular-nums text-foreground">{fmt(allCount.total)}</dd>
            </div>
            {activeCount && (
              <div className="flex flex-col-reverse">
                <dt className="text-xs text-muted-foreground">activos</dt>
                <dd className="font-display text-xl font-semibold leading-6 tabular-nums text-foreground">{fmt(activeCount.total ?? 0)}</dd>
              </div>
            )}
          </dl>
        )}
      </header>

      {locked ? (
        <LockedLibrary total={allCount?.total} />
      ) : (
        <>
          <LibraryToolbar
            filters={filters}
            onChange={updateFilters}
            onClear={() => setFilters(DEFAULT_FILTERS)}
            countries={countriesData?.countries ?? []}
          />

          <p className="mb-3 min-h-5 px-0.5 text-[13px] text-muted-foreground" aria-live="polite">
            {data && (
              <>
                <b className="font-semibold tabular-nums text-foreground">{fmt(total)}</b> anuncios
                {STATUS_WORD[filters.status] && ` ${STATUS_WORD[filters.status]}`}
                <span className="max-md:hidden"> · ordenados por tiempo corriendo</span>
              </>
            )}
          </p>

          {isLoading ? (
            <div className={GRID} aria-busy="true" aria-label="Cargando anuncios">
              <CardSkeletons count={12} animate />
            </div>
          ) : isError && !data ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
              No se pudo cargar la Biblioteca.{' '}
              <button type="button" onClick={() => refetch()} className="font-medium text-primary-text hover:underline">
                Reintentar
              </button>
            </div>
          ) : ads.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
              Ningún anuncio coincide con estos filtros.
              {!isDefaultFilters && (
                <>
                  {' '}
                  <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)} className="font-medium text-primary-text hover:underline">
                    Limpiar filtros
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <div
                className={cn(GRID, isFetching && !isFetchingNextPage && 'opacity-60 transition-opacity')}
                aria-busy={isFetching && !isFetchingNextPage}
              >
                {ads.map(ad => (
                  <LibraryAdCard
                    key={ad.id}
                    ad={ad}
                    allowMetaLink={allowMetaLink}
                    canHoverPlay={canHoverPlay}
                    onOpen={openAd}
                  />
                ))}
              </div>

              <div className="mt-7 flex flex-col items-center gap-2">
                {hasNextPage && (
                  <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                    {isFetchingNextPage
                      ? 'Cargando…'
                      : remaining > 0 && remaining < PAGE_SIZE ? `Cargar ${remaining} más` : `Cargar ${PAGE_SIZE} más`}
                  </Button>
                )}
                {isError && hasNextPage && !isFetchingNextPage && (
                  <p className="text-xs text-warning-foreground">No se pudieron cargar más anuncios. Intenta de nuevo.</p>
                )}
                <p className="text-xs text-subtle-foreground">Mostrando {fmt(ads.length)} de {fmt(total)}</p>
              </div>
            </>
          )}
        </>
      )}

      <AdVideoDialog
        ad={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        allowMetaLink={allowMetaLink}
        returnFocusTo={openerRef}
      />
    </div>
  )
}
