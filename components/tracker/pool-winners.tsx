'use client'

import { useState, useMemo } from 'react'
import { Lock, Globe, TrendingUp, Crown, ChevronLeft, ChevronRight } from 'lucide-react'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { PerformanceBadge } from '@/components/dashboard/performance-badge'
import { Sparkline } from '@/components/tracker/sparkline'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PoolWinnersResponse, PoolWinnerProduct } from '@/app/(dashboard)/types'

interface PoolWinnersSectionProps {
  data: PoolWinnersResponse | undefined
  isLoading?: boolean
  page?: number
  onPageChange?: (page: number) => void
}

export function PoolWinnersSection({ data, isLoading, page = 0, onPageChange }: PoolWinnersSectionProps) {
  const [nicheFilter, setNicheFilter] = useState('all')
  const [currencyFilter, setCurrencyFilter] = useState('all')
  const [paFilter, setPaFilter] = useState('all')

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
    if (nicheFilter !== 'all') r = r.filter((w) => w.niche === nicheFilter)
    if (currencyFilter !== 'all') r = r.filter((w) => w.currency === currencyFilter)
    if (paFilter !== 'all') r = r.filter((w) => (paFilter === 'yes') === !!w.pagoAnticipado)
    return r
  }, [winners, nicheFilter, currencyFilter, paFilter])

  const selectCls = 'h-8 appearance-none rounded-lg border border-border bg-secondary/40 px-3 text-xs text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer'

  if (isLoading) {
    return (
      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-5 w-5 animate-pulse rounded bg-secondary" />
          <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
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
        <SectionHeader />
        <p className="mt-4 text-sm text-muted-foreground">
          El pool aún no tiene candidatos suficientes. Vuelve mañana después del sync automático.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="px-6 pt-5 pb-0">
      <SectionHeader count={data?.total ?? filtered.length} />

      </div>{/* /header wrapper */}

      {/* Column headers */}
      <div className="mt-3 grid grid-cols-[28px_40px_1fr_80px_64px_64px_48px_64px] items-center gap-3 border-b border-border px-6 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <div>#</div>
        <div />
        <div>Producto</div>
        <div>Tienda</div>
        <div className="text-center">Tendencia</div>
        <div className="text-center">Crecimiento</div>
        <div className="text-center">Score</div>
        <div className="text-center">Estado</div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/50 bg-secondary/20 px-6 py-2">
        {niches.length > 0 && (
          <select value={nicheFilter} onChange={(e) => setNicheFilter(e.target.value)} className={selectCls}>
            <option value="all">Todos los nichos</option>
            {niches.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        )}
        {currencies.length > 0 && (
          <select value={currencyFilter} onChange={(e) => setCurrencyFilter(e.target.value)} className={selectCls}>
            <option value="all">Todas las monedas</option>
            {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <select value={paFilter} onChange={(e) => setPaFilter(e.target.value)} className={selectCls}>
          <option value="all">Pago anticipado: Todos</option>
          <option value="yes">Solo pago anticipado</option>
        </select>
        {(nicheFilter !== 'all' || currencyFilter !== 'all' || paFilter !== 'all') && (
          <button
            onClick={() => { setNicheFilter('all'); setCurrencyFilter('all'); setPaFilter('all') }}
            className="ml-auto text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Limpiar filtros
          </button>
        )}
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

function SectionHeader({ count }: { count?: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Pool de Testeos</h2>
        {count !== undefined && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            {count} productos
          </span>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground">Señales más fuertes del pool</span>
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

function PoolWinnerRow({
  winner,
  position,
}: {
  winner: PoolWinnerProduct
  position: number
}) {
  const isFirst = position === 1
  return (
    <div
      className={cn(
        'grid grid-cols-[28px_40px_1fr_80px_64px_64px_48px_64px] items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/20',
        isFirst ? 'bg-amber-500/5' : ''
      )}
    >
      {/* position */}
      <div className="flex items-center justify-center">
        {isFirst ? (
          <Crown className="h-4 w-4 text-amber-500" />
        ) : (
          <span className="text-xs font-bold text-muted-foreground">#{position}</span>
        )}
      </div>

      {/* image */}
      {winner.productImage ? (
        <img
          src={winner.productImage}
          alt=""
          className="h-10 w-10 rounded-lg object-cover"
        />
      ) : (
        <div className="h-10 w-10 rounded-lg bg-secondary" />
      )}

      {/* product title */}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{winner.productTitle}</p>
        {winner.currentRank && (
          <span className="text-[10px] text-muted-foreground">Rank #{winner.currentRank}</span>
        )}
      </div>

      {/* store */}
      <div className="min-w-0">
        <span className="block truncate rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {winner.storeName}
        </span>
      </div>

      {/* sparkline — growth */}
      <div className="flex justify-center">
        {(() => {
          const history = (winner.growthHistory ?? []).slice(-7)
          return history.length >= 2
            ? <Sparkline data={history} width={64} height={28} />
            : <span className="text-[10px] text-muted-foreground/30">—</span>
        })()}
      </div>

      {/* growth % */}
      <div className="text-center">
        <span
          className={cn(
            'text-xs font-semibold tabular-nums',
            winner.growthPct != null && winner.growthPct > 0 ? 'text-emerald-500' : 'text-rose-500'
          )}
        >
          {winner.growthPct != null
            ? `${winner.growthPct > 0 ? '+' : ''}${winner.growthPct.toFixed(1)}%`
            : '—'}
        </span>
      </div>

      {/* score ring */}
      <div className="flex justify-center">
        <ScoreRing
          score={winner.performanceScore}
          size="sm"
          showLabel={false}
          confidence={winner.signalConfidence}
        />
      </div>

      {/* status badge */}
      <div className="flex justify-center">
        <PerformanceBadge label={winner.performanceLabel} size="sm" />
      </div>
    </div>
  )
}
