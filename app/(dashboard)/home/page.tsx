'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { convertCurrency, currencySymbol } from '@/lib/currency'
import { useCurrency } from '@/store/hooks'
import { useGetStoreOverviewQuery, useGetTrackerCandidatesQuery, useGetPoolWinnersQuery, useGetProductAdsQuery } from '../services/dashboardApi'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { PerformanceBadge } from '@/components/dashboard/performance-badge'
import { FloatingVideoPanel, useHoverPanel, isTestAd, type Ad } from '@/components/tracker/product-ads'
import { usePlanTier } from '@/lib/view-as'
import type { PoolWinnerProduct } from '../types'
import {
  Search, Store, Target, Zap,
  ArrowRight, Flame, BarChart3, Globe, FlaskConical, Clock, Package, TrendingUp, TrendingDown,
} from 'lucide-react'
import { DropspyIcon } from '@/components/ui/dropspy-logo'
import { resolveDisplayLabel } from '@/lib/label-utils'

// ─── Ranked video product card — imagen+info a la izquierda, carrusel de video
// grande a la derecha. Si el candidato no tiene video-ads activos no se
// renderiza nada (ni la card): "si no tiene video no mostrar el producto".
// Mirrors the "siempre sin blur en contexto pool" rule from pool-winners.tsx
// (CHANGE-082): en Ranking de productos más vendidos los videos se muestran sin
// blur para todos los planes; solo el clic a Meta queda gateado por allowMetaLink.

function ProductVideoThumb({
  ad, allowMetaLink, onHover, onLeave,
}: {
  ad: Ad
  allowMetaLink: boolean
  onHover: (ad: Ad, rect: DOMRect) => void
  onLeave: () => void
}) {
  const thumbRef = useRef<HTMLDivElement>(null)
  const hasVideo = !!ad.video_url_r2
  return (
    <div
      ref={thumbRef}
      role="button"
      tabIndex={0}
      className={cn(
        'relative h-[240px] w-[135px] shrink-0 overflow-hidden rounded-xl bg-secondary',
        allowMetaLink ? 'cursor-pointer' : 'cursor-default',
      )}
      onMouseEnter={() => { if (thumbRef.current) onHover(ad, thumbRef.current.getBoundingClientRect()) }}
      onMouseLeave={onLeave}
      onClick={() => allowMetaLink && window.open(ad.ad_snapshot_url, '_blank', 'noopener,noreferrer')}
      onKeyDown={e => { if (e.key === 'Enter' && allowMetaLink) window.open(ad.ad_snapshot_url, '_blank', 'noopener,noreferrer') }}
    >
      <img
        src={ad.thumbnail_url || 'https://picsum.photos/seed/placeholder/400/700'}
        alt=""
        className="h-full w-full object-cover"
      />
      {hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
            <svg className="h-5 w-5 translate-x-0.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
      {ad.days_running > 0 && (
        <span className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          {ad.days_running}d
        </span>
      )}
    </div>
  )
}

function RankedVideoProductCard({
  product, idx, sym, preferredCurrency, trackerPriceMap,
}: {
  product: PoolWinnerProduct
  idx: number
  sym: string
  preferredCurrency: string
  trackerPriceMap: Map<string, { price: number | null; currency: string | null }>
}) {
  const { data } = useGetProductAdsQuery(product.candidateId)
  const { allowMetaLink } = usePlanTier()
  const { hoveredAd, hoverPos, handleHover, handleLeave, handlePanelEnter, handlePanelLeave } = useHoverPanel()

  const active = (data?.ads ?? []).filter(a => a.status === 'active' && !isTestAd(a))

  // Todavía cargando — skeleton para no saltar de posición cuando resuelva
  if (!data) {
    return <div className="h-[266px] animate-pulse rounded-2xl border border-border bg-card" />
  }
  // Sin video activo — no se muestra el producto (además del filtro hasVideo del backend)
  if (active.length === 0) return null

  // Dedup by creative — same key pattern used in product-ads.tsx / pool-winners.tsx
  const seen = new Set<string>()
  const deduped = active.filter(ad => {
    const key = (ad.thumbnail_url ?? ad.video_url_r2 ?? ad.id).split('?')[0]
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const tracked = trackerPriceMap.get(product.candidateId)
  const rawPrice = tracked?.price ?? product.productPrice
  const rawCurrency = tracked?.currency ?? product.currency ?? 'USD'
  const displayPrice = rawPrice != null
    ? convertCurrency(rawPrice, rawCurrency, preferredCurrency)
    : null

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-stretch gap-3 p-3">
        {/* Left — rank + imagen + info, compacto */}
        <Link
          href={`/tracker/${product.candidateId}?storeId=${product.storeId}&from=home`}
          className="flex w-[168px] shrink-0 flex-col gap-2 rounded-xl p-1.5 transition-colors hover:bg-secondary/40"
        >
          <div className="flex items-center justify-between">
            <span className={cn(
              'text-sm font-bold tabular-nums',
              idx === 0 && 'text-yellow-500',
              idx === 1 && 'text-slate-400',
              idx === 2 && 'text-orange-500',
              idx > 2 && 'text-muted-foreground',
            )}>
              #{idx + 1}
            </span>
            <ScoreRing score={product.performanceScore} size="sm" showLabel={false} />
          </div>

          {product.productImage ? (
            <img src={product.productImage} alt="" className="h-20 w-20 self-center rounded-xl object-cover" />
          ) : (
            <div className="h-20 w-20 self-center rounded-xl bg-secondary" />
          )}

          <div className="min-w-0 text-center">
            <p className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">
              {product.productTitle}
            </p>
            <div className="mt-1 flex justify-center">
              <span className="max-w-full truncate rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {product.storeName}
              </span>
            </div>
            {displayPrice != null && (
              <p className="mt-1 text-xs font-medium text-muted-foreground tabular-nums">
                {sym}{displayPrice.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
              </p>
            )}
          </div>
        </Link>

        {/* Right — carrusel de video, grande */}
        <div className="min-w-0 flex-1">
          <div className="flex h-full gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {deduped.map(ad => (
              <ProductVideoThumb
                key={ad.id}
                ad={ad}
                allowMetaLink={allowMetaLink}
                onHover={handleHover}
                onLeave={handleLeave}
              />
            ))}
          </div>
        </div>
      </div>

      {hoveredAd && (
        <FloatingVideoPanel
          ad={hoveredAd} top={hoverPos.top} left={hoverPos.left}
          onMouseEnter={handlePanelEnter} onMouseLeave={handlePanelLeave}
        />
      )}
    </div>
  )
}

