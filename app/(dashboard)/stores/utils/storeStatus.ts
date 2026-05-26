import type { StoreResponse } from '../types'

export type StoreStatus = 'ACTIVA' | 'INACTIVA' | 'ZOMBIE'

/**
 * Single source of truth for store health status.
 * Combines isActive + lastScrapedAt + backend inactivityTier into one value.
 */
export function getStoreStatus(
  store: Pick<StoreResponse, 'isActive' | 'lastScrapedAt' | 'inactivityTier'>,
): StoreStatus {
  const hoursAgo = store.lastScrapedAt
    ? (Date.now() - new Date(store.lastScrapedAt).getTime()) / (1000 * 60 * 60)
    : Infinity

  // Synced successfully in the last 24h → healthy, no badge
  if (store.isActive && hoursAgo < 24) return 'ACTIVA'

  // Backend marked ZOMBIE, or hasn't synced in over 7 days → ZOMBIE
  if (store.inactivityTier === 'ZOMBIE' || hoursAgo > 7 * 24) return 'ZOMBIE'

  // Everything else (1–7 days without successful sync) → INACTIVA
  return 'INACTIVA'
}
