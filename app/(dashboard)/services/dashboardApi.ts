
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '@/store'
import type { StoreOverviewItem, TrackerCandidate, WindowCandidate, CandidateDetail, WeeklyWinnerResponse, PoolWinnersResponse, DashboardInsight, PodiumResponse, ProductAdsResponse } from '../types'

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
  tagTypes: ['Overview', 'Tracker', 'Candidate', 'Winner', 'Pool', 'Ads'],
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

    // GET /api/dashboard/pool/winners?page=&size=&pagoAnticipado=&q=&niche=&currency=&days=&scalable=&country=
    getPoolWinners: builder.query<PoolWinnersResponse, {
      page?: number; size?: number; pagoAnticipado?: boolean
      q?: string; niche?: string[]; currency?: string[]; days?: number; scalable?: boolean; country?: string
    }>({
      query: ({ page = 0, size = 20, pagoAnticipado, q, niche, currency, days, scalable, country } = {}) => ({
        url: '/pool/winners',
        params: {
          page, size,
          ...(pagoAnticipado != null && { pagoAnticipado }),
          ...(q                && { q }),
          ...(niche?.length    && { niche }),    // TODO: backend pendiente
          ...(currency?.length && { currency }), // TODO: backend pendiente
          ...(days             && { days }),
          ...(scalable         && { scalable }),
          ...(country          && { country }),
        },
      }),
      providesTags: ['Pool'],
    }),

    // GET /api/dashboard/pool/countries — países distintos en todo el pool (no paginado)
    getPoolCountries: builder.query<{ countries: string[] }, void>({
      query: () => '/pool/countries',
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

    // GET /api/dashboard/candidates/{candidateId}/ads
    getProductAds: builder.query<ProductAdsResponse, string>({
      query: (candidateId) => `/candidates/${candidateId}/ads`,
      providesTags: (_r, _e, candidateId) => [{ type: 'Ads', id: candidateId }],
    }),

    // GET /api/dashboard/stores/{storeId}/ads/count
    getStoreAdsCount: builder.query<{ storeId: string; totalActiveAds: number }, string>({
      query: (storeId) => `/stores/${storeId}/ads/count`,
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
  useGetPoolCountriesQuery,
  useGetInsightsQuery,
  useGetPodiumQuery,
  useGetProductAdsQuery,
  useGetStoreAdsCountQuery,
} = dashboardApi