'use client'

import { useGetStoresQuery } from '@/app/(dashboard)/stores/services/storeApi'
import { getStoreStatus } from '@/app/(dashboard)/stores/utils/storeStatus'
import type { TrackerCandidate } from '@/app/(dashboard)/types'

interface KpiCardsProps {
  candidates: TrackerCandidate[]
}

// ── rank delta helpers ─────────────────────────────────────────────────────────

function getPrevRank(c: TrackerCandidate): number | null {
  const rh = c.rankHistory
  if (!rh || rh.length < 2) return null
  return rh[rh.length - 2]
}

function getRankDelta(c: TrackerCandidate): number | null {
  const prev = getPrevRank(c)
  if (prev == null || c.currentRank == null) return null
  return prev - c.currentRank // positive = improved (lower rank number is better)
}

// ── label buckets ─────────────────────────────────────────────────────────────

const BUCKET_COLORS: Record<string, string> = {
  Rocket:   '#085041',
  Rising:   '#1D9E75',
  Steady:   '#BA7517',
  Watching: '#8b8b8b',
}

function getBucket(c: TrackerCandidate): 'Rocket' | 'Rising' | 'Steady' | 'Watching' {
  if ((c.performanceScore ?? 0) >= 70) return 'Rocket'
  if (c.performanceLabel === 'Rising')  return 'Rising'
  if (c.performanceLabel === 'Stable')  return 'Steady'
  return 'Watching'
}

// ─────────────────────────────────────────────────────────────────────────────

export function KpiCards({ candidates }: KpiCardsProps) {
  const { data: stores = [] } = useGetStoresQuery()

  const now = Date.now()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000

  // ── Mayor salto hoy ───────────────────────────────────────────────────────
  const topJumper = candidates
    .filter(c => c.signalConfidence > 0.30 && c.daysElapsed >= 2)
    .map(c => ({ c, delta: getRankDelta(c) }))
    .filter(({ delta }) => delta != null && delta > 0)
    .sort((a, b) => b.delta! - a.delta!)[0] ?? null

  // ── Salud del pool ────────────────────────────────────────────────────────
  const total = candidates.length

  const buckets = { Rocket: 0, Rising: 0, Steady: 0, Watching: 0 }
  for (const c of candidates) buckets[getBucket(c)]++

  const winnersCount = buckets.Rocket + buckets.Rising
  const healthPct = total > 0 ? Math.round((winnersCount / total) * 100) : 0

  // ── Row 2 stats ───────────────────────────────────────────────────────────
  const newDespegando = candidates.filter(
    c => c.daysElapsed <= 7 && (c.growthPct ?? 0) > 20
  ).length

  const avgDays = total > 0
    ? Math.round(candidates.reduce((s, c) => s + c.daysElapsed, 0) / total)
    : 0

  const activeStores = stores.filter(s => getStoreStatus(s) === 'ACTIVA').length

  const newThisWeek = candidates.filter(c => {
    if (!c.firstSeenDate) return false
    return now - new Date(c.firstSeenDate).getTime() <= sevenDaysMs
  }).length

  return (
    <div className="mb-6 space-y-3">

      {/* ── Row 1 ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_2fr] gap-3">

        {/* Mayor salto hoy */}
        <div className="rounded-xl border border-border bg-card px-4 py-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Mayor salto hoy
          </p>

          {topJumper ? (
            <div className="flex items-center gap-3">
              {topJumper.c.productImage ? (
                <img
                  src={`/api/image-proxy?url=${encodeURIComponent(topJumper.c.productImage)}`}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-muted-foreground">
                  {topJumper.c.productTitle.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {topJumper.c.productTitle}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {topJumper.c.storeName}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-500">↑{topJumper.delta}</span>
                  <span className="text-[10px] text-muted-foreground">
                    #{getPrevRank(topJumper.c)} → #{topJumper.c.currentRank} · score {topJumper.c.performanceScore}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Sin datos de rank aún</p>
          )}
        </div>

        {/* Salud del pool */}
        <div className="rounded-xl border border-border bg-card px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Salud del pool
            </p>
            <span className="text-sm font-bold tabular-nums text-foreground">
              {winnersCount}
              <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                / {total} ganadores ({healthPct}%)
              </span>
            </span>
          </div>

          {total > 0 ? (
            <div className="space-y-2">
              {(Object.entries(buckets) as [string, number][])
                .filter(([, count]) => count > 0)
                .map(([label, count]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] text-muted-foreground">{label}</span>
                    <div className="flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(2, Math.round((count / total) * 100))}%`,
                          backgroundColor: BUCKET_COLORS[label],
                        }}
                      />
                    </div>
                    <span className="w-5 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  </div>
                ))
              }
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Sin candidatos activos</p>
          )}
        </div>
      </div>

      {/* ── Row 2 ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {([
          { label: 'Nuevos despegando',       value: newDespegando, sub: '≤7 días & >20% growth' },
          { label: 'Días prom. seguimiento',  value: avgDays,       sub: 'promedio activos' },
          { label: 'Tiendas activas',          value: activeStores,  sub: 'sync < 24 h' },
          { label: 'Productos esta semana',    value: newThisWeek,   sub: 'detectados 7 días' },
        ] as const).map(({ label, value, sub }) => (
          <div key={label} className="rounded-xl border border-border bg-card px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums text-foreground">{value}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

    </div>
  )
}
