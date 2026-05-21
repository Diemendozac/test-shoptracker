'use client'

import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts'
import type { HistoryEntry } from '@/lib/types'

interface ScoreChartProps {
  history: HistoryEntry[]
}

export function ScoreChart({ history }: ScoreChartProps) {
  const data = history.map((h) => ({
    day: `Day ${h.trackingDay}`,
    score: Math.round(h.performanceScore),
    growth: Math.round(h.growthPct),
    date: new Date(h.snapshotDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  })).reverse()

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'oklch(0.6 0 0)', fontSize: 11 }}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'oklch(0.6 0 0)', fontSize: 11 }}
            width={30}
          />
          <ReferenceLine y={50} stroke="oklch(0.3 0 0)" strokeDasharray="3 3" />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                    <p className="text-xs text-muted-foreground">{data.date}</p>
                    <p className="text-sm font-semibold text-rising">Score: {data.score}%</p>
                    <p className="text-xs text-muted-foreground">Growth: {data.growth >= 0 ? '+' : ''}{data.growth}%</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="oklch(0.75 0.18 165)"
            strokeWidth={2}
            dot={{ fill: 'oklch(0.75 0.18 165)', strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: 'oklch(0.75 0.18 165)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
