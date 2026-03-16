// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../app/(auth)/store/authSlice'
import { authApi } from '@/app/(auth)/services/authApi'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware), // 👈 esto es lo que falta
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch