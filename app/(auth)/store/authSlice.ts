
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthResponse } from '../services/authApi'

type AuthUser = AuthResponse['user']

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
}

const getInitialToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

const getInitialUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('auth_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const initialState: AuthState = {
  user: getInitialUser(),
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
      localStorage.setItem('auth_user', JSON.stringify(action.payload.user))
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer