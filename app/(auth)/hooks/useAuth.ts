
'use client'

import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setCredentials, logout } from '../store/authSlice'
import { useLoginMutation, useRegisterMutation } from '../services/authApi'
import type { LoginRequest, RegisterRequest } from '../services/authApi'

export function useAuth() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { user, token, isAuthenticated } = useAppSelector((s) => s.auth)

  const [loginMutation, { isLoading: isLoginLoading, error: loginError }] = useLoginMutation()
  const [registerMutation, { isLoading: isRegisterLoading, error: registerError }] = useRegisterMutation()

  const login = async (credentials: LoginRequest) => {
    const result = await loginMutation(credentials).unwrap()
    dispatch(setCredentials(result))
    router.push('/dashboard')
  }

  const register = async (data: RegisterRequest) => {
    const result = await registerMutation(data).unwrap()
    dispatch(setCredentials(result))
    router.push('/dashboard')
  }

  const signOut = () => {
    dispatch(logout())
    router.push('/login')
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    signOut,
    isLoginLoading,
    isRegisterLoading,
    loginError,
    registerError,
  }
}