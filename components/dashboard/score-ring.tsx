'use client'

import { cn } from '@/lib/utils'
import type { PerformanceLabel } from '@/lib/types'

interface ScoreRingProps {
  score: number
  label?: PerformanceLabel
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const getScoreColor = (score: number): string => {
  if (score >= 0.6) return 'text-rising stroke-rising'
  if (score >= 0.4) return 'text-watching stroke-watching'
  if (score >= 0.2) return 'text-stable stroke-stable'
  return 'text-declining stroke-declining'
}

export function ScoreRing({ score, label, size = 'md', showLabel = true }: ScoreRingProps) {
  const percentage = Math.round(score * 100)
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (score * circumference)
  const colorClass = getScoreColor(score)

  const sizeConfig = {
    sm: { width: 48, fontSize: 'text-xs', labelSize: 'text-[8px]' },
    md: { width: 72, fontSize: 'text-lg', labelSize: 'text-[10px]' },
    lg: { width: 96, fontSize: 'text-2xl', labelSize: 'text-xs' },
  }

  const config = sizeConfig[size]

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: config.width, height: config.width }}>
      <svg className="absolute -rotate-90 transform" viewBox="0 0 100 100" style={{ width: config.width, height: config.width }}>
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-border"
        />
        {/* Progress circle */}
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
