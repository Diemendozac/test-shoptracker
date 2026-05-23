'use client'

import { TrendingUp, Target, Rocket, Activity } from 'lucide-react'
import type { TrackerCandidate } from '@/app/(dashboard)/types'
import { cn } from '@/lib/utils'

interface KpiCardsProps {
  candidates: TrackerCandidate[]
}

export function KpiCards({ candidates }: KpiCardsProps) {
  const total    = candidates.length
  const rising   = candidates.filter((c) => c.performanceLabel === 'Rising').length
  const avgScore = total > 0
    ? Math.round(candidates.reduce((s, c) => s + (c.performanceScore ?? 0), 0) / total)
    : 0
  const stores   = new Set(candidates.map((c) => c.storeId)).size

  const cards = [
    {
      icon: Target,
      label: 'Candidatos activos',
      value: total,
      sub: 'en seguimiento',
      color: 'text-purple-400',
      glow: 'rgba(168,85,247,0.15)',
      border: 'rgba(168,85,247,0.25)',
    },
    {
      icon: Activity,
      label: 'Score promedio',
      value: avgScore,
      sub: 'de candidatos activos',
      color: 'text-orange-400',
      glow: 'rgba(249,115,22,0.15)',
      border: 'rgba(249,115,22,0.25)',
    },
    {
      icon: Rocket,
      label: 'En alza',
      value: rising,
      sub: 'señal Rising',
      color: 'text-emerald-400',
      glow: 'rgba(52,211,153,0.15)',
      border: 'rgba(52,211,153,0.25)',
    },
    {
      icon: TrendingUp,
      label: 'Tiendas monitoreadas',
      value: stores,
      sub: 'con candidatos activos',
      color: 'text-sky-400',
      glow: 'rgba(56,189,248,0.15)',
      border: 'rgba(56,189,248,0.25)',
    },
  ]

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map(({ icon: Icon, label, value, sub, color, glow, border }) => (
        <div
          key={label}
          className="relative overflow-hidden rounded-xl border bg-card px-4 py-4"
          style={{ borderColor: border, boxShadow: `0 0 24px ${glow}` }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn('mt-1 text-2xl font-black tabular-nums', color)}>{value}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>
            </div>
            <div
              className="rounded-lg p-2"
              style={{ backgroundColor: glow }}
            >
              <Icon className={cn('h-4 w-4', color)} />
            </div>
          </div>
          {/* Subtle glow orb */}
          <div
            className="pointer-events-none absolute -bottom-4 -right-4 h-16 w-16 rounded-full"
            style={{ backgroundColor: glow, filter: 'blur(16px)' }}
          />
        </div>
      ))}
    </div>
  )
}
