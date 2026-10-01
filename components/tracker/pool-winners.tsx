'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Lock, TrendingUp, Crown, ChevronLeft, ChevronRight, Globe, ArrowUpDown, ArrowUp, ArrowDown, Search, X, Star, SlidersHorizontal } from 'lucide-react'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useCurrency } from '@/store/hooks'
import type { PoolWinnersResponse, PoolWinnerProduct } from '@/app/(dashboard)/types'
import type { PoolPreset } from '@/app/(dashboard)/pool/page'
import { useGetPoolCountriesQuery } from '@/app/(dashboard)/services/dashboardApi'
import { usePlanTier } from '@/lib/view-as'
import { useMediaQuery } from '@/hooks/use-media-query'
import { ProductRow, ROW_COLS, type RowLayout } from '@/components/tracker/product-row'
export { ShareButton } from '@/components/tracker/share-button'

function countryFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return ''
  const base = 0x1F1E6 - 65
  return String.fromCodePoint(base + code.toUpperCase().charCodeAt(0)) +
         String.fromCodePoint(base + code.toUpperCase().charCodeAt(1))
}

type PoolSortKey = 'productTitle' | 'productPrice' | 'performanceScore' | 'growthPct' | 'currentRank' | 'daysElapsed'
type SortDir = 'asc' | 'desc'
interface SortState { key: PoolSortKey | null; dir: SortDir }

// Fixed category and currency lists — these are SCOUT's defined sets
const NICHES = [
  'Belleza & Cuidado', 'Herramientas & Auto', 'Hogar & Cocina',
  'Jardín & Exterior', 'Joyería & Relojes', 'Juguetes & Entretenimiento',
  'Mascotas', 'Moda & Accesorios', 'Salud & Bienestar',
]
const CURRENCIES = ['COP', 'EUR', 'GBP', 'USD']

// ─────────────────────────────────────────────────────────────────────────────

function getPageRange(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  if (current <= 3) return [0, 1, 2, 3, 4, 'ellipsis', total - 1]
  if (current >= total - 4) return [0, 'ellipsis', total - 5, total - 4, total - 3, total - 2, total - 1]
  return [0, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total - 1]
}

function SortIcon({ column, sort }: { column: PoolSortKey; sort: SortState }) {
  if (sort.key !== column)
    return <ArrowUpDown className="h-3 w-3 opacity-50 transition-opacity group-hover/th:opacity-100" />
  return sort.dir === 'asc'
    ? <ArrowUp className="h-3 w-3 text-primary" />
    : <ArrowDown className="h-3 w-3 text-primary" />
}

export type PagoFilter = 'all' | 'anticipado' | 'contraentrega'

// Plantillas de columnas: la cabecera y las filas usan SIEMPRE la misma (antes la cabecera
// quedaba en 10 columnas con el panel abierto y "Producto" medía 0 px, encimado sobre "Precio").

interface PoolWinnersSectionProps {
  data: PoolWinnersResponse | undefined
  isLoading?: boolean
  page?: number
  onPageChange?: (page: number) => void
  preset?: PoolPreset
  // Pago — server-side via query param
  pagoFilter?: PagoFilter
  onPagoFilterChange?: (f: PagoFilter) => void
  favorites: Set<string>
  onToggleFavorite: (id: string) => void
  /** Favoritos con sus datos guardados: la pestaña Favoritos los muestra todos, no solo los de la página. */
  favoriteItems?: PoolWinnerProduct[]
  /** Favoritos guardados solo con el id (antes de CHANGE-131) que todavía no volvieron a aparecer. */
  missingFavorites?: number
  /**
   * Alcance del Radar (CHANGE-134): 'market' = todo el pool (paginado en el servidor, con el límite
   * de páginas del plan); 'mine' = los productos de tus tiendas (/tracker), filtrados y paginados
   * en pool/page.tsx. En 'mine' no hay límite de páginas ni búsqueda con IA.
   */
  scope?: 'market' | 'mine'
  // Server-side filter props — state lives in pool/page.tsx
  // search: término CONFIRMADO (Enter) — el que realmente filtra `data`/la tabla.
  // searchInput: lo que el usuario está tecleando ahora mismo — value del <input>.
  // suggestions: resultados del dropdown en vivo (query aparte, debounced, ver pool/page.tsx).
  search: string
  searchInput: string
  onSearchInputChange: (v: string) => void
  onSearchSubmit: () => void
  suggestions: PoolWinnerProduct[]
  dateFilter: 7 | 15 | 30 | 0
  onDateFilterChange: (v: 7 | 15 | 30 | 0) => void
  daysExactFilter: number | null
  onDaysExactFilterChange: (v: number | null) => void
  nicheFilter: Set<string>
  onNicheFilterChange: (v: Set<string>) => void
  currencyFilter: Set<string>
  onCurrencyFilterChange: (v: Set<string>) => void
  escalarFilter: boolean
  onEscalarFilterChange: (v: boolean) => void
  countryFilter: string
  onCountryFilterChange: (v: string) => void
  // Split-view (panel de detalle al lado en vez de navegar a /tracker/[id]) — opcional,
  // si no se pasa la tabla se comporta exactamente igual que antes (navega con <Link>).
  selectedCandidateId?: string | null
  onSelectWinner?: (candidateId: string, storeId: string) => void
  /** Modo compacto (split view). Si no se pasa, se deriva de selectedCandidateId como antes. */
  compact?: boolean
}

export function PoolWinnersSection({
  data, isLoading, page = 0, onPageChange, preset = 'all',
  pagoFilter = 'all', onPagoFilterChange,
  favorites, onToggleFavorite, favoriteItems = [], missingFavorites = 0, scope = 'market',
  search, searchInput, onSearchInputChange, onSearchSubmit, suggestions,
  dateFilter, onDateFilterChange,
  daysExactFilter, onDaysExactFilterChange,
  nicheFilter, onNicheFilterChange,
  currencyFilter, onCurrencyFilterChange,
  escalarFilter, onEscalarFilterChange,
  countryFilter, onCountryFilterChange,
  selectedCandidateId, onSelectWinner, compact,
}: PoolWinnersSectionProps) {
  const { currency: preferredCurrency } = useCurrency()
  const { maxPoolPage } = usePlanTier()
  const isCompact = compact ?? !!selectedCandidateId
  // Fila compartida (CHANGE-134): tarjeta por debajo de 768 px, fila media hasta 1280 px.
  // El layout del dashboard monta después de hidratar, así que el primer render ya tiene el ancho real.
  const isMdUp = useMediaQuery('(min-width: 768px)')
  const isWide = useMediaQuery('(min-width: 1280px)')
  const rowVariant: 'row' | 'card' = isMdUp ? 'row' : 'card'
  const rowLayout: RowLayout = isCompact ? 'compact' : isWide ? 'full' : 'medium'
  const isMine = scope === 'mine'
  const pageLimit = isMine ? Infinity : maxPoolPage
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeFilterCount =
    (nicheFilter.size > 0 ? 1 : 0) + (currencyFilter.size > 0 ? 1 : 0) + (dateFilter > 0 ? 1 : 0) +
    (daysExactFilter != null ? 1 : 0) + (pagoFilter !== 'all' ? 1 : 0) + (escalarFilter ? 1 : 0) + (countryFilter ? 1 : 0)
  const [sort, setSort] = useState<SortState>({ key: 'performanceScore', dir: 'desc' })

  // Dropdown de sugerencias en vivo (tipo Kalodata) — se cierra al hacer click afuera o Escape
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  function toggleSet(prev: Set<string>, value: string): Set<string> {
    const next = new Set(prev)
    next.has(value) ? next.delete(value) : next.add(value)
    return next
  }

  function handleSort(key: PoolSortKey) {
    setSort(prev =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'productTitle' ? 'asc' : 'desc' },
    )
  }

  const winners = data?.winners ?? []

  // Pool-wide — no afectado por paginación ni por los demás filtros, alimenta el dropdown
  const { data: countriesData } = useGetPoolCountriesQuery()
  const countries = countriesData?.countries ?? []

  const isFavoritesTab = preset === 'favorites'

  // Client-side: deduplication + tab presets + sort only.
  // All other filters (search, dates, niche, currency, pago, escalar, country) are server-side
  // query params — never filter() on a partial page.
  const filtered = useMemo(() => {
    // Deduplicate: same product title + same store → keep the one with higher score
    const seen = new Map<string, PoolWinnerProduct>()
    // Favoritos: la lista guardada completa, no la página abierta (CHANGE-131)
    for (const w of (isFavoritesTab ? favoriteItems : winners)) {
      const key = `${w.productTitle.trim().toLowerCase()}|${w.baseUrl ?? w.storeId}`
      const existing = seen.get(key)
      if (!existing || w.performanceScore > existing.performanceScore) {
        seen.set(key, w)
      }
    }
    let r = Array.from(seen.values())
    // Sort
    if (sort.key) {
      const k = sort.key
      r = [...r].sort((a, b) => {
        const av = a[k as keyof PoolWinnerProduct] as string | number | null | undefined
        const bv = b[k as keyof PoolWinnerProduct] as string | number | null | undefined
        if (av == null && bv == null) return 0
        if (av == null) return 1
        if (bv == null) return -1
        const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
        return sort.dir === 'asc' ? cmp : -cmp
      })
    }
    return r
  }, [winners, isFavoritesTab, favoriteItems, sort])

  const hasActiveFilters = !!search || nicheFilter.size > 0 || currencyFilter.size > 0 || dateFilter > 0 || daysExactFilter != null || pagoFilter !== 'all' || escalarFilter || !!countryFilter

  if (isLoading) {
    return (
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {[80, 120, 96, 64].map((w, i) => (
            <div key={i} className="h-8 animate-pulse rounded-full bg-secondary" style={{ width: w }} />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  if (!isMine && data.locked) {
    return <LockedState />
  }

  if (!isMine && page > maxPoolPage) {
    return <PoolPageLocked />
  }

  if (isMine && data.winners.length === 0 && !hasActiveFilters && !isFavoritesTab) {
    return (
      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm font-medium text-foreground">Todavía no hay productos de tus tiendas</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Sigue una tienda en <Link href="/stores" className="font-medium text-primary-text hover:underline">Competidores</Link> y
          sus productos nuevos aparecen aquí después del próximo corte.
        </p>
      </div>
    )
  }

  // Solo el pool "de verdad" vacío (sin búsqueda ni filtros) se queda sin barra de búsqueda —
  // si el usuario tiene un filtro/búsqueda activa y no hay resultados, se sigue de largo hasta
  // el render principal: la barra queda visible y el mensaje de "sin resultados" (más abajo,
  // filtered.length === 0) es específico en vez de sugerir que el pool entero está vacío.
  if (data.winners.length === 0 && !hasActiveFilters) {
    return (
      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          El pool aún no tiene testeos suficientes. Vuelve mañana después del sync automático.
        </p>
      </div>
    )
  }

  // Las sugerencias llegan como prop (query aparte, en vivo, ver pool/page.tsx) — si no hay
  // match literal para resaltar (la IA pudo haber matcheado por sinónimo), se muestra el
  // título plano sin resaltar.
  function highlightMatch(title: string, term: string) {
    const idx = title.toLowerCase().indexOf(term.trim().toLowerCase())
    if (idx === -1) return title
    return (
      <>
        {title.slice(0, idx)}
        <span className="text-primary font-semibold">{title.slice(idx, idx + term.trim().length)}</span>
        {title.slice(idx + term.trim().length)}
      </>
    )
  }

  function clearAll() {
    onSearchInputChange('')
    onNicheFilterChange(new Set())
    onCurrencyFilterChange(new Set())
    onDateFilterChange(0)
    onDaysExactFilterChange(null)
    onPagoFilterChange?.('all')
    onEscalarFilterChange(false)
    onCountryFilterChange('')
  }

  // Los mismos controles en la barra (computador) y en el panel del celular (CHANGE-141)
  // Días en testeo — filtro exacto (FIX-055), no acumulado como "Fechas"
  const daysSlider = (
      <div className="flex items-center gap-2 sm:w-64">
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
          Días en testeo{daysExactFilter != null ? `: ${daysExactFilter}` : ''}
        </span>
        <input
          type="range"
          min={1}
          max={30}
          value={daysExactFilter ?? 1}
          onChange={e => onDaysExactFilterChange(Number(e.target.value))}
          className="h-1.5 flex-1 accent-primary"
          aria-label="Filtrar por días exactos en testeo"
        />
        {daysExactFilter != null && (
          <button
            onClick={() => onDaysExactFilterChange(null)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Quitar filtro de días en testeo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
  )

  function renderFilters(sheet: boolean) {
    return (
        <div className={sheet ? 'grid grid-cols-[minmax(0,1fr)] gap-5' : 'flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-b border-border'}>

          {/* Fechas */}
          <div className={cn('flex items-center gap-1.5', sheet && 'flex-wrap')}>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Fechas</span>
            {([0, 7, 15, 30] as const).map((d) => (
              <button
                key={d}
                onClick={() => onDateFilterChange(d)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                  dateFilter === d
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                )}
              >
                {d === 0 ? 'Todos' : `Últimos ${d}d`}
              </button>
            ))}
          </div>

          {/* Categorías / nicho — multi-select */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Categoría</span>
            <button
              onClick={() => onNicheFilterChange(new Set())}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                nicheFilter.size === 0
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              Todas
            </button>
            {NICHES.map((n) => (
              <button
                key={n}
                onClick={() => onNicheFilterChange(toggleSet(nicheFilter, n))}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                  nicheFilter.has(n)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                )}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Moneda — multi-select */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Moneda</span>
            <button
              onClick={() => onCurrencyFilterChange(new Set())}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                currencyFilter.size === 0
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              Todas
            </button>
            {CURRENCIES.map((c) => (
              <button
                key={c}
                onClick={() => onCurrencyFilterChange(toggleSet(currencyFilter, c))}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                  currencyFilter.has(c)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                )}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Pago */}
          <div className={cn('flex items-center gap-1.5', sheet && 'flex-wrap')}>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Pago</span>
            {(['all', 'anticipado', 'contraentrega'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => onPagoFilterChange?.(opt)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                  pagoFilter === opt
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                )}
              >
                {opt === 'all' ? 'Todos' : opt === 'anticipado' ? 'Pago anticipado' : 'Contraentrega'}
              </button>
            ))}
          </div>

          {/* Spikear — mismo nombre que en Mis testeos (tracker-table.tsx); acá es solo un
              filtro pasivo (isScalable), no la mecánica interactiva de floor/thorns de Spikear. */}
          <button
            onClick={() => onEscalarFilterChange(!escalarFilter)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-all',
              escalarFilter
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                : 'border-border bg-background text-muted-foreground hover:border-emerald-500/50 hover:text-emerald-600',
            )}
          >
            ↑ Spikear
          </button>

          {/* País — dropdown con todos los países del pool, no solo los de esta página */}
          {countries.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">País</span>
              <select
                value={countryFilter}
                onChange={e => onCountryFilterChange(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="">Todos</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {countryFlag(c)} {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Count + clear — solo en la barra; el panel del celular tiene su propio botón */}
          {!sheet && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground tabular-nums">
              {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearAll}
                className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
          )}
        </div>
    )
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card">

      {/* ── Búsqueda — línea propia, con dropdown de sugerencias en vivo — + días en testeo al lado ── */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-3">
        <div ref={searchBoxRef} className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={isMine ? 'Busca en los productos de tus tiendas — Enter para buscar…' : 'Busca por palabra clave (IA) — Enter para buscar…'}
            value={searchInput}
            onChange={e => { onSearchInputChange(e.target.value); setShowSuggestions(true) }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={e => {
              if (e.key === 'Enter') { onSearchSubmit(); setShowSuggestions(false) }
            }}
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {searchInput && (
            <button onClick={() => { onSearchInputChange(''); setShowSuggestions(false) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              <div className="divide-y divide-border/50">
                {suggestions.map((w) => (
                  <Link
                    key={w.candidateId}
                    href={`/tracker/${w.candidateId}?storeId=${w.storeId}&from=pool`}
                    onClick={() => setShowSuggestions(false)}
                    className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-secondary/50"
                  >
                    <img
                      src={w.productImage || 'https://picsum.photos/seed/placeholder/60/60'}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-md object-cover"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {highlightMatch(w.productTitle, searchInput)}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{Math.round(w.performanceScore)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {isMdUp && daysSlider}
        {/* Celular (CHANGE-141): los filtros van en un panel que sube desde abajo */}
        {!isMdUp && (
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className={cn(
              'flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium',
              activeFilterCount > 0 ? 'border-primary-border bg-primary-subtle text-primary-text' : 'border-border bg-background text-foreground',
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
          </button>
        )}
      </div>

      {/* ── Filtros: barra en computador; en el celular, dentro del panel de abajo ── */}
      {isMdUp && renderFilters(false)}

      {/* Encabezados de la fila compartida (CHANGE-134). En el celular no hay encabezados: tarjetas. */}
      {rowVariant === 'row' && (
        <div className={cn('grid items-center gap-3 border-b border-border bg-secondary/30 px-4 py-2.5 text-xs font-medium text-muted-foreground', ROW_COLS[rowLayout])}>
          <div />
          <div />
          <button onClick={() => handleSort('productTitle')} className="group/th flex items-center gap-1 transition-colors hover:text-foreground">
            Producto <SortIcon column="productTitle" sort={sort} />
          </button>
          <div title="Despegando, Creciendo, Estable o Cayendo, según sus últimos 7 registros de rank">Señal</div>
          <button onClick={() => handleSort('currentRank')} className="group/th flex items-center gap-1 transition-colors hover:text-foreground">
            Movimiento <SortIcon column="currentRank" sort={sort} />
          </button>
          {rowLayout === 'full' && (
            <>
              <button onClick={() => handleSort('performanceScore')} className="group/th flex items-center gap-1 transition-colors hover:text-foreground">
                Puntaje <SortIcon column="performanceScore" sort={sort} />
              </button>
              <button onClick={() => handleSort('daysElapsed')} className="group/th flex items-center gap-1 transition-colors hover:text-foreground">
                Detectado <SortIcon column="daysElapsed" sort={sort} />
              </button>
              <div>Anuncios</div>
            </>
          )}
          {rowLayout !== 'compact' && <div />}
        </div>
      )}
      {isFavoritesTab && (filtered.length > 0 || missingFavorites > 0) && (
        <p className="px-6 pb-2 text-xs text-muted-foreground">
          Tus favoritos, con los datos de la última vez que aparecieron en el pool. Los filtros no se aplican a esta lista.
          {missingFavorites > 0 && (
            <> {missingFavorites === 1
              ? '1 favorito guardado antes aparece aquí si vuelve a salir en el pool.'
              : `${missingFavorites} favoritos guardados antes aparecen aquí si vuelven a salir en el pool.`}</>
          )}
        </p>
      )}
      <div className="divide-y divide-border/50">
        {filtered.length === 0 ? (
          isFavoritesTab ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <Star className="h-9 w-9 opacity-20" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {missingFavorites > 0 ? 'Tus favoritos aparecerán aquí' : 'Aún no tienes favoritos'}
                </p>
                <p className="mt-0.5 text-xs">
                  {missingFavorites > 0
                    ? 'Los guardaste antes de este cambio: aparecen aquí si vuelven a salir en el pool.'
                    : 'Marca productos con ★ para guardarlos aquí.'}
                </p>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {search
                ? <>No encontramos productos relacionados con &ldquo;{search}&rdquo;.</>
                : 'No hay productos que coincidan con los filtros.'}
            </p>
          )
        ) : (
          filtered.map((winner) => (
            <ProductRow
              key={winner.candidateId}
              product={winner}
              href={isMine ? `/tracker/${winner.candidateId}?storeId=${winner.storeId}` : `/tracker/${winner.candidateId}?storeId=${winner.storeId}&from=pool`}
              variant={rowVariant}
              layout={rowLayout}
              preferredCurrency={preferredCurrency ?? 'USD'}
              isFavorite={favorites.has(winner.candidateId)}
              onToggleFavorite={onToggleFavorite}
              isSelected={winner.candidateId === selectedCandidateId}
              onSelect={onSelectWinner}
            />
          ))
        )}
      </div>

      {/* Límite de la prueba, dicho con el número real (CHANGE-134). Antes solo se veían candados
          en la paginación y, al llegar a la página siguiente, un muro. */}
      {!isMine && !isFavoritesTab && page === maxPoolPage && (data.total ?? 0) > (page + 1) * 20 && (
        <div className="flex flex-wrap items-center gap-3 border-t border-border bg-secondary/40 px-4 py-4">
          <Lock className="h-4 w-4 shrink-0 text-subtle-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Hay {((data.total ?? 0) - (page + 1) * 20).toLocaleString('es-CO')} productos más en el Radar
            </p>
            <p className="text-xs text-muted-foreground">
              {page === 0 ? 'Tu prueba ve la primera página, lo más fuerte del mercado.' : `Tu plan ve las primeras ${(page + 1).toLocaleString('es-CO')} páginas.`}
              {' '}Con un plan pago ves todo el mercado.
            </p>
          </div>
          <Link href="/pricing" className="rounded-lg bg-grad-cta px-3 py-2 text-xs font-semibold text-primary-foreground shadow-[0_8px_24px_-10px_var(--glow)] hover:brightness-110">
            Ver planes
          </Link>
        </div>
      )}

      {/* Pagination — la lista de favoritos no se pagina: son los guardados, no el pool */}
      {!isFavoritesTab && onPageChange && data && (data.totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-between border-t border-border px-6 py-3">
          <span className="text-xs text-muted-foreground">
            Mostrando {page * 20 + 1}–{Math.min((page + 1) * 20, data.total ?? 0)} de {data.total ?? 0} productos
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {getPageRange(page, data.totalPages ?? 1).map((p, idx) =>
              p === 'ellipsis' ? (
                <span key={`e${idx}`} className="flex h-7 w-5 items-center justify-center text-xs text-muted-foreground select-none">…</span>
              ) : p > pageLimit ? (
                <span
                  key={p}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/40 text-muted-foreground/30"
                >
                  <Lock className="h-3 w-3" />
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                    p === page
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  )}
                >
                  {p + 1}
                </button>
              )
            )}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= (data.totalPages ?? 1) - 1 || page >= pageLimit}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Panel de filtros en el celular (CHANGE-141) */}
      {!isMdUp && (
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetContent side="bottom" aria-describedby={undefined} showCloseButton={false}
            className="max-h-[85dvh] gap-0 overflow-y-auto rounded-t-2xl p-0 pb-[env(safe-area-inset-bottom,0px)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-5 py-4">
              <SheetTitle className="text-base">Filtros</SheetTitle>
              {activeFilterCount > 0 && (
                <button type="button" onClick={clearAll} className="text-sm text-muted-foreground hover:text-foreground">Limpiar</button>
              )}
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-5 px-5 py-4">
              {daysSlider}
              {renderFilters(true)}
            </div>
            <div className="sticky bottom-0 border-t border-border bg-background px-5 py-3">
              <Button className="w-full" onClick={() => setFiltersOpen(false)}>
                {isMine ? 'Ver resultados' : `Ver ${(data.total ?? 0).toLocaleString('es-CO')} productos`}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* bottom padding when no pagination */}
      {(isFavoritesTab || !(onPageChange && data && (data.totalPages ?? 1) > 1)) && (
        <div className="pb-4" />
      )}
    </div>
  )
}

// ─── sub-components ───────────────────────────────────────────────────────────


function PoolPageLocked() {
  const { isTrial } = usePlanTier()
  const message = isTrial
    ? 'La prueba gratis solo accede a la primera página. Suscríbete a un plan para ver todos los productos.'
    : 'Alcanzaste el límite de páginas de tu plan. Actualiza de plan para ver más resultados.'
  const cta = isTrial ? 'Ver planes' : 'Actualizar plan'

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative">
        <div className="pointer-events-none select-none space-y-3 p-6 blur-sm">
          {[42, 38, 35, 31].map((score, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-border/50 bg-secondary/30 px-4 py-3">
              <span className="text-xs font-bold text-muted-foreground">#{i + 21}</span>
              <div className="h-8 w-8 rounded-full bg-secondary" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-40 rounded bg-secondary" />
                <div className="h-2 w-24 rounded bg-secondary/60" />
              </div>
              <ScoreRing score={score} size="sm" showLabel={false} />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/80 backdrop-blur-[2px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Página bloqueada</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {message}
            </p>
          </div>
          <Link href={isTrial ? '/pricing' : '/settings'}>
            <Button size="sm" className="mt-1 gap-1.5">
              <Crown className="h-3.5 w-3.5" />
              {cta}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function LockedState() {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card">
      {/* blurred preview */}
      <div className="relative">
        <div className="pointer-events-none select-none space-y-3 p-6 blur-sm">
          {[85, 72, 61].map((score, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-border/50 bg-secondary/30 px-4 py-3"
            >
              <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
              <div className="h-8 w-8 rounded-full bg-secondary" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-40 rounded bg-secondary" />
                <div className="h-2 w-24 rounded bg-secondary/60" />
              </div>
              <ScoreRing score={score} size="sm" showLabel={false} />
            </div>
          ))}
        </div>

        {/* lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/80 backdrop-blur-[2px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Señales del pool bloqueadas</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              El plan Básico desbloquea las señales del Pool de Testeos
            </p>
          </div>
          <Button size="sm" className="mt-1 gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Actualizar a Básico
          </Button>
        </div>
      </div>

      {/* header below the blurred area */}
      <div className="border-t border-border px-6 py-3">
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Pool de Testeos — requiere plan Básico</span>
        </div>
      </div>
    </div>
  )
}

