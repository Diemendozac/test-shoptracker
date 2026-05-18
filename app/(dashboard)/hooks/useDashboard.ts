
'use client'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setSelectedStore, setTrackerFilter, setSearchQuery } from '../store/dashboardSlice'
import {
  useGetStoreOverviewQuery,
  useGetTrackerCandidatesQuery,
} from '../services/dashboardApi'
import type { PerformanceLabel } from '@/lib/types'

export function useDashboard() {
  const dispatch = useAppDispatch()
  const { selectedStoreId, trackerFilter, searchQuery } = useAppSelector((s) => s.dashboard)

  const overview = useGetStoreOverviewQuery()

  const tracker = useGetTrackerCandidatesQuery(
    { storeId: selectedStoreId ?? undefined },
    { skip: false }
  )

  // Stats calculados desde los datos reales
  const candidates = tracker.data ?? []
  const stats = {
    totalCandidates: candidates.length,
    risingCandidates: candidates.filter((c) => c.performanceLabel === 'Rising').length,
    avgScore:
      candidates.length > 0
        ? candidates.reduce((acc, c) => acc + (c.performanceScore ?? 0), 0) / candidates.length
        : 0,
  }

  // Filtrado local (sin re-fetch)
  const filteredCandidates = candidates.filter((c) => {
    const matchesFilter = trackerFilter === 'all' || c.performanceLabel === trackerFilter
    const matchesSearch =
      searchQuery === '' ||
      c.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.storeName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return {
    // state
    selectedStoreId,
    trackerFilter,
    searchQuery,
    // data
    overviewItems: overview.data ?? [],
    allCandidates: candidates,
    filteredCandidates,
    stats,
    // loading
    isOverviewLoading: overview.isLoading,
    isTrackerLoading: tracker.isLoading,
    overviewError: overview.error,
    trackerError: tracker.error,
    // actions
    selectStore: (id: string | null) => dispatch(setSelectedStore(id)),
    setFilter: (f: PerformanceLabel | 'all') => dispatch(setTrackerFilter(f)),
    setSearch: (q: string) => dispatch(setSearchQuery(q)),
  }
}