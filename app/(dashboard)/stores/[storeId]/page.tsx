'use client'

import { Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'

import { useGetStoresQuery } from '@/app/(dashboard)/stores/services/storeApi'
import { useGetTrackerCandidatesQuery, useGetPoolWinnersQuery } from '@/app/(dashboard)/services/dashboardApi'
import type { TrackerCandidate } from '@/app/(dashboard)/types'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { PerformanceBadge } from '@/components/dashboard/performance-badge'
import { Sparkline } from '@/components/tracker/sparkline'
import { AdsCell } from '@/components/tracker/tracker-table'
import {
  ArrowLeft, ExternalLink, CheckCircle, XCircle,
  Clock, Target, Zap, TrendingUp, BarChart3, Store, Megaphone,
} from 'lucide-react'
import { resolveDisplayLabel } from '@/lib/label-utils'
import { StoreVideosGrid } from '@/components/tracker/product-ads'
import { useGetAdvertiserPagesQuery } from '@/app/(dashboard)/stores/services/storeApi'

export default function StoreDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24 text-sm text-muted-foreground">Cargando…</div>}>
      <StoreDetailContent />
    </Suspense>
  )
}


function StoreDetailContent() {
  const { storeId } = useParams<{ storeId: string }>()
  const router = useRouter()
  const { data: stores } = useGetStoresQuery()
  const store = stores?.find(s => s.storeId === storeId)

  const { data: allCandidates = [], isLoading: loadingCandidates } =
    useGetTrackerCandidatesQuery({ storeId })

  // Para StoreVideosGrid usamos candidatos del pool (Explorar testeos)
  // filtrados por dominio — esos sí tienen ads scrapeados
  const { data: poolData } = useGetPoolWinnersQuery({ size: 500 })
  const storeDomain = store?.baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '') ?? ''
  const videoCandidates = (poolData?.winners ?? [])
    .filter(w => storeDomain && w.baseUrl?.includes(storeDomain)) as unknown as TrackerCandidate[]

  if (!store && stores) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
        <Store className="h-10 w-10 opacity-30" />
        <p className="text-sm">Tienda no encontrada.</p>
        <button onClick={() => router.push('/stores')} className="text-xs text-primary hover:underline">
          ← Volver a tiendas
        </button>
      </div>
    )
  }

  const sorted = [...allCandidates].sort((a, b) => (b.performanceScore ?? 0) - (a.performanceScore ?? 0))
  const top5 = sorted.slice(0, 5)

  const domain = store?.baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '') ?? ''
  const faviconUrl = domain ? `https://icons.duckduckgo.com/ip3/${domain}.ico` : null

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">

      {/* Back */}
      <Link href="/stores" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Volver a tiendas
      </Link>

      {/* Store header card */}
      {store && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="bg-gradient-to-r from-primary/5 via-transparent to-transparent p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-center gap-4">
                {/* Logo */}
                <StoreLogo storeName={store.storeName} faviconUrl={faviconUrl} />

                {/* Info */}
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{store.storeName}</h1>
                  <a
                    href={store.baseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {domain}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {store.currency && (
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {store.currency}
                      </span>
                    )}
                    {store.niche && (
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        {store.niche}
                      </span>
                    )}
                    {store.pagoAnticipado && (
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                        Pago anticipado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-col items-end gap-1.5">
                <div className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                  store.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground',
                )}>
                  {store.isActive
                    ? <><CheckCircle className="h-3 w-3" />Activa</>
                    : <><XCircle className="h-3 w-3" />Pausada</>
                  }
                </div>
                {store.inactivityTier && store.inactivityTier !== 'ACTIVA' && (
                  <div className={cn(
                    'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                    store.inactivityTier === 'MODERADA' && 'bg-yellow-500/10 text-yellow-600',
                    store.inactivityTier === 'INACTIVA' && 'bg-orange-500/10 text-orange-600',
                    store.inactivityTier === 'ZOMBIE'   && 'bg-red-500/10 text-red-500',
                  )}>
                    {store.inactivityTier}
                  </div>
                )}
                {store.lastScrapedAt && (
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatLastScraped(store.lastScrapedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
                <Target className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground tabular-nums">{allCandidates.length}</p>
                <p className="text-xs text-muted-foreground">En testeo</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                <Zap className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground tabular-nums">
                  {allCandidates.filter(c => (c.growthPct ?? 0) > 10).length}
                </p>
                <p className="text-xs text-muted-foreground">En alza (&gt;+10%)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground tabular-nums">
                  {allCandidates.length > 0
                    ? `~${Math.round(allCandidates.reduce((s, c) => s + (c.performanceScore ?? 0), 0) / allCandidates.length)}`
                    : '—'
                  }
                </p>
                <p className="text-xs text-muted-foreground">Score promedio</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Páginas anunciantes en Meta */}
      <AdvertiserPagesSection storeId={storeId} />

      {/* Videos de la tienda */}
      {videoCandidates.length > 0 && (
        <StoreVideosGrid candidates={videoCandidates} />
      )}

      {/* Top 5 productos */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Top 5 productos</h2>
        </div>

        {loadingCandidates ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        ) : top5.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-12 text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Sin productos en testeo aún</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {top5.map((c, idx) => (
                <div
                  key={c.candidateId}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/tracker/${c.candidateId}?storeId=${c.storeId}&from=tracker`)}
                  onKeyDown={e => { if (e.key === 'Enter') router.push(`/tracker/${c.candidateId}?storeId=${c.storeId}&from=tracker`) }}
                  className="grid grid-cols-[28px_52px_1fr_100px_70px_140px_52px_52px] cursor-pointer items-center gap-4 border-b border-border/50 px-5 py-3 transition-colors last:border-0 hover:bg-secondary/30"
                >
                  {/* Rank */}
                  <span className={cn(
                    'text-center text-xs font-bold tabular-nums',
                    idx === 0 && 'text-yellow-500',
                    idx === 1 && 'text-slate-400',
                    idx === 2 && 'text-orange-500',
                    idx > 2 && 'text-muted-foreground',
                  )}>
                    #{idx + 1}
                  </span>

                  {/* Image */}
                  {c.productImage ? (
                    <img src={c.productImage} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-secondary" />
                  )}

                  {/* Title */}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{c.productTitle}</p>
                    {c.currentRank && (
                      <p className="text-[10px] text-muted-foreground">Rank #{c.currentRank}</p>
                    )}
                  </div>

                  {/* Performance badge */}
                  <div><PerformanceBadge label={resolveDisplayLabel(c.performanceLabel, c.performanceScore, c.growthPct, c.daysElapsed, c.scoreHistory, c.growthHistory)} size="sm" /></div>

                  {/* Sparkline */}
                  <div className="flex justify-center">
                    {(c.growthHistory ?? []).length >= 2
                      ? <Sparkline data={(c.growthHistory ?? []).slice(-7)} width={64} height={28} />
                      : <span className="text-[10px] text-muted-foreground/30">—</span>
                    }
                  </div>

                  {/* ADS — stopPropagation prevents row navigation on ad click */}
                  <div onClick={e => e.stopPropagation()}>
                    <AdsCell candidateId={c.candidateId} />
                  </div>

                  {/* Growth */}
                  <span className={cn(
                    'text-center text-xs font-bold tabular-nums',
                    (c.growthPct ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-500',
                  )}>
                    {c.growthPct != null ? `${c.growthPct > 0 ? '+' : ''}${c.growthPct.toFixed(1)}%` : '—'}
                  </span>

                  {/* Score */}
                  <ScoreRing score={c.performanceScore ?? 0} size="sm" showLabel={false} />
                </div>
            ))}
          </div>
        )}
      </div>

      {/* Todos los productos activos */}
      {allCandidates.length > 5 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Todos los productos en testeo</h2>
            <span className="text-xs text-muted-foreground">{allCandidates.length} productos</span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {sorted.slice(5).map((c, idx) => (
              <div
                key={c.candidateId}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/tracker/${c.candidateId}?storeId=${c.storeId}&from=tracker`)}
                onKeyDown={e => { if (e.key === 'Enter') router.push(`/tracker/${c.candidateId}?storeId=${c.storeId}&from=tracker`) }}
                className="grid grid-cols-[28px_52px_1fr_100px_70px_140px_52px_52px] cursor-pointer items-center gap-4 border-b border-border/50 px-5 py-3 transition-colors last:border-0 hover:bg-secondary/30"
              >
                {/* Rank */}
                <span className="text-center text-xs font-bold tabular-nums text-muted-foreground">
                  #{idx + 6}
                </span>

                {/* Image */}
                {c.productImage ? (
                  <img src={c.productImage} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-secondary" />
                )}

                {/* Title */}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{c.productTitle}</p>
                  {c.currentRank && (
                    <p className="text-[10px] text-muted-foreground">Rank #{c.currentRank}</p>
                  )}
                </div>

                {/* Performance badge */}
                <div><PerformanceBadge label={resolveDisplayLabel(c.performanceLabel, c.performanceScore, c.growthPct, c.daysElapsed, c.scoreHistory, c.growthHistory)} size="sm" /></div>

                {/* Sparkline */}
                <div className="flex justify-center">
                  {(c.growthHistory ?? []).length >= 2
                    ? <Sparkline data={(c.growthHistory ?? []).slice(-7)} width={64} height={28} />
                    : <span className="text-[10px] text-muted-foreground/30">—</span>
                  }
                </div>

                {/* ADS — stopPropagation prevents row navigation on ad click */}
                <div onClick={e => e.stopPropagation()}>
                  <AdsCell candidateId={c.candidateId} />
                </div>

                {/* Growth */}
                <span className={cn(
                  'text-center text-xs font-bold tabular-nums',
                  (c.growthPct ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-500',
                )}>
                  {c.growthPct != null ? `${c.growthPct > 0 ? '+' : ''}${c.growthPct.toFixed(1)}%` : '—'}
                </span>

                {/* Score */}
                <ScoreRing score={c.performanceScore ?? 0} size="sm" showLabel={false} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Advertiser pages section ─────────────────────────────────────────────────

function AdvertiserPagesSection({ storeId }: { storeId: string }) {
  const { data: pages = [], isLoading } = useGetAdvertiserPagesQuery(storeId)

  if (isLoading) return null
  if (pages.length === 0) return null

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Páginas anunciantes en Meta</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {pages.map((p) => (
          <a
            key={p.pageName}
            href={p.pageId ? `https://www.facebook.com/${p.pageId}` : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm transition-colors',
              p.pageId ? 'hover:border-primary/40 hover:bg-primary/5 cursor-pointer' : 'cursor-default',
            )}
          >
            {/* Meta "f" logo */}
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-[10px] font-bold text-white">f</span>
            <span className="font-medium text-foreground">{p.pageName}</span>
            {p.totalAds != null && (
              <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground tabular-nums">
                {p.totalAds.toLocaleString()} ads
              </span>
            )}
            {p.pageId && <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/50" />}
          </a>
        ))}
      </div>
    </div>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatLastScraped(dateStr: string) {
  const diffHours = Math.round((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60))
  if (diffHours < 1) return 'Justo ahora'
  if (diffHours < 24) return `Hace ${diffHours}h`
  return `Hace ${Math.floor(diffHours / 24)}d`
}

function StoreLogo({ storeName, faviconUrl }: { storeName: string; faviconUrl: string | null }) {
  const initials = storeName.slice(0, 2).toUpperCase()
  if (!faviconUrl) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
        {initials}
      </div>
    )
  }
  return (
    <img
      src={faviconUrl}
      alt=""
      className="h-14 w-14 shrink-0 rounded-2xl bg-secondary object-contain p-1"
      onError={(e) => {
        const el = e.currentTarget
        el.replaceWith(Object.assign(document.createElement('div'), {
          className: 'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary',
          textContent: initials,
        }))
      }}
    />
  )
}
