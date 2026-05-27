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

const BUCKET_ORDER = ['Rocket', 'Rising', 'Steady', 'Watching', 'Declining'] as const
type Bucket = typeof BUCKET_ORDER[number]

const BUCKET_COLORS: Record<Bucket, string> = {
  Rocket:   '#085041',
  Rising:   '#1D9E75',
  Steady:   '#BA7517',
  Watching: '#D3D1C7',
  Declining:'#E24B4A',
}

function getBucket(c: TrackerCandidate): Bucket {
  if ((c.performanceScore ?? 0) >= 70)      return 'Rocket'
  if (c.performanceLabel === 'Rising')       return 'Rising'
  if (c.performanceLabel === 'Stable')       return 'Steady'
  if (c.performanceLabel === 'Declining')    return 'Declining'
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

  // ── Salud del seguimiento ─────────────────────────────────────────────────
  const total = candidates.length

  const buckets: Record<Bucket, number> = { Rocket: 0, Rising: 0, Steady: 0, Watching: 0, Declining: 0 }
  for (const c of candidates) buckets[getBucket(c)]++

  const signalCount   = buckets.Rocket + buckets.Rising
  const signalPct     = total > 0 ? Math.round((signalCount   / total) * 100) : 0

  const growingCount  = candidates.filter(c => (c.growthPct ?? 0) > 0).length
  const growingPct    = total > 0 ? Math.round((growingCount  / total) * 100) : 0

  // ── Row 2 stats ───────────────────────────────────────────────────────────
  const newDespegando = candidates.filter(
    c => c.daysElapsed <= 7 && (c.growthPct ?? 0) > 20
  ).length

  const growingCardColor = growingPct >= 50 ? '#1D9E75' : growingPct >= 25 ? '#BA7517' : undefined

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

        {/* Salud del seguimiento */}
        <div className="rounded-xl border border-border bg-card px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Salud del seguimiento
            </p>
            <div className="space-y-0.5 text-right">
              <p className={`text-xs tabular-nums font-medium ${signalPct > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                {signalCount} de {total} con señal positiva ({signalPct}%)
              </p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {growingCount} de {total} en crecimiento ({growingPct}%)
              </p>
            </div>
          </div>

          {total > 0 ? (
            <div className="space-y-1.5">
              {BUCKET_ORDER.map(label => {
                const count = buckets[label]
                const pct   = Math.round((count / total) * 100)
                return (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] text-muted-foreground">{label}</span>
                    <div className="flex-1 overflow-hidden rounded-full bg-secondary" style={{ height: 6 }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: count > 0 ? `${pct}%` : '0%',
                          backgroundColor: BUCKET_COLORS[label],
                        }}
                      />
                    </div>
                    <span className="w-7 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                      {count}
                    </span>
                    <span className="w-6 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground/60">
                      {pct}%
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Sin candidatos activos</p>
          )}
        </div>
      </div>

      {/* ── Row 2 ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {/* Nuevos despegando */}
        <div className="rounded-xl border border-border bg-card px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nuevos despegando</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-foreground">{newDespegando}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">≤7 días &amp; &gt;20% growth</p>
        </div>

        {/* En crecimiento */}
        <div className="rounded-xl border border-border bg-card px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">En crecimiento</p>
          <p
            className="mt-1 text-2xl font-black tabular-nums"
            style={{ color: growingCardColor ?? 'var(--foreground)' }}
          >
            {growingPct}%
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">con growthPct &gt; 0%</p>
        </div>

        {/* Tiendas activas */}
        <div className="rounded-xl border border-border bg-card px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tiendas activas</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-foreground">{activeStores}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">sync &lt; 24 h</p>
        </div>

        {/* Productos esta semana */}
        <div className="rounded-xl border border-border bg-card px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Productos esta semana</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-foreground">{newThisWeek}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">detectados 7 días</p>
        </div>
      </div>

    </div>
  )
}
