'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { convertCurrency, currencySymbol } from '@/lib/currency'
import { useCurrency } from '@/store/hooks'
import { useGetStoreOverviewQuery, useGetTrackerCandidatesQuery, useGetPoolWinnersQuery } from '../services/dashboardApi'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { PerformanceBadge } from '@/components/dashboard/performance-badge'
import {
  Search, Store, Target, Zap,
  ArrowRight, Flame, BarChart3, Globe, FlaskConical, Clock, Package, TrendingUp, TrendingDown,
} from 'lucide-react'
import { DropspyIcon } from '@/components/ui/dropspy-logo'
import { resolveDisplayLabel } from '@/lib/label-utils'

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

  const topProducts = poolData?.locked ? [] : (poolData?.winners ?? [])
  const activeStores = overview.length
  const trackingCount = tracker.length
  const risingCount = tracker.filter(c => (c.growthPct ?? 0) > 10).length

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

        {/* ── KPI strip ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Store,   label: 'Tiendas activas',    value: activeStores,   color: 'text-blue-600 bg-blue-500/10' },
            { icon: Target,  label: 'En testeo',          value: trackingCount,  color: 'text-violet-600 bg-violet-500/10' },
            { icon: Zap,     label: 'En alza (>+10%)',    value: risingCount,    color: 'text-emerald-600 bg-emerald-500/10' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4">
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

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

        {/* ── Two-column: top products + insights ─────────────────────── */}
        <div className="grid grid-cols-[1fr_320px] gap-6">

          {/* Top productos del pool */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <h2 className="text-sm font-semibold text-foreground">Ranking de productos más vendidos</h2>
              </div>
              <Link href="/pool" className="flex items-center gap-1 text-xs text-primary hover:underline">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {topProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Los top productos aparecerán aquí</p>
                  <Link href="/pool" className="text-xs text-primary hover:underline">Explorar pool →</Link>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {topProducts.slice(0, 8).map((product, idx) => {
                    const price = product.productPrice != null
                      ? convertCurrency(product.productPrice, product.currency ?? 'USD', preferredCurrency)
                      : null
                    return (
                      <div key={product.candidateId} className="flex h-[72px] items-center gap-3 overflow-hidden px-4 transition-colors hover:bg-secondary/30">
                        {/* Rank — 32px */}
                        <span className={cn(
                          'w-8 shrink-0 text-center text-xs font-bold tabular-nums',
                          idx === 0 && 'text-yellow-500',
                          idx === 1 && 'text-slate-400',
                          idx === 2 && 'text-orange-500',
                          idx > 2 && 'text-muted-foreground',
                        )}>
                          #{idx + 1}
                        </span>

                        {/* Image — 48px */}
                        {product.productImage ? (
                          <img src={product.productImage} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <div className="h-12 w-12 shrink-0 rounded-lg bg-secondary" />
                        )}

                        {/* Info — flex-1 */}
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="truncate whitespace-nowrap text-sm font-medium text-foreground">
                            {product.productTitle}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="max-w-[120px] truncate rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {product.storeName}
                            </span>
                            {product.currentRank && (
                              <span className="shrink-0 text-[10px] text-muted-foreground">#{product.currentRank}</span>
                            )}
                          </div>
                        </div>

                        {/* Price — 100px */}
                        <span className="w-[100px] shrink-0 text-right text-xs font-medium text-muted-foreground tabular-nums">
                          {price != null ? `${sym}${price.toLocaleString('es-CO', { maximumFractionDigits: 0 })}` : ''}
                        </span>

                        {/* Score ring — 48px */}
                        <div className="flex w-12 shrink-0 items-center justify-center">
                          <ScoreRing score={product.performanceScore} size="sm" showLabel={false} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Insights panel */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Qué hacer ahora</h2>
            </div>

            <div className="space-y-2">
              {trackerInsights.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card px-4 py-6 text-center">
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
    </div>
  )
}
