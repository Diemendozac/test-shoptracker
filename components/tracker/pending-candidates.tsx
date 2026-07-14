'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FlaskConical, Lock, X, Trash2 } from 'lucide-react'
import { FormattedPrice } from '@/components/ui/formatted-price'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { usePlanTier } from '@/lib/view-as'
import {
  useGetPendingCandidatesQuery,
  useActivateCandidateMutation,
  useCancelCandidateMutation,
  useBulkActivateCandidatesMutation,
  useBulkCancelCandidatesMutation,
} from '@/app/(dashboard)/services/candidateApi'
import type { PendingCandidate } from '@/app/(dashboard)/services/candidateApi'
import { useGetStoresQuery } from '@/app/(dashboard)/stores/services/storeApi'
import { useCurrency } from '@/store/hooks'

export function PendingCandidatesSection() {
  const { canActivateCandidates } = usePlanTier()
  const { data: candidates, isLoading } = useGetPendingCandidatesQuery()
  const [activate, { isLoading: activating }] = useActivateCandidateMutation()
  const [cancel] = useCancelCandidateMutation()
  const [bulkActivate, { isLoading: bulkActivating }] = useBulkActivateCandidatesMutation()
  const [bulkCancel, { isLoading: bulkCancelling }] = useBulkCancelCandidatesMutation()
  const { currency: preferredCurrency } = useCurrency()
  const { data: stores } = useGetStoresQuery()
  const storeBaseUrlMap = Object.fromEntries((stores ?? []).map(s => [s.storeId, s.baseUrl]))

  const [selected, setSelected] = useState<Set<string>>(new Set())

  const allIds = candidates?.map(c => c.candidateId) ?? []
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id))
  const someSelected = selected.size > 0

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allIds))
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleBulkActivate() {
    await bulkActivate([...selected])
    setSelected(new Set())
  }

  async function handleBulkCancel() {
    await bulkCancel([...selected])
    setSelected(new Set())
  }

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
    <div className="mb-6 w-full overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
      {/* header */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleAll}
            className="border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
          />
          <FlaskConical className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-foreground">Candidatos pendientes</h2>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-600">
            {candidates.length} nuevo{candidates.length !== 1 ? 's' : ''}
          </span>
        </div>

        {someSelected ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">{selected.size} seleccionado{selected.size !== 1 ? 's' : ''}</span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 border-red-500/30 px-2.5 text-xs text-red-500 hover:bg-red-500/10 hover:text-red-500"
              onClick={handleBulkCancel}
              disabled={bulkCancelling || bulkActivating}
            >
              <Trash2 className="h-3 w-3" />
              Descartar
            </Button>
            {canActivateCandidates ? (
              <Button
                size="sm"
                className="h-7 gap-1.5 bg-amber-500 px-2.5 text-xs text-white hover:bg-amber-600"
                onClick={handleBulkActivate}
                disabled={bulkActivating || bulkCancelling}
              >
                <FlaskConical className="h-3 w-3" />
                Testear {selected.size}
              </Button>
            ) : (
              <Link href="/pricing">
                <Button size="sm" className="h-7 gap-1.5 px-2.5 text-xs">
                  <Lock className="h-3 w-3" />
                  Suscríbete para testear
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground">Detectados en la última sincronización</span>
        )}
      </div>

      {!canActivateCandidates && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5">
          <p className="text-xs text-foreground">
            <Lock className="mr-1.5 inline h-3 w-3 text-primary" />
            Tu prueba gratis detecta productos pero no puede testearlos. Suscríbete para empezar a testear estos {candidates.length} candidato{candidates.length !== 1 ? 's' : ''}.
          </p>
          <Link href="/pricing" className="shrink-0">
            <Button size="sm">Ver planes</Button>
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {candidates.map((c) => (
          <PendingRow
            key={c.candidateId}
            candidate={c}
            storeBaseUrl={storeBaseUrlMap[c.storeId] ?? ''}
            preferredCurrency={preferredCurrency}
            selected={selected.has(c.candidateId)}
            canActivate={canActivateCandidates}
            onToggle={() => toggleOne(c.candidateId)}
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
  storeBaseUrl,
  preferredCurrency,
  selected,
  canActivate,
  onToggle,
  onActivate,
  onCancel,
  isActivating,
}: {
  candidate: PendingCandidate
  storeBaseUrl: string
  preferredCurrency: string
  selected: boolean
  canActivate: boolean
  onToggle: () => void
  onActivate: () => void
  onCancel: () => void
  isActivating: boolean
}) {
  const detectedDate = new Date(candidate.firstSeenDate).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  })

  const productUrl = (() => {
    const raw = candidate.productUrl
    if (!raw) return null
    if (raw.startsWith('http')) return raw
    const base = storeBaseUrl.replace(/\/$/, '')
    return base ? `${base}${raw}` : null
  })()

  return (
    <div className={`grid grid-cols-[20px_40px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
      selected
        ? 'border-amber-500/40 bg-amber-500/10'
        : 'border-amber-500/20 bg-card hover:bg-secondary/30'
    }`}>
      {/* checkbox */}
      <Checkbox
        checked={selected}
        onCheckedChange={onToggle}
        className="border-amber-500/40 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
      />

      {/* image */}
      {candidate.productImage ? (
        <img
          src={candidate.productImage}
          alt=""
          className="h-10 w-10 rounded-lg object-cover"
        />
      ) : (
        <div className="h-10 w-10 rounded-lg bg-secondary" />
      )}

      {/* info */}
      <div className="min-w-0 overflow-hidden">
        {productUrl ? (
          <a
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-sm font-medium text-foreground hover:text-primary hover:underline transition-colors"
          >
            {candidate.productTitle}
          </a>
        ) : (
          <p className="truncate text-sm font-medium text-foreground">{candidate.productTitle}</p>
        )}
        <div className="mt-0.5 flex items-center gap-2 overflow-hidden">
          <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {candidate.storeName}
          </span>
          {candidate.firstSeenRank != null && (
            <span className="shrink-0 text-[10px] text-muted-foreground">#{candidate.firstSeenRank} al detectar</span>
          )}
          <span className="shrink-0 text-[10px] text-muted-foreground">{detectedDate}</span>
        </div>
      </div>

      {/* price + actions */}
      <div className="flex items-center gap-3">
        <FormattedPrice
          amount={candidate.productPrice}
          originalCurrency={candidate.currency}
          preferredCurrency={preferredCurrency}
          compact
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 border-red-500/30 px-2.5 text-xs text-red-500 hover:bg-red-500/10 hover:text-red-500"
            onClick={onCancel}
          >
            <X className="h-3 w-3" />
            Descartar
          </Button>
          {canActivate ? (
            <Button
              size="sm"
              className="h-7 gap-1.5 bg-amber-500 px-2.5 text-xs text-white hover:bg-amber-600"
              onClick={onActivate}
              disabled={isActivating}
            >
              <FlaskConical className="h-3 w-3" />
              Testear
            </Button>
          ) : (
            <Link href="/pricing">
              <Button size="sm" className="h-7 gap-1.5 px-2.5 text-xs">
                <Lock className="h-3 w-3" />
                Testear
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
