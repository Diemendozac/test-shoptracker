'use client'

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: LucideIcon
  /** Se conserva por compatibilidad con los call sites; en la dirección B ya no cambia el color. */
  variant?: 'default' | 'primary' | 'success' | 'warning'
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
}: StatsCardProps) {
  const isPositive = change !== undefined && change >= 0

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card transition-[border-color,box-shadow] duration-200 hover:border-border-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <span className="font-display text-[34px] font-semibold leading-none tracking-tight text-foreground tabular-nums">{value}</span>
          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className={cn(
                'text-xs font-semibold tabular-nums',
                isPositive ? 'text-success-foreground' : 'text-danger-foreground'
              )}>
                {isPositive ? '+' : ''}{change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary-text">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
