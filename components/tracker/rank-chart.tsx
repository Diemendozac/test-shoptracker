'use client'

import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { HistoryEntry } from '@/lib/types'

interface RankChartProps {
  history: HistoryEntry[]
}

export function RankChart({ history }: RankChartProps) {
  const data = history.map((h) => ({
    day: `Day ${h.trackingDay}`,
    rank: h.bestsellerRank ?? 0,
    score: Math.round(h.performanceScore * 100),
    date: new Date(h.snapshotDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  })).reverse()

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="rankGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.7 0.2 285)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="oklch(0.7 0.2 285)" stopOpacity={0} />
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
            domain={[1, 'dataMax']}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'oklch(0.6 0 0)', fontSize: 11 }}
            width={30}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                    <p className="text-xs text-muted-foreground">{data.date}</p>
                    <p className="text-sm font-semibold text-foreground">Rank #{data.rank}</p>
                    <p className="text-xs text-primary">Score: {data.score}%</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Area
            type="monotone"
            dataKey="rank"
            stroke="oklch(0.7 0.2 285)"
            strokeWidth={2}
            fill="url(#rankGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
