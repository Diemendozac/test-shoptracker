'use client'

import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { HistoryEntry } from '@/lib/types'

interface RankChartProps {
  history: HistoryEntry[]
}

export function RankChart({ history }: RankChartProps) {
  // Only plot days with a real rank — never rank 0 or null
  const data = history
    .map((h) => ({
      day: `Day ${h.trackingDay}`,
      rank: h.bestsellerRank ?? 0,
      score: Math.round(h.performanceScore),
      date: new Date(h.snapshotDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }))
    .filter((d) => d.rank > 0)

  const validRanks = data.map(d => d.rank)
  const bestRank = validRanks.length > 0 ? Math.min(...validRanks) : null
  const worstRank = validRanks.length > 0 ? Math.max(...validRanks) : 1

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="rankGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.7 0.2 285)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="oklch(0.7 0.2 285)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'oklch(0.6 0 0)', fontSize: 11 }}
          />
          <YAxis
            reversed
            domain={[1, worstRank]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'oklch(0.6 0 0)', fontSize: 11 }}
            width={30}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload
                if (!d.rank || d.rank === 0) {
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                      <p className="text-xs text-muted-foreground">{d.date}</p>
                      <p className="text-sm font-semibold text-muted-foreground">Sin datos</p>
                    </div>
                  )
                }
                return (
                  <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                    <p className="text-xs text-muted-foreground">{d.date}</p>
                    <p className="text-sm font-semibold text-foreground">Rank #{d.rank}</p>
                    {bestRank !== null && d.rank === bestRank && (
                      <p className="text-xs font-medium text-emerald-500">★ Mejor posición alcanzada</p>
                    )}
                    <p className="text-xs text-primary">Score: {d.score}</p>
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
            stroke="oklch(0.7 0.2 285)"
            strokeWidth={2}
            fill="url(#rankGradient)"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dot={(props: any) => {
              if (bestRank !== null && props.payload.rank === bestRank) {
                return (
                  <circle
                    key={`best-${props.index}`}
                    cx={props.cx}
                    cy={props.cy}
                    r={5}
                    fill="oklch(0.7 0.2 285)"
                    stroke="white"
                    strokeWidth={2}
                  />
                )
              }
              return <g key={`dot-${props.index}`} />
            }}
            activeDot={{ r: 4, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
