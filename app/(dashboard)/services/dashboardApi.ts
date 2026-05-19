
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '@/store'
import type { StoreOverviewItem, TrackerCandidate, CandidateDetail, WeeklyWinnerResponse, PoolWinnersResponse } from '../types'

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL + '/dashboard',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Overview', 'Tracker', 'Candidate', 'Winner', 'Pool'],
  endpoints: (builder) => ({

    // GET /api/dashboard
    getStoreOverview: builder.query<StoreOverviewItem[], void>({
      query: () => '',
      providesTags: ['Overview'],
    }),

    // GET /api/dashboard/tracker?storeId=
    getTrackerCandidates: builder.query<TrackerCandidate[], { storeId?: string }>({
      query: ({ storeId }) => ({
        url: '/tracker',
        params: storeId ? { storeId } : {},
      }),
      providesTags: ['Tracker'],
    }),

    // GET /api/dashboard/winner?storeId=
    getWeeklyWinner: builder.query<WeeklyWinnerResponse, { storeId: string }>({
      query: ({ storeId }) => ({ url: '/winner', params: { storeId } }),
      providesTags: ['Winner'],
    }),

    // GET /api/dashboard/pool/winners
    getPoolWinners: builder.query<PoolWinnersResponse, void>({
      query: () => '/pool/winners',
      providesTags: ['Pool'],
    }),

    // GET /api/dashboard/stores/:storeId/candidates/:candidateId
    getCandidateDetail: builder.query<CandidateDetail, { storeId: string; candidateId: string }>({
      query: ({ storeId, candidateId }) =>
        `/stores/${storeId}/candidates/${candidateId}`,
      providesTags: (_r, _e, { candidateId }) => [{ type: 'Candidate', id: candidateId }],
    }),

  }),
})

export const {
  useGetStoreOverviewQuery,
  useGetTrackerCandidatesQuery,
  useGetCandidateDetailQuery,
  useGetWeeklyWinnerQuery,
  useGetPoolWinnersQuery,
} = dashboardApi