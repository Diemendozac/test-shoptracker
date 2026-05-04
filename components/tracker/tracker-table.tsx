'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { PerformanceBadge } from '@/components/dashboard/performance-badge'
import { ScoreRing } from '@/components/dashboard/score-ring'
import type { TrackerCandidate } from '@/lib/types'
import {
  ExternalLink,
  Clock,
  Award,
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

export function TrackerTable({ candidates }: TrackerTableProps) {
  // Sort state
  const [sort, setSort] = useState<SortState>({ key: null, dir: 'asc' })

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
          {/* Product — sortable */}
          <button
            onClick={() => handleSort('productTitle')}
            className="group/th col-span-4 flex items-center gap-1.5 text-left hover:text-foreground transition-colors"
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

          {/* Status — not sortable (visual only) */}
          <div className="col-span-2 text-center">Status</div>

          {/* Growth — sortable */}
          <button
            onClick={() => handleSort('growthPct')}
            className="group/th col-span-1 flex items-center justify-center gap-1.5 hover:text-foreground transition-colors"
          >
            Growth
            <SortIcon column="growthPct" sort={sort} />
          </button>

          {/* Days elapsed — sortable */}
          <button
            onClick={() => handleSort('daysElapsed')}
            className="group/th col-span-1 flex items-center justify-center gap-1.5 hover:text-foreground transition-colors"
          >
            Days
            <SortIcon column="daysElapsed" sort={sort} />
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
                {/* Product */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-muted-foreground">
                    {candidate.productTitle.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{candidate.productTitle}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{candidate.daysInBestseller} days in bestseller</span>
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
                  <ScoreRing score={candidate.performanceScore} size="sm" showLabel={false} />
                </div>

                {/* Status */}
                <div className="col-span-2 flex justify-center">
                  <PerformanceBadge label={candidate.performanceLabel} size="sm" />
                </div>

                {/* Growth */}
                <div className="col-span-1 text-center">
                  <span
                    className={cn(
                      'text-sm font-semibold tabular-nums',
                      candidate.growthPct >= 0 ? 'text-rising' : 'text-declining'
                    )}
                  >
                    {candidate.growthPct >= 0 ? '+' : ''}{Math.round(candidate.growthPct)}%
                  </span>
                </div>

                {/* Days Elapsed */}
                <div className="col-span-1 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Award className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">{candidate.daysElapsed}</span>
                  </div>
                </div>

                {/* Action */}
                <div className="col-span-1 flex justify-center">
                  <Link
                    href={`/tracker/${candidate.candidateId}`}
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