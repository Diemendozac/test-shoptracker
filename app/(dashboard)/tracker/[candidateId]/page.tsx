'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { PageLayout } from '@/components/layout/page-layout'
import { PerformanceBadge } from '@/components/dashboard/performance-badge'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { RankChart } from '@/components/tracker/rank-chart'
import { ScoreChart } from '@/components/tracker/score-chart'
import { useGetCandidateDetailQuery } from '@/app/(dashboard)/services/dashboardApi'
import { useGetStoresQuery } from '@/app/(dashboard)/stores/services/storeApi'
import { useCurrency } from '@/store/hooks'
import { ProductAdsSection } from '@/components/tracker/product-ads'
import { usePlanTier } from '@/lib/view-as'
import { FormattedPrice } from '@/components/ui/formatted-price'
import {
  ArrowLeft, ExternalLink, Calendar, TrendingUp, Target,
  Award, Clock, Zap, AlertCircle, Store,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, ZoomIn,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShareButton } from '@/components/tracker/pool-winners'

// ─── Smart label ─────────────────────────────────────────────────────────────
// Single source of truth for the status label displayed anywhere in this page.
// "Declining" is overridden when the score trajectory is clearly upward, because
// the raw backend label lags one cycle behind the visible rank improvement.

import type { CandidateHistory } from '@/app/(dashboard)/types'
import { resolveDisplayLabel, isScalable } from '@/lib/label-utils'
import { applyScoreDecay, computeDecayFactor, daysSinceLastImprovement } from '@/lib/score-decay'
import { spike, unspike, loadAllSpikes, type SpikeEntry } from '@/lib/spike-store'

function computeSmartLabel(
  entry: CandidateHistory,
  prev: CandidateHistory | null,
  prevPrev: CandidateHistory | null,
): string {
  if (entry.trackingDay <= 2) return 'New'
  if (entry.growthPct === 0 && entry.performanceScore < 5) return 'Watching'

  const label = entry.performanceLabel

  if (label === 'Watching') {
    if (entry.growthPct > 0 && prev != null && prev.growthPct > 0) return 'Rising'
    return label
  }

  if (label === 'Declining') {
    const onUptrend = prev != null && prevPrev != null
      && entry.performanceScore > prev.performanceScore
      && prev.performanceScore > prevPrev.performanceScore
    if (onUptrend) return 'Rising'

    const scoreDrop = prev != null && entry.performanceScore < prev.performanceScore
    const rankWorse = prev != null
      && entry.bestsellerRank != null && prev.bestsellerRank != null
      && entry.bestsellerRank > prev.bestsellerRank
    if (!(scoreDrop && rankWorse)) return 'Watching'
  }

  return label
}

// ─── ProductGallery ───────────────────────────────────────────────────────────

