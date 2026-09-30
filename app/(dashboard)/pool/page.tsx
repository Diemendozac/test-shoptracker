'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PoolWinnersSection } from '@/components/tracker/pool-winners'
import type { PagoFilter } from '@/components/tracker/pool-winners'
import { PoolDetailPanel } from '@/components/tracker/pool-detail-panel'
import { PoolArchiveHint } from '@/components/tracker/pool-archive-hint'
import { useGetPoolWinnersQuery, useGetPoolSearchQuery, useGetTrackerCandidatesQuery } from '@/app/(dashboard)/services/dashboardApi'
import { useViewAs } from '@/lib/view-as'
import { cn } from '@/lib/utils'
import { Segmented } from '@/components/ui/segmented'
import { useMediaQuery } from '@/hooks/use-media-query'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { LayoutGrid, Star } from 'lucide-react'
import type { PoolWinnerProduct, PoolWinnersResponse, TrackerCandidate } from '@/app/(dashboard)/types'
import { isScalable } from '@/lib/label-utils'

// "En alza", "Top score" y "Nuevos esta semana" se quitaron (CHANGE-131): filtraban en el navegador
// solo los 20 productos de la página abierta, no el pool. Top score repetía el orden del backend
// (ya viene por puntaje) y Nuevos repetía el filtro de Fechas "7d", que sí filtra en el servidor.
export type PoolPreset = 'all' | 'favorites'

const TABS: { id: PoolPreset; label: string; icon: React.ElementType }[] = [
  { id: 'all',       label: 'Todos los productos', icon: LayoutGrid },
  { id: 'favorites', label: 'Favoritos',           icon: Star       },
]

const FAVORITE_ITEMS_KEY = 'dropspy_favorites_pool_items'
const PAGE_SIZE = 20

type Scope = 'market' | 'mine'

