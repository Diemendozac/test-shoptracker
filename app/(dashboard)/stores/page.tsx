'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, X } from 'lucide-react'
import { PageLayout } from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button'
import { useStores } from './hooks/useStores'
import { AddStoreModal } from './components/AddStoreModal'
import { EditStoreModal } from './components/EditStoreModal'
import { useGetTrackerCandidatesQuery } from '../services/dashboardApi'
import { useGetMeQuery } from '../services/userApi'
import { storeHealth, type StoreHealthRow } from '@/lib/today'
import { StoreCard } from '@/components/stores/store-card'
import { PendingCandidatesSection } from '@/components/tracker/pending-candidates'
import type { StoreResponse } from './types'
import type { TrackerCandidate } from '../types'

// Competidores (CHANGE-137, Fase 3a del rediseño). Antes "Mis tiendas": una tabla con estrellas
// de "Calidad", filtros de pago y orden, "Sincronizar ahora" para todos y "Pausar/Reanudar" sin
// acción. Ahora: cupos reales del plan, aviso de tiendas quietas, los productos nuevos por
// revisar (antes la pantalla Pendientes) y una tarjeta por tienda con hechos que se comprueban.

export default function CompetitorsPage() {
  const {
    stores, isLoading,
    deleteStore, deletingStoreId,
    syncStore, syncingStoreId,
    openAddModal,
  } = useStores()
  const { data: candidates = [] } = useGetTrackerCandidatesQuery({})
  const { data: me } = useGetMeQuery()
  const isAdmin = me?.plan === 'admin'

  const [editingStore, setEditingStore] = useState<StoreResponse | null>(null)
  const [query, setQuery] = useState('')

  // Límite real del plan (PLAN_MAX_STORES del backend); el backend cuenta las tiendas activas
  const maxStores = me?.maxStores
  const activeCount = stores.filter((s) => s.isActive).length
  const atLimit = maxStores != null && maxStores < 999 && activeCount >= maxStores

  const byStore = useMemo(() => {
    const map: Record<string, TrackerCandidate[]> = {}
    for (const c of candidates) (map[c.storeId] ??= []).push(c)
    return map
  }, [candidates])

  // Activas primero por productos nuevos; después las quietas; al final las pausadas, que no
  // usan cupo pero se tienen que poder ver para editarlas o dejar de seguirlas.
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const health = storeHealth(stores, candidates)
    const paused: StoreHealthRow[] = stores
      .filter((s) => !s.isActive)
      .map((s) => ({ store: s, newThisWeek: 0, label: 'Pausada', tone: 'none' }))
    const ordered = [
      ...health.filter((r) => r.tone !== 'bad'),
      ...health.filter((r) => r.tone === 'bad'),
      ...paused,
    ]
    return q ? ordered.filter((r) => r.store.storeName.toLowerCase().includes(q) || r.store.baseUrl.toLowerCase().includes(q)) : ordered
  }, [stores, candidates, query])
  const quiet = rows.filter((r) => r.tone === 'bad').length

  return (
    <PageLayout title="Competidores" description="Las tiendas Shopify que sigues y lo que están lanzando.">
      <AddStoreModal />
      <EditStoreModal store={editingStore} onClose={() => setEditingStore(null)} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {maxStores == null ? (
              <><span className="font-semibold text-foreground">{activeCount}</span> {activeCount === 1 ? 'tienda' : 'tiendas'}</>
            ) : maxStores >= 999 ? (
              <><span className="font-semibold text-foreground">{activeCount}</span> tiendas · sin límite</>
            ) : (
              <><span className="font-semibold text-foreground">{activeCount} de {maxStores}</span> tiendas en tu plan</>
            )}
          </p>
          {stores.length > 6 && (
            <div className="relative w-full max-w-xs sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                id="buscar-tienda"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar tienda…"
                aria-label="Buscar tienda"
                className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {query && (
                <button onClick={() => setQuery('')} aria-label="Limpiar búsqueda" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          <div className="ml-auto flex items-center gap-3">
            {atLimit && (
              <span className="text-xs text-muted-foreground">
                Llegaste al límite. <Link href="/pricing" className="font-medium text-primary-text hover:underline">Ver planes</Link>
              </span>
            )}
            <Button variant="brand" className="gap-2" onClick={openAddModal} disabled={atLimit}>
              <Plus className="h-4 w-4" />Seguir tienda
            </Button>
          </div>
        </div>

        {quiet > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-danger-border bg-danger-subtle px-4 py-3 text-sm text-danger-foreground">
            <span className="font-semibold">{quiet === 1 ? '1 tienda está quieta.' : `${quiet} tiendas están quietas.`}</span>
            <span>{quiet === 1 ? 'Estás usando un cupo en una tienda que casi no se mueve.' : `Estás usando ${quiet} cupos en tiendas que casi no se mueven.`}</span>
          </div>
        )}

        <PendingCandidatesSection />

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-60 animate-pulse rounded-xl bg-secondary" />)}
          </div>
        ) : stores.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center">
            <p className="text-sm font-medium text-foreground">Todavía no sigues ninguna tienda</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Pega el link de una tienda Shopify de tu competencia. Desde el próximo corte verás aquí qué lanza y qué le funciona.
            </p>
            <Button variant="outline" className="gap-2" onClick={openAddModal}><Plus className="h-4 w-4" />Seguir la primera tienda</Button>
          </div>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Ninguna tienda coincide con &ldquo;{query}&rdquo;. <button onClick={() => setQuery('')} className="text-primary-text hover:underline">Limpiar</button>
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => (
              <StoreCard
                key={row.store.storeId}
                row={row}
                candidates={byStore[row.store.storeId] ?? []}
                isAdmin={isAdmin}
                isSyncing={syncingStoreId === row.store.storeId}
                isDeleting={deletingStoreId === row.store.storeId}
                onEdit={() => setEditingStore(row.store)}
                onDelete={() => deleteStore(row.store.storeId)}
                onSync={() => syncStore(row.store.storeId, row.store.storeName)}
              />
            ))}
          </div>
        )}

        {stores.some((s) => !s.isActive) && (
          <p className="text-xs text-subtle-foreground">Las tiendas pausadas no usan cupo.</p>
        )}
      </div>
    </PageLayout>
  )
}
