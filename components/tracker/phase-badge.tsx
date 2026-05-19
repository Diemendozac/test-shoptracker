'use client'

import { Rocket, Minus, TrendingDown, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

type Phase = 'Despegue' | 'Meseta' | 'Caída' | 'Rebote'

const phaseConfig: Record<Phase, {
  icon: typeof Rocket
  color: string
  label: string
}> = {
  Despegue: {
    icon: Rocket,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    label: 'Despegue',
  },
  Meseta: {
    icon: Minus,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    label: 'Meseta',
  },
  Caída: {
    icon: TrendingDown,
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    label: 'Caída',
  },
  Rebote: {
    icon: RefreshCw,
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    label: 'Rebote',
  },
}

interface PhaseBadgeProps {
  phase: string | null | undefined
  size?: 'sm' | 'md'
}

export function PhaseBadge({ phase, size = 'sm' }: PhaseBadgeProps) {
  if (!phase) return null
  const config = phaseConfig[phase as Phase]
  if (!config) return null

  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        config.color,
        size === 'sm' && 'px-1.5 py-0.5 text-[10px]',
        size === 'md' && 'px-2 py-0.5 text-xs',
      )}
    >
      <Icon className={cn(size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
      {config.label}
    </span>
  )
}
