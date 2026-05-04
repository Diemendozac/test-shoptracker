'use client'

import { PageLayout } from '@/components/layout/page-layout'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStores } from './hooks/useStores'
import { AddStoreModal } from './components/AddStoreModal'
import { StoreCard } from './components/StoreCard'

export default function StoresPage() {
  const {
    stores, isLoading,
    deleteStore, deletingStoreId,
    syncStore, syncingStoreId,
    openAddModal,
  } = useStores()

  return (
    <PageLayout title="Stores" description="Manage your tracked Shopify stores">
      <AddStoreModal />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{stores.length}</span> of 50 stores registered
        </p>
        <Button className="gap-2" onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Add Store
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-70 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <StoreCard
              key={store.storeId}
              store={store}
              isSyncing={syncingStoreId === store.storeId}
              isDeleting={deletingStoreId === store.storeId}
              onSync={() => syncStore(store.storeId, store.storeName)}
              onDelete={() => deleteStore(store.storeId)}
            />
          ))}

          {/* Add Store card */}
          <button
            onClick={openAddModal}
            className="flex min-h-70 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card/50 text-muted-foreground transition-all hover:border-primary/40 hover:bg-card hover:text-foreground"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
              <Plus className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="font-medium">Add New Store</p>
              <p className="text-xs text-muted-foreground">Track up to 50 Shopify stores</p>
            </div>
          </button>
        </div>
      )}
    </PageLayout>
  )
}