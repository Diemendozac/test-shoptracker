// ShopTracker Types

export interface Store {
  storeId: string
  storeName: string
  baseUrl: string
  bestsellerPath: string
  recentPath: string
  isActive: boolean
  lastScrapedAt: string
}

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

export interface DashboardItem {
  storeId: string
  storeName: string
  storeUrl?: string
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
  createdAt: string | null
  performanceScore: number | null
  entryScore: number | null
  entryRank: number | null
  previousRank: number | null
  storeProductCount: number | null
  performanceLabel: PerformanceLabel
  growthPct: number | null
  daysInBestseller: number
  signalConfidence: number
  cyclePhase: string | null
  scoreHistory?: number[]
  growthHistory?: number[]
  rankHistory?: number[]
}

export interface CandidateDetail {
  candidateId: string
  productHandle: string
  productTitle: string
  productImage: string | null
  productUrl: string | null
  productPrice: number
  firstSeenDate: string
  trackingStartDate: string
  trackingStatus: 'active' | 'completed' | 'paused'
  daysElapsed: number
  daysInBestseller: number
}

export interface CandidateSummary {
  entryRank: number
  floorRank: number
  bestRank: number
  currentRank: number
  growthPct: number
  peakGrowthPct: number
  daysInBestseller: number
  performanceScore: number
  performanceLabel: PerformanceLabel
  signalConfidence: number
}

export interface HistoryEntry {
  trackingDay: number
  snapshotDate: string
  inBestseller: boolean
  bestsellerRank: number | null
  growthPct: number
  performanceScore: number
  performanceLabel: PerformanceLabel
}

export interface CandidateFullDetail {
  candidate: CandidateDetail
  summary: CandidateSummary
  history: HistoryEntry[]
}

export type PerformanceLabel = 'Rising' | 'Watching' | 'Declining' | 'Stable'

export interface User {
  userId: string
  email: string
}
