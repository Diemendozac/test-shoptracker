'use client'

import { cn } from '@/lib/utils'
import { useViewAs, type PlanOverride } from '@/lib/view-as'

const OPTIONS: { value: PlanOverride; label: string }[] = [
  { value: 'real',    label: 'Real' },
  { value: 'starter', label: 'Starter' },
  { value: 'pro',     label: 'Pro' },
  { value: 'agency',  label: 'Agency' },
]

export function ViewAsBar() {
  const { isAdmin, viewAs, setViewAs, realPlan } = useViewAs()
  if (!isAdmin) return null

  const isOverriding = viewAs !== 'real'

  return (
    <div className={cn(
      'fixed bottom-5 left-1/2 z-50 -translate-x-1/2',
      'flex items-center gap-1.5 rounded-full px-3 py-1.5 shadow-xl backdrop-blur-md',
      'border text-xs font-medium transition-colors',
      isOverriding
        ? 'border-amber-500/40 bg-amber-950/80 text-amber-200'
        : 'border-border bg-card/90 text-muted-foreground',
    )}>
      <span className="mr-1 opacity-60">Vista:</span>
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setViewAs(value)}
          className={cn(
            'rounded-full px-3 py-0.5 transition-all',
            viewAs === value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'hover:bg-secondary hover:text-foreground',
          )}
        >
          {value === 'real' ? `${label} (${realPlan})` : label}
        </button>
      ))}
    </div>
  )
}
