'use client'

import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { HistoryEntry } from '@/lib/types'
import { formatShortDate } from '@/lib/format-date'

interface ScoreChartProps {
  history: HistoryEntry[]
  /** Alto en px (default 256, el de siempre) */
  height?: number
}

const AXIS_TICK = { fill: 'var(--subtle-foreground)', fontSize: 12 }

// Un solo color de datos: el significado (confirmado / débil) lo pone el ScoreRing,
// no el gráfico. Antes: rojo < 40 / ámbar < 60 / verde, una tercera escala para el
// mismo número (ver docs/redesign/detalle-producto/01-diagnostico.md, P9).
export function ScoreChart({ history, height = 256 }: ScoreChartProps) {
  const data = history.map((h) => ({
    score: h.performanceScore != null ? Math.round(h.performanceScore) : 0,
    hasScore: h.performanceScore != null,
    growth: h.growthPct != null ? Math.round(h.growthPct) : null,
    date: formatShortDate(h.snapshotDate, { year: 'never' }),
  }))
  // oldest left, newest right — no .reverse()

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={AXIS_TICK}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={AXIS_TICK}
            width={40}
          />
          <Tooltip
            cursor={{ fill: 'var(--accent)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload
                return (
                  <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-card-hover">
                    <p className="text-xs text-muted-foreground">{d.date}</p>
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      Score: {d.hasScore ? d.score : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      Crecimiento: {d.growth == null ? '—' : `${d.growth > 0 ? '+' : ''}${d.growth}%`}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="score" radius={[3, 3, 0, 0]} fill="var(--chart-1)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
