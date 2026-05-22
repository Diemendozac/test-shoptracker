'use client'

import { FlaskConical, X, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGetPendingCandidatesQuery, useActivateCandidateMutation, useCancelCandidateMutation } from '@/app/(dashboard)/services/candidateApi'
import type { PendingCandidate } from '@/app/(dashboard)/services/candidateApi'
import { useCurrency } from '@/store/hooks'
import { convertCurrency, currencySymbol } from '@/lib/currency'

export function PendingCandidatesSection() {
  const { data: candidates, isLoading } = useGetPendingCandidatesQuery()
  const [activate, { isLoading: activating }] = useActivateCandidateMutation()
  const [cancel] = useCancelCandidateMutation()
  const { currency: preferredCurrency } = useCurrency()

  if (isLoading) {
    return (
      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-4 w-4 animate-pulse rounded bg-secondary" />
          <div className="h-4 w-40 animate-pulse rounded bg-secondary" />
        </div>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      </div>
    )
  }

  if (!candidates || candidates.length === 0) return null

  return (
    <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-foreground">Candidatos pendientes</h2>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-600">
            {candidates.length} nuevo{candidates.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">Detectados en la última sincronización</span>
      </div>

      <div className="space-y-3">
        {candidates.map((c) => (
          <PendingRow
            key={c.candidateId}
            candidate={c}
            preferredCurrency={preferredCurrency}
            onActivate={() => activate(c.candidateId)}
            onCancel={() => cancel(c.candidateId)}
            isActivating={activating}
          />
        ))}
      </div>
    </div>
  )
}

function PendingRow({
  candidate,
  preferredCurrency,
  onActivate,
  onCancel,
  isActivating,
}: {
  candidate: PendingCandidate
  preferredCurrency: string
  onActivate: () => void
  onCancel: () => void
  isActivating: boolean
}) {
  const detectedDate = new Date(candidate.firstSeenDate).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <div className="flex items-center gap-4 rounded-xl border border-amber-500/20 bg-card px-4 py-3 transition-colors hover:bg-secondary/30">
      {/* image */}
      {candidate.productImage ? (
        <img
          src={candidate.productImage}
          alt=""
          className="h-10 w-10 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="h-10 w-10 shrink-0 rounded-lg bg-secondary" />
      )}

      {/* info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{candidate.productTitle}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {candidate.storeName}
          </span>
          {candidate.firstSeenRank != null && (
            <span className="text-[10px] text-muted-foreground">#{candidate.firstSeenRank} al detectar</span>
          )}
          <span className="text-[10px] text-muted-foreground">{detectedDate}</span>
        </div>
      </div>

      {/* price */}
      {candidate.productPrice != null && (
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {currencySymbol(preferredCurrency)}{convertCurrency(candidate.productPrice, candidate.currency ?? 'USD', preferredCurrency).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
        </span>
      )}

      {/* actions */}
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 border-red-500/30 px-2.5 text-xs text-red-500 hover:bg-red-500/10 hover:text-red-500"
          onClick={onCancel}
        >
          <X className="h-3 w-3" />
          Descartar
        </Button>
        <Button
          size="sm"
          className="h-7 gap-1.5 bg-amber-500 px-2.5 text-xs text-white hover:bg-amber-600"
          onClick={onActivate}
          disabled={isActivating}
        >
          <FlaskConical className="h-3 w-3" />
          Testear
        </Button>
      </div>
    </div>
  )
}
