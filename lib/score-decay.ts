/**
 * Temporal decay utilities for performance score.
 *
 * Rationale: a product that grew early but has been stagnant for weeks should
 * not keep a high score. We penalise the growth-weighted portion of the score
 * (≈50%) by a decay factor derived from days without rank improvement.
 *
 * decayFactor = Math.max(0.3, 1 - daysSinceLastImprovement / 30)
 * adjustedScore = rawScore × (0.5 × decayFactor + 0.5)
 *
 * Floor of 0.3 prevents a historically-good product from being zeroed out.
 * Products with < 3 valid snapshots are exempt (insufficient signal).
 */

/**
 * How many days have passed since the rank last improved.
 *
 * ranks: oldest → newest, null/0 entries are ignored.
 * A lower rank number means a better position.
 *
 * Returns 0 if the most-recent snapshot was an improvement.
 * Returns (valid.length - 1) if the rank never improved.
 */
export function daysSinceLastImprovement(
  ranks: (number | null | undefined)[],
): number {
  const valid = ranks.filter((r): r is number => r != null && r > 0)
  if (valid.length < 2) return 0

  for (let i = valid.length - 1; i > 0; i--) {
    if (valid[i] < valid[i - 1]) {
      // rank improved on snapshot i → days since last improvement
      return (valid.length - 1) - i
    }
  }

  // Rank never improved → stagnant for the entire history window
  return valid.length - 1
}

/**
 * Decay factor in [0.3, 1.0].
 *
 * Returns 1.0 (no penalty) when:
 * - fewer than 3 valid rank snapshots exist
 * - daysElapsed < 3
 * - the product improved its rank today
 */
export function computeDecayFactor(
  rankHistory: (number | null | undefined)[],
  daysElapsed: number,
): number {
  const validCount = rankHistory.filter(r => r != null && r > 0).length
  if (validCount < 3 || daysElapsed < 3) return 1.0

  const days = daysSinceLastImprovement(rankHistory)
  return Math.max(0.3, 1 - days / 30)
}

/**
 * Adjusted display score that penalises stagnation.
 *
 * Only the growth-weighted component (~50%) is affected by decay;
 * momentum and rank-quality components remain intact.
 *
 * Result is clamped to [0, 100] and rounded to an integer.
 */
export function applyScoreDecay(
  rawScore: number | null | undefined,
  rankHistory: (number | null | undefined)[],
  daysElapsed: number,
): number {
  if (rawScore == null) return 0
  const decay = computeDecayFactor(rankHistory, daysElapsed)
  return Math.min(100, Math.max(0, Math.round(rawScore * (0.5 * decay + 0.5))))
}
