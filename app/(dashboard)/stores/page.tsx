'use client'

import { useState } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStores } from './hooks/useStores'
import { AddStoreModal } from './components/AddStoreModal'
import { StoreRow } from './components/StoreRow'

export default function StoresPage() {
  const {
    stores, isLoading,
    deleteStore, deletingStoreId,
    syncStore, syncingStoreId,
    openAddModal,
  } = useStores()

  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? stores.filter(s =>
        s.storeName.toLowerCase().includes(query.toLowerCase()) ||
        s.baseUrl.toLowerCase().includes(query.toLowerCase())
      )
    : stores

  return (
    <PageLayout title="Tiendas" description="Administra tus tiendas Shopify rastreadas">
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

        <Button className="gap-2 shrink-0" onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Agregar tienda
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {/* Column headers */}
        <div className="grid grid-cols-[40px_1fr_80px_60px_96px_96px_80px] items-center gap-3 border-b border-border px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <div />
          <div>Tienda</div>
          <div>Nicho</div>
          <div className="text-center">Moneda</div>
          <div className="text-center">Pago</div>
          <div className="text-center">Estado</div>
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
