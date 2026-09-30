'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Store, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatShortDate } from '@/lib/format-date'
import { computeSignal } from '@/lib/signal'
import { usePlanTier } from '@/lib/view-as'
import { useCurrency } from '@/store/hooks'
import { useGetCandidateDetailQuery, useGetProductAdsQuery } from '@/app/(dashboard)/services/dashboardApi'
import { useGetStoresQuery } from '@/app/(dashboard)/stores/services/storeApi'
import { FormattedPrice } from '@/components/ui/formatted-price'
import { Segmented } from '@/components/ui/segmented'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { RankChart } from '@/components/tracker/rank-chart'
import { ScoreChart } from '@/components/tracker/score-chart'
import { ProductAdsSection } from '@/components/tracker/product-ads'
import { ProductDescriptionModal } from '@/components/tracker/product-description'
import { ProductGallery } from '@/components/tracker/product-gallery'
import { SignalBadge } from '@/components/tracker/signal-badge'
import { ShareButton } from '@/components/tracker/share-button'
import type { CandidateDetail } from '@/app/(dashboard)/types'

// Ficha de producto única (CHANGE-135, Fase 2d del rediseño). La misma pieza se abre como panel
// al lado del Radar y como página (/tracker/[id]). Antes eran dos vistas con datos y reglas de
// plan distintas (docs/redesign/detalle-producto/01-diagnostico.md, G-1…G-5 y S-1).
//
// Orden: cabecera → veredicto → trayectoria → anuncios → producto → historial.
// Decisiones de Daniel (2026-09-30):
//   - Puntaje: el del backend en todas partes (S-1). El "decaimiento" que la página calculaba en
//     el navegador ya no se muestra; la caída la dice la señal.
//   - Tienda visible para todos; "Ver en la tienda" como hoy (G-5): Pro, tus propias tiendas o
//     tiendas de Dropspy (isScoutStore). Ya no depende de ?from=pool en la URL (G-4): se mira si
//     la tienda es tuya.

type Variant = 'page' | 'panel'

function productLink(c: CandidateDetail['candidate']): string | null {
  const base = (c.storeBaseUrl ?? '').replace(/\/$/, '')
  if (c.productUrl?.startsWith('http')) return c.productUrl
  if (c.productUrl) return base ? `${base}${c.productUrl}` : null
  return base && c.productHandle ? `${base}/products/${c.productHandle}` : null
}

function domain(url: string | null | undefined): string {
  return (url ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '')
}

