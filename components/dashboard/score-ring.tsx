'use client'

import { cn } from '@/lib/utils'
import type { PerformanceLabel } from '@/lib/types'

interface ScoreRingProps {
  score: number
  label?: PerformanceLabel
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  confidence?: number  // 0–1: signal confidence from signalConfidence field
}

const getScoreColor = (score: number): string => {
  if (score >= 0.6) return 'text-rising stroke-rising'
  if (score >= 0.4) return 'text-watching stroke-watching'
  if (score >= 0.2) return 'text-stable stroke-stable'
  return 'text-declining stroke-declining'
}

// confidence >= 0.7 → green dot (señal confirmada), < 0.7 → yellow (señal temprana), undefined → no dot
function confidenceDot(confidence: number | undefined, dotSize: number) {
  if (confidence === undefined) return null
  const isConfirmed = confidence >= 0.7
  return (
    <div
      className="absolute bottom-0 right-0"
      style={{ width: dotSize, height: dotSize }}
    >
      <div
        className={cn(
          'h-full w-full rounded-full border-2 border-background',
          isConfirmed ? 'bg-emerald-500' : 'bg-amber-400'
        )}
        title={isConfirmed
          ? `Señal confirmada (${Math.round(confidence * 100)}%)`
          : `Señal temprana (${Math.round(confidence * 100)}%)`
        }
      />
    </div>
  )
}

export function ScoreRing({ score, label, size = 'md', showLabel = true, confidence }: ScoreRingProps) {
  const clampedScore = Math.max(0, Math.min(score, 100))
  const normalizedScore = clampedScore / 100

  const percentage = Math.round(clampedScore)
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (normalizedScore * circumference)
  const colorClass = getScoreColor(normalizedScore)

  const sizeConfig = {
    sm: { width: 48, fontSize: 'text-xs', labelSize: 'text-[8px]', dotSize: 10 },
    md: { width: 72, fontSize: 'text-lg', labelSize: 'text-[10px]', dotSize: 13 },
    lg: { width: 96, fontSize: 'text-2xl', labelSize: 'text-xs', dotSize: 16 },
  }

  const config = sizeConfig[size]

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: config.width, height: config.width }}
    >
      {confidenceDot(confidence, config.dotSize)}
      <svg
        className="absolute -rotate-90 transform"
        viewBox="0 0 100 100"
        style={{ width: config.width, height: config.width }}
      >
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-border"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn('transition-all duration-700 ease-out', colorClass)}
        />
      </svg>

      <div className="flex flex-col items-center justify-center">
        <span className={cn('font-bold tabular-nums', config.fontSize, colorClass.split(' ')[0])}>
          {percentage}
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