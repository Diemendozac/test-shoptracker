'use client'

import { useId } from 'react'
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { HistoryEntry } from '@/lib/types'
import { formatShortDate } from '@/lib/format-date'

interface RankChartProps {
  history: HistoryEntry[]
  /** Alto en px (default 256, el de siempre) */
  height?: number
}

const AXIS_TICK = { fill: 'var(--subtle-foreground)', fontSize: 12 }

export function RankChart({ history, height = 256 }: RankChartProps) {
  // id único: dos gráficos en el mismo documento no pueden compartir el degradado
  const gradientId = `rank-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  // Only plot days with a real rank — never rank 0 or null
  const data = history
    .map((h) => ({
      rank: h.bestsellerRank ?? 0,
      score: h.performanceScore != null ? Math.round(h.performanceScore) : null,
      date: formatShortDate(h.snapshotDate, { year: 'never' }),
    }))
    .filter((d) => d.rank > 0)

  const validRanks = data.map(d => d.rank)
  const bestRank = validRanks.length > 0 ? Math.min(...validRanks) : null
  const worstRank = validRanks.length > 0 ? Math.max(...validRanks) : 1

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.18} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={AXIS_TICK}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            reversed
            domain={[1, worstRank]}
            axisLine={false}
            tickLine={false}
            tick={AXIS_TICK}
            tickFormatter={(v: number) => `#${v}`}
            width={40}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload
                return (
                  <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-card-hover">
                    <p className="text-xs text-muted-foreground">{d.date}</p>
                    <p className="text-sm font-semibold text-foreground tabular-nums">Rank #{d.rank}</p>
                    {bestRank !== null && d.rank === bestRank && (
                      <p className="text-xs font-medium text-success-foreground">★ Mejor posición alcanzada</p>
                    )}
                    <p className="text-xs text-muted-foreground tabular-nums">Score: {d.score ?? '—'}</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Area
            type="monotone"
            dataKey="rank"
            baseValue="dataMax"
            stroke="var(--primary)"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dot={(props: any) => {
              // Entrada (primer día) hueca; mejor posición rellena
              if (bestRank !== null && props.payload.rank === bestRank) {
                return (
                  <circle key={`best-${props.index}`} cx={props.cx} cy={props.cy} r={5}
                    fill="var(--primary)" stroke="var(--card)" strokeWidth={2} />
                )
              }
              if (props.index === 0) {
                return (
                  <circle key={`entry-${props.index}`} cx={props.cx} cy={props.cy} r={4}
                    fill="var(--card)" stroke="var(--primary)" strokeWidth={2} />
                )
              }
              return <g key={`dot-${props.index}`} />
            }}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)', fill: 'var(--primary)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
