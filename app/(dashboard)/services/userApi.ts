import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '@/store'

export interface UserProfile {
  userId: string
  email: string
  plan: string
  maxStores: number
  createdAt: string
  autoDetectCandidates: boolean
  preferredCurrency: string | null
}

export interface NotificationPending {
  candidateId: string
  productTitle: string
  storeName: string
  storeId: string
  firstSeenDate: string
  firstSeenRank: number
}

export interface NotificationAlert {
  candidateId: string
  storeId: string
  productTitle: string
  storeName: string
  performanceScore: number
  performanceLabel: string
  growthPct: number
  alertSentAt: string
}

export interface NotificationsResponse {
  pending: NotificationPending[]
  alerts: NotificationAlert[]
}

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL + '/users',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Me'],
  endpoints: (builder) => ({

    getMe: builder.query<UserProfile, void>({
      query: () => '/me',
      providesTags: ['Me'],
    }),

    changePassword: builder.mutation<void, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: '/me/password', method: 'PUT', body }),
    }),

    updatePreferences: builder.mutation<void, { autoDetectCandidates?: boolean; preferredCurrency?: string | null }>({
      query: (body) => ({ url: '/me/preferences', method: 'PATCH', body }),
      invalidatesTags: ['Me'],
    }),

    getNotifications: builder.query<NotificationsResponse, void>({
      query: () => '/notifications',
      providesTags: ['Me'],
    }),

  }),
})

export const { useGetMeQuery, useChangePasswordMutation, useGetNotificationsQuery, useUpdatePreferencesMutation } = userApi
