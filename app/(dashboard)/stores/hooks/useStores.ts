'use client'

import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { openAddModal, closeAddModal, setDeletingStore, setSyncingStore } from '../store/storesSlice'
import {
  useGetStoresQuery,
  useCreateStoreMutation,
  useDeleteStoreMutation,
  useSyncStoreMutation,
} from '../services/storeApi'
import { candidateApi } from '@/app/(dashboard)/services/candidateApi'
import { useToast } from '@/hooks/use-toast'
import type { CreateStoreRequest } from '../types'

export function useStores() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { toast } = useToast()
  const { isAddModalOpen, deletingStoreId, syncingStoreId } = useAppSelector((s) => s.stores)

  const { data: stores = [], isLoading, error } = useGetStoresQuery()
  const [createStoreMutation, { isLoading: isCreating }] = useCreateStoreMutation()
  const [deleteStoreMutation, { isLoading: isDeleting }] = useDeleteStoreMutation()
  const [syncStoreMutation] = useSyncStoreMutation()

  const addStore = async (req: CreateStoreRequest) => {
    await createStoreMutation(req).unwrap()
    dispatch(closeAddModal())
  }

  const deleteStore = async (storeId: string) => {
    dispatch(setDeletingStore(storeId))
    try {
      await deleteStoreMutation(storeId).unwrap()
    } finally {
      dispatch(setDeletingStore(null))
    }
  }

  const syncStore = async (storeId: string, storeName: string) => {
    dispatch(setSyncingStore(storeId))
    try {
      const result = await syncStoreMutation(storeId).unwrap()
      dispatch(candidateApi.util.invalidateTags(['Pending']))

      if (result.newCandidates > 0) {
        const n = result.newCandidates
        toast({
          title: `${n} producto${n !== 1 ? 's' : ''} nuevo${n !== 1 ? 's' : ''} detectado${n !== 1 ? 's' : ''}`,
          description: 'Revísalos en Testeos → Mis tiendas',
          action: (
            <button
              onClick={() => router.push('/tracker')}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Ver ahora
            </button>
          ) as any,
        })
      } else {
        toast({
          title: 'Sync completo',
          description: `${storeName} actualizada sin productos nuevos.`,
        })
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Sync fallido',
        description: `No se pudo sincronizar ${storeName}. Intenta de nuevo.`,
      })
    } finally {
      dispatch(setSyncingStore(null))
    }
  }

  return {
    stores,
    activeCount: stores.filter((s) => s.isActive).length,
    isLoading,
    error,
    isCreating,
    isDeleting,
    deletingStoreId,
    syncingStoreId,
    isAddModalOpen,
    openAddModal:  () => dispatch(openAddModal()),
    closeAddModal: () => dispatch(closeAddModal()),
    addStore,
    deleteStore,
    syncStore,
  }
}