
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { PerformanceLabel } from '@/lib/types'

interface DashboardState {
  selectedStoreId: string | null   // gobierna el tab del tracker
  trackerFilter: PerformanceLabel | 'all'
  searchQuery: string
}

const initialState: DashboardState = {
  selectedStoreId: null,
  trackerFilter: 'all',
  searchQuery: '',
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setSelectedStore: (state, action: PayloadAction<string | null>) => {
      state.selectedStoreId = action.payload
      // reset filtros al cambiar de tienda
      state.trackerFilter = 'all'
      state.searchQuery = ''
    },
    setTrackerFilter: (state, action: PayloadAction<PerformanceLabel | 'all'>) => {
      state.trackerFilter = action.payload
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
  },
})

export const { setSelectedStore, setTrackerFilter, setSearchQuery } = dashboardSlice.actions
export default dashboardSlice.reducer