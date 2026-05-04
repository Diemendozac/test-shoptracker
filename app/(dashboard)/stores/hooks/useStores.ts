'use client'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { openAddModal, closeAddModal, setDeletingStore, setSyncingStore } from '../store/storesSlice'
import {
  useGetStoresQuery,
  useCreateStoreMutation,
  useDeleteStoreMutation,
  useSyncStoreMutation,
} from '../services/storeApi'
import { useToast } from '@/hooks/use-toast'
import type { CreateStoreRequest } from '../types'

export function useStores() {
  const dispatch = useAppDispatch()
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
      await syncStoreMutation(storeId).unwrap()
      toast({
        title: 'Sync complete',
        description: `${storeName} data has been updated successfully.`,
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Sync failed',
        description: `Could not sync ${storeName}. Please try again.`,
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