/** Minúsculas y sin tildes, para buscar en los productos de tus tiendas. */
function norm(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

/** Un producto de /tracker con la forma que usa la tabla del Radar (misma fila, CHANGE-134). */
function trackerToRow(c: TrackerCandidate): PoolWinnerProduct {
  return {
    candidateId: c.candidateId,
    productTitle: c.productTitle,
    productImage: c.productImage,
    productUrl: null,
    productPrice: c.productPrice,
    performanceScore: c.performanceScore ?? 0,
    performanceLabel: c.performanceLabel,
    growthPct: c.growthPct,
    currentRank: c.currentRank,
    daysElapsed: c.daysElapsed,
    daysInBestseller: c.daysInBestseller,
    signalConfidence: c.signalConfidence,
    cyclePhase: c.cyclePhase,
    storeId: c.storeId,
    storeName: c.storeName,
    niche: c.niche,
    currency: c.currency,
    storeCountry: c.storeCountry,
    pagoAnticipado: c.pagoAnticipado,
    estUnitsDayLow: c.estUnitsDayLow,
    estRevDayLow: c.estRevDayLow,
    storeProductCount: c.storeProductCount ?? null,
    previousRank: null,
    scoreHistory: c.scoreHistory,
    growthHistory: c.growthHistory,
    rankHistory: c.rankHistory,
  }
}

export default function PoolPage() {
  // effectivePlan, no isAdmin: si un admin está simulando "ver como Pro/Starter"
  // desde la ViewAsBar, debe ver el pool filtrado igual que ese plan lo vería.
  const { effectivePlan } = useViewAs()
  const isAdminView = effectivePlan === 'admin'
  const [page, setPage] = useState(0)
  const [preset, setPreset] = useState<PoolPreset>('all')

  // Alcance (CHANGE-134): todo el mercado (el pool) o solo tus tiendas. "Mis testeos" (/tracker)
  // ahora es este segundo alcance: /tracker redirige a /pool?alcance=mis-tiendas.
  const router = useRouter()
  const searchParams = useSearchParams()
  const scope: Scope = searchParams.get('alcance') === 'mis-tiendas' ? 'mine' : 'market'
  const isMine = scope === 'mine'
  function handleScope(next: Scope) {
    if (next === scope) return
    setPage(0)
    setSelectedWinner(null)
    router.replace(next === 'mine' ? '/pool?alcance=mis-tiendas' : '/pool', { scroll: false })
  }

  // All filter state lives here so every change triggers a fresh server fetch
  const [pagoFilter, setPagoFilter] = useState<PagoFilter>('all')
  // searchInput: lo que el usuario está tecleando ahora mismo — value del input, y fuente
  // del dropdown de sugerencias (debounced 300ms, "en vivo", CHANGE-095).
  // searchSubmitted: lo que de verdad filtra la tabla principal — solo cambia con Enter,
  // para que la tabla no salte con cada tecla mientras el dropdown ya da feedback inmediato.
  const [searchInput, setSearchInput] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [searchSubmitted, setSearchSubmitted] = useState('')
  const [dateFilter, setDateFilter] = useState<7 | 15 | 30 | 0>(0)
  const [daysExactFilter, setDaysExactFilter] = useState<number | null>(null)
  const [nicheFilter, setNicheFilter] = useState<Set<string>>(new Set())
  const [currencyFilter, setCurrencyFilter] = useState<Set<string>>(new Set())
  const [escalarFilter, setEscalarFilter] = useState(false)
  const [countryFilter, setCountryFilter] = useState<string>('')

  // Split-view: producto seleccionado para el panel de detalle al lado de la tabla,
  // en vez de navegar a /tracker/[candidateId].
  const [selectedWinner, setSelectedWinner] = useState<{ candidateId: string; storeId: string } | null>(null)
  // Elemento que abrió el panel: al cerrar el Sheet el foco vuelve ahí (teclado / lector de pantalla)
  const openerRef = useRef<HTMLElement | null>(null)
  function handleSelectWinner(candidateId: string, storeId: string) {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setSelectedWinner({ candidateId, storeId })
  }
  function handleClosePanel() { setSelectedWinner(null) }
  // Split (tabla + panel al lado) solo desde 1280 px: por debajo la fila compacta no entra
  // (el título medía 17–38 px entre 1024 y 1100). Ahí el panel se abre en un Sheet.
  const isSplit = useMediaQuery('(min-width: 1280px)')

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      // Los favoritos de la vieja pantalla Mis testeos se suman a los del Radar (CHANGE-134)
      const legacy = localStorage.getItem('dropspy_favorites_tracker')
      if (legacy) {
        const merged = new Set<string>([
          ...(JSON.parse(localStorage.getItem('dropspy_favorites_pool') ?? '[]') as string[]),
          ...(JSON.parse(legacy) as string[]),
        ])
        localStorage.setItem('dropspy_favorites_pool', JSON.stringify([...merged]))
        localStorage.removeItem('dropspy_favorites_tracker')
      }
      const stored = localStorage.getItem('dropspy_favorites_pool')
      return new Set(stored ? JSON.parse(stored) as string[] : [])
    } catch { return new Set() }
  })

  // Favoritos que se pueden mostrar aunque no estén en la página abierta (CHANGE-131). Antes la
  // pestaña filtraba solo los 20 productos cargados, así que un favorito de la página 3 no se veía
  // nunca. Se guarda la fila tal como se vio la última vez en el pool, y se refresca cada vez que
  // vuelve a aparecer. `favorites` (ids) sigue siendo la lista de verdad, con la misma clave de
  // siempre: los favoritos viejos (sin datos guardados) aparecen si vuelven a salir en el pool.
  const [favoriteItems, setFavoriteItems] = useState<Record<string, PoolWinnerProduct>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const stored = localStorage.getItem(FAVORITE_ITEMS_KEY)
      return stored ? JSON.parse(stored) as Record<string, PoolWinnerProduct> : {}
    } catch { return {} }
  })

  function saveFavoriteItems(next: Record<string, PoolWinnerProduct>) {
    try { localStorage.setItem(FAVORITE_ITEMS_KEY, JSON.stringify(next)) } catch { /* sin almacenamiento: queda en memoria */ }
  }

  // Búsqueda que llega desde el buscador global (⌘K → "Buscar con IA en el Radar", CHANGE-132):
  // /pool?q=... se aplica como si se hubiera escrito y confirmado con Enter.
  const qParam = searchParams.get('q')
  useEffect(() => {
    if (!qParam) return
    setSearchInput(qParam)
    setSearchSubmitted(qParam)
    setPage(0)
  }, [qParam])

  // Debounce solo para el dropdown de sugerencias en vivo — 300ms después de dejar de escribir.
  // La tabla principal NO escucha esto; escucha searchSubmitted (solo cambia con Enter).
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // Every filter handler resets to page 1 before the new fetch
  function handleTab(id: PoolPreset) { setPreset(id); setPage(0) }
  function handlePagoFilter(f: PagoFilter) { setPagoFilter(f); setPage(0) }
  function handleSearchInputChange(v: string) {
    setSearchInput(v)
    // Al borrar el texto, la tabla se limpia de inmediato — no tiene sentido esperar un Enter
    // para "buscar nada". Mientras haya texto, la tabla espera al Enter (handleSearchSubmit).
    if (v === '') { setSearchSubmitted(''); setPage(0) }
  }
  function handleSearchSubmit() { setSearchSubmitted(searchInput); setPage(0) }
  function handleDateFilterChange(v: 7 | 15 | 30 | 0) { setDateFilter(v); setPage(0) }
  function handleDaysExactFilterChange(v: number | null) { setDaysExactFilter(v); setPage(0) }
  function handleNicheFilterChange(v: Set<string>) { setNicheFilter(v); setPage(0) }
  function handleCurrencyFilterChange(v: Set<string>) { setCurrencyFilter(v); setPage(0) }
  function handleEscalarFilterChange(v: boolean) { setEscalarFilter(v); setPage(0) }
  function handleCountryFilterChange(v: string) { setCountryFilter(v); setPage(0) }

  function toggleFavorite(id: string) {
    const wasFavorite = favorites.has(id)
    const winner = data?.winners.find(w => w.candidateId === id)
    setFavoriteItems(prev => {
      const next = { ...prev }
      if (wasFavorite) delete next[id]
      else if (winner) next[id] = winner
      saveFavoriteItems(next)
      return next
    })
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem('dropspy_favorites_pool', JSON.stringify([...next]))
      return next
    })
  }

  // Params compartidos entre la tabla principal y la query de sugerencias del dropdown —
  // ambas deben respetar los mismos filtros de categoría/moneda/pago/fecha/país/ads,
  // solo difieren en qué término de búsqueda usan y cuántos resultados piden.
  const sharedParams = {
    pagoAnticipado: pagoFilter === 'anticipado' ? true
      : pagoFilter === 'contraentrega' ? false
      : undefined,
    niche:     nicheFilter.size > 0    ? Array.from(nicheFilter)    : undefined,
    currency:  currencyFilter.size > 0 ? Array.from(currencyFilter) : undefined,
    days:      dateFilter > 0          ? dateFilter                  : undefined,
    daysExact: daysExactFilter ?? undefined,
    scalable:  escalarFilter            ? true                        : undefined,
    country:   countryFilter || undefined,
    // Solo admin (vista real, sin simular otro plan) ve el pool completo
    hasVideo:  isAdminView ? undefined : true,
  }

  // Tabla principal — solo reacciona a searchSubmitted (Enter), no a cada tecla.
  const { data: poolData, isLoading: poolLoading, error } = useGetPoolWinnersQuery({
    ...sharedParams,
    page,
    size: PAGE_SIZE,
    q: searchSubmitted || undefined,
  }, { skip: isMine })

  // Alcance "Mis tiendas": los productos de tus tiendas (/tracker, ya completos en el cliente),
  // con los mismos filtros que el pool aplica en el servidor, ordenados por puntaje y paginados
  // aquí. Antes vivían en la pantalla Mis testeos, con otra tabla y otros filtros.
  const { data: trackerData = [], isLoading: trackerLoading } = useGetTrackerCandidatesQuery({}, { skip: !isMine })
  const mineAll = useMemo(() => {
    if (!isMine) return []
    const q = norm(searchSubmitted.trim())
    return trackerData
      .filter(c => !q || norm(c.productTitle).includes(q))
      .filter(c => pagoFilter === 'all' || (pagoFilter === 'anticipado' ? c.pagoAnticipado === true : c.pagoAnticipado === false))
      .filter(c => nicheFilter.size === 0 || (c.niche != null && nicheFilter.has(c.niche)))
      .filter(c => currencyFilter.size === 0 || (c.currency != null && currencyFilter.has(c.currency)))
      .filter(c => dateFilter === 0 || c.daysElapsed <= dateFilter)
      .filter(c => daysExactFilter == null || c.daysElapsed === daysExactFilter)
      .filter(c => !escalarFilter || isScalable(c.performanceScore, c.signalConfidence))
      .filter(c => !countryFilter || c.storeCountry === countryFilter)
      .sort((a, b) => (b.performanceScore ?? 0) - (a.performanceScore ?? 0))
      .map(trackerToRow)
  }, [isMine, trackerData, searchSubmitted, pagoFilter, nicheFilter, currencyFilter, dateFilter, daysExactFilter, escalarFilter, countryFilter])
  const mineData: PoolWinnersResponse | undefined = isMine && !trackerLoading ? {
    locked: false,
    plan: effectivePlan,
    winners: mineAll.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    total: mineAll.length,
    page,
    totalPages: Math.max(1, Math.ceil(mineAll.length / PAGE_SIZE)),
  } : undefined

  const data = isMine ? mineData : poolData
  const isLoading = isMine ? trackerLoading : poolLoading

  // Sugerencias del dropdown (CHANGE-095) — reacciona a searchDebounced (en vivo, 300ms),
  // pedido chico y aparte para no forzar a la tabla a refrescarse con cada tecla.
  const { data: suggestData } = useGetPoolWinnersQuery(
    { ...sharedParams, page: 0, size: 6, q: searchDebounced },
    { skip: !searchDebounced || isMine },
  )

  // Refresca los datos guardados de los favoritos que aparecen en la página abierta, y completa
  // los favoritos viejos que se guardaron solo con el id.
  useEffect(() => {
    const seen = (data?.winners ?? []).filter(w => favorites.has(w.candidateId))
    if (seen.length === 0) return
    setFavoriteItems(prev => {
      const next = { ...prev }
      for (const w of seen) next[w.candidateId] = w
      saveFavoriteItems(next)
      return next
    })
  }, [data, favorites])

  const favoriteList = useMemo(
    () => Object.values(favoriteItems).filter(w => favorites.has(w.candidateId)),
    [favoriteItems, favorites],
  )
  const missingFavorites = useMemo(
    () => [...favorites].filter(id => !favoriteItems[id]).length,
    [favorites, favoriteItems],
  )

  // Archivo (FIX-053): candidatos que ya salieron del tracking activo, buscables por IA.
  // Sigue la búsqueda CONFIRMADA (Enter), igual que la tabla principal — no tiene sentido
  // gastar una llamada a la API de Anthropic por cada tecla mientras el usuario escribe.
  const { data: archiveData, isLoading: archiveLoading } = useGetPoolSearchQuery(
    { q: searchSubmitted, country: countryFilter || undefined },
    { skip: !searchSubmitted || isMine },
  )

  return (
    <>
      {/* ── Tab header ── */}
      <div className="flex flex-wrap items-center gap-x-4 border-b border-border bg-card px-3 sm:px-6">
        <div className="flex items-center gap-1 overflow-x-auto py-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTab(id)}
              className={cn(
                'flex shrink-0 items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-medium transition-colors whitespace-nowrap',
                preset === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {id === 'favorites' && favorites.size > 0 && (
                <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-amber-500">
                  {favorites.size}
                </span>
              )}
            </button>
          ))}
        </div>
        {/* Alcance (CHANGE-134): el mercado entero o solo tus tiendas (lo que antes era Mis testeos) */}
        <div className="ml-auto py-2">
          <Segmented
            ariaLabel="Alcance del Radar"
            value={scope}
            onChange={handleScope}
            options={[
              { value: 'market' as Scope, label: 'Todo el mercado' },
              { value: 'mine' as Scope, label: 'Mis tiendas' },
            ]}
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-3 sm:p-6">
        {error && !data && (
          <div className="rounded-xl border border-border bg-card px-6 py-8 text-center">
            <p className="text-sm font-medium text-foreground">No se pudo cargar el pool</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {'status' in error ? `Error ${(error as { status: number }).status}` : 'Error de red'} — intenta recargar la página
            </p>
          </div>
        )}
        <div className={cn('grid gap-6', selectedWinner && isSplit && 'grid-cols-[minmax(0,1fr)_440px]')}>
          <PoolWinnersSection
            data={data}
            isLoading={isLoading}
            page={page}
            onPageChange={setPage}
            preset={preset}
            scope={scope}
            pagoFilter={pagoFilter}
            onPagoFilterChange={handlePagoFilter}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            favoriteItems={favoriteList}
            missingFavorites={missingFavorites}
            search={searchSubmitted}
            searchInput={searchInput}
            onSearchInputChange={handleSearchInputChange}
            onSearchSubmit={handleSearchSubmit}
            suggestions={suggestData?.winners ?? []}
            dateFilter={dateFilter}
            onDateFilterChange={handleDateFilterChange}
            daysExactFilter={daysExactFilter}
            onDaysExactFilterChange={handleDaysExactFilterChange}
            nicheFilter={nicheFilter}
            onNicheFilterChange={handleNicheFilterChange}
            currencyFilter={currencyFilter}
            onCurrencyFilterChange={handleCurrencyFilterChange}
            escalarFilter={escalarFilter}
            onEscalarFilterChange={handleEscalarFilterChange}
            countryFilter={countryFilter}
            onCountryFilterChange={handleCountryFilterChange}
            selectedCandidateId={selectedWinner?.candidateId ?? null}
            onSelectWinner={handleSelectWinner}
            compact={!!selectedWinner && isSplit}
          />
          {selectedWinner && isSplit && (
            <PoolDetailPanel
              candidateId={selectedWinner.candidateId}
              storeId={selectedWinner.storeId}
              onClose={handleClosePanel}
            />
          )}
        </div>
        {/* < 1280 px: el mismo panel en un Sheet (antes se renderizaba debajo de toda la tabla, fuera de la vista) */}
        <Sheet open={!!selectedWinner && !isSplit} onOpenChange={open => { if (!open) handleClosePanel() }}>
          <SheetContent
            side="right"
            showCloseButton={false}
            aria-describedby={undefined}
            onCloseAutoFocus={e => { e.preventDefault(); openerRef.current?.focus() }}
            className="w-full gap-0 overflow-y-auto bg-card p-0 sm:max-w-[440px]">
            <SheetTitle className="sr-only">Detalle del producto</SheetTitle>
            {selectedWinner && (
              <PoolDetailPanel
                candidateId={selectedWinner.candidateId}
                storeId={selectedWinner.storeId}
                onClose={handleClosePanel}
                variant="sheet"
              />
            )}
          </SheetContent>
        </Sheet>
        <PoolArchiveHint data={archiveData} isLoading={archiveLoading} />
      </div>
    </>
  )
}
