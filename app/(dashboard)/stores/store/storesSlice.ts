import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface StoresUiState {
  isAddModalOpen: boolean
  deletingStoreId: string | null
  syncingStoreId: string | null   // ← nuevo
}

const initialState: StoresUiState = {
  isAddModalOpen: false,
  deletingStoreId: null,
  syncingStoreId: null,           // ← nuevo
}

const storesSlice = createSlice({
  name: 'stores',
  initialState,
  reducers: {
    openAddModal:  (state) => { state.isAddModalOpen = true },
    closeAddModal: (state) => { state.isAddModalOpen = false },
    setDeletingStore: (state, action: PayloadAction<string | null>) => {
      state.deletingStoreId = action.payload
    },
    setSyncingStore: (state, action: PayloadAction<string | null>) => {  // ← nuevo
      state.syncingStoreId = action.payload
    },
  },
})

export const { openAddModal, closeAddModal, setDeletingStore, setSyncingStore } = storesSlice.actions
export default storesSlice.reducer