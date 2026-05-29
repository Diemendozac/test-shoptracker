'use client'

import { useState } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { TrackerTable } from '@/components/tracker/tracker-table'
import { HeroSignalCard } from '@/components/tracker/hero-signal-card'
import { ShootingStars } from '@/components/tracker/shooting-stars'
import { useGetWindowCandidatesQuery } from '../services/dashboardApi'
import type { TrackerCandidate } from '../types'
import { cn } from '@/lib/utils'
import { useDashboard } from '../hooks/useDashboard'
import { KpiCards } from '@/components/tracker/kpi-cards'

const WINDOW_OPTIONS = [
  { label: 'Todos', days: 0 },
  { label: '7d',    days: 7 },
  { label: '15d',   days: 15 },
  { label: '30d',   days: 30 },
] as const

export default function TrackerPage() {
  const [windowDays, setWindowDays] = useState(0)

  const {
    allCandidates,
    filteredCandidates,
    isTrackerLoading,
  } = useDashboard()

  const { data: windowData, isFetching: isWindowFetching } = useGetWindowCandidatesQuery(
    { days: windowDays },
    { skip: windowDays === 0 }
  )

  const windowAsTracker: TrackerCandidate[] = (windowData ?? []).map((w) => ({
    ...w,
    performanceScore: w.windowScore,
    entryScore: null,
    productPrice: null,
    currentRank: null,
    estUnitsDayLow: null,
    estRevDayLow: null,
    niche: null,
    currency: null,
    pagoAnticipado: null,
    signalConfidence: 0,
    cyclePhase: null,
  }))

  const raceTrackCandidates = windowDays > 0 ? windowAsTracker : allCandidates

  const tableCandidates = windowDays > 0
    ? filteredCandidates.filter(c => c.daysElapsed <= windowDays)
    : filteredCandidates

  return (
    <PageLayout>
      {/* Hero signal — best candidate across all tracked products */}
      {!isTrackerLoading && <HeroSignalCard candidates={allCandidates} />}

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
            Testeados hace ≤{windowDays} días
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
          {tableCandidates.length} candidatos
        </span>
      </div>
      <TrackerTable candidates={tableCandidates} windowDays={windowDays} />
    </PageLayout>
  )
}
