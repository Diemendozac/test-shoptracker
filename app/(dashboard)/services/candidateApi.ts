import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '@/store'

export interface PendingCandidate {
  candidateId: string
  storeId: string
  storeName: string
  productHandle: string
  productTitle: string
  productImage: string | null
  productUrl: string | null
  productPrice: number | null
  currency: string | null
  firstSeenDate: string
  firstSeenRank: number | null
}

export const candidateApi = createApi({
  reducerPath: 'candidateApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL + '/candidates',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Pending', 'Tracker'],
  endpoints: (builder) => ({

    getPendingCandidates: builder.query<PendingCandidate[], void>({
      query: () => '/pending',
      providesTags: ['Pending'],
    }),

    activateCandidate: builder.mutation<void, string>({
      query: (candidateId) => ({
        url: `/${candidateId}/activate`,
        method: 'POST',
      }),
      invalidatesTags: ['Pending'],
    }),

    cancelCandidate: builder.mutation<void, string>({
      query: (candidateId) => ({
        url: `/${candidateId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Pending'],
    }),

    removeCandidate: builder.mutation<void, string>({
      query: (candidateId) => ({
        url: `/${candidateId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Pending', 'Tracker'],
    }),

  }),
})

export const {
  useGetPendingCandidatesQuery,
  useActivateCandidateMutation,
  useCancelCandidateMutation,
  useRemoveCandidateMutation,
} = candidateApi
