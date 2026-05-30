'use client'

import { useMemo, useState } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { Plus, Search, X, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStores } from './hooks/useStores'
import { AddStoreModal } from './components/AddStoreModal'
import { StoreRow } from './components/StoreRow'
import { useGetTrackerCandidatesQuery } from '../services/dashboardApi'
import { computeStoreQuality } from '@/lib/store-quality'
import type { StoreQuality } from '@/lib/store-quality'
import type { StoreResponse } from './types'
import { cn } from '@/lib/utils'

type SortField = 'name' | 'status' | 'calidad' | null
type SortDir = 'asc' | 'desc'
type PayFilter = 'all' | 'anticipado' | 'contraentrega'

function getStatusOrder(store: StoreResponse): number {
  const hours = store.lastScrapedAt
    ? (Date.now() - new Date(store.lastScrapedAt).getTime()) / (1000 * 60 * 60)
    : Infinity
  if (hours < 24) return 0
  if (hours > 7 * 24) return 2
  return 1
}

export default function StoresPage() {
  const {
    stores, isLoading,
    deleteStore, deletingStoreId,
    syncStore, syncingStoreId,
    openAddModal,
  } = useStores()

  const { data: allCandidates = [], isLoading: isCandidatesLoading } = useGetTrackerCandidatesQuery({})

  const [query, setQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [payFilter, setPayFilter] = useState<PayFilter>('all')

  // Compute quality per store from all tracker candidates
  const qualityMap = useMemo(() => {
    const map: Record<string, StoreQuality | null> = {}
    const byStore: Record<string, typeof allCandidates> = {}
    for (const c of allCandidates) {
      if (!byStore[c.storeId]) byStore[c.storeId] = []
      byStore[c.storeId].push(c)
    }
    const maxCandidates = Math.max(...Object.values(byStore).map(cs => cs.length), 1)
    for (const store of stores) {
      map[store.storeId] = computeStoreQuality(byStore[store.storeId] ?? [], maxCandidates)
    }
    return map
  }, [allCandidates, stores])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const filtered = useMemo(() => {
    let result = query.trim()
      ? stores.filter(s =>
          s.storeName.toLowerCase().includes(query.toLowerCase()) ||
          s.baseUrl.toLowerCase().includes(query.toLowerCase())
        )
      : [...stores]

    if (payFilter === 'anticipado') result = result.filter(s => s.pagoAnticipado === true)
    if (payFilter === 'contraentrega') result = result.filter(s => s.pagoAnticipado !== true)

    if (sortField === 'calidad') {
      result.sort((a, b) => {
        const qa = qualityMap[a.storeId]?.finalScore ?? -1
        const qb = qualityMap[b.storeId]?.finalScore ?? -1
        return sortDir === 'asc' ? qa - qb : qb - qa
      })
    } else if (sortField === 'status') {
      result.sort((a, b) => {
        const sa = getStatusOrder(a)
        const sb = getStatusOrder(b)
        return sortDir === 'asc' ? sa - sb : sb - sa
      })
    } else if (sortField === 'name') {
      result.sort((a, b) => {
        const cmp = a.storeName.localeCompare(b.storeName)
        return sortDir === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [stores, query, sortField, sortDir, qualityMap])

  function SortHeader({ field, label, className }: { field: SortField; label: string; className?: string }) {
    const active = sortField === field
    return (
      <button
        onClick={() => handleSort(field)}
        className={cn(
          'inline-flex items-center gap-0.5 transition-colors hover:text-foreground',
          active ? 'text-foreground' : '',
          className,
        )}
      >
        {label}
        {active ? (
          sortDir === 'asc' ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />
        ) : (
          <ChevronDown className="h-2.5 w-2.5 opacity-30" />
        )}
      </button>
    )
  }

  return (
    <PageLayout title="Mis tiendas" description="Administra tus tiendas Shopify rastreadas">
      <AddStoreModal />

      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar tienda…"
            className="h-9 w-full rounded-lg border border-border bg-secondary/40 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <p className="flex-1 text-sm text-muted-foreground">
          {query ? (
            <><span className="font-medium text-foreground">{filtered.length}</span> de {stores.length} tiendas</>
          ) : (
            <><span className="font-medium text-foreground">{stores.length}</span> de 50 tiendas registradas</>
          )}
        </p>

        {/* Pago filter chips */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/30 p-1">
          {([['all', 'Todos'], ['anticipado', 'Anticipado'], ['contraentrega', 'Contraentrega']] as [PayFilter, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setPayFilter(val)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                payFilter === val
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <Button className="gap-2 shrink-0" onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Agregar tienda
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card">
        {/* Column headers */}
        <div className="grid grid-cols-[40px_1fr_96px_96px_96px_80px] items-center gap-3 border-b border-border px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <div />
          <SortHeader field="name" label="Tienda" />
          <div className="text-center">Pago</div>
          <SortHeader field="status" label="Estado" className="justify-center" />
          <SortHeader field="calidad" label="Calidad" className="justify-center" />
          <div />
        </div>

        {isLoading ? (
          <div className="divide-y divide-border/50">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="h-9 w-9 animate-pulse rounded-lg bg-secondary" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-36 animate-pulse rounded bg-secondary" />
                  <div className="h-2 w-24 animate-pulse rounded bg-secondary/60" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            {query ? (
              <>
                <p className="text-sm">No hay tiendas que coincidan con &ldquo;{query}&rdquo;</p>
                <button onClick={() => setQuery('')} className="text-xs text-primary hover:underline">
                  Limpiar búsqueda
                </button>
              </>
            ) : (
              <>
                <p className="text-sm">No tienes tiendas registradas aún.</p>
                <Button variant="outline" className="gap-2" onClick={openAddModal}>
                  <Plus className="h-4 w-4" />
                  Agregar primera tienda
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((store) => (
              <StoreRow
                key={store.storeId}
                store={store}
                quality={qualityMap[store.storeId] ?? null}
                qualityLoading={isCandidatesLoading}
                isSyncing={syncingStoreId === store.storeId}
                isDeleting={deletingStoreId === store.storeId}
                onSync={() => syncStore(store.storeId, store.storeName)}
                onDelete={() => deleteStore(store.storeId)}
              />
            ))}
          </div>
        )}

        {/* Add row at bottom */}
        {!isLoading && (
          <button
            onClick={openAddModal}
            className="flex w-full items-center gap-3 border-t border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary/20 hover:text-foreground"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-border">
              <Plus className="h-4 w-4" />
            </div>
            <span>Agregar nueva tienda</span>
          </button>
        )}
      </div>
    </PageLayout>
  )
}