function ProductGallery({ images, productTitle }: { images: string[]; productTitle: string }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState(0)
  const [thumbOffset, setThumbOffset] = useState(0)
  const VISIBLE_THUMBS = 4

  const prev = useCallback(() => setActiveIdx(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setActiveIdx(i => (i + 1) % images.length), [images.length])

  const openLightbox = (idx: number) => { setLightboxIdx(idx); setLightboxOpen(true) }
  const closeLightbox = useCallback(() => setLightboxOpen(false), [])
  const lightboxPrev = useCallback(() => setLightboxIdx(i => (i - 1 + images.length) % images.length), [images.length])
  const lightboxNext = useCallback(() => setLightboxIdx(i => (i + 1) % images.length), [images.length])

  useEffect(() => {
    if (!lightboxOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') lightboxPrev()
      if (e.key === 'ArrowRight') lightboxNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxOpen, closeLightbox, lightboxPrev, lightboxNext])

  // sync thumb strip when active image changes
  useEffect(() => {
    if (activeIdx < thumbOffset) setThumbOffset(activeIdx)
    else if (activeIdx >= thumbOffset + VISIBLE_THUMBS) setThumbOffset(activeIdx - VISIBLE_THUMBS + 1)
  }, [activeIdx, thumbOffset])

  if (images.length === 0) return null

  const canScrollUp = thumbOffset > 0
  const canScrollDown = thumbOffset + VISIBLE_THUMBS < images.length

  return (
    <>
      <div className="flex gap-2 shrink-0">
        {/* Main image */}
        <div
          className="relative group w-52 h-52 rounded-xl overflow-hidden bg-secondary cursor-zoom-in"
          onClick={() => openLightbox(activeIdx)}
        >
          <img
            src={images[activeIdx]}
            alt={productTitle}
            className="w-full h-full object-cover"
          />
          {images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prev() }}
                className="absolute left-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); next() }}
                className="absolute right-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
          <div className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <ZoomIn className="h-3.5 w-3.5" />
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={cn('h-1.5 w-1.5 rounded-full', i === activeIdx ? 'bg-white' : 'bg-white/40')}
                />
              ))}
            </div>
          )}
        </div>

        {/* Vertical thumbnail strip */}
        {images.length > 1 && (
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setThumbOffset(o => Math.max(0, o - 1))}
              disabled={!canScrollUp}
              className="flex h-5 w-10 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <div className="flex flex-col gap-1">
              {images.slice(thumbOffset, thumbOffset + VISIBLE_THUMBS).map((img, relIdx) => {
                const absIdx = thumbOffset + relIdx
                return (
                  <button
                    key={absIdx}
                    onClick={() => setActiveIdx(absIdx)}
                    className={cn(
                      'h-[46px] w-[46px] shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                      absIdx === activeIdx ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100',
                    )}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setThumbOffset(o => Math.min(images.length - VISIBLE_THUMBS, o + 1))}
              disabled={!canScrollDown}
              className="flex h-5 w-10 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          {/* Main lightbox image */}
          <div
            className="relative flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={lightboxPrev}
              className="absolute -left-14 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <img
              src={images[lightboxIdx]}
              alt={productTitle}
              className="max-h-[70vh] max-w-[80vw] rounded-xl object-contain"
            />
            <button
              onClick={lightboxNext}
              className="absolute -right-14 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Lightbox thumbnail strip */}
          {images.length > 1 && (
            <div
              className="mt-4 flex items-center gap-2"
              onClick={e => e.stopPropagation()}
            >
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIdx(i)}
                  className={cn(
                    'h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                    i === lightboxIdx ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80',
                  )}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          <p className="absolute bottom-4 text-sm text-white/60">
            {lightboxIdx + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  )
}

export default function CandidateDetailPage() {
  return (
    <Suspense fallback={
      <PageLayout title="Product Details" description="Deep dive into candidate performance">
        <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">Loading…</div>
      </PageLayout>
    }>
      <CandidateDetailContent />
    </Suspense>
  )
}

function CandidateDetailContent() {
  const searchParams = useSearchParams()
  const { candidateId } = useParams<{ candidateId: string }>()
  const router = useRouter()

  const storeId = searchParams.get('storeId')
  const fromTracker = searchParams.get('from') !== 'pool'
  const { isPro } = usePlanTier()

  const { data: stores } = useGetStoresQuery()
  const store = stores?.find(s => s.storeId === storeId)
  const storeBaseUrl = store?.baseUrl ?? ''
  const storeName = store?.storeName ?? null

  const { data, isLoading, isError } = useGetCandidateDetailQuery(
    { storeId: storeId!, candidateId },
    { skip: !storeId }
  )

  const [productImages, setProductImages] = useState<string[]>([])
  const [spikeEntry, setSpikeEntry] = useState<SpikeEntry | null>(null)

  useEffect(() => {
    setSpikeEntry(loadAllSpikes()[candidateId] ?? null)
  }, [candidateId])

  // Step 1: seed gallery immediately from the known cover image so it always renders
  useEffect(() => {
    if (data?.candidate.productImage && productImages.length === 0) {
      setProductImages([data.candidate.productImage])
    }
  }, [data?.candidate.productImage])  // eslint-disable-line react-hooks/exhaustive-deps

  // Step 2: enhance with full image set from Shopify JSON when store is ready
  useEffect(() => {
    if (!storeBaseUrl || !data?.candidate.productHandle) return
    fetch(`/api/product-images?baseUrl=${encodeURIComponent(storeBaseUrl)}&handle=${encodeURIComponent(data.candidate.productHandle)}`)
      .then(r => r.json())
      .then(({ images }) => { if (images?.length > 0) setProductImages(images) })
      .catch(() => {/* keep the seeded single image */})
  }, [storeBaseUrl, data?.candidate.productHandle])

  const { currency: preferredCurrency } = useCurrency()

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  const buildProductUrl = (rawUrl: string | null, handle: string, baseOverride?: string) => {
    const base = (baseOverride || storeBaseUrl).replace(/\/$/, '')
    if (!rawUrl) return base && handle ? `${base}/products/${handle}` : null
    if (rawUrl.startsWith('http')) return rawUrl
    return base ? `${base}${rawUrl}` : null
  }


  if (!storeId) {
    return (
      <PageLayout title="Product Details" description="Deep dive into candidate performance">
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
          <AlertCircle className="h-10 w-10 opacity-40" />
          <p className="text-sm">Missing store context. Go back and open this product from the Tracker.</p>
          <Button variant="outline" size="sm" onClick={() => router.push('/tracker')}>
            Back to Tracker
          </Button>
        </div>
      </PageLayout>
    )
  }

  if (isLoading) {
    return (
      <PageLayout title="Product Details" description="Deep dive into candidate performance">
        <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
          Loading…
        </div>
      </PageLayout>
    )
  }

  if (isError || !data) {
    return (
      <PageLayout title="Product Details" description="Deep dive into candidate performance">
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
          <AlertCircle className="h-10 w-10 opacity-40" />
          <p className="text-sm">Could not load product details.</p>
          <Button variant="outline" size="sm" onClick={() => router.push('/tracker')}>
            Back to Tracker
          </Button>
        </div>
      </PageLayout>
    )
  }

  const { candidate, summary, history } = data

  // Temporal decay: penalise score when rank hasn't improved recently
  const rankHistoryFromEntries = history.map(h => h.bestsellerRank)
  const adjustedScore = applyScoreDecay(
    summary?.performanceScore,
    rankHistoryFromEntries,
    candidate?.daysElapsed ?? 0,
  )
  const decayFactor = computeDecayFactor(rankHistoryFromEntries, candidate?.daysElapsed ?? 0)
  const daysStagnant = daysSinceLastImprovement(rankHistoryFromEntries)

  // entryRank: use summary value if valid, otherwise fall back to first rank > 0 in history
  const entryRankDisplay: number | null =
    (summary?.entryRank != null && summary.entryRank > 0)
      ? summary.entryRank
      : (history.find(h => (h.bestsellerRank ?? 0) > 0)?.bestsellerRank ?? null)

  const totalProducts = store?.productCount ?? 0
  const superadoPct = totalProducts > 0 && summary?.currentRank != null
    ? Math.max(0, Math.round(((totalProducts - summary.currentRank) / totalProducts) * 100))
    : null
  const superadoColor = superadoPct == null ? ''
    : superadoPct <= 25 ? 'text-rose-500'
    : superadoPct <= 50 ? 'text-amber-600'
    : superadoPct <= 75 ? 'text-green-700'
    : 'text-emerald-600'

  const lastEntry     = history.length > 0 ? history[history.length - 1] : null
  const prevEntry     = history.length > 1 ? history[history.length - 2] : null
  const prevPrevEntry = history.length > 2 ? history[history.length - 3] : null

  // Header badge: use resolveDisplayLabel (same function used in every other view)
  // so it always matches what the tracker table and store cards show.
  const scoreHistory3 = history.slice(-3).map(e => e.performanceScore)
  const growthHistory2 = history.slice(-2).map(e => e.growthPct)
  const currentLabel = resolveDisplayLabel(
    summary?.performanceLabel ?? 'Watching',
    summary?.performanceScore,
    summary?.growthPct,
    candidate.daysElapsed,
    scoreHistory3,
    growthHistory2,
  )

  return (
    <PageLayout title="Product Details" description="Deep dive into candidate performance">
      {/* Back Link */}
      <Link
        href="/tracker"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tracker
      </Link>

      {/* Header Card */}
      <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-gradient-to-r from-primary/10 via-transparent to-transparent p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Product Info */}
            <div className="flex items-start gap-5">
              {/* Gallery or fallback avatar */}
              {productImages.length > 0 ? (
                <ProductGallery images={productImages} productTitle={candidate.productTitle} />
              ) : candidate.productImage ? (
                <img
                  src={candidate.productImage}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-xl object-cover bg-secondary"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-secondary text-2xl font-bold text-muted-foreground">
                  {candidate.productTitle.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="mb-1 text-2xl font-bold text-foreground">{candidate.productTitle}</h1>
                {storeName && (
                  <div className="mb-2">
                    <Link
                      href={`/stores/${storeId}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <Store className="h-3.5 w-3.5" />
                      {storeName}
                    </Link>
                  </div>
                )}
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
                    {candidate.productHandle}
                  </span>
                  {summary && <PerformanceBadge label={currentLabel} size="md" />}
                  <FormattedPrice
                    amount={candidate.productPrice}
                    originalCurrency={candidate.currency}
                    preferredCurrency={preferredCurrency}
                    className="items-start"
                  />
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    First seen: {formatDate(candidate.firstSeenDate)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    Day {candidate.daysElapsed} of 30
                  </span>
                </div>
              </div>
            </div>

            {/* Score Ring */}
            <div className="flex items-center gap-6">
              {summary && (
                <div className="flex flex-col items-center gap-2">
                  <ScoreRing score={adjustedScore} label={currentLabel} size="lg" showLabel={false} />
                  {isScalable(adjustedScore, summary.signalConfidence) && (
                    spikeEntry ? (
                      <button
                        onClick={() => {
                          unspike(candidateId)
                          setSpikeEntry(null)
                        }}
                        className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 hover:bg-rose-500/15 hover:text-rose-500 transition-colors"
                      >
                        Spikeando ✕
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const entry: SpikeEntry = { spike_floor: adjustedScore, last_score: adjustedScore, spiked_at: new Date().toISOString() }
                          spike(candidateId, adjustedScore)
                          setSpikeEntry(entry)
                        }}
                        className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 hover:bg-emerald-500/30 transition-colors"
                      >
                        ↑ Spikear
                      </button>
                    )
                  )}
                  {decayFactor < 1 && (
                    <span className="text-[10px] text-muted-foreground/70 tabular-nums">
                      decay ×{decayFactor.toFixed(2)} · {daysStagnant}d sin mejora
                    </span>
                  )}
                </div>
              )}
              {(fromTracker || isPro || candidate.isScoutStore) && (() => {
                const url = buildProductUrl(candidate.productUrl, candidate.productHandle, candidate.storeBaseUrl)
                return url ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="gap-2">
                      Ver producto
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                ) : null
              })()}
              <ShareButton candidateId={candidateId} />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 divide-x divide-border md:grid-cols-4">
          <div className="p-4 text-center">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Current Rank</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {summary?.currentRank != null ? `#${summary.currentRank}` : '—'}
            </p>
          </div>
          <div className="p-4 text-center">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-muted-foreground">
              <Award className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Best Rank</span>
            </div>
            <p className="text-2xl font-bold text-rising">
              {summary?.bestRank != null ? `#${summary.bestRank}` : '—'}
            </p>
          </div>
          <div className="p-4 text-center">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Growth</span>
            </div>
            {summary != null ? (
              <>
                <p className={`text-2xl font-bold ${summary.growthPct >= 0 ? 'text-rising' : 'text-declining'}`}>
                  {summary.growthPct >= 0 ? '+' : ''}{Math.round(summary.growthPct)}%
                </p>
                {superadoPct != null && summary.growthPct > 1 && (
                  <p className={`mt-0.5 text-[11px] leading-tight ${superadoColor}`}>
                    ↑ superó al {superadoPct}% del catálogo
                  </p>
                )}
              </>
            ) : (
              <p className="text-2xl font-bold text-muted-foreground">—</p>
            )}
          </div>
          <div className="p-4 text-center">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Confidence</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {summary != null ? `${Math.round(summary.signalConfidence * 100)}%` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Active Ads */}
      <ProductAdsSection candidateId={candidateId} />

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rank Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Rank Progression</h3>
              <p className="text-sm text-muted-foreground">Posición en el ranking a lo largo del tiempo</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Entry:</span>
              <span className="font-medium text-foreground">
                {entryRankDisplay != null ? `#${entryRankDisplay}` : '—'}
              </span>
              <span className="text-muted-foreground mx-2">→</span>
              <span className="text-muted-foreground">Now:</span>
              <span className="font-medium text-rising">
                {summary?.currentRank != null ? `#${summary.currentRank}` : '—'}
              </span>
            </div>
          </div>
          <RankChart history={history} />
        </div>

        {/* Score Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Performance Score</h3>
              <p className="text-sm text-muted-foreground">Normalized performance over tracking window</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Peak:</span>
              <span className="font-medium text-rising">
                {summary?.peakGrowthPct != null ? `${Math.round(summary.peakGrowthPct)}%` : '—'}
              </span>
            </div>
          </div>
          <ScoreChart history={history} />
        </div>
      </div>

      {/* Narrative summary */}
      {summary && (() => {
        const gained = entryRankDisplay != null && summary.currentRank != null
          ? entryRankDisplay - summary.currentRank : null
        const topPct = totalProducts > 0 && summary.currentRank != null
          ? Math.round((summary.currentRank / totalProducts) * 100) : null
        const zone = topPct == null ? null : topPct <= 25 ? 'alta' : topPct <= 60 ? 'media' : 'baja'
        const growth = summary.growthPct != null ? Math.round(summary.growthPct) : null

        let movePart = ''
        if (gained != null && gained > 0)
          movePart = `Subió ${gained} posición${gained !== 1 ? 'es' : ''} en ${candidate.daysElapsed} días${growth != null ? ` (+${growth}%)` : ''}.`
        else if (gained != null && gained < 0)
          movePart = `Bajó ${Math.abs(gained)} posición${Math.abs(gained) !== 1 ? 'es' : ''} en ${candidate.daysElapsed} días${growth != null ? ` (${growth}%)` : ''}.`
        else
          movePart = `${candidate.daysElapsed} días en seguimiento${growth != null ? `, crecimiento ${growth >= 0 ? '+' : ''}${growth}%` : ''}.`

        const zonePart = zone && topPct != null
          ? ` Aún en zona ${zone} del catálogo (top ${topPct}%).` : ''

        return (
          <p className="mt-6 mb-2" style={{ fontSize: 13, color: 'var(--color-muted-foreground)' }}>
            {movePart}{zonePart}
          </p>
        )
      })()}

      {/* History Table */}
      <div className="mt-2 overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="font-semibold text-foreground">Tracking History</h3>
          <p className="text-sm text-muted-foreground">Daily snapshots from the observation window</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Day</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Rank</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Growth</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Score</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No tracking data yet
                  </td>
                </tr>
              ) : (
                history.map((entry, idx) => {
                  const prev     = idx > 0 ? history[idx - 1] : null
                  const prevPrev = idx > 1 ? history[idx - 2] : null
                  const dayLabel = computeSmartLabel(entry, prev, prevPrev)
                  return (
                    <tr key={entry.trackingDay} className="transition-colors hover:bg-secondary/20">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">Day {entry.trackingDay}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(entry.snapshotDate)}</td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-foreground">
                        {entry.bestsellerRank ? `#${entry.bestsellerRank}` : '-'}
                      </td>
                      <td className={`px-4 py-3 text-center text-sm font-medium ${entry.growthPct >= 0 ? 'text-rising' : 'text-declining'}`}>
                        {entry.growthPct >= 0 ? '+' : ''}{Math.round(entry.growthPct)}%
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-primary">
                        {Math.round(entry.performanceScore)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <PerformanceBadge label={dayLabel} size="sm" showIcon={false} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>


    </PageLayout>
  )
}
