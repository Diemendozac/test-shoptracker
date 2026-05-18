'use client'

import { PageLayout } from '@/components/layout/page-layout'
import { TrackerTable } from '@/components/tracker/tracker-table'
import { WinnerCard } from '@/components/tracker/winner-card'
import { useGetWeeklyWinnerQuery } from '../services/dashboardApi'
import type { PerformanceLabel } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Filter, SortAsc, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDashboard } from '../hooks/useDashboard'

const statusFilters: { label: string; value: PerformanceLabel | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Rising', value: 'Rising' },
  { label: 'Watching', value: 'Watching' },
  { label: 'Stable', value: 'Stable' },
  { label: 'Declining', value: 'Declining' },
]

export default function TrackerPage() {
  const {
    trackerFilter,
    searchQuery,
    filteredCandidates,
    isTrackerLoading,
    setFilter,
    setSearch,
    selectedStoreId,
    overviewItems,
  } = useDashboard()

  const winnerStoreId = selectedStoreId ?? overviewItems[0]?.storeId ?? null

  const { data: winnerData } = useGetWeeklyWinnerQuery(
    { storeId: winnerStoreId! },
    { skip: !winnerStoreId }
  )

  return (
    <PageLayout title="Tracker" description="All active candidates in tracking window">
      {winnerData?.winner && (
        <WinnerCard winner={winnerData.winner} runnersUp={winnerData.runnersUp} />
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex rounded-lg border border-border bg-secondary/30 p-1">
            {statusFilters.map((status) => (
              <button
                key={status.value}
                onClick={() => setFilter(status.value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                  trackerFilter === status.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64 rounded-lg border border-border bg-input pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <SortAsc className="h-4 w-4" />
            Sort
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filteredCandidates.length}</span> candidates
        </p>
      </div>

      {isTrackerLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      ) : (
        <TrackerTable candidates={filteredCandidates} />
      )}
    </PageLayout>
  )
}