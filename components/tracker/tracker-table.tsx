'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import Link from 'next/link'
import { cn, fmtCompact } from '@/lib/utils'
import { FormattedPrice } from '@/components/ui/formatted-price'
import { useCurrency } from '@/store/hooks'
import { Sparkline } from '@/components/tracker/sparkline'
import type { TrackerCandidate } from '@/app/(dashboard)/types'
import type { Ad } from '@/components/tracker/product-ads'
import {
  ExternalLink, ArrowUpDown, ArrowUp, ArrowDown,
  Search, X, SlidersHorizontal, Trash2, ChevronLeft, ChevronRight, Star, Lock,
} from 'lucide-react'
import { ShareButton } from '@/components/tracker/pool-winners'
import { useRemoveCandidateMutation } from '@/app/(dashboard)/services/candidateApi'
import { dashboardApi, useGetProductAdsQuery } from '@/app/(dashboard)/services/dashboardApi'
import { usePlanTier } from '@/lib/view-as'
import { FloatingVideoPanel, useHoverPanel, AdvertiserBadge, uniqueAdvertisersFromAds, isTestAd } from '@/components/tracker/product-ads'
import { HoverImagePreview } from '@/components/ui/image-preview'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { resolveDisplayLabel, isScalable } from '@/lib/label-utils'
import { applyScoreDecay } from '@/lib/score-decay'
import {
  spike, unspike, syncScores,
  computeSpikeState, computeSpikeLevel,
  type SpikeEntry,
} from '@/lib/spike-store'
import { SpikeOverlay } from '@/components/tracker/spike-overlay'

// ─── AdsCell — columna inline de anuncios con floating panel ─────────────────

const PLACEHOLDER = 'https://picsum.photos/seed/placeholder/400/700'

