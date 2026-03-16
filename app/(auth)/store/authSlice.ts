
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthResponse } from '../services/authApi'

interface AuthState {
  user: AuthResponse['user'] | null
  token: string | null
  isAuthenticated: boolean
}

const getInitialToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

const initialState: AuthState = {
  user: null,
  token: getInitialToken(),
  isAuthenticated: !!getInitialToken(),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthResponse>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      localStorage.setItem('auth_token', action.payload.token)
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('auth_token')
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer