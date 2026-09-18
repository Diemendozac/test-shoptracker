'use client'

// Panel de detalle en split-view para "Explorar testeos" — reemplaza la navegación a
// /tracker/[candidateId] por un panel que se abre al lado sin perder el contexto de la
// tabla. Reutiliza exactamente los mismos datos y componentes que la página de detalle
// completa (useGetCandidateDetailQuery, ProductAdsSection, ProductDescriptionModal,
// RankChart, ScoreChart) — no se inventa ninguna fuente de datos nueva.

import Link from 'next/link'
import { X, ExternalLink, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGetCandidateDetailQuery } from '@/app/(dashboard)/services/dashboardApi'
import { useCurrency } from '@/store/hooks'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { RankChart } from '@/components/tracker/rank-chart'
import { ScoreChart } from '@/components/tracker/score-chart'
import { ProductAdsSection } from '@/components/tracker/product-ads'
import { ProductDescriptionModal } from '@/components/tracker/product-description'
import { FormattedPrice } from '@/components/ui/formatted-price'

interface PoolDetailPanelProps {
  candidateId: string
  storeId: string
  onClose: () => void
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'accent' }) {
  return (
    <div className="p-3 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn(
        'mt-0.5 text-lg font-bold tabular-nums',
        tone === 'good' ? 'text-rising' : tone === 'accent' ? 'text-primary' : 'text-foreground',
      )}>
        {value}
      </p>
    </div>
  )
}

export function PoolDetailPanel({ candidateId, storeId, onClose }: PoolDetailPanelProps) {
  const { currency: preferredCurrency } = useCurrency()
  const { data, isLoading, isError } = useGetCandidateDetailQuery({ storeId, candidateId })

  const candidate = data?.candidate
  const summary = data?.summary
  const history = data?.history ?? []

  return (
    <aside className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-border bg-card shadow-sm">
      {isLoading && (
        <div className="space-y-3 p-5">
          <div className="h-16 animate-pulse rounded-xl bg-secondary/40" />
          <div className="h-24 animate-pulse rounded-xl bg-secondary/40" />
          <div className="h-40 animate-pulse rounded-xl bg-secondary/40" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-sm text-muted-foreground">No se pudo cargar el detalle de este producto.</p>
          <button onClick={onClose} className="text-sm font-medium text-primary hover:underline">Cerrar</button>
        </div>
      )}

      {candidate && !isLoading && (
        <>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-border p-4">
            <div className="flex min-w-0 items-start gap-3">
              {candidate.productImage ? (
                <img
                  src={candidate.productImage}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-xl bg-secondary object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-xl font-bold text-muted-foreground">
                  {candidate.productTitle.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-sm font-semibold leading-snug text-foreground">
                  {candidate.productTitle}
                </h2>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Store className="h-3 w-3 shrink-0" />
                  <span className="truncate">{candidate.storeBaseUrl}</span>
                </div>
                <div className="mt-1.5">
                  <FormattedPrice
                    amount={candidate.productPrice}
                    originalCurrency={candidate.currency}
                    preferredCurrency={preferredCurrency ?? 'USD'}
                    compact
                  />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar panel"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-rose-400 hover:bg-rose-500/10 hover:text-rose-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
            <Stat label="Rank" value={summary?.currentRank != null ? `#${summary.currentRank}` : '—'} />
            <Stat label="Score" value={summary != null ? `${Math.round(summary.performanceScore)}` : '—'} tone="good" />
            <Stat
              label="Crecim."
              value={summary?.growthPct != null ? `${summary.growthPct >= 0 ? '+' : ''}${Math.round(summary.growthPct)}%` : '—'}
              tone="good"
            />
            <Stat label="Confianza" value={summary != null ? `${Math.round(summary.signalConfidence * 100)}%` : '—'} tone="accent" />
          </div>

          {/* Score ring + link a la página completa */}
          <div className="flex items-center justify-between gap-3 border-b border-border p-4">
            <div className="flex items-center gap-3">
              <ScoreRing score={summary?.performanceScore ?? 0} size="sm" showLabel={false} confidence={summary?.signalConfidence} />
              <span className="text-xs text-muted-foreground">{candidate.daysElapsed} días en testeo</span>
            </div>
            <Link
              href={`/tracker/${candidateId}?storeId=${storeId}&from=pool`}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Página completa <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* Charts */}
          {history.length > 0 && (
            <div className="space-y-4 border-b border-border p-4">
              <div>
                <p className="mb-2 text-xs font-semibold text-foreground">Progresión del rank</p>
                <RankChart history={history} />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-foreground">Puntaje de rendimiento</p>
                <ScoreChart history={history} />
              </div>
            </div>
          )}

          {/* Ads */}
          <div className="border-b border-border p-4">
            <ProductAdsSection candidateId={candidateId} />
          </div>

          {/* Descripción */}
          <div className="p-4">
            <ProductDescriptionModal descriptionBlocks={candidate.descriptionBlocks ?? null} />
          </div>
        </>
      )}
    </aside>
  )
}
