import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const STORAGE_KEY = 'shoptracker_currency'

function loadFromStorage(): string {
  if (typeof window === 'undefined') return 'USD'
  return localStorage.getItem(STORAGE_KEY) ?? 'USD'
}

const currencySlice = createSlice({
  name: 'currency',
  initialState: { code: loadFromStorage() },
  reducers: {
    setCurrency(state, action: PayloadAction<string>) {
      state.code = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, action.payload)
      }
    },
  },
})

export const { setCurrency } = currencySlice.actions
export default currencySlice.reducer
