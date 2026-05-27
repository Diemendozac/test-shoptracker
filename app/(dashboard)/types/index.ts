
import type { PerformanceLabel } from '@/lib/types'

export interface TopCandidate {
  candidateId: string
  productTitle: string
  productImage: string | null
  productPrice: number | null
  currentRank: number | null
  estUnitsDayLow: number | null
  estRevDayLow: number | null
  performanceScore: number
  performanceLabel: PerformanceLabel
  growthPct: number
}

export interface StoreOverviewItem {
  storeId: string
  storeName: string
  inactivityTier: 'ACTIVA' | 'MODERADA' | 'INACTIVA' | 'ZOMBIE' | null
  topCandidate: TopCandidate | null
}

export interface TrackerCandidate {
  candidateId: string
  storeId: string
  productTitle: string
  productImage: string | null
  productPrice: number | null
  currentRank: number | null
  estUnitsDayLow: number | null
  estRevDayLow: number | null
  storeName: string
  niche: string | null
  currency: string | null
  pagoAnticipado: boolean | null
  daysElapsed: number
  firstSeenDate: string | null
  performanceScore: number | null
  entryScore: number | null
  entryRank: number | null
  performanceLabel: PerformanceLabel
  growthPct: number | null
  daysInBestseller: number
  storeProductCount?: number | null
  signalConfidence: number
  cyclePhase: string | null
  scoreHistory?: number[]
  growthHistory?: number[]
  rankHistory?: number[]
}

export interface WindowCandidate {
  candidateId: string
  storeId: string
  productTitle: string
  productImage: string | null
  storeName: string
  daysElapsed: number
  windowScore: number
  performanceLabel: PerformanceLabel
  growthPct: number | null
  daysInBestseller: number
  signalConfidence: number
  cyclePhase: string | null
}

export interface WinnerProduct {
  candidateId: string
  productTitle: string
  productImage: string | null
  productUrl: string | null
  productPrice: number | null
  performanceScore: number
  performanceLabel: string
  growthPct: number | null
  currentRank: number | null
  daysElapsed: number
  daysInBestseller: number
  signalConfidence: number
  cyclePhase: string | null
}

export interface WeeklyWinnerResponse {
  winner: WinnerProduct | null
  runnersUp: WinnerProduct[]
}

export interface PoolWinnerProduct extends WinnerProduct {
  storeId: string
  storeName: string
  niche: string | null
  currency: string | null
  pagoAnticipado: boolean | null
  estUnitsDayLow: number | null
  estRevDayLow: number | null
  storeProductCount: number | null
  previousRank: number | null
  scoreHistory?: number[]
  growthHistory?: number[]
  rankHistory?: number[]
}

export interface PodiumWinner {
  candidateId: string
  productTitle: string
  productImage: string | null
  storeName: string
  storeId: string
  performanceScore: number
  performanceLabel: string
  growthPct: number | null
  currentRank: number | null
  storeProductCount: number | null
  dateReachedTop: string | null
  daysInTop: number
}

export interface PodiumResponse {
  winners: PodiumWinner[]
  days: number
}

export interface PoolWinnersResponse {
  locked: boolean
  plan: string
  winners: PoolWinnerProduct[]
  total?: number
  page?: number
  totalPages?: number
}

export interface CandidateHistory {
  trackingDay: number
  snapshotDate: string
  inBestseller: boolean
  bestsellerRank: number | null
  growthPct: number
  performanceScore: number
  performanceLabel: PerformanceLabel
}

export interface DashboardInsight {
  type: 'rising' | 'streak' | 'score' | 'alert' | 'total' | 'task_stores' | 'task_scale' | 'task_pending'
  isTask: boolean
  emoji: string
  message: string
  cta: string
  ctaPath: string
}

export interface CandidateDetail {
  candidate: {
    candidateId: string
    productTitle: string
    productHandle: string
    productUrl: string | null
    productPrice: number
    productImage: string | null
    firstSeenDate: string
    currency: string | null
    daysElapsed: number
  }
  summary: {
    performanceScore: number
    performanceLabel: PerformanceLabel
    currentRank: number
    bestRank: number
    entryRank: number
    growthPct: number
    peakGrowthPct: number
    signalConfidence: number
    daysInBestseller: number
  } | null
  history: CandidateHistory[]
}