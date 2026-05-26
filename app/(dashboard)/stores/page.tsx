'use client'

import { PageLayout } from '@/components/layout/page-layout'
import { Plus, RefreshCw, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStores } from './hooks/useStores'
import { AddStoreModal } from './components/AddStoreModal'
import { StoreRow } from './components/StoreRow'
import { useRedetectPaymentsMutation } from './services/storeApi'
import { useState } from 'react'

export default function StoresPage() {
  const {
    stores, isLoading,
    deleteStore, deletingStoreId,
    syncStore, syncingStoreId,
    openAddModal,
  } = useStores()

  const [redetect, { isLoading: redetecting }] = useRedetectPaymentsMutation()
  const [redetectResult, setRedetectResult] = useState<number | null>(null)

  async function handleRedetect() {
    setRedetectResult(null)
    const res = await redetect().unwrap()
    setRedetectResult(res.updated)
    setTimeout(() => setRedetectResult(null), 4000)
  }

  return (
    <PageLayout title="Tiendas" description="Administra tus tiendas Shopify rastreadas">
      <AddStoreModal />

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{stores.length}</span> de 50 tiendas registradas
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleRedetect}
            disabled={redetecting}
            title="Re-detecta moneda y pago anticipado para tiendas donde no se detectó automáticamente"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${redetecting ? 'animate-spin' : ''}`} />
            <CreditCard className="h-3.5 w-3.5" />
            {redetecting
              ? 'Detectando...'
              : redetectResult !== null
              ? `${redetectResult} tienda${redetectResult !== 1 ? 's' : ''} actualizada${redetectResult !== 1 ? 's' : ''}`
              : 'Re-detectar pagos'}
          </Button>
          <Button className="gap-2" onClick={openAddModal}>
            <Plus className="h-4 w-4" />
            Agregar tienda
          </Button>
        </div>
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
        ) : stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <p className="text-sm">No tienes tiendas registradas aún.</p>
            <Button variant="outline" className="gap-2" onClick={openAddModal}>
              <Plus className="h-4 w-4" />
              Agregar primera tienda
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {stores.map((store) => (
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
