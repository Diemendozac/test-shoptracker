
import type { PerformanceLabel } from '@/lib/types'

export interface TopCandidate {
  candidateId: string
  productTitle: string
  productImage: string | null
  performanceScore: number
  performanceLabel: PerformanceLabel
  growthPct: number
}

export interface StoreOverviewItem {
  storeId: string
  storeName: string
  topCandidate: TopCandidate | null
}

export interface TrackerCandidate {
  candidateId: string
  storeId: string
  productTitle: string
  storeName: string
  daysElapsed: number
  performanceScore: number | null
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
}

export interface PoolWinnersResponse {
  locked: boolean
  plan: string
  winners: PoolWinnerProduct[]
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

export interface CandidateDetail {
  candidate: {
    candidateId: string
    productTitle: string
    productHandle: string
    productUrl: string | null
    productPrice: number
    productImage: string | null
    firstSeenDate: string
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