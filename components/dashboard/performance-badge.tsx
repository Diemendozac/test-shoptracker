'use client'

import { cn } from '@/lib/utils'
import type { PerformanceLabel } from '@/lib/types'
import { TrendingUp, TrendingDown, Minus, Eye } from 'lucide-react'

interface PerformanceBadgeProps {
  label: PerformanceLabel
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

const labelConfig: Record<PerformanceLabel, {
  color: string
  bgColor: string
  borderColor: string
  icon: typeof TrendingUp
}> = {
  Rising: {
    color: 'text-rising',
    bgColor: 'bg-rising/10',
    borderColor: 'border-rising/20',
    icon: TrendingUp,
  },
  Watching: {
    color: 'text-watching',
    bgColor: 'bg-watching/10',
    borderColor: 'border-watching/20',
    icon: Eye,
  },
  Declining: {
    color: 'text-declining',
    bgColor: 'bg-declining/10',
    borderColor: 'border-declining/20',
    icon: TrendingDown,
  },
  Stable: {
    color: 'text-stable',
    bgColor: 'bg-stable/10',
    borderColor: 'border-stable/20',
    icon: Minus,
  },
}

export function PerformanceBadge({ label, size = 'md', showIcon = true }: PerformanceBadgeProps) {
  const config = labelConfig[label]
  const Icon = config.icon

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border font-medium',
      config.color,
      config.bgColor,
      config.borderColor,
      size === 'sm' && 'px-2 py-0.5 text-xs',
      size === 'md' && 'px-2.5 py-1 text-xs',
      size === 'lg' && 'px-3 py-1.5 text-sm',
    )}>
      {showIcon && <Icon className={cn(
        size === 'sm' && 'h-3 w-3',
        size === 'md' && 'h-3.5 w-3.5',
        size === 'lg' && 'h-4 w-4',
      )} />}
      {label}
    </span>
  )
}
