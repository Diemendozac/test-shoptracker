import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '@/store'

export interface UserProfile {
  userId: string
  email: string
  plan: string
  maxStores: number
  createdAt: string
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

  }),
})

export const { useGetMeQuery, useChangePasswordMutation } = userApi
