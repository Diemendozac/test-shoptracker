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
import { convertCurrency, currencySymbol } from '@/lib/currency'
import {
  ArrowLeft, ExternalLink, Calendar, TrendingUp, Target,
  Award, Clock, Zap, AlertCircle, Store,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, ZoomIn,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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

  const { data: stores } = useGetStoresQuery()
  const store = stores?.find(s => s.storeId === storeId)
  const storeBaseUrl = store?.baseUrl ?? ''
  const storeName = store?.storeName ?? null

  const { data, isLoading, isError } = useGetCandidateDetailQuery(
    { storeId: storeId!, candidateId },
    { skip: !storeId }
  )

  const [productImages, setProductImages] = useState<string[]>([])
  useEffect(() => {
    if (!storeBaseUrl || !data?.candidate.productHandle) return
    fetch(`/api/product-images?baseUrl=${encodeURIComponent(storeBaseUrl)}&handle=${encodeURIComponent(data.candidate.productHandle)}`)
      .then(r => r.json())
      .then(({ images }) => {
        if (images?.length > 0) setProductImages(images)
        else if (data.candidate.productImage) setProductImages([data.candidate.productImage])
      })
      .catch(() => { if (data?.candidate.productImage) setProductImages([data.candidate.productImage]) })
  }, [storeBaseUrl, data?.candidate.productHandle, data?.candidate.productImage])

  const { currency: preferredCurrency } = useCurrency()

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  const buildProductUrl = (rawUrl: string | null, handle: string) => {
    if (!rawUrl) return null
    if (rawUrl.startsWith('http')) return rawUrl
    const base = storeBaseUrl.replace(/\/$/, '')
    return base ? `${base}${rawUrl}` : null
  }

  const formatCurrency = (amount: number, sourceCurrency?: string | null) => {
    const converted = convertCurrency(amount, sourceCurrency ?? 'USD', preferredCurrency)
    const sym = currencySymbol(preferredCurrency)
    return `${sym}${converted.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
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
                      href="/stores"
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
                  {summary && <PerformanceBadge label={summary.performanceLabel} size="md" />}
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(candidate.productPrice, candidate.currency)}
                  </span>
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
                <ScoreRing score={summary.performanceScore} label={summary.performanceLabel} size="lg" />
              )}
              {fromTracker && (() => {
                const url = buildProductUrl(candidate.productUrl, candidate.productHandle)
                return url ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="gap-2">
                      Ver producto
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                ) : null
              })()}
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
              <p className={`text-2xl font-bold ${summary.growthPct >= 0 ? 'text-rising' : 'text-declining'}`}>
                {summary.growthPct >= 0 ? '+' : ''}{Math.round(summary.growthPct)}%
              </p>
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

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rank Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Rank Progression</h3>
              <p className="text-sm text-muted-foreground">Position in bestseller list over time</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Entry:</span>
              <span className="font-medium text-foreground">
                {summary?.entryRank != null ? `#${summary.entryRank}` : '—'}
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
                {summary?.peakGrowthPct != null ? `${Math.round(summary.peakGrowthPct * 100)}%` : '—'}
              </span>
            </div>
          </div>
          <ScoreChart history={history} />
        </div>
      </div>

      {/* History Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
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
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">In Bestseller</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Rank</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Growth</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Score</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No tracking data yet
                  </td>
                </tr>
              ) : (
                history.map((entry) => (
                  <tr key={entry.trackingDay} className="transition-colors hover:bg-secondary/20">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">Day {entry.trackingDay}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(entry.snapshotDate)}</td>
                    <td className="px-4 py-3 text-center">
                      {entry.inBestseller ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rising/20 text-rising">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                      )}
                    </td>
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
                      <PerformanceBadge label={entry.performanceLabel} size="sm" showIcon={false} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  )
}
