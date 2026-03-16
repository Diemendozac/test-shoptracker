'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { PerformanceBadge } from '@/components/dashboard/performance-badge'
import { ScoreRing } from '@/components/dashboard/score-ring'
import type { TrackerCandidate } from '@/lib/types'
import { ExternalLink, Clock, Award } from 'lucide-react'

interface TrackerTableProps {
  candidates: TrackerCandidate[]
}

export function TrackerTable({ candidates }: TrackerTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 border-b border-border bg-secondary/30 px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <div className="col-span-4">Product</div>
        <div className="col-span-2">Store</div>
        <div className="col-span-1 text-center">Score</div>
        <div className="col-span-2 text-center">Status</div>
        <div className="col-span-1 text-center">Growth</div>
        <div className="col-span-1 text-center">Days</div>
        <div className="col-span-1 text-center">Action</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-border">
        {candidates.map((candidate, idx) => (
          <div
            key={candidate.candidateId}
            className={cn(
              'group grid grid-cols-12 items-center gap-4 px-6 py-4 transition-colors hover:bg-secondary/20',
              idx % 2 === 0 && 'bg-secondary/5'
            )}
          >
            {/* Product */}
            <div className="col-span-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-muted-foreground">
                {candidate.productTitle.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{candidate.productTitle}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{candidate.daysInBestseller} days in bestseller</span>
                </div>
              </div>
            </div>

            {/* Store */}
            <div className="col-span-2">
              <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
                {candidate.storeName}
              </span>
            </div>

            {/* Score */}
            <div className="col-span-1 flex justify-center">
              <ScoreRing score={candidate.performanceScore} size="sm" showLabel={false} />
            </div>

            {/* Status */}
            <div className="col-span-2 flex justify-center">
              <PerformanceBadge label={candidate.performanceLabel} size="sm" />
            </div>

            {/* Growth */}
            <div className="col-span-1 text-center">
              <span className={cn(
                'text-sm font-semibold tabular-nums',
                candidate.growthPct >= 0 ? 'text-rising' : 'text-declining'
              )}>
                {candidate.growthPct >= 0 ? '+' : ''}{Math.round(candidate.growthPct * 100)}%
              </span>
            </div>

            {/* Days Elapsed */}
            <div className="col-span-1 text-center">
              <div className="flex items-center justify-center gap-1">
                <Award className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{candidate.daysElapsed}</span>
              </div>
            </div>

            {/* Action */}
            <div className="col-span-1 flex justify-center">
              <Link
                href={`/tracker/${candidate.candidateId}`}
                className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                View
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
