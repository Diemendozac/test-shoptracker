'use client'

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: LucideIcon
  variant?: 'default' | 'primary' | 'success' | 'warning'
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  variant = 'default',
}: StatsCardProps) {
  const isPositive = change !== undefined && change >= 0

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      {/* Background glow effect */}
      <div className={cn(
        'absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100',
        variant === 'primary' && 'bg-primary/20',
        variant === 'success' && 'bg-rising/20',
        variant === 'warning' && 'bg-watching/20',
        variant === 'default' && 'bg-primary/10',
      )} />

      <div className="relative flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 pt-1">
              <span className={cn(
                'text-xs font-medium',
                isPositive ? 'text-rising' : 'text-declining'
              )}>
                {isPositive ? '+' : ''}{change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
          variant === 'primary' && 'bg-primary/10 text-primary',
          variant === 'success' && 'bg-rising/10 text-rising',
          variant === 'warning' && 'bg-watching/10 text-watching',
          variant === 'default' && 'bg-secondary text-muted-foreground',
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
