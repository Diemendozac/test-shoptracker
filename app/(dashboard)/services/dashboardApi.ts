
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '@/store'
import type { StoreOverviewItem, TrackerCandidate, WindowCandidate, CandidateDetail, WeeklyWinnerResponse, PoolWinnersResponse, DashboardInsight, PodiumResponse } from '../types'

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

    // GET /api/dashboard/pool/winners?page=&size=&pagoAnticipado=
    getPoolWinners: builder.query<PoolWinnersResponse, { page?: number; size?: number; pagoAnticipado?: boolean }>({
      query: ({ page = 0, size = 20, pagoAnticipado } = {}) => ({
        url: '/pool/winners',
        params: { page, size, ...(pagoAnticipado != null && { pagoAnticipado }) },
      }),
      providesTags: ['Pool'],
    }),

    // GET /api/dashboard/tracker/window?days=N
    getWindowCandidates: builder.query<WindowCandidate[], { days: number }>({
      query: ({ days }) => ({ url: '/tracker/window', params: { days } }),
      providesTags: ['Tracker'],
    }),

    // GET /api/dashboard/stores/:storeId/candidates/:candidateId
    getCandidateDetail: builder.query<CandidateDetail, { storeId: string; candidateId: string }>({
      query: ({ storeId, candidateId }) =>
        `/stores/${storeId}/candidates/${candidateId}`,
      providesTags: (_r, _e, { candidateId }) => [{ type: 'Candidate', id: candidateId }],
    }),

    // GET /api/dashboard/insights
    getInsights: builder.query<DashboardInsight[], void>({
      query: () => '/insights',
      providesTags: ['Tracker'],
    }),

    // GET /api/dashboard/podium?days=N (0 = all time)
    getPodium: builder.query<PodiumResponse, { days: number }>({
      query: ({ days }) => ({ url: '/podium', params: { days } }),
      providesTags: ['Winner'],
    }),

  }),
})

export const {
  useGetStoreOverviewQuery,
  useGetTrackerCandidatesQuery,
  useGetWindowCandidatesQuery,
  useGetCandidateDetailQuery,
  useGetWeeklyWinnerQuery,
  useGetPoolWinnersQuery,
  useGetInsightsQuery,
  useGetPodiumQuery,
} = dashboardApi