'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SegmentedOption<T extends string | number> {
  value: T
  label: React.ReactNode
}

interface SegmentedProps<T extends string | number> {
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Nombre accesible del grupo (p. ej. "Ventana de tiempo") */
  ariaLabel: string
  className?: string
}

/**
 * Control segmentado controlado. Reemplaza los grupos de botones hechos a mano
 * (ventana del tracker, presets, etc.) para que todos se vean y se comporten igual.
 */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-0.5 rounded-lg border border-border bg-secondary p-1', className)}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors',
              selected
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
