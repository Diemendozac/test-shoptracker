
import { createApi } from '@reduxjs/toolkit/query/react'
import { makeAuthBaseQuery } from '@/lib/baseQuery'
import type { StoreResponse, CreateStoreRequest, UpdateStoreRequest } from '../types'

export interface AdvertiserPage {
  pageId:    string | null
  pageName:  string
  totalAds:  number | null
  firstSeen: string
  lastSeen:  string
}

export interface SyncResult {
  storeId: string
  storeName: string
  snapshotDate: string
  bestsellerSnapshots: number
  newCandidates: number
  trackingUpdated: number
  success: boolean
  errorMessage: string | null
}

export const storesApi = createApi({
  reducerPath: 'storesApi',
  baseQuery: makeAuthBaseQuery(process.env.NEXT_PUBLIC_API_URL + '/stores'),
  tagTypes: ['Store'],
  endpoints: (builder) => ({

    // GET /api/stores
    getStores: builder.query<StoreResponse[], void>({
      query: () => '',
      providesTags: ['Store'],
    }),

    // POST /api/stores
    createStore: builder.mutation<StoreResponse, CreateStoreRequest>({
      query: (body) => ({ url: '', method: 'POST', body }),
      invalidatesTags: ['Store'],
    }),

    // PUT /api/stores/:storeId
    updateStore: builder.mutation<StoreResponse, { storeId: string; body: UpdateStoreRequest }>({
      query: ({ storeId, body }) => ({ url: `/${storeId}`, method: 'PUT', body }),
      invalidatesTags: ['Store'],
    }),

    // DELETE /api/stores/:storeId
    deleteStore: builder.mutation<void, string>({
      query: (storeId) => ({ url: `/${storeId}`, method: 'DELETE' }),
      invalidatesTags: ['Store'],
    }),

    // POST /api/stores/:storeId/sync
    syncStore: builder.mutation<SyncResult, string>({
      query: (storeId) => ({ url: `/${storeId}/sync`, method: 'POST' }),
      invalidatesTags: ['Store'],
    }),

    // POST /api/stores/redetect-payments
    redetectPayments: builder.mutation<{ updated: number }, void>({
      query: () => ({ url: '/redetect-payments', method: 'POST' }),
      invalidatesTags: ['Store'],
    }),

    // GET /api/stores/:storeId/advertiser-pages
    getAdvertiserPages: builder.query<AdvertiserPage[], string>({
      query: (storeId) => `/${storeId}/advertiser-pages`,
    }),

  }),
})

export const {
  useGetStoresQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useDeleteStoreMutation,
  useSyncStoreMutation,
  useRedetectPaymentsMutation,
  useGetAdvertiserPagesQuery,
} = storesApi