function AdThumb({
  ad, canViewAds, allowMetaLink, onHover, onLeave,
}: {
  ad: Ad
  canViewAds: boolean
  allowMetaLink: boolean
  onHover: (ad: Ad, rect: DOMRect) => void
  onLeave: () => void
}) {
  const thumbRef = useRef<HTMLDivElement>(null)
  const hasVideo = !!ad.video_url_r2
  return (
    <div
      ref={thumbRef}
      className={cn(
        'relative h-[48px] w-[34px] shrink-0 overflow-hidden rounded-md bg-secondary',
        canViewAds ? 'cursor-pointer' : 'pointer-events-none blur-sm',
      )}
      onMouseEnter={() => {
        if (canViewAds && thumbRef.current)
          onHover(ad, thumbRef.current.getBoundingClientRect())
      }}
      onMouseLeave={onLeave}
      onClick={() => allowMetaLink && window.open(ad.ad_snapshot_url, '_blank', 'noopener,noreferrer')}
    >
      <img
        src={ad.thumbnail_url || PLACEHOLDER}
        alt=""
        className="h-full w-full object-cover"
      />
      {hasVideo && canViewAds && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black/50">
            <svg className="h-2.5 w-2.5 translate-x-px text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}

export function AdsCell({ candidateId }: { candidateId: string }) {
  const { data } = useGetProductAdsQuery(candidateId)
  const { hoveredAd, hoverPos, handleHover, handleLeave, handlePanelEnter, handlePanelLeave } = useHoverPanel()
  const { canViewAds, allowMetaLink } = usePlanTier()

  const active = data?.ads.filter(a => a.status === 'active' && !isTestAd(a)) ?? []
  if (active.length === 0) {
    const advertisers = uniqueAdvertisersFromAds(data?.ads.filter(a => !isTestAd(a)) ?? [])
    const placeholder = (
      <div style={{ display: 'flex', gap: 3 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 34, height: 48, borderRadius: 6,
            border: '1px dashed var(--color-border)',
            opacity: 0.4,
          }} />
        ))}
      </div>
    )
    if (advertisers.length === 0) return placeholder
    return (
      <div className="flex flex-col gap-1.5">
        {placeholder}
        <div className="flex flex-wrap gap-1">
          {advertisers.map(name => (
            <AdvertiserBadge key={name} advertiserName={name} allowMetaLink={allowMetaLink} />
          ))}
        </div>
      </div>
    )
  }

  const deduped = [...new Map(
    active.map(a => [(a.thumbnail_url ?? a.video_url_r2 ?? a.ad_snapshot_url ?? '').split('?')[0], a])
  ).values()]
  const previews          = deduped.slice(0, 3)
  const remaining         = deduped.length - 3
  const uniqueAdvertisers = uniqueAdvertisersFromAds(active)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        {previews.map(ad => (
          <AdThumb
            key={ad.id}
            ad={ad}
            canViewAds={canViewAds}
            allowMetaLink={allowMetaLink}
            onHover={handleHover}
            onLeave={handleLeave}
          />
        ))}
        {remaining > 0 && (
          <span className="text-xs font-semibold tabular-nums text-muted-foreground">
            +{remaining}
          </span>
        )}
      </div>
      {uniqueAdvertisers.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {uniqueAdvertisers.slice(0, 2).map(name => (
            <AdvertiserBadge
              key={name}
              advertiserName={name}
              allowMetaLink={allowMetaLink}
            />
          ))}
          {uniqueAdvertisers.length > 2 && (
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
              +{uniqueAdvertisers.length - 2}
            </span>
          )}
        </div>
      )}
      {hoveredAd && canViewAds && (
        <FloatingVideoPanel
          ad={hoveredAd} top={hoverPos.top} left={hoverPos.left}
          onMouseEnter={handlePanelEnter} onMouseLeave={handlePanelLeave}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function countryFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return ''
  const base = 0x1F1E6 - 65
  return String.fromCodePoint(base + code.charCodeAt(0)) +
         String.fromCodePoint(base + code.charCodeAt(1))
}

function getPageRange(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  if (current <= 3) return [0, 1, 2, 3, 4, 'ellipsis', total - 1]
  if (current >= total - 4) return [0, 'ellipsis', total - 5, total - 4, total - 3, total - 2, total - 1]
  return [0, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total - 1]
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey =
  | 'productTitle' | 'storeName' | 'productPrice'
  | 'performanceScore' | 'growthPct'
  | 'daysElapsed'
type SortDir = 'asc' | 'desc'
interface SortState { key: SortKey | null; dir: SortDir }
interface TrackerTableProps {
  candidates: TrackerCandidate[]
  windowDays?: number
  favorites: Set<string>
  onToggleFavorite: (id: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SortIcon({ column, sort }: { column: SortKey; sort: SortState }) {
  if (sort.key !== column)
    return <ArrowUpDown className="h-3 w-3 opacity-30 transition-opacity group-hover/th:opacity-70" />
  return sort.dir === 'asc'
    ? <ArrowUp className="h-3 w-3 text-primary-text" />
    : <ArrowDown className="h-3 w-3 text-primary-text" />
}

function contextTier(topPct: number) {
  // Escala de un solo tono: verde para el cuarto superior, neutro para el resto
  if (topPct <= 10) return { color: 'bg-success',  labelColor: 'text-success-foreground', label: 'Winner' }
  if (topPct <= 25) return { color: 'bg-success',  labelColor: 'text-success-foreground', label: 'Strong' }
  if (topPct <= 50) return { color: 'bg-subtle-foreground/60', labelColor: 'text-muted-foreground', label: 'Mid' }
  if (topPct <= 75) return { color: 'bg-subtle-foreground/60', labelColor: 'text-muted-foreground', label: 'Low' }
  return               { color: 'bg-subtle-foreground/60', labelColor: 'text-muted-foreground', label: 'Weak' }
}

function ContextBar({ rank, total }: { rank: number | null; total?: number | null }) {
  const topPct = rank != null && total && total > 0
    ? Math.min(100, Math.max(1, Math.round((rank / total) * 100)))
    : null
  const barFill = topPct != null ? Math.max(1, 100 - topPct) : 0
  const tier = topPct != null ? contextTier(topPct) : null
  return (
    <div className="space-y-1 w-full">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-score-track">
        <div
          className={cn('h-full rounded-full transition-all duration-500', tier?.color ?? 'bg-score-track')}
          style={{ width: `${barFill}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs tabular-nums text-muted-foreground">
          {topPct != null ? `top ${topPct}%` : '—'}
        </span>
        {tier && (
          <span className={cn('text-xs font-semibold', tier.labelColor)}>{tier.label}</span>
        )}
      </div>
      {total != null && total > 0 && (
        <span className="text-xs tabular-nums text-subtle-foreground">
          de {total} productos
        </span>
      )}
    </div>
  )
}

// Prueba gratis: puede testear candidatos, pero no ve la data calculada
// (score, tendencia, % crecimiento) — ese es el gancho de upgrade en Mis testeos.
function LockedMetric({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <div className="pointer-events-none select-none blur-[3px] opacity-60">{children}</div>
      <Lock className="absolute h-3 w-3 text-muted-foreground" />
    </div>
  )
}

const PAGE_SIZE = 20

// ─── Component ────────────────────────────────────────────────────────────────

export function TrackerTable({ candidates, windowDays = 0, favorites, onToggleFavorite }: TrackerTableProps) {
  const { currency: preferredCurrency } = useCurrency()
  const { canViewTrackerMetrics } = usePlanTier()
  const dispatch = useDispatch()
  const [removeCandidate] = useRemoveCandidateMutation()
  const displayDays = windowDays === 30 ? 30 : 7

  const [sort, setSort] = useState<SortState>({ key: 'performanceScore', dir: 'desc' })
  const [search, setSearch] = useState('')
  const [storeFilter, setStoreFilter] = useState<string>('all')
  const [nicheFilter, setNicheFilter] = useState<string>('all')
  const [currencyFilter, setCurrencyFilter] = useState<string>('all')
  const [countryFilter, setCountryFilter] = useState<string>('all')
  const [paFilter, setPaFilter] = useState<string>('all')
  const [spikeFilter, setSpikeFilter] = useState(false)
  const [hideDormant, setHideDormant] = useState(true)
  const [page, setPage] = useState(0)
  const [spikes, setSpikes] = useState<Record<string, SpikeEntry>>({})

  useEffect(() => {
    setSpikes(syncScores(candidates))
  }, [candidates])

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

  const countries = useMemo(
    () => ['all', ...Array.from(new Set(candidates.map(c => c.storeCountry).filter(Boolean) as string[])).sort()],
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
    if (countryFilter !== 'all') result = result.filter(c => c.storeCountry === countryFilter)
    if (paFilter === 'yes') result = result.filter(c => !!c.pagoAnticipado)
    if (paFilter === 'no')  result = result.filter(c => !c.pagoAnticipado)
    if (spikeFilter)      result = result.filter(c => isScalable(c.performanceScore, c.signalConfidence))
    if (hideDormant)      result = result.filter(c => !((c.performanceScore ?? 0) < 15 && c.daysElapsed > 14))
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
  }, [candidates, search, storeFilter, nicheFilter, currencyFilter, countryFilter, paFilter, spikeFilter, hideDormant, sort])

  const hasActiveFilters =
    !!search || storeFilter !== 'all' || nicheFilter !== 'all' ||
    currencyFilter !== 'all' || countryFilter !== 'all' || paFilter !== 'all' || spikeFilter || !hideDormant

  function clearFilters() {
    setSearch(''); setStoreFilter('all'); setNicheFilter('all')
    setCurrencyFilter('all'); setCountryFilter('all'); setPaFilter('all'); setSpikeFilter(false); setHideDormant(true)
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
            placeholder="Buscar producto…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="relative">
          <select value={storeFilter} onChange={e => { setStoreFilter(e.target.value); resetPage() }}
            className="h-9 appearance-none rounded-lg border border-input bg-card px-3 pr-8 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
            {stores.map(s => <option key={s} value={s}>{s === 'all' ? 'Todas las tiendas' : s}</option>)}
          </select>
          <SlidersHorizontal className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>

        {niches.length > 1 && (
          <select value={nicheFilter} onChange={e => { setNicheFilter(e.target.value); resetPage() }}
            className="h-9 appearance-none rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
            <option value="all">Todos los nichos</option>
            {niches.filter(n => n !== 'all').map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        )}

        {currencies.length > 1 && (
          <select value={currencyFilter} onChange={e => { setCurrencyFilter(e.target.value); resetPage() }}
            className="h-9 appearance-none rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
            <option value="all">Todas las monedas</option>
            {currencies.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {countries.length > 1 && (
          <select value={countryFilter} onChange={e => { setCountryFilter(e.target.value); resetPage() }}
            className="h-9 appearance-none rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
            <option value="all">Todos los países</option>
            {countries.filter(c => c !== 'all').map(c => (
              <option key={c} value={c}>{countryFlag(c)} {c}</option>
            ))}
          </select>
        )}

        <select value={paFilter} onChange={e => { setPaFilter(e.target.value); resetPage() }}
          className="h-9 appearance-none rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
          <option value="all">Pago: Todos</option>
          <option value="yes">Pago anticipado</option>
          <option value="no">Contraentrega</option>
        </select>

        <button
          onClick={() => { setSpikeFilter(f => !f); resetPage() }}
          className={cn(
            'h-9 rounded-lg border px-3 text-xs font-medium transition-all',
            spikeFilter
              ? 'border-primary-border bg-primary-subtle text-primary-text'
              : 'border-input bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          ↑ Spikear
        </button>

        <button
          onClick={() => { setHideDormant(f => !f); resetPage() }}
          className={cn(
            'h-9 rounded-lg border px-3 text-xs font-medium transition-all',
            hideDormant
              ? 'border-primary-border bg-primary-subtle text-primary-text'
              : 'border-input bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          Solo activos
        </button>

        <select
          value={
            sort.key === 'daysElapsed' && sort.dir === 'asc' ? 'recent'
            : sort.key === 'daysElapsed' && sort.dir === 'desc' ? 'oldest'
            : 'relevance'
          }
          onChange={e => {
            if (e.target.value === 'recent')      setSort({ key: 'daysElapsed', dir: 'asc' })
            else if (e.target.value === 'oldest') setSort({ key: 'daysElapsed', dir: 'desc' })
            else                                  setSort({ key: 'performanceScore', dir: 'desc' })
          }}
          className="h-9 appearance-none rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
          <option value="relevance">Ordenar: Relevancia</option>
          <option value="recent">Más recientes</option>
          <option value="oldest">Más antiguos</option>
        </select>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex h-9 items-center gap-1.5 rounded-lg border border-input bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <X className="h-3 w-3" /> Clear
          </button>
        )}

        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {processed.length} of {candidates.length} results
        </span>
      </div>

      {/* ── Table ── */}
      <div>
        {/* Header */}
        <div className="grid grid-cols-[24px_56px_minmax(0,1fr)_104px_64px_48px_80px_104px_104px_128px_148px] items-center gap-2.5 px-4 pb-2 text-xs font-medium text-muted-foreground">
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
          <div>Ads</div>
          <div className="text-center">Acción</div>
        </div>

        {/* Body */}
        <div className="space-y-2">
          {processed.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-muted-foreground shadow-card">
              <Search className="h-8 w-8 text-subtle-foreground" />
              <p className="text-sm">Ningún producto coincide con tus filtros</p>
              <button onClick={clearFilters} className="text-xs underline underline-offset-2 hover:text-foreground transition-colors">
                Limpiar filtros
              </button>
            </div>
          ) : (
            pagedItems.map((candidate, idx) => {
              const idx_abs = page * PAGE_SIZE + idx
              // Rank delta vs ayer: penúltimo valor del rankHistory
              const rh = candidate.rankHistory
              const prevRank = rh && rh.length >= 2 ? rh[rh.length - 2] : null
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

              // Un solo tono: el % de arriba ya dice si es bueno o malo
              const subColor = 'text-muted-foreground'

              const subText: { text: string; color: string } | null = gp == null ? null
                : gp > 1 && superadoPct != null
                  ? { text: `↑ superó al ${superadoPct}% de ${candidate.storeName}`, color: subColor }
                : gp < -1
                  ? { text: '↓ bajando en tienda', color: 'text-danger-foreground' }
                : null

              const score = applyScoreDecay(
                candidate.performanceScore,
                candidate.rankHistory ?? [],
                candidate.daysElapsed,
              )

              return (
                <div
                  key={candidate.candidateId}
                  className="rounded-xl border border-border bg-card shadow-card transition-[border-color,box-shadow] hover:border-border-hover hover:shadow-card-hover"
                >
                <div className="grid grid-cols-[24px_56px_minmax(0,1fr)_104px_64px_48px_80px_104px_104px_128px_148px] items-center gap-2.5 px-4 py-3">
                  {/* # */}
                  <button
                    onClick={() => onToggleFavorite(candidate.candidateId)}
                    title={favorites.has(candidate.candidateId) ? 'Quitar favorito' : 'Marcar favorito'}
                    className="flex w-full items-center justify-center"
                  >
                    <Star className={cn(
                      'h-3.5 w-3.5 transition-colors',
                      favorites.has(candidate.candidateId)
                        ? 'fill-warning text-warning'
                        : 'text-subtle-foreground hover:text-warning',
                    )} />
                  </button>

                  {/* Image */}
                  {(() => {
                    const spikeEntry = spikes[String(candidate.candidateId)]
                    const spikeState = computeSpikeState(spikeEntry, candidate.performanceScore ?? 0)
                    const spikeLevel = computeSpikeLevel(spikeEntry, candidate.performanceScore ?? 0)
                    return (
                      <div className="relative" style={{ width: 56, height: 56, flexShrink: 0 }}>
                        <SpikeOverlay state={spikeState} level={spikeLevel} size={56}>
                          <HoverImagePreview src={candidate.productImage} fallback={candidate.productTitle.charAt(0)} size={56} proxy />
                        </SpikeOverlay>
                        {candidate.storeCountry && (
                          <span className="pointer-events-none absolute -bottom-1 -right-1 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-card text-[13px] leading-none shadow-sm ring-1 ring-border">
                            {countryFlag(candidate.storeCountry)}
                          </span>
                        )}
                      </div>
                    )
                  })()}

                  {/* Producto */}
                  <div className="min-w-0 pl-1">
                    <div className="flex min-w-0">
                      <Link
                        href={`/tracker/${candidate.candidateId}?storeId=${candidate.storeId}&from=tracker`}
                        className="truncate text-sm font-semibold text-foreground transition-colors hover:text-primary-text hover:underline"
                      >
                        {candidate.productTitle}
                      </Link>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {candidate.currentRank != null ? `Rank #${candidate.currentRank}` : 'Sin rank'}
                      </span>
                      {rankDir && (
                        <span className={cn(
                          'inline-flex items-center gap-0.5 rounded-md px-1 text-xs font-semibold tabular-nums',
                          rankDir === 'up'
                            ? 'bg-success-subtle text-success-foreground'
                            : 'bg-danger-subtle text-danger-foreground',
                        )}>
                          {rankDir === 'up' ? '↑' : '↓'}
                          {rankDelta !== null ? Math.abs(rankDelta) : ''}
                        </span>
                      )}
                      {isScalable(candidate.performanceScore, candidate.signalConfidence) && (() => {
                        const id = String(candidate.candidateId)
                        const isSpiked = !!spikes[id]
                        return isSpiked ? (
                          <button
                            onClick={() => {
                              unspike(id)
                              setSpikes(prev => { const n = { ...prev }; delete n[id]; return n })
                            }}
                            className="shrink-0 rounded-full border border-primary-border bg-primary-subtle px-2 py-px text-xs font-semibold text-primary-text transition-colors hover:border-danger-border hover:bg-danger-subtle hover:text-danger-foreground"
                          >
                            Spikeando ✕
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              spike(id, candidate.performanceScore ?? 0)
                              setSpikes(prev => ({
                                ...prev,
                                [id]: { spike_floor: candidate.performanceScore ?? 0, last_score: candidate.performanceScore ?? 0, spiked_at: new Date().toISOString() },
                              }))
                            }}
                            className="shrink-0 rounded-full border border-primary-border bg-primary-subtle px-2 py-px text-xs font-semibold text-primary-text transition-colors hover:bg-primary-border"
                          >
                            Spikear
                          </button>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Tienda */}
                  <div className="min-w-0 text-center">
                    <span className="block truncate rounded-md border border-border bg-secondary px-2 py-1 text-xs font-medium text-foreground">
                      {candidate.storeName}
                    </span>
                    {candidate.storeProductCount != null && candidate.storeProductCount > 0 && (
                      <span className="mt-0.5 block text-xs text-muted-foreground tabular-nums">
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
                    {(() => {
                      const content = score > 0 ? (
                        <ScoreRing
                          score={score}
                          label={resolveDisplayLabel(candidate.performanceLabel, candidate.performanceScore, candidate.growthPct, candidate.daysElapsed, candidate.scoreHistory, candidate.growthHistory)}
                          size="sm"
                          showLabel={false}
                        />
                      ) : (
                        <span className="text-xs text-subtle-foreground">—</span>
                      )
                      return canViewTrackerMetrics ? content : <LockedMetric>{content}</LockedMetric>
                    })()}
                  </div>

                  {/* Tendencia */}
                  <div className="flex justify-center">
                    {(() => {
                      const history = (candidate.growthHistory ?? candidate.scoreHistory ?? []).slice(-displayDays)
                      const content = history.length >= 2
                        ? <Sparkline data={history} width={80} height={32} />
                        : <span className="text-xs text-subtle-foreground">—</span>
                      return canViewTrackerMetrics ? content : <LockedMetric>{content}</LockedMetric>
                    })()}
                  </div>

                  {/* Crecimiento */}
                  <div>
                    {(() => {
                      const content = (
                        <>
                          <span className={cn(
                            'block text-sm font-semibold tabular-nums',
                            gp == null ? 'text-subtle-foreground' : gp >= 0 ? 'text-success-foreground' : 'text-danger-foreground',
                          )}>
                            {gp != null ? `${gp >= 0 ? '+' : ''}${gp.toFixed(1)}%` : '—'}
                          </span>
                          {subText && (
                            <span className={cn('mt-0.5 block text-xs leading-4', subText.color)}>
                              {subText.text}
                            </span>
                          )}
                        </>
                      )
                      return canViewTrackerMetrics ? content : <LockedMetric>{content}</LockedMetric>
                    })()}
                  </div>

                  {/* Contexto */}
                  <ContextBar rank={candidate.currentRank} total={candidate.storeProductCount} />

                  {/* Ads */}
                  <div className="self-start">
                    <AdsCell candidateId={candidate.candidateId} />
                  </div>

                  {/* Acción */}
                  <div className="flex items-center justify-center gap-1.5 self-start">
                    <Link
                      href={`/tracker/${candidate.candidateId}?storeId=${candidate.storeId}`}
                      className="flex items-center gap-1 rounded-lg border border-input bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      Ver
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <ShareButton candidateId={candidate.candidateId} />
                    <button
                      onClick={async () => {
                        if (confirm(`¿Eliminar "${candidate.productTitle}"?`)) {
                          await removeCandidate(candidate.candidateId)
                          dispatch(dashboardApi.util.invalidateTags(['Tracker', 'Overview']))
                        }
                      }}
                      className="rounded-lg p-1.5 text-subtle-foreground transition-colors hover:bg-danger-subtle hover:text-danger-foreground"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 pt-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, processed.length)} de {processed.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {getPageRange(page, totalPages).map((p, idx) =>
              p === 'ellipsis' ? (
                <span key={`e${idx}`} className="flex h-7 w-5 items-center justify-center text-xs text-muted-foreground select-none">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md border text-xs font-medium transition-colors',
                    p === page
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {p + 1}
                </button>
              )
            )}
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
