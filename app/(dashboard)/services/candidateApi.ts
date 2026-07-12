import { createApi } from '@reduxjs/toolkit/query/react'
import { makeAuthBaseQuery } from '@/lib/baseQuery'

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
  baseQuery: makeAuthBaseQuery(process.env.NEXT_PUBLIC_API_URL + '/candidates'),
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

    bulkActivateCandidates: builder.mutation<{ activated: number }, string[]>({
      query: (candidateIds) => ({
        url: '/bulk-activate',
        method: 'POST',
        body: { candidateIds },
      }),
      invalidatesTags: ['Pending'],
    }),

    bulkCancelCandidates: builder.mutation<{ deleted: number }, string[]>({
      query: (candidateIds) => ({
        url: '/bulk',
        method: 'DELETE',
        body: { candidateIds },
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
  useBulkActivateCandidatesMutation,
  useBulkCancelCandidatesMutation,
  useCancelCandidateMutation,
  useRemoveCandidateMutation,
} = candidateApi
