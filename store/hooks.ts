
// src/store/hooks.ts
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './index'
import { setCurrency } from './currencySlice'
import { useUpdatePreferencesMutation } from '@/app/(dashboard)/services/userApi'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector = <T>(selector: (state: RootState) => T) =>
  useSelector(selector)

export function useCurrency() {
  const dispatch    = useAppDispatch()
  const code        = useAppSelector((s) => s.currency.code)
  const [updatePreferences] = useUpdatePreferencesMutation()

  function change(newCode: string) {
    dispatch(setCurrency(newCode))
    updatePreferences({ preferredCurrency: newCode })
  }

  return { currency: code, setCurrency: change }
}