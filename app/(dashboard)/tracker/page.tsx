'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageLayout } from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button'
import { TrackerTable } from '@/components/tracker/tracker-table'
import { HeroSignalCard } from '@/components/tracker/hero-signal-card'
import { ShootingStars } from '@/components/tracker/shooting-stars'
import { useGetWindowCandidatesQuery } from '../services/dashboardApi'
import type { TrackerCandidate } from '../types'
import { cn } from '@/lib/utils'
import { useDashboard } from '../hooks/useDashboard'
import { KpiCards } from '@/components/tracker/kpi-cards'
import { usePlanTier } from '@/lib/view-as'
import { Star, Store, Lock } from 'lucide-react'

const WINDOW_OPTIONS = [
  { label: 'Todos', days: 0 },
  { label: '7d',    days: 7 },
  { label: '15d',   days: 15 },
  { label: '30d',   days: 30 },
] as const

export default function TrackerPage() {
  const { canViewTrackerMetrics } = usePlanTier()
  const [windowDays, setWindowDays] = useState(0)
  const [trackerPreset, setTrackerPreset] = useState<'all' | 'favorites'>('all')
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem('dropspy_favorites_tracker')
      return new Set(stored ? JSON.parse(stored) as string[] : [])
    } catch { return new Set() }
  })

  function toggleFavorite(id: string) {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem('dropspy_favorites_tracker', JSON.stringify([...next]))
      return next
    })
  }

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
    entryRank: null,
    productPrice: null,
    currentRank: null,
    estUnitsDayLow: null,
    estRevDayLow: null,
    niche: null,
    productNiche: null,
    currency: null,
    pagoAnticipado: null,
    firstSeenDate: null,
    createdAt: null,
    previousRank: null,
    storeProductCount: null,
    storeCountry: null,
    signalConfidence: 0,
    cyclePhase: null,
  }))

  const raceTrackCandidates = windowDays > 0 ? windowAsTracker : allCandidates

  const baseTableCandidates = windowDays > 0
    ? filteredCandidates.filter(c => c.daysElapsed <= windowDays)
    : filteredCandidates

  const tableCandidates = trackerPreset === 'favorites'
    ? baseTableCandidates.filter(c => favorites.has(c.candidateId))
    : baseTableCandidates

  // Sin ningún testeo (nunca se agregó una tienda, o ninguna tiene candidatos aún):
  // guiar a agregar tienda en vez de mostrar la tabla vacía como si fuera un filtro sin resultados.
  if (!isTrackerLoading && allCandidates.length === 0) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card py-24 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Todavía no tienes testeos</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Agrega una tienda para empezar a detectar productos nuevos y testearlos aquí.
            </p>
          </div>
          <Link href="/stores">
            <Button size="sm" className="mt-1 gap-2">
              <Store className="h-3.5 w-3.5" />
              Agregar tienda
            </Button>
          </Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      {/* Hero signal — best candidate across all tracked products */}
      {!isTrackerLoading && canViewTrackerMetrics && <HeroSignalCard candidates={allCandidates} />}

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

      {/* Shooting stars — top 5 / KPI cards: bloqueados en la prueba gratis */}
      {!canViewTrackerMetrics ? (
        <div className="mb-6 flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Analíticas bloqueadas en la prueba gratis</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Top productos, salud del seguimiento y estadísticas se desbloquean al suscribirte.
            </p>
          </div>
          <Link href="/pricing">
            <Button size="sm" className="mt-1">Ver planes</Button>
          </Link>
        </div>
      ) : (
        <>
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

          {!isTrackerLoading && <KpiCards candidates={allCandidates} />}
        </>
      )}

      {/* Product Leaderboard */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/30 p-1">
          <button
            onClick={() => setTrackerPreset('all')}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-all',
              trackerPreset === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            Todos los productos
          </button>
          <button
            onClick={() => setTrackerPreset('favorites')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all',
              trackerPreset === 'favorites'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <Star className="h-3 w-3" />
            Favoritos
            {favorites.size > 0 && (
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                trackerPreset === 'favorites'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-amber-400/20 text-amber-500',
              )}>
                {favorites.size}
              </span>
            )}
          </button>
        </div>
        <span className="text-xs text-muted-foreground">
          {tableCandidates.length} candidatos
        </span>
      </div>
      {trackerPreset === 'favorites' && tableCandidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16 text-muted-foreground">
          <Star className="h-9 w-9 opacity-20" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Aún no tienes favoritos</p>
            <p className="mt-0.5 text-xs">Marca productos con ★ para guardarlos aquí.</p>
          </div>
        </div>
      ) : (
        <TrackerTable
          candidates={tableCandidates}
          windowDays={windowDays}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </PageLayout>
  )
}
