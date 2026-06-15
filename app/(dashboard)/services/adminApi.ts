import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '@/store'

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

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL + '/admin',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['AdminUsers'],
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
  }),
})

export const { useGetAdminUsersQuery, useUpdateUserPlanMutation } = adminApi
