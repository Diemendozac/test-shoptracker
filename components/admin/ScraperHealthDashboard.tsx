'use client'

// FIX-069: dashboard de salud de los 3 scrapers de SCOUT (buscador de tiendas, scraper de
// ads/videos, sync diario). Mismo lenguaje visual que components/tracker/score-chart.tsx
// (recharts directo, colores OKLCH semánticos) — no se introduce un sistema visual nuevo.

import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { useGetScraperRunsQuery, type ScraperRunRow } from '@/app/(dashboard)/services/adminApi'
import { cn } from '@/lib/utils'

const SCRAPER_LABELS: Record<string, string> = {
  store_detector: 'Buscador de tiendas',
  sync_ads:       'Scraper de ads (videos)',
  daily_sync:     'Sync diario (productos/tracking)',
}

const SCRAPER_ORDER = ['daily_sync', 'sync_ads', 'store_detector']

const OK_COLOR    = 'oklch(0.65 0.18 145)' // verde
const ERROR_COLOR = 'oklch(0.6 0.2 25)'    // rojo
const WARN_COLOR  = 'oklch(0.78 0.17 80)'  // amarillo

function statusColor(status: string) {
  if (status === 'success') return OK_COLOR
  if (status === 'partial') return WARN_COLOR
  return ERROR_COLOR
}

function StatusBadge({ status }: { status: string }) {
  const label = status === 'success' ? 'OK' : status === 'partial' ? 'Parcial' : 'Falló'
  const cls =
    status === 'success' ? 'bg-emerald-500/15 text-emerald-600' :
    status === 'partial' ? 'bg-amber-500/15 text-amber-600' :
                            'bg-rose-500/15 text-rose-600'
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', cls)}>
      {label}
    </span>
  )
}

function fmtDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function ScraperCard({ name, runs }: { name: string; runs: ScraperRunRow[] }) {
  // runs viene ordenado desc (más reciente primero) desde el backend — para el gráfico
  // queremos más antiguo a la izquierda, igual que score-chart.tsx.
  const chronological = [...runs].reverse()
  const last = runs[0]

  const successCount = runs.filter(r => r.status === 'success').length
  const successRate  = runs.length > 0 ? Math.round((successCount / runs.length) * 100) : null

  const data = chronological.map(r => ({
    date:  new Date(r.startedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
    ok:    r.itemsOk ?? 0,
    error: r.itemsError ?? 0,
    status: r.status,
    startedAt: r.startedAt,
  }))

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{SCRAPER_LABELS[name] ?? name}</h3>
          <p className="text-xs text-muted-foreground">
            {runs.length === 0 ? 'Sin corridas registradas todavía' : `Última corrida: ${fmtDateTime(last.startedAt)}`}
          </p>
        </div>
        {last && <StatusBadge status={last.status} />}
      </div>

      {runs.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
          Este scraper todavía no reportó ninguna corrida.
        </div>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-secondary/30 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Éxito ({runs.length}c)</p>
              <p className="text-lg font-bold tabular-nums text-foreground">{successRate}%</p>
            </div>
            <div className="rounded-lg bg-secondary/30 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">OK último run</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: OK_COLOR }}>{last.itemsOk ?? '—'}</p>
            </div>
            <div className="rounded-lg bg-secondary/30 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Errores último run</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: last.itemsError ? ERROR_COLOR : undefined }}>
                {last.itemsError ?? '—'}
              </p>
            </div>
          </div>

          {last.errorSample && (
            <p className="mb-3 truncate rounded-lg bg-rose-500/10 px-3 py-1.5 text-[11px] text-rose-600" title={last.errorSample}>
              {last.errorSample}
            </p>
          )}

          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'oklch(0.6 0 0)', fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'oklch(0.6 0 0)', fontSize: 10 }} width={28} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload
                      return (
                        <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                          <p className="text-xs text-muted-foreground">{fmtDateTime(d.startedAt)}</p>
                          <p className="text-sm font-semibold" style={{ color: OK_COLOR }}>OK: {d.ok}</p>
                          <p className="text-sm font-semibold" style={{ color: ERROR_COLOR }}>Errores: {d.error}</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="ok" stackId="a" fill={OK_COLOR} radius={[0, 0, 0, 0]} />
                <Bar dataKey="error" stackId="a" fill={ERROR_COLOR} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}

export function ScraperHealthDashboard() {
  const { data, isLoading, error } = useGetScraperRunsQuery({ days: 30 })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-secondary/30" />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-rose-500">No se pudo cargar la salud de los scrapers.</p>
  }

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-foreground">Salud de scrapers</h2>
        <p className="text-xs text-muted-foreground">Últimos {data?.days ?? 30} días — verde: procesado OK, rojo: error</p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {SCRAPER_ORDER.map(name => (
          <ScraperCard key={name} name={name} runs={data?.scrapers[name] ?? []} />
        ))}
      </div>
    </div>
  )
}
