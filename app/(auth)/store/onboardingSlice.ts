
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
  step: number
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

const getInitialState = (): OnboardingState => {
  if (typeof window === 'undefined') return { step: 0, answers: emptyAnswers }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { step: 0, answers: emptyAnswers }
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
    nextStep: (state) => {
      state.step += 1
      persist(state)
    },
    prevStep: (state) => {
      state.step = Math.max(0, state.step - 1)
      persist(state)
    },
    resetOnboarding: (state) => {
      state.step = 0
      state.answers = emptyAnswers
      if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY)
    },
  },
})

export const { setAnswer, nextStep, prevStep, resetOnboarding } = onboardingSlice.actions
export default onboardingSlice.reducer