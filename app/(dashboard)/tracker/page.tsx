'use client'

import { useState } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { TrackerTable } from '@/components/tracker/tracker-table'
import { WinnerCard } from '@/components/tracker/winner-card'
import { ShootingStars } from '@/components/tracker/shooting-stars'
import { PoolWinnersSection } from '@/components/tracker/pool-winners'
import { PendingCandidatesSection } from '@/components/tracker/pending-candidates'
import { useGetWeeklyWinnerQuery, useGetPoolWinnersQuery, useGetWindowCandidatesQuery } from '../services/dashboardApi'
import type { PerformanceLabel } from '@/lib/types'
import type { TrackerCandidate } from '../types'
import { cn } from '@/lib/utils'
import { Filter, SortAsc, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDashboard } from '../hooks/useDashboard'
import { KpiCards } from '@/components/tracker/kpi-cards'

const WINDOW_OPTIONS = [
  { label: 'Todos', days: 0 },
  { label: '3d',    days: 3 },
  { label: '5d',    days: 5 },
  { label: '30d',   days: 30 },
] as const

const statusFilters: { label: string; value: PerformanceLabel | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Rising', value: 'Rising' },
  { label: 'Watching', value: 'Watching' },
  { label: 'Stable', value: 'Stable' },
  { label: 'Declining', value: 'Declining' },
]

export default function TrackerPage() {
  const [windowDays, setWindowDays] = useState(0)

  const {
    trackerFilter,
    searchQuery,
    allCandidates,
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

  const { data: poolData, isLoading: isPoolLoading } = useGetPoolWinnersQuery()

  const { data: windowData, isFetching: isWindowFetching } = useGetWindowCandidatesQuery(
    { days: windowDays },
    { skip: windowDays === 0 }
  )

  const windowAsTracker: TrackerCandidate[] = (windowData ?? []).map((w) => ({
    ...w,
    performanceScore: w.windowScore,
    entryScore: null,
  }))

  const raceTrackCandidates = windowDays > 0 ? windowAsTracker : allCandidates

  return (
    <PageLayout title="Tracker" description="All active candidates in tracking window">
      {/* Pending candidates — awaiting user approval */}
      <PendingCandidatesSection />

      {/* Pool winners — global intelligence feed */}
      <PoolWinnersSection data={poolData} isLoading={isPoolLoading} />

      {/* Winner banner — per-store */}
      {winnerData?.winner && (
        <WinnerCard winner={winnerData.winner} runnersUp={winnerData.runnersUp} />
      )}

      {/* Window selector */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Vista:</span>
        <div className="flex rounded-lg border border-border bg-secondary/30 p-1">
          {WINDOW_OPTIONS.map(({ label, days }) => (
            <button
              key={days}
              onClick={() => setWindowDays(days)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-all',
                windowDays === days
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {windowDays > 0 && (
          <span className="text-[10px] text-muted-foreground">
            Score promedio últimos {windowDays} días
          </span>
        )}
      </div>

      {/* Shooting stars — top 5 */}
      {isTrackerLoading || (windowDays > 0 && isWindowFetching) ? (
        <div className="mb-6 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      ) : (
        <ShootingStars
          candidates={raceTrackCandidates}
          onRequestFullTable={() => {}}
          showFullTable={false}
        />
      )}

      {/* KPI cards */}
      {!isTrackerLoading && <KpiCards candidates={allCandidates} />}

      {/* Product Leaderboard */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Product Leaderboard</h2>
        <span className="text-xs text-muted-foreground">
          {filteredCandidates.length} candidatos
        </span>
      </div>
      <TrackerTable candidates={filteredCandidates} />
    </PageLayout>
  )
}
