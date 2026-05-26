'use client'

import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import type { HistoryEntry } from '@/lib/types'

interface ScoreChartProps {
  history: HistoryEntry[]
}

function barColor(score: number) {
  if (score >= 60) return 'oklch(0.65 0.18 145)'
  if (score >= 40) return 'oklch(0.78 0.17 80)'
  return 'oklch(0.6 0.2 25)'
}

export function ScoreChart({ history }: ScoreChartProps) {
  const data = history.map((h) => ({
    day: `Day ${h.trackingDay}`,
    score: Math.round(h.performanceScore),
    growth: Math.round(h.growthPct),
    date: new Date(h.snapshotDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))
  // oldest left, newest right — no .reverse()

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload
                return (
                  <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                    <p className="text-xs text-muted-foreground">{d.date}</p>
                    <p className="text-sm font-semibold" style={{ color: barColor(d.score) }}>
                      Score: {d.score}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Growth: {d.growth >= 0 ? '+' : ''}{d.growth}%
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="score" radius={[3, 3, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={barColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
