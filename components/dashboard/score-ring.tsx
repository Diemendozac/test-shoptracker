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
  sm: { width: 48,  fontSize: 'text-xs',   labelSize: 'text-[8px]'  },
  md: { width: 72,  fontSize: 'text-lg',   labelSize: 'text-[10px]' },
  lg: { width: 96,  fontSize: 'text-2xl',  labelSize: 'text-xs'     },
}

const RADIUS = 40
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function ScoreRing({
  score,
  label,
  size = 'md',
  showLabel = true,
  confidence,
}: ScoreRingProps) {
  const clamped     = Math.max(0, Math.min(score, 100))
  const normalized  = clamped / 100
  const config      = sizeConfig[size]

  const hasConfidence = confidence !== undefined

  // Arc lengths
  const confirmedLen   = hasConfidence
    ? CIRCUMFERENCE * normalized * confidence!
    : CIRCUMFERENCE * normalized
  const unconfirmedLen = hasConfidence
    ? CIRCUMFERENCE * normalized * (1 - confidence!)
    : 0

  // Green arc starts at 12 o'clock (dashoffset = 0)
  // Yellow arc starts right after green (dashoffset = CIRCUMFERENCE - confirmedLen)
  const yellowOffset = CIRCUMFERENCE - confirmedLen

  // Fallback color when no confidence prop (legacy single-arc behavior)
  const fallbackColor =
    normalized >= 0.6 ? 'stroke-rising'
    : normalized >= 0.4 ? 'stroke-watching'
    : normalized >= 0.2 ? 'stroke-stable'
    : 'stroke-declining'

  const fallbackTextColor =
    normalized >= 0.6 ? 'text-rising'
    : normalized >= 0.4 ? 'text-watching'
    : normalized >= 0.2 ? 'text-stable'
    : 'text-declining'

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
        {/* Track background */}
        <circle
          cx="50" cy="50" r={RADIUS}
          fill="none" strokeWidth="8"
          stroke="currentColor"
          className="text-border"
        />

        {hasConfidence ? (
          <>
            {/* Yellow arc — unconfirmed portion (draw first, below green) */}
            {unconfirmedLen > 0.5 && (
              <circle
                cx="50" cy="50" r={RADIUS}
                fill="none" strokeWidth="8"
                strokeLinecap="butt"
                strokeDasharray={`${unconfirmedLen} ${CIRCUMFERENCE}`}
                strokeDashoffset={yellowOffset}
                className="stroke-amber-400 transition-all duration-700 ease-out"
              />
            )}

            {/* Green arc — confirmed portion (draw on top) */}
            {confirmedLen > 0.5 && (
              <circle
                cx="50" cy="50" r={RADIUS}
                fill="none" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${confirmedLen} ${CIRCUMFERENCE}`}
                strokeDashoffset={0}
                className="stroke-emerald-500 transition-all duration-700 ease-out"
              />
            )}
          </>
        ) : (
          /* Legacy single-arc when no confidence provided */
          <circle
            cx="50" cy="50" r={RADIUS}
            fill="none" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${confirmedLen} ${CIRCUMFERENCE}`}
            strokeDashoffset={0}
            className={cn('transition-all duration-700 ease-out', fallbackColor)}
          />
        )}
      </svg>

      {/* Inner text */}
      <div className="flex flex-col items-center justify-center">
        <span
          className={cn(
            'font-bold tabular-nums',
            config.fontSize,
            hasConfidence ? 'text-foreground' : fallbackTextColor,
          )}
        >
          {Math.round(clamped)}
        </span>
        {showLabel && label && (
          <span className={cn('font-medium text-muted-foreground', config.labelSize)}>
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
