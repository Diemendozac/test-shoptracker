'use client'

import { useState, useMemo } from 'react'
import { Lock, TrendingUp, Crown, ChevronLeft, ChevronRight, Globe } from 'lucide-react'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { PerformanceBadge } from '@/components/dashboard/performance-badge'
import { Sparkline } from '@/components/tracker/sparkline'
import { Button } from '@/components/ui/button'
import { HoverImagePreview } from '@/components/ui/image-preview'
import { cn, fmtCompact, fmtUnits } from '@/lib/utils'
import type { PoolWinnersResponse, PoolWinnerProduct } from '@/app/(dashboard)/types'
import type { PoolPreset } from '@/app/(dashboard)/pool/page'

const PL_S1_CONS = 13.3785
const PL_ALPHA   = 2.1598
function plEst(rank: number | null | undefined): number {
  if (!rank || rank <= 0) return 0
  return PL_S1_CONS * Math.pow(rank, -PL_ALPHA)
}

interface PoolWinnersSectionProps {
  data: PoolWinnersResponse | undefined
  isLoading?: boolean
  page?: number
  onPageChange?: (page: number) => void
  preset?: PoolPreset
}

export function PoolWinnersSection({ data, isLoading, page = 0, onPageChange, preset = 'all' }: PoolWinnersSectionProps) {
  const [nicheFilter, setNicheFilter] = useState('all')
  const [currencyFilter, setCurrencyFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<7 | 30 | 0>(0)

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
    if (preset === 'rising')          r = r.filter((w) => w.performanceLabel === 'Rising')
    if (preset === 'pago_anticipado') r = r.filter((w) => w.pagoAnticipado === true)
    if (preset === 'top_score')       r = [...r].sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 20)
    if (preset === 'new')             r = r.filter((w) => w.daysElapsed <= 7)
    // Chip filters
    if (dateFilter > 0)            r = r.filter((w) => w.daysElapsed <= dateFilter)
    if (nicheFilter !== 'all')     r = r.filter((w) => w.niche === nicheFilter)
    if (currencyFilter !== 'all')  r = r.filter((w) => w.currency === currencyFilter)
    return r
  }, [winners, preset, dateFilter, nicheFilter, currencyFilter])

  const hasActiveFilters = nicheFilter !== 'all' || currencyFilter !== 'all' || dateFilter > 0

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
          {([0, 7, 30] as const).map((d) => (
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
              {d === 0 ? 'Todos' : d === 7 ? 'Últimos 7d' : 'Últimos 30d'}
            </button>
          ))}
        </div>

        {/* Categorías / nicho */}
        {niches.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Categoría</span>
            {['all', ...niches].map((n) => (
              <button
                key={n}
                onClick={() => setNicheFilter(n)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                  nicheFilter === n
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                )}
              >
                {n === 'all' ? 'Todas' : n}
              </button>
            ))}
          </div>
        )}

        {/* Moneda */}
        {currencies.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Moneda</span>
            {['all', ...currencies].map((c) => (
              <button
                key={c}
                onClick={() => setCurrencyFilter(c)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                  currencyFilter === c
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                )}
              >
                {c === 'all' ? 'Todas' : c}
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
              onClick={() => { setNicheFilter('all'); setCurrencyFilter('all'); setDateFilter(0) }}
              className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[28px_72px_1fr_150px_72px_80px_80px_72px_56px_72px] items-center gap-4 border-b border-border px-6 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <div>#</div>
        <div />
        <div>Producto</div>
        <div>Tienda</div>
        <div className="text-center">~Ventas/d</div>
        <div className="text-center">~Ingr./d</div>
        <div className="text-center">Tendencia</div>
        <div className="text-center">Crecimiento</div>
        <div className="text-center">Score</div>
        <div className="text-center">Estado</div>
      </div>
      <div className="divide-y divide-border/50 px-2">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay productos que coincidan con los filtros.
          </p>
        ) : (
          filtered.map((winner, i) => (
            <PoolWinnerRow key={winner.candidateId} winner={winner} position={page * 20 + i + 1} />
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

function PoolWinnerRow({ winner, position }: { winner: PoolWinnerProduct; position: number }) {
  const isFirst = position === 1
  const uds = winner.estUnitsDayLow ?? plEst(winner.currentRank)
  const rev = winner.estRevDayLow ?? (winner.productPrice != null && uds > 0 ? uds * winner.productPrice : 0)
  return (
    <div className={cn(
      'grid grid-cols-[28px_72px_1fr_150px_72px_80px_80px_72px_56px_72px] items-center gap-4 px-6 py-3 transition-colors hover:bg-secondary/30',
      isFirst && 'bg-amber-500/5',
    )}>
      {/* Position */}
      <div className="flex items-center justify-center">
        {isFirst
          ? <Crown className="h-4 w-4 text-amber-500" />
          : <span className="text-xs font-bold text-muted-foreground">#{position}</span>}
      </div>

      {/* Image with hover preview */}
      <HoverImagePreview
        src={winner.productImage}
        fallback={winner.productTitle.charAt(0)}
      />

      {/* Product info */}
      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {winner.productTitle}
        </p>
        {winner.productPrice != null && (
          <p className="mt-1 text-xs font-medium text-primary">
            ${winner.productPrice.toLocaleString('es-CO')}
          </p>
        )}
        {winner.currentRank && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">Rank #{winner.currentRank}</p>
        )}
      </div>

      {/* Store */}
      <div className="min-w-0">
        <span className="block truncate rounded-md bg-secondary px-2 py-1 text-[11px] font-medium text-muted-foreground">
          {winner.storeName}
        </span>
      </div>

      {/* Est. ventas/día */}
      <div className="text-center">
        {uds >= 0.01 ? (
          <span className="text-sm font-semibold tabular-nums text-foreground">
            ~{fmtUnits(uds)}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground/30">—</span>
        )}
        <p className="text-[9px] text-muted-foreground/50">uds/d</p>
      </div>

      {/* Est. ingresos/día */}
      <div className="text-center">
        {rev > 0 ? (
          <span className="text-sm font-semibold tabular-nums text-emerald-500">
            ~${fmtCompact(rev)}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground/30">—</span>
        )}
        <p className="text-[9px] text-muted-foreground/50">p5</p>
      </div>

      {/* Sparkline */}
      <div className="flex justify-center">
        {(() => {
          const h = (winner.growthHistory ?? []).slice(-7)
          return h.length >= 2
            ? <Sparkline data={h} width={72} height={32} />
            : <span className="text-[10px] text-muted-foreground/30">—</span>
        })()}
      </div>

      {/* Growth % */}
      <div className="text-center">
        <span className={cn(
          'text-sm font-bold tabular-nums',
          winner.growthPct != null && winner.growthPct > 0 ? 'text-emerald-600' : 'text-rose-500',
        )}>
          {winner.growthPct != null
            ? `${winner.growthPct > 0 ? '+' : ''}${winner.growthPct.toFixed(1)}%`
            : '—'}
        </span>
      </div>

      {/* Score ring */}
      <div className="flex justify-center">
        <ScoreRing score={winner.performanceScore} size="sm" showLabel={false} confidence={winner.signalConfidence} />
      </div>

      {/* Status */}
      <div className="flex justify-center">
        <PerformanceBadge label={winner.performanceLabel} size="sm" />
      </div>
    </div>
  )
}
