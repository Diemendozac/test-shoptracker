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
    const result = await createStoreMutation(req).unwrap()
    if (!result.subscribedToExisting) dispatch(closeAddModal())
    return result
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
        })
        router.push('/tracker')
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