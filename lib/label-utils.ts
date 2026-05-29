import type { PerformanceLabel } from '@/lib/types'

/**
 * Single source of truth for display labels — mirrors computeSmartLabel in the
 * tracker detail page but works from summary-level fields (no per-day entries).
 */
export function resolveDisplayLabel(
  label: string,
  performanceScore: number | null | undefined,
  growthPct: number | null | undefined,
  daysElapsed: number | null | undefined,
  scoreHistory?: number[],
  growthHistory?: number[],
): PerformanceLabel {
  const days  = daysElapsed ?? 999
  const score = performanceScore ?? 0
  const gp    = growthPct ?? 0

  if (days <= 2) return 'New'

  // Backend legacy value
  const raw = label === 'Stable' ? 'Steady' : label

  // Flat zero + near-zero score → no real signal yet
  if (gp === 0 && score < 5) return 'Watching'

  if (raw === 'Watching') {
    const prevGrowth = growthHistory && growthHistory.length >= 2
      ? growthHistory[growthHistory.length - 2]
      : null
    if (gp > 0 && prevGrowth != null && prevGrowth > 0) return 'Rising'
    return 'Watching'
  }

  if (raw === 'Declining') {
    // 3-day score uptrend overrides Declining → Rising
    if (scoreHistory && scoreHistory.length >= 3) {
      const [a, b, c] = scoreHistory.slice(-3)
      if (c > b && b > a) return 'Rising'
    }
    // Declining only holds when score fell AND rank worsened (negative growthPct)
    const prevScore = scoreHistory && scoreHistory.length >= 2
      ? scoreHistory[scoreHistory.length - 2]
      : null
    const scoreDrop = prevScore != null ? score < prevScore : false
    const rankWorse = gp < 0
    if (!(scoreDrop && rankWorse)) return 'Watching'
  }

  return raw as PerformanceLabel
}
