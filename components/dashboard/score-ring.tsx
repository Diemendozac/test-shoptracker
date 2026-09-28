'use client'

import { cn } from '@/lib/utils'
import type { PerformanceLabel } from '@/lib/types'

interface ScoreRingProps {
  score: number
  label?: PerformanceLabel
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  confidence?: number  // 0–1: signal confidence
}

const sizeConfig = {
  sm: { width: 48,  fontSize: 'text-xs',   labelSize: 'text-xs'     },
  md: { width: 72,  fontSize: 'text-lg',   labelSize: 'text-xs'     },
  lg: { width: 96,  fontSize: 'text-2xl',  labelSize: 'text-xs'     },
}

const RADIUS = 40
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function ScoreRing({
  score,
  label,
  size = 'md',
  showLabel = true,
  confidence: _confidence,
}: ScoreRingProps) {
  const clamped    = Math.max(0, Math.min(score, 100))
  const normalized = clamped / 100
  const config     = sizeConfig[size]
  const arcLen     = CIRCUMFERENCE * normalized

  // Color rule: green at 65+, yellow below
  // (pendiente D-1: volver a la regla de confianza de CHANGE-004; ver docs/redesign)
  const isGreen    = clamped >= 65
  const arcColor   = isGreen ? 'stroke-success' : 'stroke-warning'

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: config.width, height: config.width }}
    >
      <svg
        className="absolute -rotate-90"
        viewBox="0 0 100 100"
        style={{ width: config.width, height: config.width }}
      >
        {/* Track */}
        <circle
          cx="50" cy="50" r={RADIUS}
          fill="none" strokeWidth="8"
          stroke="currentColor"
          className="text-score-track"
        />

        {/* Score arc */}
        {arcLen > 0.5 && (
          <circle
            cx="50" cy="50" r={RADIUS}
            fill="none" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${arcLen} ${CIRCUMFERENCE}`}
            strokeDashoffset={0}
            className={cn('transition-all duration-700 ease-out', arcColor)}
          />
        )}
      </svg>

      {/* Inner text — absolutely centered so the number sits in the middle of the ring */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-semibold tabular-nums leading-none text-foreground', config.fontSize)}>
          {Math.round(clamped)}
        </span>
        {showLabel && label && (
          <span className={cn('font-medium leading-none text-muted-foreground', config.labelSize)}>
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
