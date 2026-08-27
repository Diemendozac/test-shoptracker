import { createApi } from '@reduxjs/toolkit/query/react'
import { makeAuthBaseQuery } from '@/lib/baseQuery'

export interface AdminUserRow {
  userId: string
  email: string
  plan: string
  maxStores: number
  createdAt: string
  lastLogin: string | null
  activeStores: number
  totalStores: number
  candidates: number
}

export interface AdminUsersResponse {
  totalUsers: number
  byPlan: Record<string, number>
  activeLastWeek: number
  users: AdminUserRow[]
}

export interface ScraperRunRow {
  id: string
  startedAt: string
  finishedAt: string | null
  status: 'success' | 'partial' | 'failure'
  itemsTotal: number | null
  itemsOk: number | null
  itemsError: number | null
  errorSample: string | null
  metadata: string | null
}

export interface ScraperRunsResponse {
  days: number
  scrapers: Record<string, ScraperRunRow[]>
}

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: makeAuthBaseQuery(process.env.NEXT_PUBLIC_API_URL + '/admin'),
  tagTypes: ['AdminUsers', 'ScraperRuns'],
  endpoints: (builder) => ({
    getAdminUsers: builder.query<AdminUsersResponse, void>({
      query: () => '/users',
      providesTags: ['AdminUsers'],
    }),
    updateUserPlan: builder.mutation<{ userId: string; email: string; plan: string; maxStores: number }, { userId: string; plan: string }>({
      query: ({ userId, plan }) => ({
        url: `/users/${userId}/plan`,
        method: 'PATCH',
        body: { plan },
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    getScraperRuns: builder.query<ScraperRunsResponse, { days?: number } | void>({
      query: (arg) => `/scraper-runs?days=${arg?.days ?? 30}`,
      providesTags: ['ScraperRuns'],
    }),
  }),
})

export const { useGetAdminUsersQuery, useUpdateUserPlanMutation, useGetScraperRunsQuery } = adminApi
