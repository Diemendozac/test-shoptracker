import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { RootState } from '@/store'
import { logout } from '@/app/(auth)/store/authSlice'

export function makeAuthBaseQuery(baseUrl: string): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> {
  const raw = fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  })

  return async (args, api, extraOptions) => {
    const result = await raw(args, api, extraOptions)
    if (result.error?.status === 401) {
      api.dispatch(logout())
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return result
  }
}