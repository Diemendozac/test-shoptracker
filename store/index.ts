// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../app/(auth)/store/authSlice'
import onboardingReducer from '../app/(auth)/store/onboardingSlice'
import currencyReducer from './currencySlice'
import { authApi } from '@/app/(auth)/services/authApi'
import { dashboardApi } from '@/app/(dashboard)/services/dashboardApi';
import { storesApi } from '@/app/(dashboard)/stores/services/storeApi';
import { candidateApi } from '@/app/(dashboard)/services/candidateApi';
import { userApi } from '@/app/(dashboard)/services/userApi';
import { adminApi } from '@/app/(dashboard)/services/adminApi';
import dashboardReducer from '@/app/(dashboard)/store/dashboardSlice';
import storeReducer from '@/app/(dashboard)/stores/store/storesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    onboarding: onboardingReducer,
    currency: currencyReducer,
    stores: storeReducer,
    dashboard: dashboardReducer,
    [authApi.reducerPath]: authApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [storesApi.reducerPath]: storesApi.reducer,
    [candidateApi.reducerPath]: candidateApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      dashboardApi.middleware,
      storesApi.middleware,
      candidateApi.middleware,
      userApi.middleware,
      adminApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch