'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Lock, TrendingUp, Crown, ChevronLeft, ChevronRight, Globe, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { Sparkline } from '@/components/tracker/sparkline'
import { Button } from '@/components/ui/button'
import { cn, fmtCompact } from '@/lib/utils'
import { FormattedPrice } from '@/components/ui/formatted-price'
import { useCurrency } from '@/store/hooks'
import { HoverImagePreview } from '@/components/ui/image-preview'
import type { PoolWinnersResponse, PoolWinnerProduct } from '@/app/(dashboard)/types'
import type { PoolPreset } from '@/app/(dashboard)/pool/page'

type PoolSortKey = 'productTitle' | 'productPrice' | 'performanceScore' | 'growthPct' | 'currentRank'
type SortDir = 'asc' | 'desc'
interface SortState { key: PoolSortKey | null; dir: SortDir }

/**
 * "En alza" concrete definition — all 4 conditions must hold:
 *  1. Rank improved at least 3 consecutive days in the last 7
 *  2. Score improved vs yesterday
 *  3. growthPct > 0
 *  4. daysElapsed >= 3
 * Lower rank number = better position (rank 1 = best seller).
 */
function isRising(w: PoolWinnerProduct): boolean {
  if (w.daysElapsed < 3) return false
  if (w.growthPct == null || w.growthPct <= 0) return false

  // Score improved vs yesterday
  const sh = w.scoreHistory
  if (sh && sh.length >= 2 && sh[sh.length - 1] <= sh[sh.length - 2]) return false

  // Rank improved at least 3 consecutive days (streak) in last 7
  const rh = w.rankHistory
  if (!rh || rh.length < 3) return false
  const recent = rh.slice(-7)
  let streak = 0
  let maxStreak = 0
  for (let i = 1; i < recent.length; i++) {
    if (recent[i] < recent[i - 1]) { streak++; if (streak > maxStreak) maxStreak = streak }
    else streak = 0
  }
  return maxStreak >= 3
}

function SortIcon({ column, sort }: { column: PoolSortKey; sort: SortState }) {
  if (sort.key !== column)
    return <ArrowUpDown className="h-3 w-3 opacity-50 transition-opacity group-hover/th:opacity-100" />
  return sort.dir === 'asc'
    ? <ArrowUp className="h-3 w-3 text-primary" />
    : <ArrowDown className="h-3 w-3 text-primary" />
}

interface PoolWinnersSectionProps {
  data: PoolWinnersResponse | undefined
  isLoading?: boolean
  page?: number
  onPageChange?: (page: number) => void
  preset?: PoolPreset
}

export function PoolWinnersSection({ data, isLoading, page = 0, onPageChange, preset = 'all' }: PoolWinnersSectionProps) {
  const { currency: preferredCurrency } = useCurrency()
  const [nicheFilter, setNicheFilter] = useState<Set<string>>(new Set())
  const [currencyFilter, setCurrencyFilter] = useState<Set<string>>(new Set())
  const [dateFilter, setDateFilter] = useState<7 | 15 | 30 | 0>(0)
  const [sort, setSort] = useState<SortState>({ key: 'performanceScore', dir: 'desc' })

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

  const niches = useMemo(
    () => Array.from(new Set(winners.map((w) => w.niche).filter(Boolean) as string[])).sort(),
    [winners]
  )
  const currencies = useMemo(
    () => Array.from(new Set(winners.map((w) => w.currency).filter(Boolean) as string[])).sort(),
    [winners]
  )

  const filtered = useMemo(() => {
    let r = winners
    // Tab preset filters
    if (preset === 'rising')          r = r.filter(isRising)
    // pago_anticipado is filtered server-side via query param — no client filter needed
    if (preset === 'top_score')       r = [...r].sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 20)
    if (preset === 'new')             r = r.filter((w) => w.daysElapsed <= 7)
    // Chip filters
    if (dateFilter > 0)            r = r.filter((w) => w.daysElapsed <= dateFilter)
    if (nicheFilter.size > 0)      r = r.filter((w) => w.niche != null && nicheFilter.has(w.niche))
    if (currencyFilter.size > 0)   r = r.filter((w) => w.currency != null && currencyFilter.has(w.currency))
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
  }, [winners, preset, dateFilter, nicheFilter, currencyFilter, sort])

  const hasActiveFilters = nicheFilter.size > 0 || currencyFilter.size > 0 || dateFilter > 0

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

  if (data.locked) {
    return <LockedState />
  }

  if (data.winners.length === 0) {
    return (
      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          El pool aún no tiene candidatos suficientes. Vuelve mañana después del sync automático.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card">

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 border-b border-border">

        {/* Fechas */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Fechas</span>
          {([0, 7, 15, 30] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDateFilter(d)}
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
        {niches.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Categoría</span>
            {/* "Todas" clears the selection */}
            <button
              onClick={() => setNicheFilter(new Set())}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                nicheFilter.size === 0
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              Todas
            </button>
            {niches.map((n) => (
              <button
                key={n}
                onClick={() => setNicheFilter(prev => toggleSet(prev, n))}
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
        )}

        {/* Moneda — multi-select */}
        {currencies.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Moneda</span>
            <button
              onClick={() => setCurrencyFilter(new Set())}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                currencyFilter.size === 0
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              Todas
            </button>
            {currencies.map((c) => (
              <button
                key={c}
                onClick={() => setCurrencyFilter(prev => toggleSet(prev, c))}
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
        )}

        {/* Count + clear */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
          </span>
          {hasActiveFilters && (
            <button
              onClick={() => { setNicheFilter(new Set()); setCurrencyFilter(new Set()); setDateFilter(0) }}
              className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[40px_56px_1fr_72px_56px_80px_130px_100px_72px] items-center gap-6 border-b border-border bg-secondary/30 px-6 py-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <div>#</div>
        <div />
        <button
          onClick={() => handleSort('productTitle')}
          className="group/th flex items-center gap-1 hover:text-foreground transition-colors"
        >
          Producto <SortIcon column="productTitle" sort={sort} />
        </button>
        <button
          onClick={() => handleSort('productPrice')}
          className="group/th flex items-center gap-1 hover:text-foreground transition-colors"
        >
          Precio <SortIcon column="productPrice" sort={sort} />
        </button>
        <button
          onClick={() => handleSort('performanceScore')}
          className="group/th flex items-center justify-center gap-1 hover:text-foreground transition-colors"
        >
          Score <SortIcon column="performanceScore" sort={sort} />
        </button>
        <div className="text-center">Tendencia (7d)</div>
        <button
          onClick={() => handleSort('growthPct')}
          className="group/th flex items-center gap-1 hover:text-foreground transition-colors"
        >
          Crecimiento <SortIcon column="growthPct" sort={sort} />
        </button>
        <button
          onClick={() => handleSort('currentRank')}
          className="group/th flex items-center gap-1 hover:text-foreground transition-colors"
        >
          Contexto <SortIcon column="currentRank" sort={sort} />
        </button>
        <div className="text-center">Acción</div>
      </div>
      <div className="divide-y divide-border/50 px-2">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay productos que coincidan con los filtros.
          </p>
        ) : (
          filtered.map((winner, i) => (
            <PoolWinnerRow
              key={winner.candidateId}
              winner={winner}
              position={page * 20 + i + 1}
              preferredCurrency={preferredCurrency}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {onPageChange && data && (data.totalPages ?? 1) > 1 && (
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
            {Array.from({ length: data.totalPages ?? 1 }, (_, i) => i).map((p) => (
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
            ))}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= (data.totalPages ?? 1) - 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* bottom padding when no pagination */}
      {!(onPageChange && data && (data.totalPages ?? 1) > 1) && (
        <div className="pb-4" />
      )}
    </div>
  )
}

// ─── sub-components ───────────────────────────────────────────────────────────


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

function PoolWinnerRow({ winner, position, preferredCurrency }: {
  winner: PoolWinnerProduct
  position: number
  preferredCurrency: string | null
}) {
  const isFirst = position === 1

  const rh = winner.rankHistory
  const prevRank = rh && rh.length >= 2 ? rh[rh.length - 2] : (winner.previousRank ?? null)
  const rankDelta = prevRank != null && winner.currentRank != null ? prevRank - winner.currentRank : null
  const rankDir = rankDelta !== null && rankDelta !== 0
    ? (rankDelta > 0 ? 'up' : 'down')
    : winner.growthPct != null && winner.growthPct > 1 ? 'up'
    : winner.growthPct != null && winner.growthPct < -1 ? 'down'
    : null

  const gp = winner.growthPct
  const total = winner.storeProductCount
  const superadoPct = winner.currentRank != null && total && total > 0
    ? Math.max(0, Math.round(((total - winner.currentRank) / total) * 100))
    : null
  const subColor = superadoPct == null ? ''
    : superadoPct <= 25 ? 'text-rose-500'
    : superadoPct <= 50 ? 'text-amber-600'
    : superadoPct <= 75 ? 'text-green-700'
    : 'text-emerald-600'
  const subText = gp == null ? null
    : gp > 1 && superadoPct != null
      ? { text: `↑ superó al ${superadoPct}% del catálogo`, color: subColor }
    : gp < -1
      ? { text: '↓ bajando en tienda', color: 'text-rose-500' }
    : null

  const topPct = winner.currentRank != null && total && total > 0
    ? Math.min(100, Math.max(1, Math.round((winner.currentRank / total) * 100)))
    : null
  const barFill = topPct != null ? Math.max(1, 100 - topPct) : 0
  const tier = topPct != null
    ? topPct <= 10 ? { color: 'bg-emerald-500', labelColor: 'text-emerald-500', label: 'Winner' }
    : topPct <= 25 ? { color: 'bg-emerald-400', labelColor: 'text-emerald-400', label: 'Strong' }
    : topPct <= 50 ? { color: 'bg-yellow-400',  labelColor: 'text-yellow-400',  label: 'Mid'    }
    : topPct <= 75 ? { color: 'bg-orange-400',  labelColor: 'text-orange-400',  label: 'Low'    }
    :                { color: 'bg-rose-500',    labelColor: 'text-rose-500',    label: 'Weak'   }
    : null

  return (
    <div className={cn(
      'grid grid-cols-[40px_56px_1fr_72px_56px_80px_130px_100px_72px] items-center gap-6 px-6 py-3 transition-colors hover:bg-secondary/30',
      isFirst && 'bg-amber-500/5',
    )}>
      {/* # */}
      <div className="flex items-center justify-center">
        {isFirst
          ? <Crown className="h-4 w-4 text-amber-500" />
          : position <= 3
          ? <span className={cn('text-sm leading-none', position === 2 ? 'text-slate-400' : 'text-amber-700')}>★</span>
          : <span className="text-xs font-bold text-muted-foreground">#{position}</span>}
      </div>

      {/* Image */}
      <HoverImagePreview
        src={winner.productImage}
        fallback={winner.productTitle.charAt(0)}
        proxy
      />

      {/* Producto + rank */}
      <div className="min-w-0 pl-2">
        <Link
          href={`/tracker/${winner.candidateId}?storeId=${winner.storeId}&from=pool`}
          className="line-clamp-2 text-sm font-semibold leading-snug text-foreground hover:text-primary hover:underline transition-colors"
        >
          {winner.productTitle}
        </Link>
        {winner.currentRank != null && (
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground tabular-nums">
              Rank #{winner.currentRank}
            </span>
            {rankDir && (
              <span className={cn(
                'inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[11px] font-bold tabular-nums',
                rankDir === 'up' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-500',
              )}>
                {rankDir === 'up' ? '↑' : '↓'}
                {rankDelta !== null ? Math.abs(rankDelta) : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Precio */}
      <div>
        <FormattedPrice
          amount={winner.productPrice}
          originalCurrency={winner.currency}
          preferredCurrency={preferredCurrency ?? 'USD'}
          compact
        />
      </div>

      {/* Score */}
      <div className="flex items-center justify-center">
        <ScoreRing score={winner.performanceScore} size="sm" showLabel={false} confidence={winner.signalConfidence} />
      </div>

      {/* Tendencia sparkline */}
      <div className="flex justify-center">
        {(() => {
          const h = (winner.growthHistory ?? []).slice(-7)
          return h.length >= 2
            ? <Sparkline data={h} width={80} height={32} />
            : <span className="text-[10px] text-muted-foreground/30">—</span>
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

      {/* Acción */}
      <div className="flex items-center justify-center">
        <Link
          href={`/tracker/${winner.candidateId}?storeId=${winner.storeId}&from=pool`}
          className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Ver <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
