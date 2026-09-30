
'use client'

import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setCredentials, logout } from '../store/authSlice'
import { markJustRegistered } from '../store/onboardingSlice'
import { useLoginMutation, useRegisterMutation } from '../services/authApi'
import type { LoginRequest, RegisterRequest } from '../services/authApi'

interface AuthRedirect {
  /** Link de pago de Mercado Pago del plan elegido en /pricing (CHANGE-125). */
  redirectTo?: string
}

export function useAuth() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { user, token, isAuthenticated } = useAppSelector((s) => s.auth)

  const [loginMutation, { isLoading: isLoginLoading, error: loginError }] = useLoginMutation()
  const [registerMutation, { isLoading: isRegisterLoading, error: registerError }] = useRegisterMutation()

  // Si la persona venía de elegir un plan, sigue al pago (navegación completa: es otro sitio).
  // Solo se acepta un link de mpago.la; cualquier otro valor se ignora y queda el destino de siempre.
  const go = (fallback: string, redirectTo?: string) => {
    if (redirectTo?.startsWith('https://mpago.la/')) window.location.assign(redirectTo)
    else router.push(fallback)
  }

  const login = async (credentials: LoginRequest, { redirectTo }: AuthRedirect = {}) => {
    const result = await loginMutation(credentials).unwrap()
    dispatch(setCredentials(result))
    go('/dashboard', redirectTo)
  }

  // El onboarding sigue siendo obligatorio: markJustRegistered queda guardado y el modal
  // aparece cuando la persona vuelve a la app después de pagar.
  const register = async (data: RegisterRequest, { redirectTo }: AuthRedirect = {}) => {
    const result = await registerMutation(data).unwrap()
    dispatch(setCredentials(result))
    dispatch(markJustRegistered())
    go('/home', redirectTo)
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