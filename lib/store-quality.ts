interface CandidateForQuality {
  performanceScore: number | null
  performanceLabel: string
  growthPct: number | null
  firstSeenDate?: string | null
}

export interface StoreQuality {
  stars: 1 | 2 | 3 | 4 | 5
  finalScore: number
  activityScore: number
  qualityScore: number
  candidateCount: number
  avgPerformanceScore: number
  risingPct: number
  avgGrowthPct: number
  weeklyRate: number | null
}

export function computeStoreQuality(candidates: CandidateForQuality[], maxCandidates: number): StoreQuality | null {
  if (candidates.length < 3) return null

  const now = Date.now()
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

  // ── Activity dimension (40%) ─────────────────────────────────────────────
  const candidateCount = candidates.length
  const ceiling = Math.max(maxCandidates, 1)
  const volumeScore = Math.min((candidateCount / ceiling) * 100, 100)

  // Weekly cadence: avg new candidates per week over the last 30 days
  const withDates = candidates.filter(c => c.firstSeenDate != null)
  let weeklyRate: number | null = null
  let activityScore: number

  if (withDates.length >= 3) {
    const recentCount = withDates.filter(
      c => now - new Date(c.firstSeenDate!).getTime() <= thirtyDaysMs
    ).length
    weeklyRate = (recentCount / 30) * 7
    // Normalize: 5 new/week → 100
    const cadenceScore = Math.min((weeklyRate / 5) * 100, 100)
    activityScore = volumeScore * 0.5 + cadenceScore * 0.5
  } else {
    activityScore = volumeScore
  }

  // ── Quality dimension (60%) ──────────────────────────────────────────────
  const scores = candidates.map(c => c.performanceScore ?? 0)
  const avgPerformanceScore = scores.reduce((a, b) => a + b, 0) / scores.length

  const risingCount = candidates.filter(
    c => c.performanceLabel === 'Rising' || (c.performanceScore ?? 0) >= 70
  ).length
  const risingPct = risingCount / candidateCount

  const growths = candidates.map(c => c.growthPct ?? 0)
  const avgGrowthPct = growths.reduce((a, b) => a + b, 0) / growths.length
  // Only positive growth contributes; 200% avg growth = 100 pts. Zero or negative = 0.
  const normalizedGrowth = Math.min(Math.max(avgGrowthPct, 0) / 200 * 100, 100)

  const qualityScore =
    avgPerformanceScore * 0.5 +
    risingPct * 100 * 0.3 +
    normalizedGrowth * 0.2

  // ── Final ────────────────────────────────────────────────────────────────
  const finalScore = activityScore * 0.2 + qualityScore * 0.8

  const stars: 1 | 2 | 3 | 4 | 5 =
    finalScore >= 80 ? 5 :
    finalScore >= 60 ? 4 :
    finalScore >= 40 ? 3 :
    finalScore >= 20 ? 2 : 1

  return {
    stars,
    finalScore,
    activityScore,
    qualityScore,
    candidateCount,
    avgPerformanceScore,
    risingPct,
    avgGrowthPct,
    weeklyRate,
  }
}
