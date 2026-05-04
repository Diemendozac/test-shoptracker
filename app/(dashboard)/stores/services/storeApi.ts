
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '@/store'
import type { StoreResponse, CreateStoreRequest } from '../types'

export const storesApi = createApi({
  reducerPath: 'storesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL + '/stores',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Store'],
  endpoints: (builder) => ({

    // GET /api/stores
    getStores: builder.query<StoreResponse[], void>({
      query: () => '',
      providesTags: ['Store'],
    }),

    // POST /api/stores
    createStore: builder.mutation<StoreResponse, CreateStoreRequest>({
      query: (body) => ({ url: '/sync', method: 'POST', body }),
      invalidatesTags: ['Store'],
    }),

    // DELETE /api/stores/:storeId
    deleteStore: builder.mutation<void, string>({
      query: (storeId) => ({ url: `/${storeId}`, method: 'DELETE' }),
      invalidatesTags: ['Store'],
    }),

    // POST /api/stores/:storeId/sync
    syncStore: builder.mutation<void, string>({
      query: (storeId) => ({ url: `/${storeId}/sync`, method: 'POST' }),
    }),

  }),
})

export const {
  useGetStoresQuery,
  useCreateStoreMutation,
  useDeleteStoreMutation,
  useSyncStoreMutation
} = storesApi