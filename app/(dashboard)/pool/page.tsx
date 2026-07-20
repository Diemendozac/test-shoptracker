'use client'

import { useState, useEffect } from 'react'
import { PoolWinnersSection } from '@/components/tracker/pool-winners'
import type { PagoFilter } from '@/components/tracker/pool-winners'
import { PoolArchiveHint } from '@/components/tracker/pool-archive-hint'
import { useGetPoolWinnersQuery, useGetPoolSearchQuery } from '@/app/(dashboard)/services/dashboardApi'
import { useViewAs } from '@/lib/view-as'
import { cn } from '@/lib/utils'
import { LayoutGrid, TrendingUp, Star, Flame } from 'lucide-react'

export type PoolPreset = 'all' | 'rising' | 'top_score' | 'new' | 'favorites'

const TABS: { id: PoolPreset; label: string; icon: React.ElementType }[] = [
  { id: 'all',       label: 'Todos los productos', icon: LayoutGrid },
  { id: 'rising',    label: 'En alza',             icon: Flame      },
  { id: 'top_score', label: 'Top score',           icon: Star       },
  { id: 'new',       label: 'Nuevos esta semana',  icon: TrendingUp },
  { id: 'favorites', label: 'Favoritos',           icon: Star       },
]

export default function PoolPage() {
  // effectivePlan, no isAdmin: si un admin está simulando "ver como Pro/Starter"
  // desde la ViewAsBar, debe ver el pool filtrado igual que ese plan lo vería.
  const { effectivePlan } = useViewAs()
  const isAdminView = effectivePlan === 'admin'
  const [page, setPage] = useState(0)
  const [preset, setPreset] = useState<PoolPreset>('all')

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

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem('dropspy_favorites_pool')
      return new Set(stored ? JSON.parse(stored) as string[] : [])
    } catch { return new Set() }
  })

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
  const { data, isLoading, error } = useGetPoolWinnersQuery({
    ...sharedParams,
    page,
    size: 20,
    q: searchSubmitted || undefined,
  })

  // Sugerencias del dropdown (CHANGE-095) — reacciona a searchDebounced (en vivo, 300ms),
  // pedido chico y aparte para no forzar a la tabla a refrescarse con cada tecla.
  const { data: suggestData } = useGetPoolWinnersQuery(
    { ...sharedParams, page: 0, size: 6, q: searchDebounced },
    { skip: !searchDebounced },
  )

  // Archivo (FIX-053): candidatos que ya salieron del tracking activo, buscables por IA.
  // Sigue la búsqueda CONFIRMADA (Enter), igual que la tabla principal — no tiene sentido
  // gastar una llamada a la API de Anthropic por cada tecla mientras el usuario escribe.
  const { data: archiveData, isLoading: archiveLoading } = useGetPoolSearchQuery(
    { q: searchSubmitted, country: countryFilter || undefined },
    { skip: !searchSubmitted },
  )

  return (
    <>
      {/* ── Tab header ── */}
      <div className="border-b border-border bg-card px-6">
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
      </div>

      {/* ── Content ── */}
      <div className="p-6">
        {error && !data && (
          <div className="rounded-xl border border-border bg-card px-6 py-8 text-center">
            <p className="text-sm font-medium text-foreground">No se pudo cargar el pool</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {'status' in error ? `Error ${(error as { status: number }).status}` : 'Error de red'} — intenta recargar la página
            </p>
          </div>
        )}
        <PoolWinnersSection
          data={data}
          isLoading={isLoading}
          page={page}
          onPageChange={setPage}
          preset={preset}
          pagoFilter={pagoFilter}
          onPagoFilterChange={handlePagoFilter}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
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
        />
        <PoolArchiveHint data={archiveData} isLoading={archiveLoading} />
      </div>
    </>
  )
}
