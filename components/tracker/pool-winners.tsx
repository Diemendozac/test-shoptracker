'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { Lock, TrendingUp, Crown, ChevronLeft, ChevronRight, Globe, X, ZoomIn } from 'lucide-react'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { Sparkline } from '@/components/tracker/sparkline'
import { Button } from '@/components/ui/button'
import { cn, fmtCompact } from '@/lib/utils'
import { convertCurrency, currencySymbol } from '@/lib/currency'
import { useCurrency } from '@/store/hooks'
import { useGetStoresQuery } from '@/app/(dashboard)/stores/services/storeApi'
import type { PoolWinnersResponse, PoolWinnerProduct } from '@/app/(dashboard)/types'
import type { PoolPreset } from '@/app/(dashboard)/pool/page'

interface PoolWinnersSectionProps {
  data: PoolWinnersResponse | undefined
  isLoading?: boolean
  page?: number
  onPageChange?: (page: number) => void
  preset?: PoolPreset
}

export function PoolWinnersSection({ data, isLoading, page = 0, onPageChange, preset = 'all' }: PoolWinnersSectionProps) {
  const { currency: preferredCurrency } = useCurrency()
  const { data: stores } = useGetStoresQuery()
  const storeBaseUrlMap = useMemo(
    () => Object.fromEntries((stores ?? []).map(s => [s.storeId, s.baseUrl])),
    [stores],
  )
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
      <div className="grid grid-cols-[40px_72px_1fr_72px_56px_80px_130px_100px_72px] items-center gap-6 border-b border-border bg-secondary/30 px-6 py-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <div>#</div>
        <div />
        <div>Producto</div>
        <div>Precio</div>
        <div className="text-center">Score</div>
        <div className="text-center">Tendencia (7d)</div>
        <div>Crecimiento</div>
        <div>Contexto</div>
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
              storeBaseUrl={storeBaseUrlMap[winner.storeId] ?? ''}
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

function PoolWinnerRow({ winner, position, preferredCurrency, storeBaseUrl }: {
  winner: PoolWinnerProduct
  position: number
  preferredCurrency: string | null
  storeBaseUrl: string
}) {
  const isFirst = position === 1
  const sym = currencySymbol(preferredCurrency ?? winner.currency ?? 'USD')

  // gallery state
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [images, setImages] = useState<string[] | null>(null)
  const [galleryIdx, setGalleryIdx] = useState(0)

  // extract handle from productUrl  e.g. "/products/some-handle"
  const handle = winner.productUrl?.split('/products/')[1]?.split('?')[0] ?? null

  const openGallery = () => {
    setGalleryIdx(0)
    setGalleryOpen(true)
    if (images !== null) return
    if (handle && storeBaseUrl) {
      fetch(`/api/product-images?baseUrl=${encodeURIComponent(storeBaseUrl)}&handle=${encodeURIComponent(handle)}`)
        .then(r => r.json())
        .then(({ images: imgs }) => setImages(imgs?.length > 0 ? imgs : winner.productImage ? [winner.productImage] : []))
        .catch(() => setImages(winner.productImage ? [winner.productImage] : []))
    } else {
      setImages(winner.productImage ? [winner.productImage] : [])
    }
  }

  const closeGallery = useCallback(() => setGalleryOpen(false), [])
  const galleryPrev = useCallback(() => setGalleryIdx(i => images ? (i - 1 + images.length) % images.length : 0), [images])
  const galleryNext = useCallback(() => setGalleryIdx(i => images ? (i + 1) % images.length : 0), [images])

  useEffect(() => {
    if (!galleryOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeGallery()
      if (e.key === 'ArrowLeft') galleryPrev()
      if (e.key === 'ArrowRight') galleryNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [galleryOpen, closeGallery, galleryPrev, galleryNext])

  return (
    <>
    {galleryOpen && images !== null && images.length > 0 && (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90"
        onClick={closeGallery}
      >
        <div
          className="relative flex items-center justify-center"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={galleryPrev}
            className="absolute -left-14 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <img
            src={images[galleryIdx]}
            alt={winner.productTitle}
            className="max-h-[70vh] max-w-[80vw] rounded-xl object-contain"
          />
          <button
            onClick={galleryNext}
            className="absolute -right-14 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        {images.length > 1 && (
          <div className="mt-4 flex items-center gap-2" onClick={e => e.stopPropagation()}>
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setGalleryIdx(i)}
                className={cn(
                  'h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                  i === galleryIdx ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80',
                )}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <button
          onClick={closeGallery}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <p className="absolute bottom-4 text-sm text-white/60">{galleryIdx + 1} / {images.length}</p>
      </div>
    )}

    <div className={cn(
      'grid grid-cols-[40px_72px_1fr_72px_56px_80px_130px_100px_72px] items-center gap-6 px-6 py-3 transition-colors hover:bg-secondary/30',
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
      <button onClick={openGallery} className="relative group h-[56px] w-[56px] shrink-0 overflow-hidden rounded-xl cursor-zoom-in">
        {winner.productImage ? (
          <img src={winner.productImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary text-lg font-bold text-muted-foreground">
            {winner.productTitle.charAt(0)}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="h-4 w-4 text-white" />
        </div>
      </button>

      {/* Producto + rank */}
      <div className="min-w-0 pl-2">
        <Link
          href={`/tracker/${winner.candidateId}?storeId=${winner.storeId}&from=pool`}
          className="line-clamp-2 text-sm font-semibold leading-snug text-foreground hover:text-primary hover:underline transition-colors"
        >
          {winner.productTitle}
        </Link>
        {winner.currentRank != null && (
          <span className="mt-1 block text-[11px] text-muted-foreground tabular-nums">
            Rank #{winner.currentRank}
          </span>
        )}
      </div>

      {/* Precio */}
      <div>
        {winner.productPrice != null ? (
          <span className="text-xs font-semibold text-primary tabular-nums">
            {sym}{fmtCompact(convertCurrency(winner.productPrice, winner.currency, preferredCurrency))}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground/40">—</span>
        )}
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
      {(() => {
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
        return (
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
        )
      })()}

      {/* Contexto bar — rank-based, igual que tracker table */}
      {(() => {
        const total = winner.storeProductCount
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
      })()}

      {/* Acción */}
      <div className="flex items-center justify-center">
        <Link
          href={`/tracker/${winner.candidateId}?storeId=${winner.storeId}&from=pool`}
          className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Ver
        </Link>
      </div>
    </div>
    </>
  )
}
