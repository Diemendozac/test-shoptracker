'use client'

import { useState, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import Link from 'next/link'
import { cn, fmtCompact } from '@/lib/utils'
import { convertCurrency, currencySymbol } from '@/lib/currency'
import { useCurrency } from '@/store/hooks'
import { Sparkline } from '@/components/tracker/sparkline'
import type { TrackerCandidate } from '@/lib/types'
import {
  ExternalLink, ArrowUpDown, ArrowUp, ArrowDown,
  Search, X, SlidersHorizontal, Trash2,
} from 'lucide-react'
import { useRemoveCandidateMutation } from '@/app/(dashboard)/services/candidateApi'
import { dashboardApi } from '@/app/(dashboard)/services/dashboardApi'
import { HoverImagePreview } from '@/components/ui/image-preview'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey =
  | 'productTitle' | 'storeName' | 'productPrice'
  | 'performanceScore' | 'growthPct'
  | 'daysElapsed' | 'daysInBestseller' | 'firstSeenDate'
type SortDir = 'asc' | 'desc'
interface SortState { key: SortKey | null; dir: SortDir }
interface TrackerTableProps { candidates: TrackerCandidate[]; windowDays?: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SortIcon({ column, sort }: { column: SortKey; sort: SortState }) {
  if (sort.key !== column)
    return <ArrowUpDown className="h-3 w-3 opacity-30 transition-opacity group-hover/th:opacity-70" />
  return sort.dir === 'asc'
    ? <ArrowUp className="h-3 w-3 text-primary" />
    : <ArrowDown className="h-3 w-3 text-primary" />
}

function ContextBar({ score }: { score: number | null }) {
  const s = Math.round(Math.min(100, Math.max(0, score ?? 0)))
  const color = s >= 60 ? 'bg-emerald-500' : s >= 30 ? 'bg-amber-500' : 'bg-rose-500'
  return (
    <div className="space-y-1 w-full">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${s}%` }} />
      </div>
      <span className="text-[11px] font-medium tabular-nums text-muted-foreground">~{s}%</span>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TrackerTable({ candidates, windowDays = 0 }: TrackerTableProps) {
  const { currency: preferredCurrency } = useCurrency()
  const dispatch = useDispatch()
  const [removeCandidate] = useRemoveCandidateMutation()
  const displayDays = windowDays === 30 ? 30 : 7

  const [sort, setSort] = useState<SortState>({ key: 'performanceScore', dir: 'desc' })
  const [search, setSearch] = useState('')
  const [storeFilter, setStoreFilter] = useState<string>('all')
  const [nicheFilter, setNicheFilter] = useState<string>('all')
  const [currencyFilter, setCurrencyFilter] = useState<string>('all')
  const [paFilter, setPaFilter] = useState<string>('all')

  const stores = useMemo(
    () => ['all', ...Array.from(new Set(candidates.map(c => c.storeName))).sort()],
    [candidates],
  )

  const storeProductCount = useMemo(
    () => candidates.reduce<Record<string, number>>((acc, c) => {
      acc[c.storeId] = (acc[c.storeId] ?? 0) + 1
      return acc
    }, {}),
    [candidates],
  )
  const niches = useMemo(
    () => ['all', ...Array.from(new Set(candidates.map(c => c.niche).filter(Boolean) as string[])).sort()],
    [candidates],
  )
  const currencies = useMemo(
    () => ['all', ...Array.from(new Set(candidates.map(c => c.currency).filter(Boolean) as string[])).sort()],
    [candidates],
  )

  function handleSort(key: SortKey) {
    setSort(prev =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'productTitle' || key === 'storeName' ? 'asc' : 'desc' },
    )
  }

  const processed = useMemo(() => {
    let result = [...candidates]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c => c.productTitle.toLowerCase().includes(q))
    }
    if (storeFilter !== 'all') result = result.filter(c => c.storeName === storeFilter)
    if (nicheFilter !== 'all') result = result.filter(c => c.niche === nicheFilter)
    if (currencyFilter !== 'all') result = result.filter(c => c.currency === currencyFilter)
    if (paFilter !== 'all') result = result.filter(c => (paFilter === 'yes') === !!c.pagoAnticipado)
    if (sort.key) {
      const k = sort.key
      result.sort((a, b) => {
        const av = a[k], bv = b[k]
        if (av == null && bv == null) return 0
        if (av == null) return 1
        if (bv == null) return -1
        const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
        return sort.dir === 'asc' ? cmp : -cmp
      })
    }
    return result
  }, [candidates, search, storeFilter, nicheFilter, currencyFilter, paFilter, sort])

  const hasActiveFilters =
    !!search || storeFilter !== 'all' || nicheFilter !== 'all' ||
    currencyFilter !== 'all' || paFilter !== 'all' || sort.key === 'firstSeenDate'

  function clearFilters() {
    setSearch('')
    setStoreFilter('all')
    setNicheFilter('all')
    setCurrencyFilter('all')
    setPaFilter('all')
    setSort({ key: 'performanceScore', dir: 'desc' })
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-50">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-secondary/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="relative">
          <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-border bg-secondary/40 px-3 pr-8 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
            {stores.map(s => <option key={s} value={s}>{s === 'all' ? 'All stores' : s}</option>)}
          </select>
          <SlidersHorizontal className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>

        {niches.length > 1 && (
          <select value={nicheFilter} onChange={e => setNicheFilter(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-border bg-secondary/40 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
            <option value="all">Todos los nichos</option>
            {niches.filter(n => n !== 'all').map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        )}

        {currencies.length > 1 && (
          <select value={currencyFilter} onChange={e => setCurrencyFilter(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-border bg-secondary/40 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
            <option value="all">Todas las monedas</option>
            {currencies.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        <select value={paFilter} onChange={e => setPaFilter(e.target.value)}
          className="h-9 appearance-none rounded-lg border border-border bg-secondary/40 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
          <option value="all">Pago anticipado: Todos</option>
          <option value="yes">Solo pago anticipado</option>
        </select>

        <select
          value={
            sort.key === 'firstSeenDate' && sort.dir === 'desc' ? 'recent'
            : sort.key === 'firstSeenDate' && sort.dir === 'asc' ? 'oldest'
            : 'relevance'
          }
          onChange={e => {
            if (e.target.value === 'recent')      setSort({ key: 'firstSeenDate', dir: 'desc' })
            else if (e.target.value === 'oldest') setSort({ key: 'firstSeenDate', dir: 'asc' })
            else                                  setSort({ key: 'performanceScore', dir: 'desc' })
          }}
          className="h-9 appearance-none rounded-lg border border-border bg-secondary/40 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
          <option value="relevance">Ordenar: Relevancia</option>
          <option value="recent">Más recientes</option>
          <option value="oldest">Más antiguos</option>
        </select>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
            <X className="h-3 w-3" /> Clear
          </button>
        )}

        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {processed.length} of {candidates.length} results
        </span>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Header */}
        <div className="grid grid-cols-[40px_56px_1fr_140px_72px_80px_130px_100px_72px] items-center gap-6 border-b border-border bg-secondary/30 px-6 py-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <div>#</div>
          <div />
          <button onClick={() => handleSort('productTitle')} className="group/th flex items-center gap-1.5 text-left hover:text-foreground transition-colors">
            Producto <SortIcon column="productTitle" sort={sort} />
          </button>
          <button onClick={() => handleSort('storeName')} className="group/th flex items-center gap-1.5 text-left hover:text-foreground transition-colors">
            Tienda <SortIcon column="storeName" sort={sort} />
          </button>
          <button onClick={() => handleSort('productPrice')} className="group/th flex items-center gap-1.5 hover:text-foreground transition-colors">
            Precio <SortIcon column="productPrice" sort={sort} />
          </button>
          <div className="text-center">Tendencia ({displayDays}d)</div>
          <button onClick={() => handleSort('growthPct')} className="group/th flex items-center gap-1.5 hover:text-foreground transition-colors">
            Crecimiento <SortIcon column="growthPct" sort={sort} />
          </button>
          <button onClick={() => handleSort('performanceScore')} className="group/th flex items-center gap-1.5 hover:text-foreground transition-colors">
            Contexto <SortIcon column="performanceScore" sort={sort} />
          </button>
          <div className="text-center">Acción</div>
        </div>

        {/* Body */}
        <div className="divide-y divide-border/50">
          {processed.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <Search className="h-8 w-8 opacity-30" />
              <p className="text-sm">No products match your filters</p>
              <button onClick={clearFilters} className="text-xs underline underline-offset-2 hover:text-foreground transition-colors">
                Clear filters
              </button>
            </div>
          ) : (
            processed.map((candidate, idx) => {
              const sym = currencySymbol(preferredCurrency ?? candidate.currency ?? 'USD')
              const price = candidate.productPrice != null
                ? convertCurrency(candidate.productPrice, candidate.currency, preferredCurrency)
                : null

              // Rank delta: improvement from entry rank (positive = climbed up the list)
              const rankDelta = candidate.entryRank != null && candidate.currentRank != null
                ? candidate.entryRank - candidate.currentRank
                : null

              // Crecimiento sub-text derived from performance score
              const score = candidate.performanceScore ?? 0
              const topPct = Math.max(1, Math.round(100 - score))
              const gp = candidate.growthPct
              const subText = gp == null ? null
                : gp > 1  ? `↑ top ${topPct}% en tienda`
                : gp < -1 ? `↓ bottom ${Math.min(99, Math.round(score))}% en tienda`
                : 'sin cambio'

              return (
                <div
                  key={candidate.candidateId}
                  className="grid grid-cols-[40px_56px_1fr_140px_72px_80px_130px_100px_72px] items-center gap-6 px-6 py-3 transition-colors hover:bg-secondary/30"
                >
                  {/* # */}
                  <div className="flex items-center justify-center">
                    {idx < 3 ? (
                      <span className={cn('text-sm leading-none',
                        idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : 'text-amber-700',
                      )}>★</span>
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                    )}
                  </div>

                  {/* Image */}
                  <HoverImagePreview src={candidate.productImage} fallback={candidate.productTitle.charAt(0)} proxy />

                  {/* Producto */}
                  <div className="min-w-0 pl-2">
                    <Link
                      href={`/tracker/${candidate.candidateId}?storeId=${candidate.storeId}&from=tracker`}
                      className="line-clamp-2 text-sm font-semibold leading-snug text-foreground hover:text-primary hover:underline transition-colors"
                    >
                      {candidate.productTitle}
                    </Link>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {candidate.currentRank != null ? `Rank #${candidate.currentRank}` : 'Sin rank'}
                      </span>
                      {rankDelta !== null && rankDelta !== 0 && (
                        <span className={cn(
                          'inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[11px] font-bold tabular-nums',
                          rankDelta > 0
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-rose-500/10 text-rose-500',
                        )}>
                          {rankDelta > 0 ? '↑' : '↓'}{Math.abs(rankDelta)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tienda */}
                  <div className="min-w-0">
                    <span className="block truncate rounded-md bg-secondary px-2 py-1 text-[11px] font-medium text-muted-foreground">
                      {candidate.storeName}
                    </span>
                    <span className="mt-0.5 block pl-1 text-[10px] text-muted-foreground/50">
                      {storeProductCount[candidate.storeId] ?? 0} productos
                    </span>
                  </div>

                  {/* Precio */}
                  <div>
                    {price != null ? (
                      <span className="text-xs font-semibold text-primary tabular-nums">
                        {sym}{fmtCompact(price)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/40">—</span>
                    )}
                  </div>

                  {/* Tendencia */}
                  <div className="flex justify-center">
                    {(() => {
                      const history = (candidate.growthHistory ?? candidate.scoreHistory ?? []).slice(-displayDays)
                      return history.length >= 2
                        ? <Sparkline data={history} width={80} height={32} />
                        : <span className="text-[10px] text-muted-foreground/35">—</span>
                    })()}
                  </div>

                  {/* Crecimiento */}
                  <div>
                    <span className={cn(
                      'block text-sm font-bold tabular-nums',
                      gp != null && gp >= 0 ? 'text-emerald-600' : 'text-rose-500',
                    )}>
                      {gp != null ? `${gp >= 0 ? '+' : ''}${gp.toFixed(1)}%` : '—'}
                    </span>
                    {subText && (
                      <span className="mt-0.5 block text-[10px] leading-tight text-muted-foreground">
                        {subText}
                      </span>
                    )}
                  </div>

                  {/* Contexto */}
                  <ContextBar score={candidate.performanceScore} />

                  {/* Acción */}
                  <div className="flex items-center justify-center gap-1.5">
                    <Link
                      href={`/tracker/${candidate.candidateId}?storeId=${candidate.storeId}`}
                      className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      Ver
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <button
                      onClick={async () => {
                        if (confirm(`¿Eliminar "${candidate.productTitle}"?`)) {
                          await removeCandidate(candidate.candidateId)
                          dispatch(dashboardApi.util.invalidateTags(['Tracker', 'Overview']))
                        }
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground/50 transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
