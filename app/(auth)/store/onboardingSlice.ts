
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface OnboardingAnswers {
  country: string
  phone: string
  phoneOptIn: boolean
  soloOrTeam: string
  businessModel: string
  objective: string
  niches: string[]
  platforms: string[]
}

interface OnboardingState {
  // True only right after a fresh register() this session — the modal gate reads this,
  // never `!completed` alone, so existing users who just log in never see it.
  justRegistered: boolean
  completed: boolean
  answers: OnboardingAnswers
}

const STORAGE_KEY = 'onboarding_progress'

const emptyAnswers: OnboardingAnswers = {
  country: '',
  phone: '',
  phoneOptIn: false,
  soloOrTeam: '',
  businessModel: '',
  objective: '',
  niches: [],
  platforms: [],
}

const emptyState: OnboardingState = {
  justRegistered: false,
  completed: false,
  answers: emptyAnswers,
}

const getInitialState = (): OnboardingState => {
  if (typeof window === 'undefined') return emptyState
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...emptyState, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return emptyState
}

const persist = (state: OnboardingState) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState: getInitialState(),
  reducers: {
    setAnswer: (state, action: PayloadAction<Partial<OnboardingAnswers>>) => {
      state.answers = { ...state.answers, ...action.payload }
      persist(state)
    },
    markJustRegistered: (state) => {
      state.justRegistered = true
      persist(state)
    },
    markOnboardingCompleted: (state) => {
      state.completed = true
      state.justRegistered = false
      persist(state)
    },
    // Closes the modal (X / Escape / click outside) without claiming the
    // onboarding was actually completed — answers stay in localStorage so a
    // future retry can pick them up once the backend endpoint works.
    dismissOnboarding: (state) => {
      state.justRegistered = false
      persist(state)
    },
    resetOnboarding: () => {
      if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY)
      return emptyState
    },
  },
})

export const { setAnswer, markJustRegistered, markOnboardingCompleted, dismissOnboarding, resetOnboarding } = onboardingSlice.actions
export default onboardingSlice.reducer
