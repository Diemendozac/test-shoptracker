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
    color: 'text-success-foreground bg-success-subtle border-success-border',
    label: 'Despegue',
  },
  Meseta: {
    icon: Minus,
    color: 'text-muted-foreground bg-neutral-subtle border-border',
    label: 'Meseta',
  },
  Caída: {
    icon: TrendingDown,
    color: 'text-danger-foreground bg-danger-subtle border-danger-border',
    label: 'Caída',
  },
  Rebote: {
    icon: RefreshCw,
    color: 'text-info-foreground bg-info-subtle border-info-border',
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
        size === 'sm' && 'px-1.5 py-0.5 text-xs',
        size === 'md' && 'px-2 py-0.5 text-xs',
      )}
    >
      <Icon className={cn(size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
      {config.label}
    </span>
  )
}
