
import { createApi } from '@reduxjs/toolkit/query/react'
import type { StoreOverviewItem, TrackerCandidate, WindowCandidate, CandidateDetail, WeeklyWinnerResponse, PoolWinnersResponse, DashboardInsight, PodiumResponse, ProductAdsResponse, AdsLibraryResponse } from '../types'
import { makeAuthBaseQuery } from '@/lib/baseQuery'

export interface AdsLibraryParams {
  size?: number
  status?: 'active' | 'inactive'
  minDaysRunning?: number; maxDaysRunning?: number
  niche?: string[]; country?: string
}

function adsLibraryParams({ size = 24, status, minDaysRunning, maxDaysRunning, niche, country }: AdsLibraryParams, page: number) {
  return {
    page, size,
    ...(status              && { status }),
    ...(minDaysRunning != null && { minDaysRunning }),
    ...(maxDaysRunning != null && { maxDaysRunning }),
    ...(niche?.length       && { niche }),
    ...(country              && { country }),
  }
}

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: makeAuthBaseQuery(process.env.NEXT_PUBLIC_API_URL + '/dashboard'),
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

    // GET /api/dashboard/pool/winners?page=&size=&pagoAnticipado=&q=&niche=&currency=&days=&scalable=&country=&hasVideo=
    getPoolWinners: builder.query<PoolWinnersResponse, {
      page?: number; size?: number; pagoAnticipado?: boolean
      q?: string; niche?: string[]; currency?: string[]; days?: number; daysExact?: number; scalable?: boolean; country?: string
      hasVideo?: boolean
    }>({
      query: ({ page = 0, size = 20, pagoAnticipado, q, niche, currency, days, daysExact, scalable, country, hasVideo } = {}) => ({
        url: '/pool/winners',
        params: {
          page, size,
          ...(pagoAnticipado != null && { pagoAnticipado }),
          ...(q                && { q }),
          ...(niche?.length    && { niche }),
          ...(currency?.length && { currency }),
          ...(days             && { days }),
          ...(daysExact        && { daysExact }), // días en testeo exactos (slider 1-30), distinto de "days"
          ...(scalable         && { scalable }),
          ...(country          && { country }),
          ...(hasVideo         && { hasVideo }),
        },
      }),
      providesTags: ['Pool'],
    }),

    // GET /api/dashboard/pool/search?q=&page=&size=&country= — archivo: candidatos que ya
    // salieron del tracking activo (completed/winner) pero siguen siendo buscables por keyword,
    // con expansión de sinónimos por IA en el backend (FIX-053). q es obligatorio.
    getPoolSearch: builder.query<PoolWinnersResponse, {
      q: string; page?: number; size?: number; country?: string
    }>({
      query: ({ q, page = 0, size = 20, country }) => ({
        url: '/pool/search',
        params: {
          q, page, size,
          ...(country && { country }),
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

    // GET /api/dashboard/ads-library?page=&size=&status=&minDaysRunning=&maxDaysRunning=&niche=&country=
    // Biblioteca de anuncios (2026-09-15, wiki scout-biblioteca-anuncios-propuesta) — a
    // diferencia de getPoolWinners, no filtra por tracking_status del candidato.
    // Desde 2026-09-29 la pantalla usa getAdsLibraryPages; este queda para los conteos (size: 1).
    getAdsLibrary: builder.query<AdsLibraryResponse, AdsLibraryParams & { page?: number }>({
      query: ({ page = 0, ...params } = {}) => ({
        url: '/ads-library',
        params: adsLibraryParams(params, page),
      }),
      providesTags: ['Ads'],
    }),

    // La misma consulta, por páginas acumuladas: "Cargar más" en la Biblioteca
    // (docs/redesign/biblioteca-anuncios/03-spec.md, L1).
    getAdsLibraryPages: builder.infiniteQuery<AdsLibraryResponse, AdsLibraryParams, number>({
      infiniteQueryOptions: {
        initialPageParam: 0,
        getNextPageParam: (lastPage, _allPages, lastPageParam) =>
          lastPageParam + 1 < (lastPage.totalPages ?? 0) ? lastPageParam + 1 : undefined,
      },
      query: ({ queryArg, pageParam }) => ({
        url: '/ads-library',
        params: adsLibraryParams(queryArg, pageParam),
      }),
      providesTags: ['Ads'],
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
  useGetPoolSearchQuery,
  useGetPoolCountriesQuery,
  useGetInsightsQuery,
  useGetPodiumQuery,
  useGetProductAdsQuery,
  useGetStoreAdsCountQuery,
  useGetAdsLibraryQuery,
  useGetAdsLibraryPagesInfiniteQuery,
} = dashboardApi