'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { convertCurrency, currencySymbol } from '@/lib/currency'
import { useCurrency } from '@/store/hooks'
import { useGetStoreOverviewQuery, useGetTrackerCandidatesQuery, useGetPoolWinnersQuery, useGetInsightsQuery } from '../services/dashboardApi'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { PerformanceBadge } from '@/components/dashboard/performance-badge'
import {
  Search, TrendingUp, Store, Target, Zap,
  ArrowRight, Flame, BarChart3, Globe, FlaskConical, Clock,
} from 'lucide-react'

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

  const [query, setQuery] = useState('')

  const { data: overview = [] } = useGetStoreOverviewQuery()
  const { data: tracker = [] } = useGetTrackerCandidatesQuery()
  const { data: poolData } = useGetPoolWinnersQuery({ page: 0, size: 10 })
  const { data: insights = [] } = useGetInsightsQuery()

  const topProducts = poolData?.locked ? [] : (poolData?.winners ?? [])
  const activeStores = overview.length
  const trackingCount = tracker.length
  const risingCount = tracker.filter(c => (c.growthPct ?? 0) > 10).length

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/stores?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-background to-background px-6 pb-10 pt-14">
        {/* background glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">ShopTracker</span>
          </div>

          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
            Tu radar de productos ganadores
          </h1>
          <p className="mb-8 text-base text-muted-foreground">
            Detecta productos en tendencia antes que tu competencia. <span className="text-primary font-medium">{activeStores} tiendas</span> monitoreadas en tiempo real.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm ring-1 ring-transparent transition-all focus-within:border-primary focus-within:ring-primary/20">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Busca una tienda o producto a rastrear…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
              />
              <button
                type="submit"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
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
                      <div key={product.candidateId} className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-secondary/30">
                        {/* Rank */}
                        <span className={cn(
                          'w-6 shrink-0 text-center text-xs font-bold tabular-nums',
                          idx === 0 && 'text-yellow-500',
                          idx === 1 && 'text-slate-400',
                          idx === 2 && 'text-orange-500',
                          idx > 2 && 'text-muted-foreground',
                        )}>
                          #{idx + 1}
                        </span>

                        {/* Image */}
                        {product.productImage ? (
                          <img src={product.productImage} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <div className="h-10 w-10 shrink-0 rounded-lg bg-secondary" />
                        )}

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{product.productTitle}</p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {product.storeName}
                            </span>
                            {product.currentRank && (
                              <span className="text-[10px] text-muted-foreground">#{product.currentRank}</span>
                            )}
                          </div>
                        </div>

                        {/* Score */}
                        <div className="shrink-0">
                          <ScoreRing score={product.performanceScore} size="sm" showLabel={false} />
                        </div>

                        {/* Price */}
                        {price != null && (
                          <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
                            {sym}{price.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                          </span>
                        )}
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
              {insights.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card px-4 py-6 text-center">
                  <Clock className="mx-auto mb-2 h-6 w-6 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">Los insights aparecen después de algunos días de tracking</p>
                </div>
              ) : (
                insights.slice(0, 6).map((insight, i) => (
                  <Link
                    key={i}
                    href={insight.ctaPath ?? '/dashboard'}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary/60"
                  >
                    <span className="text-lg leading-none">{insight.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground leading-relaxed">{insight.message}</p>
                      <p className="mt-1 text-[10px] font-medium text-primary">{insight.cta} →</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
