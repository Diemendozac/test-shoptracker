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
  performanceScore: number
  performanceLabel: PerformanceLabel
  growthPct: number
}

export interface DashboardItem {
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
  performanceScore: number
  performanceLabel: PerformanceLabel
  growthPct: number
  daysInBestseller: number
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
