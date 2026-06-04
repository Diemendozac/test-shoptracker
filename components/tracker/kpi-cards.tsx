'use client'

import { useGetStoresQuery } from '@/app/(dashboard)/stores/services/storeApi'
import { getStoreStatus } from '@/app/(dashboard)/stores/utils/storeStatus'
import type { TrackerCandidate } from '@/app/(dashboard)/types'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InfoTipProps {
  title: string
  description: string
  condition: string
  className?: string
}

function InfoTip({ title, description, condition, className }: InfoTipProps) {
  return (
    <div className={cn('group relative inline-flex items-center', className)}>
      <Info className="h-3.5 w-3.5 cursor-default text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
      <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-64 rounded-xl border border-border bg-popover shadow-xl opacity-0 transition-opacity group-hover:opacity-100">
        <div className="px-4 py-3">
          <p className="mb-1.5 text-xs font-bold text-popover-foreground">Definición de la métrica</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <div className="border-t border-border px-4 py-3">
          <p className="mb-1 text-xs font-bold text-popover-foreground">Calculado bajo la condición</p>
          <p className="text-[11px] text-muted-foreground">• {condition}</p>
        </div>
      </div>
    </div>
  )
}

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
  const score = c.performanceScore ?? 0
  const label = c.performanceLabel as string

  if (score >= 70 || label === 'Rocket')                        return 'Rocket'
  if (label === 'Rising')                                        return 'Rising'
  if (label === 'Stable' || label === 'Steady')                 return 'Steady'
  if (label === 'Declining')                                     return 'Declining'

  // Fallback for stale ScoreSummary: use growthPct as early signal
  const gp = c.growthPct ?? 0
  if (gp >= 50 && c.daysElapsed >= 2) return 'Rising'
  if (gp >= 10 && c.daysElapsed >= 2) return 'Steady'
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
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-muted-foreground">
                  {topJumper.c.productTitle.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-foreground">
                  {topJumper.c.productTitle.length > 48
                    ? topJumper.c.productTitle.slice(0, 48) + '…'
                    : topJumper.c.productTitle}
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
          <div className="mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Salud del seguimiento
            </p>
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
          <InfoTip
            title="Nuevos despegando"
            description="Productos recién detectados que ya muestran tracción real: llevan pocos días en seguimiento y su crecimiento ya supera el 20% respecto a su posición de entrada."
            condition="≤7 días en testeo y crecimiento >20%"
            className="mt-1"
          />
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
          <InfoTip
            title="En crecimiento"
            description="Porcentaje de candidatos activos cuyo rank actual es mejor que su rank de entrada. Indica qué tan saludable es el portafolio en términos de tracción general."
            condition="Candidatos con growthPct positivo sobre el total activo"
            className="mt-1"
          />
        </div>

        {/* Tiendas activas */}
        <div className="rounded-xl border border-border bg-card px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tiendas activas</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-foreground">{activeStores}</p>
          <InfoTip
            title="Tiendas activas"
            description="Tiendas que han sido escaneadas recientemente. Si una tienda no se sincroniza en más de 24h puede indicar un problema de scraping o que fue pausada."
            condition="Última sincronización hace menos de 24 horas"
            className="mt-1"
          />
        </div>

        {/* Productos esta semana */}
        <div className="rounded-xl border border-border bg-card px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Productos esta semana</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-foreground">{newThisWeek}</p>
          <InfoTip
            title="Productos esta semana"
            description="Total de productos que entraron al bestseller por primera vez en los últimos 7 días. Es un indicador de qué tan activo está el mercado que estás monitoreando."
            condition="firstSeenDate dentro de los últimos 7 días"
            className="mt-1"
          />
        </div>
      </div>

    </div>
  )
}
