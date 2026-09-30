'use client'

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { FormattedPrice } from '@/components/ui/formatted-price'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  useGetPendingCandidatesQuery,
  useActivateCandidateMutation,
  useCancelCandidateMutation,
  useBulkActivateCandidatesMutation,
  useBulkCancelCandidatesMutation,
} from '@/app/(dashboard)/services/candidateApi'
import type { PendingCandidate } from '@/app/(dashboard)/services/candidateApi'
import { useGetMeQuery, useUpdatePreferencesMutation } from '@/app/(dashboard)/services/userApi'
import { useGetStoresQuery } from '@/app/(dashboard)/stores/services/storeApi'
import { useCurrency } from '@/store/hooks'
import { cn } from '@/lib/utils'
import { formatShortDate } from '@/lib/format-date'

// Nuevos por revisar (CHANGE-137, Fase 3a). Antes era la pantalla Pendientes, con el botón
// "Testear": la misma palabra que usa la app para lo que prueban las otras tiendas. Ahora vive
// dentro de Competidores y la acción se llama "Seguir" (empezar a seguir el producto). Si la
// persona no quiere revisar uno por uno, puede activar la detección automática, una preferencia
// que ya existía en Ajustes (autoDetectCandidates).
export function PendingCandidatesSection() {
  const { data: candidates, isLoading } = useGetPendingCandidatesQuery()
  const [activate, { isLoading: activating }] = useActivateCandidateMutation()
  const [cancel] = useCancelCandidateMutation()
  const [bulkActivate, { isLoading: bulkActivating }] = useBulkActivateCandidatesMutation()
  const [bulkCancel, { isLoading: bulkCancelling }] = useBulkCancelCandidatesMutation()
  const { data: me } = useGetMeQuery()
  const [updatePreferences, { isLoading: savingAuto }] = useUpdatePreferencesMutation()
  const { currency: preferredCurrency } = useCurrency()
  const { data: stores } = useGetStoresQuery()
  const storeBaseUrlMap = Object.fromEntries((stores ?? []).map(s => [s.storeId, s.baseUrl]))

  const [selected, setSelected] = useState<Set<string>>(new Set())

  const allIds = candidates?.map(c => c.candidateId) ?? []
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id))
  const someSelected = selected.size > 0

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds))
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleBulkActivate() {
    await bulkActivate(someSelected ? [...selected] : allIds)
    setSelected(new Set())
  }

  async function handleBulkCancel() {
    await bulkCancel([...selected])
    setSelected(new Set())
  }

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-xl bg-secondary" />
  }

  if (!candidates || candidates.length === 0) return null

  return (
    <section aria-labelledby="nuevos-por-revisar" className="rounded-xl border border-warning-border bg-card shadow-card">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Seleccionar todos" />
        <div className="min-w-0 flex-1">
          <h2 id="nuevos-por-revisar" className="text-sm font-semibold text-foreground">
            Nuevos por revisar <span className="ml-1 rounded-full bg-warning-subtle px-2 py-0.5 text-xs font-semibold text-warning-foreground tabular-nums">{candidates.length}</span>
          </h2>
          <p className="text-xs text-subtle-foreground">Aparecieron en tus tiendas. Si los sigues, entran al Radar en “Mis tiendas”.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {someSelected && (
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs text-danger-foreground"
              onClick={handleBulkCancel} disabled={bulkCancelling || bulkActivating}>
              <X className="h-3.5 w-3.5" />
              Descartar {selected.size}
            </Button>
          )}
          <Button size="sm" className="h-8 text-xs" onClick={handleBulkActivate} disabled={bulkActivating || bulkCancelling}>
            {someSelected ? `Seguir ${selected.size}` : 'Seguir todos'}
          </Button>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {candidates.map((c) => (
          <PendingRow
            key={c.candidateId}
            candidate={c}
            storeBaseUrl={storeBaseUrlMap[c.storeId] ?? ''}
            preferredCurrency={preferredCurrency}
            selected={selected.has(c.candidateId)}
            onToggle={() => toggleOne(c.candidateId)}
            onActivate={() => activate(c.candidateId)}
            onCancel={() => cancel(c.candidateId)}
            isActivating={activating}
          />
        ))}
      </ul>

      {me && !me.autoDetectCandidates && (
        <div className="flex flex-col items-start gap-3 border-t border-border bg-secondary/40 px-4 py-3 sm:flex-row sm:items-center">
          <Sparkles className="hidden h-4 w-4 shrink-0 text-primary-text sm:block" />
          <p className="min-w-0 text-xs text-muted-foreground sm:flex-1">
            ¿Prefieres no revisarlos uno por uno? Con la detección automática, los productos nuevos de tus tiendas entran solos.
          </p>
          <Button size="sm" variant="outline" className="h-8 text-xs" disabled={savingAuto}
            onClick={() => updatePreferences({ autoDetectCandidates: true })}>
            Activar detección automática
          </Button>
        </div>
      )}
    </section>
  )
}

function PendingRow({
  candidate, storeBaseUrl, preferredCurrency, selected, onToggle, onActivate, onCancel, isActivating,
}: {
  candidate: PendingCandidate
  storeBaseUrl: string
  preferredCurrency: string
  selected: boolean
  onToggle: () => void
  onActivate: () => void
  onCancel: () => void
  isActivating: boolean
}) {
  // formatShortDate lee 'YYYY-MM-DD' como fecha local: con new Date() salía un día antes en LATAM
  const detectedDate = formatShortDate(candidate.firstSeenDate)

  const productUrl = (() => {
    const raw = candidate.productUrl
    if (!raw) return null
    if (raw.startsWith('http')) return raw
    const base = storeBaseUrl.replace(/\/$/, '')
    return base ? `${base}${raw}` : null
  })()

  return (
    // En el celular, dos líneas: producto arriba, precio y acciones abajo
    <li className={cn('grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-3 px-4 py-3 transition-colors sm:flex', selected ? 'bg-warning-subtle' : 'hover:bg-secondary/40')}>
      <Checkbox checked={selected} onCheckedChange={onToggle} aria-label={`Seleccionar ${candidate.productTitle}`} />
      {candidate.productImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/image-proxy?url=${encodeURIComponent(candidate.productImage)}`} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="h-10 w-10 shrink-0 rounded-lg bg-secondary" />
      )}
      <div className="min-w-0 flex-1">
        {productUrl ? (
          <a href={productUrl} target="_blank" rel="noopener noreferrer"
            className="block truncate text-sm font-medium text-foreground transition-colors hover:text-primary-text hover:underline">
            {candidate.productTitle}
          </a>
        ) : (
          <p className="truncate text-sm font-medium text-foreground">{candidate.productTitle}</p>
        )}
        <p className="mt-0.5 truncate text-xs text-subtle-foreground">
          {candidate.storeName}
          {candidate.firstSeenRank != null && ` · #${candidate.firstSeenRank} al aparecer`}
          {` · ${detectedDate}`}
        </p>
      </div>
      <div className="col-span-3 flex items-center justify-end gap-2 sm:col-auto">
        <span className="mr-auto sm:mr-1"><FormattedPrice amount={candidate.productPrice} originalCurrency={candidate.currency} preferredCurrency={preferredCurrency} compact /></span>
        <Button size="sm" variant="ghost" className="h-8 px-2.5 text-xs text-danger-foreground" onClick={onCancel}>
          Descartar
        </Button>
        <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs" onClick={onActivate} disabled={isActivating}>
          Seguir
        </Button>
      </div>
    </li>
  )
}