export function ProductSheet({ candidateId, storeId, variant, onClose }: {
  candidateId: string
  storeId: string
  variant: Variant
  onClose?: () => void
}) {
  const isPanel = variant === 'panel'
  const { isPro } = usePlanTier()
  const { currency: preferredCurrency } = useCurrency()
  const { data, isLoading, isError } = useGetCandidateDetailQuery({ storeId, candidateId })
  const { data: adsData } = useGetProductAdsQuery(candidateId)
  const { data: stores } = useGetStoresQuery()
  const ownStore = stores?.find((s) => s.storeId === storeId)
  const [chart, setChart] = useState<'rank' | 'score'>('rank')

  // Galería: la foto de portada al instante y, si se puede, el set completo de Shopify
  const [images, setImages] = useState<string[]>([])
  useEffect(() => {
    if (!data) return
    const c = data.candidate
    setImages(c.productImage ? [c.productImage] : [])
    if (isPanel || !c.storeBaseUrl || !c.productHandle) return
    let cancelled = false
    fetch(`/api/product-images?baseUrl=${encodeURIComponent(c.storeBaseUrl)}&handle=${encodeURIComponent(c.productHandle)}`)
      .then((r) => r.json())
      .then(({ images: full }) => { if (!cancelled && full?.length > 0) setImages(full) })
      .catch(() => { /* queda la portada */ })
    return () => { cancelled = true }
  }, [data, isPanel])

  if (isLoading) {
    return <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">Cargando…</div>
  }
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
        <p className="text-sm text-muted-foreground">No se pudo cargar este producto.</p>
        {onClose && <button type="button" onClick={onClose} className="text-sm font-medium text-primary-text hover:underline">Cerrar</button>}
      </div>
    )
  }

  const { candidate: c, summary, history } = data
  const rankHistory = history.filter((h) => h.inBestseller && h.bestsellerRank != null && h.bestsellerRank > 0).map((h) => h.bestsellerRank as number)
  const signal = computeSignal({ daysElapsed: c.daysElapsed, rankHistory, performanceScore: summary?.performanceScore })
  const activeAds = (adsData?.ads ?? []).filter((a) => a.status === 'active')
  const oldestAd = activeAds.reduce<number | null>((max, a) => (a.days_running != null && (max == null || a.days_running > max) ? a.days_running : max), null)
  const catalog = ownStore?.productCount ?? null
  const topPct = catalog && summary?.currentRank ? Math.min(100, Math.max(1, Math.round((summary.currentRank / catalog) * 100))) : null
  const link = productLink(c)
  const canOpenProduct = isPro || !!ownStore || c.isScoutStore
  const storeLabel = ownStore?.storeName ?? domain(c.storeBaseUrl)

  // Veredicto: una frase con datos reales, en el orden en que un dropshipper los lee
  const verdict: string[] = []
  if (signal.state === 'nuevo') {
    verdict.push(c.daysElapsed <= 1 ? 'Apareció en el último corte.' : `Lleva ${c.daysElapsed} días en seguimiento.`)
  } else if (signal.rankChange != null && signal.rankChange !== 0) {
    verdict.push(`${signal.rankChange > 0 ? 'Subió' : 'Bajó'} ${Math.abs(signal.rankChange)} ${Math.abs(signal.rankChange) === 1 ? 'puesto' : 'puestos'} en sus últimos ${signal.window.length} registros.`)
  } else if (signal.window.length >= 2) {
    verdict.push('Se mantiene en el mismo puesto en sus últimos registros.')
  }
  if (summary?.currentRank) {
    const best = summary.bestRank && summary.bestRank < summary.currentRank ? ` (su mejor puesto: #${summary.bestRank})` : ''
    verdict.push(topPct != null
      ? `Hoy está en el puesto #${summary.currentRank}, el top ${topPct} % de su tienda${best}.`
      : `Hoy está en el puesto #${summary.currentRank} de su tienda${best}.`)
  }
  if (adsData) {
    verdict.push(activeAds.length === 0
      ? 'No tiene anuncios activos.'
      : `Tiene ${activeAds.length} ${activeAds.length === 1 ? 'anuncio activo' : 'anuncios activos'}${oldestAd ? `; el más antiguo, ${oldestAd} ${oldestAd === 1 ? 'día' : 'días'} al aire` : ''}.`)
  }
  if (signal.confidence === 'baja' && signal.state !== 'nuevo') verdict.push('Con pocos días de datos: todavía puede ser ruido.')

  const entryRank = summary?.entryRank && summary.entryRank > 0 ? summary.entryRank : rankHistory[0] ?? null

  const section = cn('rounded-xl border border-border bg-card', isPanel ? 'p-4' : 'p-5')
  const heading = 'text-sm font-semibold text-foreground'

  return (
    <div className={cn('flex flex-col', isPanel ? 'gap-4' : 'gap-5')}>
      {/* 1 · Cabecera */}
      <header className={cn(section, 'flex gap-4', isPanel && 'sticky top-0 z-10 rounded-none border-x-0 border-t-0 shadow-sm')}>
        {!isPanel && images.length > 0 ? (
          <ProductGallery images={images} productTitle={c.productTitle} />
        ) : c.productImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/image-proxy?url=${encodeURIComponent(c.productImage)}`} alt="" className={cn('shrink-0 rounded-xl bg-secondary object-cover', isPanel ? 'h-14 w-14' : 'h-20 w-20')} />
        ) : (
          <div className={cn('flex shrink-0 items-center justify-center rounded-xl bg-secondary text-xl font-bold text-muted-foreground', isPanel ? 'h-14 w-14' : 'h-20 w-20')}>
            {c.productTitle.charAt(0)}
          </div>
        )}
        <div className="grid min-w-0 flex-1 content-start gap-1.5">
          <div className="flex items-start gap-2">
            {isPanel ? (
              <h2 className="min-w-0 flex-1 font-display text-base font-semibold leading-snug text-balance">{c.productTitle}</h2>
            ) : (
              <h1 className="min-w-0 flex-1 font-display text-2xl font-semibold leading-tight text-balance">{c.productTitle}</h1>
            )}
            {onClose && (
              <button type="button" onClick={onClose} aria-label="Cerrar" className="-mr-1 -mt-1 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-subtle-foreground">
            {ownStore ? (
              <Link href={`/stores/${storeId}`} className="inline-flex items-center gap-1 font-medium text-primary-text hover:underline">
                <Store className="h-3.5 w-3.5" />{storeLabel}
              </Link>
            ) : storeLabel ? (
              <span className="inline-flex items-center gap-1"><Store className="h-3.5 w-3.5" />{storeLabel}</span>
            ) : null}
            <span aria-hidden>·</span>
            <FormattedPrice amount={c.productPrice} originalCurrency={c.currency} preferredCurrency={preferredCurrency} compact={isPanel} />
            <span aria-hidden>·</span>
            <span>Visto por primera vez el {formatShortDate(c.firstSeenDate)}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {canOpenProduct && link ? (
              <a href={link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-input bg-card px-2.5 py-1 text-xs font-medium hover:bg-accent">
                Ver en la tienda <ExternalLink className="h-3 w-3" />
              </a>
            ) : !canOpenProduct ? (
              <span title="Disponible en Pro" className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-subtle-foreground">
                Ver en la tienda · Pro
              </span>
            ) : null}
            <ShareButton candidateId={candidateId} />
            {isPanel && (
              <Link href={`/tracker/${candidateId}?storeId=${storeId}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary-text hover:underline">
                Página completa <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className={cn('flex flex-col', isPanel ? 'gap-4 px-4 pb-6' : 'gap-5')}>
        {/* 2 · Veredicto */}
        <section className={section} aria-labelledby={`v-${candidateId}`}>
          <h2 id={`v-${candidateId}`} className="sr-only">Veredicto</h2>
          <div className="flex items-start gap-4">
            <div className="grid min-w-0 flex-1 gap-2">
              <SignalBadge signal={signal} showConfidence />
              <p className={cn('leading-relaxed text-foreground', isPanel ? 'text-sm' : 'text-[15px]')}>{verdict.join(' ')}</p>
            </div>
            {summary && (
              <div className="flex shrink-0 flex-col items-center gap-1">
                <ScoreRing score={summary.performanceScore} size={isPanel ? 'sm' : 'md'} showLabel={false} confidence={summary.signalConfidence} />
                <span className="text-xs text-subtle-foreground">Puntaje</span>
              </div>
            )}
          </div>
        </section>

        {/* 3 · Trayectoria */}
        <section className={section}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className={heading}>Trayectoria</h2>
              <p className="text-xs text-subtle-foreground tabular-nums">
                Entró en #{entryRank ?? '—'} · hoy #{summary?.currentRank ?? '—'} · día {c.daysElapsed} de seguimiento
              </p>
            </div>
            <Segmented
              ariaLabel="Qué mostrar en el gráfico"
              value={chart}
              onChange={setChart}
              options={[{ value: 'rank' as const, label: 'Puesto' }, { value: 'score' as const, label: 'Puntaje' }]}
            />
          </div>
          {chart === 'rank'
            ? <RankChart history={history} height={isPanel ? 180 : 256} />
            : <ScoreChart history={history} height={isPanel ? 180 : 256} />}
        </section>

        {/* 4 · Anuncios */}
        <ProductAdsSection candidateId={candidateId} embedded={isPanel} density={isPanel ? 'compact' : 'comfortable'} />

        {/* 5 · Producto */}
        {c.descriptionBlocks && (
          <section className={section}>
            <h2 className={cn(heading, 'mb-2')}>Producto</h2>
            <ProductDescriptionModal descriptionBlocks={c.descriptionBlocks} />
          </section>
        )}

        {/* 6 · Historial diario, plegado */}
        <details className={cn(section, 'group')}>
          <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
            Historial diario <span className="font-normal text-subtle-foreground">({history.length} {history.length === 1 ? 'registro' : 'registros'})</span>
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-subtle-foreground">
                  <th className="py-2 pr-3 font-medium">Día</th>
                  <th className="py-2 pr-3 font-medium">Fecha</th>
                  <th className="py-2 pr-3 text-right font-medium">Puesto</th>
                  <th className="py-2 pr-3 text-right font-medium">Crecimiento</th>
                  <th className="py-2 text-right font-medium">Puntaje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Aún no hay registros.</td></tr>
                ) : [...history].reverse().map((h) => (
                  <tr key={h.trackingDay} className="tabular-nums">
                    <td className="py-2 pr-3">{h.trackingDay}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{formatShortDate(h.snapshotDate)}</td>
                    <td className="py-2 pr-3 text-right">{h.bestsellerRank ? `#${h.bestsellerRank}` : 'fuera'}</td>
                    <td className="py-2 pr-3 text-right text-muted-foreground">{h.growthPct >= 0 ? '+' : ''}{Math.round(h.growthPct)} %</td>
                    <td className="py-2 text-right">{Math.round(h.performanceScore)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  )
}
