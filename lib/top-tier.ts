/**
 * Returns a "Nd en top X%" label based on consecutive recent rank history,
 * or null when the product is not in top 25% or data is insufficient.
 *
 * Only shows top 10% and top 25% tiers. Middle-of-the-catalog positions
 * are not worth highlighting.
 */
export function topTierLabel(
  rankHistory: number[] | undefined,
  storeProductCount: number | null | undefined,
  daysElapsed: number,
): string | null {
  if (!rankHistory || rankHistory.length === 0) return null
  if (!storeProductCount || storeProductCount <= 0) return null
  if (daysElapsed <= 2) return null

  // Count consecutive recent days in top 10%
  let days10 = 0
  for (let i = rankHistory.length - 1; i >= 0; i--) {
    if ((rankHistory[i] / storeProductCount) * 100 <= 10) days10++
    else break
  }
  if (days10 > 0) return `${days10}d en top 10%`

  // Count consecutive recent days in top 25%
  let days25 = 0
  for (let i = rankHistory.length - 1; i >= 0; i--) {
    if ((rankHistory[i] / storeProductCount) * 100 <= 25) days25++
    else break
  }
  if (days25 > 0) return `${days25}d en top 25%`

  return null
}
