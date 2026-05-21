'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
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
  // Anything < 7 or 0 (Todos) defaults to 7 days
  const displayDays = windowDays === 30 ? 30 : 7
  // Sort state
  const [sort, setSort] = useState<SortState>({ key: 'performanceScore', dir: 'desc' })

  // Filter state
  const [search, setSearch] = useState('')
  const [storeFilter, setStoreFilter] = useState<string>('all')

  // Derived filter options
  const stores = useMemo(
    () => ['all', ...Array.from(new Set(candidates.map((c) => c.storeName))).sort()],
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
  }, [candidates, search, storeFilter, sort])

  const hasActiveFilters = search || storeFilter !== 'all'

  function clearFilters() {
    setSearch('')
    setStoreFilter('all')
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
        <div className="grid grid-cols-12 gap-4 border-b border-border bg-secondary/30 px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {/* Rank */}
          <div className="col-span-1">Rank</div>

          {/* Product — sortable */}
          <button
            onClick={() => handleSort('productTitle')}
            className="group/th col-span-3 flex items-center gap-1.5 text-left hover:text-foreground transition-colors"
          >
            Product
            <SortIcon column="productTitle" sort={sort} />
          </button>

          {/* Store — sortable */}
          <button
            onClick={() => handleSort('storeName')}
            className="group/th col-span-2 flex items-center gap-1.5 text-left hover:text-foreground transition-colors"
          >
            Store
            <SortIcon column="storeName" sort={sort} />
          </button>

          {/* Score — sortable */}
          <button
            onClick={() => handleSort('performanceScore')}
            className="group/th col-span-1 flex items-center justify-center gap-1.5 hover:text-foreground transition-colors"
          >
            Score
            <SortIcon column="performanceScore" sort={sort} />
          </button>

          {/* Trend — sparkline, period-aware */}
          <div className="col-span-2 text-center">Trend ({displayDays}d)</div>

          {/* Status — not sortable */}
          <div className="col-span-1 text-center">Status</div>

          {/* Growth — sortable */}
          <button
            onClick={() => handleSort('growthPct')}
            className="group/th col-span-1 flex items-center justify-center gap-1.5 hover:text-foreground transition-colors"
          >
            Growth
            <SortIcon column="growthPct" sort={sort} />
          </button>

          <div className="col-span-1 text-center">Action</div>
        </div>

        {/* Body */}
        <div className="divide-y divide-border">
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
            processed.map((candidate, idx) => (
              <div
                key={candidate.candidateId}
                className={cn(
                  'group grid grid-cols-12 items-center gap-4 px-6 py-4 transition-colors hover:bg-secondary/20',
                  idx % 2 === 0 && 'bg-secondary/5'
                )}
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center gap-1.5">
                  {idx < 3 && (
                    <span className={cn(
                      'text-sm leading-none',
                      idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-400' : 'text-yellow-600'
                    )}>★</span>
                  )}
                  <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                    {idx + 1}
                  </span>
                </div>

                {/* Product */}
                <div className="col-span-3 flex items-center gap-3">
                  {/* Image: layered so letter fallback shows if img fails */}
                  <div className="relative h-10 w-10 shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-muted-foreground">
                      {candidate.productTitle.charAt(0)}
                    </div>
                    {candidate.productImage && (
                      <img
                        src={`/api/image-proxy?url=${encodeURIComponent(candidate.productImage)}`}
                        alt=""
                        className="absolute inset-0 h-10 w-10 rounded-lg object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{candidate.productTitle}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{candidate.daysInBestseller}d bestseller</span>
                      </div>
                      <PhaseBadge phase={candidate.cyclePhase} />
                    </div>
                  </div>
                </div>

                {/* Store */}
                <div className="col-span-2">
                  <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
                    {candidate.storeName}
                  </span>
                </div>

                {/* Score */}
                <div className="col-span-1 flex justify-center">
                  <ScoreRing
                    score={candidate.performanceScore ?? 0}
                    size="sm"
                    showLabel={false}
                    confidence={candidate.signalConfidence}
                  />
                </div>

                {/* Trend sparkline — only shown when net growth exists in the period */}
                <div className="col-span-2 flex justify-center">
                  {(() => {
                    const history = candidate.scoreHistory ?? []
                    const sliced  = history.slice(-displayDays)
                    const hasGrowth = sliced.length >= 2 && sliced[sliced.length - 1] > sliced[0]
                    return hasGrowth
                      ? <Sparkline data={sliced} width={80} height={32} />
                      : <span className="text-[10px] text-muted-foreground/35">—</span>
                  })()}
                </div>

                {/* Status */}
                <div className="col-span-1 flex justify-center">
                  <PerformanceBadge label={candidate.performanceLabel} size="sm" />
                </div>

                {/* Growth */}
                <div className="col-span-1 text-center">
                  <span
                    className={cn(
                      'text-sm font-semibold tabular-nums',
                      candidate.growthPct != null && candidate.growthPct >= 0 ? 'text-rising' : 'text-declining'
                    )}
                  >
                    {candidate.growthPct != null
                      ? `${candidate.growthPct >= 0 ? '+' : ''}${Math.round(candidate.growthPct)}%`
                      : '—'}
                  </span>
                </div>

                {/* Action */}
                <div className="col-span-1 flex justify-center">
                  <Link
                    href={`/tracker/${candidate.candidateId}?storeId=${candidate.storeId}`}
                    className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    View
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}