// ─── Search result types ──────────────────────────────────────────────────────

type SearchResult =
  | { type: 'store';   storeId: string; storeName: string; href: string }
  | { type: 'product'; candidateId: string; productTitle: string; storeName: string; productImage: string | null; storeId: string; href: string }

// ─── Quick actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: TrendingUp,   label: 'Top candidatos',   href: '/tracker',   color: 'text-emerald-600 bg-emerald-500/10' },
  { icon: Globe,        label: 'Explorar pool',     href: '/pool',      color: 'text-blue-600 bg-blue-500/10' },
  { icon: FlaskConical, label: 'Pendientes',        href: '/pendientes',color: 'text-amber-600 bg-amber-500/10' },
  { icon: Store,        label: 'Mis tiendas',       href: '/stores',    color: 'text-violet-600 bg-violet-500/10' },
]

// ─── Home page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const { currency: preferredCurrency } = useCurrency()
  const sym = currencySymbol(preferredCurrency)

  const [query, setQuery]       = useState('')
  const [open, setOpen]         = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const wrapperRef              = useRef<HTMLDivElement>(null)

  const { data: overview = [] } = useGetStoreOverviewQuery()
  const { data: tracker = [] } = useGetTrackerCandidatesQuery({})
  const { data: poolData } = useGetPoolWinnersQuery({ page: 0, size: 10 })
  // Ranking de productos más vendidos: solo candidatos con video-ads activo
  // (filtro hasVideo del backend, ya usado en /pool) — "si no tiene video no
  // mostrar el producto". Query aparte para no vaciar las sugerencias del buscador.
  const { data: videoPoolData } = useGetPoolWinnersQuery({ page: 0, size: 5, hasVideo: true })

  const topProducts = poolData?.locked ? [] : (poolData?.winners ?? [])
  const topVideoProducts = videoPoolData?.locked ? [] : (videoPoolData?.winners ?? [])
  const activeStores = overview.length

  // Tracker price is more current than pool snapshot — prefer it when available
  const trackerPriceMap = useMemo(() => {
    const m = new Map<string, { price: number | null; currency: string | null }>()
    for (const c of tracker) m.set(c.candidateId, { price: c.productPrice, currency: c.currency })
    return m
  }, [tracker])

  // ── Insights calculados desde Mis testeos ───────────────────────────────────
  const trackerInsights = useMemo(() => {
    type InsightItem = { message: string; cta: string; ctaPath: string; icon: React.ElementType; variant: 'default' | 'success' | 'warning' | 'danger' }
    const items: InsightItem[] = []

    const scalable = tracker.filter(c => (c.performanceScore ?? 0) >= 60 && c.signalConfidence >= 0.5)
    const rising   = tracker.filter(c =>
      resolveDisplayLabel(c.performanceLabel, c.performanceScore, c.growthPct, c.daysElapsed, c.scoreHistory, c.growthHistory) === 'Rising'
    )
    const declining = tracker.filter(c =>
      resolveDisplayLabel(c.performanceLabel, c.performanceScore, c.growthPct, c.daysElapsed, c.scoreHistory, c.growthHistory) === 'Declining'
    )
    const newProducts = tracker.filter(c => c.daysElapsed <= 3)
    const withPago    = tracker.filter(c => c.pagoAnticipado === true)

    if (scalable.length > 0) items.push({
      message: scalable.length === 1
        ? `Tienes 1 producto listo para escalar`
        : `Tienes ${scalable.length} productos listos para escalar`,
      cta: 'Ver productos', ctaPath: '/tracker', icon: Zap, variant: 'success',
    })

    if (rising.length > 0) items.push({
      message: rising.length === 1
        ? `1 de tus productos está en ascenso`
        : `${rising.length} de tus productos están en ascenso`,
      cta: 'Ver análisis', ctaPath: '/tracker', icon: TrendingUp, variant: 'success',
    })

    if (declining.length > 0) items.push({
      message: declining.length === 1
        ? `1 producto tuyo está bajando — considera pausar el testeo`
        : `${declining.length} productos tuyos están bajando`,
      cta: 'Ver tendencia', ctaPath: '/tracker', icon: TrendingDown, variant: 'danger',
    })

    if (newProducts.length > 0) items.push({
      message: newProducts.length === 1
        ? `1 producto nuevo detectado esta semana`
        : `${newProducts.length} productos nuevos detectados esta semana`,
      cta: 'Ver nuevos', ctaPath: '/tracker', icon: Package, variant: 'default',
    })

    if (withPago.length > 0) items.push({
      message: withPago.length === 1
        ? `1 producto con pago anticipado confirmado`
        : `${withPago.length} productos con pago anticipado confirmado`,
      cta: 'Ver productos', ctaPath: '/tracker', icon: Target, variant: 'default',
    })

    if (tracker.length > 0) items.push({
      message: `${tracker.length} productos en seguimiento activo`,
      cta: 'Ver todos', ctaPath: '/tracker', icon: BarChart3, variant: 'default',
    })

    return items
  }, [tracker])

  // ── Autocomplete suggestions ────────────────────────────────────────────────
  const suggestions = useMemo((): SearchResult[] => {
    const q = query.toLowerCase().trim()
    if (!q) return []

    const storeResults: SearchResult[] = overview
      .filter(s => s.storeName.toLowerCase().includes(q))
      .slice(0, 3)
      .map(s => ({ type: 'store', storeId: s.storeId, storeName: s.storeName, href: `/stores/${s.storeId}` }))

    const poolProducts = topProducts.map(p => ({
      candidateId: p.candidateId,
      productTitle: p.productTitle,
      storeName:    p.storeName,
      productImage: p.productImage,
      storeId:      p.storeId,
    }))
    const trackerProducts = tracker.map(c => ({
      candidateId: c.candidateId,
      productTitle: c.productTitle,
      storeName:    c.storeName,
      productImage: c.productImage,
      storeId:      c.storeId,
    }))
    const seen = new Set<string>()
    const allProducts = [...trackerProducts, ...poolProducts].filter(p => {
      if (seen.has(p.candidateId)) return false
      seen.add(p.candidateId)
      return true
    })

    const productResults: SearchResult[] = allProducts
      .filter(c => c.productTitle.toLowerCase().includes(q))
      .slice(0, 6)
      .map(c => ({
        type: 'product',
        candidateId: c.candidateId,
        productTitle: c.productTitle,
        storeName:    c.storeName,
        productImage: c.productImage,
        storeId:      c.storeId,
        href:         `/tracker/${c.candidateId}?storeId=${c.storeId}&from=home`,
      }))

    return [...storeResults, ...productResults].slice(0, 8)
  }, [query, overview, tracker, topProducts])

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setActiveIdx(-1)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (activeIdx >= 0 && suggestions[activeIdx]) {
      router.push(suggestions[activeIdx].href)
      setOpen(false)
    } else if (query.trim()) {
      router.push(`/stores?q=${encodeURIComponent(query.trim())}`)
      setOpen(false)
    }
    setActiveIdx(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIdx(-1)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative border-b border-border bg-gradient-to-br from-primary/5 via-background to-background px-6 pb-10 pt-14">
        {/* background glow — clipped locally so dropdown isn't cut off */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <DropspyIcon size={32} className="text-foreground" />
            <span className="text-xl font-bold leading-none tracking-tight text-foreground"
              style={{ fontFamily: 'var(--font-outfit, var(--font-inter, sans-serif))' }}>
              dropspy
            </span>
          </div>

          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
            Tu radar de productos ganadores
          </h1>
          <p className="mb-8 text-base text-muted-foreground">
            Detecta productos en tendencia antes que tu competencia. <span className="text-primary font-medium">{activeStores} tiendas</span> monitoreadas en tiempo real.
          </p>

          {/* Search bar + autocomplete */}
          <div ref={wrapperRef} className="relative">
            <form onSubmit={handleSearch}>
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm ring-1 ring-transparent transition-all focus-within:border-primary focus-within:ring-primary/20">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  value={query}
                  onChange={e => { setQuery(e.target.value); setOpen(true); setActiveIdx(-1) }}
                  onFocus={() => setOpen(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Busca una tienda o producto a rastrear…"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            {/* Dropdown */}
            {open && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
                {suggestions.map((r, i) => (
                  <Link
                    key={r.type === 'store' ? r.storeId : r.candidateId}
                    href={r.href}
                    onPointerDown={e => e.preventDefault()}
                    onClick={() => { setOpen(false); setQuery(''); setActiveIdx(-1) }}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 text-left transition-colors',
                      i < suggestions.length - 1 && 'border-b border-border/50',
                      activeIdx === i ? 'bg-secondary' : 'hover:bg-secondary/60',
                    )}
                  >
                    {/* Icon / thumbnail */}
                    {r.type === 'store' ? (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
                        <Store className="h-4 w-4" />
                      </div>
                    ) : r.productImage ? (
                      <img
                        src={`/api/image-proxy?url=${encodeURIComponent(r.productImage)}`}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                        <Package className="h-4 w-4" />
                      </div>
                    )}

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {r.type === 'store' ? r.storeName : r.productTitle}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {r.type === 'store' ? 'Tienda' : r.storeName}
                      </p>
                    </div>

                    {/* Badge */}
                    <span className={cn(
                      'shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium',
                      r.type === 'store'
                        ? 'bg-violet-500/10 text-violet-600'
                        : 'bg-emerald-500/10 text-emerald-600',
                    )}>
                      {r.type === 'store' ? 'Tienda' : 'Producto'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">

        {/* ── Quick actions ────────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Acceso rápido</h2>
          <div className="grid grid-cols-4 gap-3">
            {QUICK_ACTIONS.map(({ icon: Icon, label, href, color }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:bg-secondary/60"
              >
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-foreground">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Mejores testeos — top 5, imagen grande + carrusel de video ── */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <h2 className="text-sm font-semibold text-foreground">Mejores testeos</h2>
            </div>
            <Link href="/pool" className="flex items-center gap-1 text-xs text-primary hover:underline">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {topVideoProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card py-12 text-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Los top productos aparecerán aquí</p>
              <Link href="/pool" className="text-xs text-primary hover:underline">Explorar pool →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {topVideoProducts.slice(0, 5).map((product, idx) => (
                <RankedVideoProductCard
                  key={product.candidateId}
                  product={product}
                  idx={idx}
                  sym={sym}
                  preferredCurrency={preferredCurrency}
                  trackerPriceMap={trackerPriceMap}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Insights panel ───────────────────────────────────────────── */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Qué hacer ahora</h2>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {trackerInsights.length === 0 ? (
              <div className="col-span-2 rounded-2xl border border-border bg-card px-4 py-6 text-center">
                <Clock className="mx-auto mb-2 h-6 w-6 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">Los insights aparecen después de algunos días de tracking</p>
              </div>
            ) : (
              trackerInsights.slice(0, 6).map((insight, i) => {
                const iconColor =
                  insight.variant === 'success' ? 'text-emerald-500' :
                  insight.variant === 'danger'  ? 'text-red-500' :
                  'text-primary'
                return (
                  <Link
                    key={i}
                    href={insight.ctaPath}
                    className="flex h-[72px] items-center gap-3 overflow-hidden rounded-xl border border-border bg-card px-4 transition-colors hover:bg-secondary/60"
                  >
                    <insight.icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="text-xs leading-snug text-foreground"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {insight.message}
                      </p>
                      <p className="mt-1 text-[10px] font-medium text-primary">{insight.cta} →</p>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
