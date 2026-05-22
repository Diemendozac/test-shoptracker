'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { cn, fmtCompact } from '@/lib/utils'
import { convertCurrency, currencySymbol } from '@/lib/currency'
import { useCurrency } from '@/store/hooks'
import { PerformanceBadge } from '@/components/dashboard/performance-badge'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { PhaseBadge } from '@/components/tracker/phase-badge'
import { Sparkline } from '@/components/tracker/sparkline'
import type { TrackerCandidate } from '@/lib/types'
import {
  ExternalLink,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  SlidersHorizontal,
} from 'lucide-react'
import { HoverImagePreview } from '@/components/ui/image-preview'

const PL_S1_CONS = 13.3785
const PL_ALPHA   = 2.1598
function plEst(rank: number | null | undefined): number {
  if (!rank || rank <= 0) return 0
  return PL_S1_CONS * Math.pow(rank, -PL_ALPHA)
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = 'productTitle' | 'storeName' | 'performanceScore' | 'growthPct' | 'daysElapsed' | 'daysInBestseller'
type SortDir = 'asc' | 'desc'

interface SortState {
  key: SortKey | null
  dir: SortDir
}

interface TrackerTableProps {
  candidates: TrackerCandidate[]
  windowDays?: number  // 0=Todos, 3, 5, 30 — from the window selector
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SortIcon({ column, sort }: { column: SortKey; sort: SortState }) {
  if (sort.key !== column)
    return <ArrowUpDown className="h-3 w-3 opacity-30 transition-opacity group-hover/th:opacity-70" />
  return sort.dir === 'asc'
    ? <ArrowUp className="h-3 w-3 text-primary" />
    : <ArrowDown className="h-3 w-3 text-primary" />
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TrackerTable({ candidates, windowDays = 0 }: TrackerTableProps) {
  const { currency: preferredCurrency } = useCurrency()
  // Anything < 7 or 0 (Todos) defaults to 7 days
  const displayDays = windowDays === 30 ? 30 : 7
  // Sort state
  const [sort, setSort] = useState<SortState>({ key: 'performanceScore', dir: 'desc' })

  // Filter state
  const [search, setSearch] = useState('')
  const [storeFilter, setStoreFilter] = useState<string>('all')
  const [nicheFilter, setNicheFilter] = useState<string>('all')
  const [currencyFilter, setCurrencyFilter] = useState<string>('all')
  const [paFilter, setPaFilter] = useState<string>('all') // 'all' | 'yes' | 'no'

  // Derived filter options
  const stores = useMemo(
    () => ['all', ...Array.from(new Set(candidates.map((c) => c.storeName))).sort()],
    [candidates]
  )
  const niches = useMemo(
    () => ['all', ...Array.from(new Set(candidates.map((c) => c.niche).filter(Boolean) as string[])).sort()],
    [candidates]
  )
  const currencies = useMemo(
    () => ['all', ...Array.from(new Set(candidates.map((c) => c.currency).filter(Boolean) as string[])).sort()],
    [candidates]
  )

  // Toggle sort
  function handleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    )
  }

  // Filtered + sorted candidates
  const processed = useMemo(() => {
    let result = [...candidates]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((c) => c.productTitle.toLowerCase().includes(q))
    }

    // Store filter
    if (storeFilter !== 'all') {
      result = result.filter((c) => c.storeName === storeFilter)
    }

    // Niche filter
    if (nicheFilter !== 'all') {
      result = result.filter((c) => c.niche === nicheFilter)
    }

    // Currency filter
    if (currencyFilter !== 'all') {
      result = result.filter((c) => c.currency === currencyFilter)
    }

    // Pago anticipado filter
    if (paFilter !== 'all') {
      result = result.filter((c) => (paFilter === 'yes') === !!c.pagoAnticipado)
    }

    // Sort
    if (sort.key) {
      const k = sort.key
      result.sort((a, b) => {
        const av = a[k]
        const bv = b[k]
        const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
        return sort.dir === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [candidates, search, storeFilter, nicheFilter, currencyFilter, paFilter, sort])

  const hasActiveFilters = search || storeFilter !== 'all' || nicheFilter !== 'all' || currencyFilter !== 'all' || paFilter !== 'all'

  function clearFilters() {
    setSearch('')
    setStoreFilter('all')
    setNicheFilter('all')
    setCurrencyFilter('all')
    setPaFilter('all')
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-50">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-secondary/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Store filter */}
        <div className="relative">
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-border bg-secondary/40 px-3 pr-8 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            {stores.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All stores' : s}
              </option>
            ))}
          </select>
          <SlidersHorizontal className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* Niche filter — only shown when there's data */}
        {niches.length > 1 && (
          <select
            value={nicheFilter}
            onChange={(e) => setNicheFilter(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-border bg-secondary/40 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            <option value="all">Todos los nichos</option>
            {niches.filter((n) => n !== 'all').map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        )}

        {/* Currency filter */}
        {currencies.length > 1 && (
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-border bg-secondary/40 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            <option value="all">Todas las monedas</option>
            {currencies.filter((c) => c !== 'all').map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {/* Pago anticipado filter */}
        <select
          value={paFilter}
          onChange={(e) => setPaFilter(e.target.value)}
          className="h-9 appearance-none rounded-lg border border-border bg-secondary/40 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
        >
          <option value="all">Pago anticipado: Todos</option>
          <option value="yes">Solo pago anticipado</option>
        </select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}

        {/* Result count */}
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {processed.length} of {candidates.length} results
        </span>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Header */}
        <div className="grid grid-cols-[40px_72px_1fr_150px_72px_80px_56px_80px_80px_68px_80px] items-center gap-4 border-b border-border bg-secondary/30 px-6 py-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <div>#</div>
          <div />
          <button
            onClick={() => handleSort('productTitle')}
            className="group/th flex items-center gap-1.5 text-left hover:text-foreground transition-colors"
          >
            Producto
            <SortIcon column="productTitle" sort={sort} />
          </button>
          <button
            onClick={() => handleSort('storeName')}
            className="group/th flex items-center gap-1.5 text-left hover:text-foreground transition-colors"
          >
            Tienda
            <SortIcon column="storeName" sort={sort} />
          </button>
          <div className="text-center">~Ventas/d</div>
          <div className="text-center">~Ingr./d</div>
          <button
            onClick={() => handleSort('performanceScore')}
            className="group/th flex items-center justify-center gap-1.5 hover:text-foreground transition-colors"
          >
            Score
            <SortIcon column="performanceScore" sort={sort} />
          </button>
          <div className="text-center">Trend ({displayDays}d)</div>
          <div className="text-center">Estado</div>
          <button
            onClick={() => handleSort('growthPct')}
            className="group/th flex items-center justify-center gap-1.5 hover:text-foreground transition-colors"
          >
            Growth
            <SortIcon column="growthPct" sort={sort} />
          </button>
          <div className="text-center">Acción</div>
        </div>

        {/* Body */}
        <div className="divide-y divide-border/50">
          {processed.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <Search className="h-8 w-8 opacity-30" />
              <p className="text-sm">No products match your filters</p>
              <button
                onClick={clearFilters}
                className="text-xs underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
            processed.map((candidate, idx) => {
              const uds    = candidate.estUnitsDayLow ?? plEst(candidate.currentRank)
              const udsInt = uds >= 0.5 ? Math.max(1, Math.round(uds)) : 0
              const revRaw      = udsInt > 0 && candidate.productPrice != null ? udsInt * candidate.productPrice : 0
              const rev         = convertCurrency(revRaw, candidate.currency, preferredCurrency)
              const displayCurr = preferredCurrency ?? candidate.currency ?? 'USD'
              const sym         = currencySymbol(displayCurr)
              return (
              <div
                key={candidate.candidateId}
                className="grid grid-cols-[40px_72px_1fr_150px_72px_80px_56px_80px_80px_68px_80px] items-center gap-4 px-6 py-3 transition-colors hover:bg-secondary/30"
              >
                {/* Rank */}
                <div className="flex items-center justify-center">
                  {idx < 3 ? (
                    <span className={cn(
                      'text-sm leading-none',
                      idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : 'text-amber-700'
                    )}>★</span>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                  )}
                </div>

                {/* Image */}
                <HoverImagePreview
                  src={candidate.productImage}
                  fallback={candidate.productTitle.charAt(0)}
                  proxy
                />

                {/* Product info */}
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                    {candidate.productTitle}
                  </p>
                  {candidate.productPrice != null && (
                    <p className="mt-0.5 text-xs font-medium text-primary">
                      ${candidate.productPrice.toLocaleString('es-CO')}
                    </p>
                  )}
                  <div className="mt-0.5 flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{candidate.daysInBestseller}d bestseller</span>
                    </div>
                    <PhaseBadge phase={candidate.cyclePhase} />
                  </div>
                </div>

                {/* Store */}
                <div className="min-w-0">
                  <span className="block truncate rounded-md bg-secondary px-2 py-1 text-[11px] font-medium text-muted-foreground">
                    {candidate.storeName}
                  </span>
                </div>

                {/* Est. ventas/día */}
                <div className="text-center">
                  {udsInt > 0 ? (
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      ~{udsInt}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/30">—</span>
                  )}
                  <p className="text-[9px] text-muted-foreground/50">uds/d</p>
                </div>

                {/* Est. ingresos/día */}
                <div className="text-center">
                  {rev > 0 ? (
                    <>
                      <span className="text-sm font-semibold tabular-nums text-emerald-500">
                        ~{sym}{fmtCompact(rev)}
                      </span>
                      <p className="text-[9px] text-muted-foreground/50">{displayCurr} p5</p>
                    </>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/30">—</span>
                  )}
                </div>

                {/* Score */}
                <div className="flex justify-center">
                  <ScoreRing
                    score={candidate.performanceScore ?? 0}
                    size="sm"
                    showLabel={false}
                    confidence={candidate.signalConfidence}
                  />
                </div>

                {/* Trend sparkline */}
                <div className="flex justify-center">
                  {(() => {
                    const history = (candidate.growthHistory ?? candidate.scoreHistory ?? []).slice(-displayDays)
                    return history.length >= 2
                      ? <Sparkline data={history} width={80} height={32} />
                      : <span className="text-[10px] text-muted-foreground/35">—</span>
                  })()}
                </div>

                {/* Status */}
                <div className="flex justify-center">
                  <PerformanceBadge label={candidate.performanceLabel} size="sm" />
                </div>

                {/* Growth */}
                <div className="text-center">
                  <span className={cn(
                    'text-sm font-bold tabular-nums',
                    candidate.growthPct != null && candidate.growthPct >= 0 ? 'text-emerald-600' : 'text-rose-500'
                  )}>
                    {candidate.growthPct != null
                      ? `${candidate.growthPct >= 0 ? '+' : ''}${Math.round(candidate.growthPct)}%`
                      : '—'}
                  </span>
                </div>

                {/* Action */}
                <div className="flex justify-center">
                  <Link
                    href={`/tracker/${candidate.candidateId}?storeId=${candidate.storeId}`}
                    className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    Ver
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )})
          )}
        </div>
      </div>
    </div>
  )
}