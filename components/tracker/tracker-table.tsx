'use client'

import { useState, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import Link from 'next/link'
import { cn, fmtCompact } from '@/lib/utils'
import { FormattedPrice } from '@/components/ui/formatted-price'
import { useCurrency } from '@/store/hooks'
import { Sparkline } from '@/components/tracker/sparkline'
import type { TrackerCandidate } from '@/lib/types'
import {
  ExternalLink, ArrowUpDown, ArrowUp, ArrowDown,
  Search, X, SlidersHorizontal, Trash2, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useRemoveCandidateMutation } from '@/app/(dashboard)/services/candidateApi'
import { dashboardApi } from '@/app/(dashboard)/services/dashboardApi'
import { HoverImagePreview } from '@/components/ui/image-preview'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { resolveDisplayLabel } from '@/lib/label-utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey =
  | 'productTitle' | 'storeName' | 'productPrice'
  | 'performanceScore' | 'growthPct'
  | 'daysElapsed' | 'createdAt'
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

function contextTier(topPct: number) {
  if (topPct <= 10) return { color: 'bg-emerald-500',  labelColor: 'text-emerald-500',  label: 'Winner' }
  if (topPct <= 25) return { color: 'bg-emerald-400',  labelColor: 'text-emerald-400',  label: 'Strong' }
  if (topPct <= 50) return { color: 'bg-yellow-400',   labelColor: 'text-yellow-400',   label: 'Mid'    }
  if (topPct <= 75) return { color: 'bg-orange-400',   labelColor: 'text-orange-400',   label: 'Low'    }
  return               { color: 'bg-rose-500',     labelColor: 'text-rose-500',     label: 'Weak'   }
}

function ContextBar({ rank, total }: { rank: number | null; total?: number | null }) {
  const topPct = rank != null && total && total > 0
    ? Math.min(100, Math.max(1, Math.round((rank / total) * 100)))
    : null
  const barFill = topPct != null ? Math.max(1, 100 - topPct) : 0
  const tier = topPct != null ? contextTier(topPct) : null
  return (
    <div className="space-y-1 w-full">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn('h-full rounded-full transition-all duration-500', tier?.color ?? 'bg-secondary')}
          style={{ width: `${barFill}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {topPct != null ? `top ${topPct}%` : '—'}
        </span>
        {tier && (
          <span className={cn('text-[10px] font-semibold', tier.labelColor)}>{tier.label}</span>
        )}
      </div>
      {total != null && total > 0 && (
        <span className="text-[11px] tabular-nums text-muted-foreground/60">
          de {total} productos
        </span>
      )}
    </div>
  )
}

const PAGE_SIZE = 20

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
  const [page, setPage] = useState(0)

  function resetPage() { setPage(0) }

  const stores = useMemo(
    () => ['all', ...Array.from(new Set(candidates.map(c => c.storeName))).sort()],
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
    resetPage()
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
    currencyFilter !== 'all' || paFilter !== 'all' || sort.key === 'createdAt'

  function clearFilters() {
    setSearch(''); setStoreFilter('all'); setNicheFilter('all')
    setCurrencyFilter('all'); setPaFilter('all')
    setSort({ key: 'performanceScore', dir: 'desc' })
    resetPage()
  }

  const totalPages = Math.ceil(processed.length / PAGE_SIZE)
  const pagedItems = processed.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

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
          <select value={storeFilter} onChange={e => { setStoreFilter(e.target.value); resetPage() }}
            className="h-9 appearance-none rounded-lg border border-border bg-secondary/40 px-3 pr-8 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
            {stores.map(s => <option key={s} value={s}>{s === 'all' ? 'All stores' : s}</option>)}
          </select>
          <SlidersHorizontal className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>

        {niches.length > 1 && (
          <select value={nicheFilter} onChange={e => { setNicheFilter(e.target.value); resetPage() }}
            className="h-9 appearance-none rounded-lg border border-border bg-secondary/40 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
            <option value="all">Todos los nichos</option>
            {niches.filter(n => n !== 'all').map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        )}

        {currencies.length > 1 && (
          <select value={currencyFilter} onChange={e => { setCurrencyFilter(e.target.value); resetPage() }}
            className="h-9 appearance-none rounded-lg border border-border bg-secondary/40 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
            <option value="all">Todas las monedas</option>
            {currencies.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        <select value={paFilter} onChange={e => { setPaFilter(e.target.value); resetPage() }}
          className="h-9 appearance-none rounded-lg border border-border bg-secondary/40 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
          <option value="all">Pago anticipado: Todos</option>
          <option value="yes">Solo pago anticipado</option>
        </select>

        <select
          value={
            sort.key === 'createdAt' && sort.dir === 'desc' ? 'recent'
            : sort.key === 'createdAt' && sort.dir === 'asc' ? 'oldest'
            : 'relevance'
          }
          onChange={e => {
            if (e.target.value === 'recent')      setSort({ key: 'createdAt', dir: 'desc' })
            else if (e.target.value === 'oldest') setSort({ key: 'createdAt', dir: 'asc' })
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
        <div className="grid grid-cols-[40px_56px_1fr_140px_72px_56px_80px_130px_100px_72px] items-center gap-6 border-b border-border bg-secondary/30 px-6 py-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
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
          <button onClick={() => handleSort('performanceScore')} className="group/th flex items-center gap-1.5 hover:text-foreground transition-colors">
            Score <SortIcon column="performanceScore" sort={sort} />
          </button>
          <div className="text-center">Tendencia ({displayDays}d)</div>
          <button onClick={() => handleSort('growthPct')} className="group/th flex items-center gap-1.5 hover:text-foreground transition-colors">
            Crecimiento <SortIcon column="growthPct" sort={sort} />
          </button>
          <div>Contexto</div>
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
            pagedItems.map((candidate, idx) => {
              const idx_abs = page * PAGE_SIZE + idx
              // Rank delta vs ayer: penúltimo valor del rankHistory
              const rh = candidate.rankHistory
              const prevRank = rh && rh.length >= 2 ? rh[rh.length - 2] : (candidate.previousRank ?? null)
              const rankDelta = prevRank != null && candidate.currentRank != null
                ? prevRank - candidate.currentRank
                : null

              // Fallback direccional de growthPct cuando no hay historial (primer día)
              const rankDir = rankDelta !== null && rankDelta !== 0
                ? (rankDelta > 0 ? 'up' : 'down')
                : candidate.growthPct != null && candidate.growthPct > 1 ? 'up'
                : candidate.growthPct != null && candidate.growthPct < -1 ? 'down'
                : null

              const total = candidate.storeProductCount
              const gp = candidate.growthPct

              // "superó al X% del catálogo" = productos por debajo del rank actual
              const superadoPct = candidate.currentRank != null && total && total > 0
                ? Math.max(0, Math.round(((total - candidate.currentRank) / total) * 100))
                : null

              const subColor = superadoPct == null ? ''
                : superadoPct <= 25  ? 'text-rose-500'
                : superadoPct <= 50  ? 'text-amber-600'
                : superadoPct <= 75  ? 'text-green-700'
                : 'text-emerald-600'

              const subText: { text: string; color: string } | null = gp == null ? null
                : gp > 1 && superadoPct != null
                  ? { text: `↑ superó al ${superadoPct}% del catálogo`, color: subColor }
                : gp < -1
                  ? { text: '↓ bajando en tienda', color: 'text-rose-500' }
                : null

              const score = Math.round(candidate.performanceScore ?? 0)

              return (
                <div
                  key={candidate.candidateId}
                  className="grid grid-cols-[40px_56px_1fr_140px_72px_56px_80px_130px_100px_72px] items-center gap-6 px-6 py-3 transition-colors hover:bg-secondary/30"
                >
                  {/* # */}
                  <div className="flex items-center justify-center">
                    {idx_abs < 3 ? (
                      <span className={cn('text-sm leading-none',
                        idx_abs === 0 ? 'text-amber-500' : idx_abs === 1 ? 'text-slate-400' : 'text-amber-700',
                      )}>★</span>
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">#{idx_abs + 1}</span>
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
                      {rankDir && (
                        <span className={cn(
                          'inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[11px] font-bold tabular-nums',
                          rankDir === 'up'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-rose-500/10 text-rose-500',
                        )}>
                          {rankDir === 'up' ? '↑' : '↓'}
                          {rankDelta !== null ? Math.abs(rankDelta) : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tienda */}
                  <div className="min-w-0 text-center">
                    <span className="block truncate rounded-md bg-secondary px-2 py-1 text-[11px] font-medium text-muted-foreground">
                      {candidate.storeName}
                    </span>
                    {candidate.storeProductCount != null && candidate.storeProductCount > 0 && (
                      <span className="mt-0.5 block text-[10px] text-muted-foreground/50">
                        {candidate.storeProductCount} productos
                      </span>
                    )}
                  </div>

                  {/* Precio */}
                  <div>
                    <FormattedPrice
                      amount={candidate.productPrice}
                      originalCurrency={candidate.currency}
                      preferredCurrency={preferredCurrency}
                      compact
                    />
                  </div>

                  {/* Score */}
                  <div className="flex items-center justify-center">
                    {score > 0 ? (
                      <ScoreRing
                        score={score}
                        label={resolveDisplayLabel(candidate.performanceLabel, candidate.performanceScore, candidate.growthPct, candidate.daysElapsed, candidate.scoreHistory, candidate.growthHistory)}
                        size="sm"
                        showLabel={false}
                      />
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
                      <span className={cn('mt-0.5 block text-[10px] leading-tight', subText.color)}>
                        {subText.text}
                      </span>
                    )}
                  </div>

                  {/* Contexto */}
                  <ContextBar rank={candidate.currentRank} total={candidate.storeProductCount} />

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

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-2 pt-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, processed.length)} de {processed.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i).map(i => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md border text-xs font-medium transition-colors',
                  i === page
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
