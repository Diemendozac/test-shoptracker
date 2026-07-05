'use client'

import { useEffect, useState, useRef } from 'react'
import { use } from 'react'
import { Volume2, VolumeX, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScoreRing } from '@/components/dashboard/score-ring'

interface ShareAd {
  id: string
  thumbnail_url: string | null
  video_url_r2: string | null
  ad_snapshot_url: string
  status: string
  days_running: number | null
}

interface ShareProduct {
  candidateId: string
  productTitle: string
  productImage: string | null
  productUrl: string | null
  productPrice: number | null
  currency: string | null
  performanceScore: number
  performanceLabel: string
  growthPct: number | null
  currentRank: number | null
  storeName: string
  storeCountry: string | null
  pagoAnticipado: boolean | null
  ads: ShareAd[]
}

function VideoCard({ ad }: { ad: ShareAd }) {
  const [muted, setMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  function toggleMute() {
    const next = !muted
    setMuted(next)
    if (videoRef.current) videoRef.current.muted = next
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-neutral-900" style={{ aspectRatio: '9/16', maxWidth: 160 }}>
      {ad.video_url_r2 ? (
        <>
          <video
            ref={videoRef}
            src={ad.video_url_r2}
            poster={ad.thumbnail_url ?? undefined}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
          />
          <button
            onClick={toggleMute}
            className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
        </>
      ) : (
        <img
          src={ad.thumbnail_url ?? '/placeholder.jpg'}
          alt="Ad"
          className="h-full w-full object-cover"
        />
      )}
      {ad.days_running != null && (
        <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
          {ad.days_running}d activo
        </span>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-800 dark:border-neutral-700 dark:border-t-neutral-200" />
        <p className="text-sm text-neutral-500">Cargando producto…</p>
      </div>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
        <span className="text-3xl">🔍</span>
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
          Producto no disponible
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          Este link puede haber expirado o el producto ya no está en el pool.
        </p>
      </div>
      <a
        href="https://www.getdropspy.com"
        className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-80 dark:bg-white dark:text-neutral-900"
      >
        Ir a Dropspy
      </a>
    </div>
  )
}

export default function SharePage({ params }: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = use(params)
  const [product, setProduct] = useState<ShareProduct | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) { setStatus('error'); return }

    fetch(`${apiUrl}/public/candidates/${candidateId}`, { cache: 'no-store' })
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json() as Promise<ShareProduct>
      })
      .then(data => { setProduct(data); setStatus('ready') })
      .catch(() => setStatus('error'))
  }, [candidateId])

  if (status === 'loading') return <LoadingState />
  if (status === 'error' || !product) return <ErrorState />

  const activeAds = product.ads.filter(a => a.status === 'active')
  const proxiedImage = product.productImage
    ? `/api/image-proxy?url=${encodeURIComponent(product.productImage)}`
    : null

  const growthColor = product.growthPct != null && product.growthPct >= 0
    ? 'text-emerald-600'
    : 'text-rose-500'

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 dark:bg-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-white dark:text-neutral-900" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">dropspy</span>
          </div>
          <a
            href="https://www.getdropspy.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            Explorar pool <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">

        {/* Product card */}
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex gap-5 p-6">
            {/* Image */}
            <div className="shrink-0">
              {proxiedImage ? (
                <img
                  src={proxiedImage}
                  alt={product.productTitle}
                  className="h-28 w-28 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-neutral-100 text-3xl dark:bg-neutral-800">
                  📦
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <h1 className="line-clamp-2 text-lg font-bold leading-snug text-neutral-900 dark:text-neutral-100">
                {product.productTitle}
              </h1>
              <p className="mt-1 text-sm text-neutral-500">{product.storeName}</p>

              <div className="mt-3 flex flex-wrap items-center gap-4">
                {/* Score */}
                <ScoreRing score={product.performanceScore} size="sm" showLabel={false} />

                {/* Price */}
                {product.productPrice != null && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400">Precio</p>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {product.currency ?? ''} {product.productPrice.toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Growth */}
                {product.growthPct != null && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400">Crecimiento 7d</p>
                    <p className={cn('text-sm font-bold tabular-nums', growthColor)}>
                      {product.growthPct >= 0 ? '+' : ''}{product.growthPct.toFixed(1)}%
                    </p>
                  </div>
                )}

                {/* Rank */}
                {product.currentRank != null && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400">Rank bestseller</p>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      #{product.currentRank}
                    </p>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {product.pagoAnticipado != null && (
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-medium',
                    product.pagoAnticipado
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
                  )}>
                    {product.pagoAnticipado ? 'Pago anticipado' : 'Contraentrega'}
                  </span>
                )}
                {product.storeCountry && (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    {product.storeCountry}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Product link */}
          {product.productUrl && (
            <div className="border-t border-neutral-100 px-6 py-3 dark:border-neutral-800">
              <a
                href={product.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-neutral-200"
              >
                <ExternalLink className="h-3 w-3" />
                Ver producto en tienda
              </a>
            </div>
          )}
        </div>

        {/* Ads / Videos */}
        {activeAds.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Ads activos ({activeAds.length})
            </h2>
            <div className="flex flex-wrap gap-3">
              {activeAds.map(ad => (
                <VideoCard key={ad.id} ad={ad} />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 text-center">
          <p className="text-xs text-neutral-400">
            Compartido desde{' '}
            <a
              href="https://www.getdropspy.com"
              className="font-medium text-neutral-600 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              Dropspy
            </a>
            {' '}— inteligencia competitiva para dropshippers
          </p>
        </div>
      </main>
    </div>
  )
}