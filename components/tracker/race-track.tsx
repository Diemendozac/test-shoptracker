'use client'

import { ChevronDown, Trophy, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TrackerCandidate } from '@/app/(dashboard)/types'

interface RaceTrackProps {
  candidates: TrackerCandidate[]
  showTable: boolean
  onToggleTable: () => void
}

// Score [0–100] → position % on track [4%, 82%]
// Leaves room for horse icon width + score badge on the right
function scoreToLeft(score: number): number {
  return 4 + Math.min(Math.max(score, 0), 100) * 0.78
}

const BADGE_COLORS: Record<string, string> = {
  Rocket:   'bg-emerald-500 text-white',
  Rising:   'bg-green-500  text-white',
  Steady:   'bg-blue-500   text-white',
  Declining:'bg-red-500    text-white',
  Watching: 'bg-amber-500  text-white',
}

const AVATAR_PALETTE = [
  'bg-violet-600', 'bg-blue-600', 'bg-orange-500',
  'bg-pink-600',   'bg-teal-600', 'bg-indigo-600',
  'bg-rose-600',   'bg-cyan-600',
]

function avatarColor(name: string): string {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_PALETTE.length
  return AVATAR_PALETTE[h]
}

function storeInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase()
}

function shortTitle(title: string): string {
  const words = title.trim().split(/\s+/)
  return words.slice(0, 4).join(' ')
}

export function RaceTrack({ candidates, showTable, onToggleTable }: RaceTrackProps) {
  const top10 = [...candidates]
    .sort((a, b) => (b.performanceScore ?? 0) - (a.performanceScore ?? 0))
    .slice(0, 10)

  if (top10.length === 0) return null

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-semibold">La Carrera</span>
          <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            Top {top10.length}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          Posición = performance score
        </span>
      </div>

      {/* ── Lanes ── */}
      <div className="space-y-1 p-3">
        {top10.map((c, i) => {
          const isLeader  = i === 0
          const score     = c.performanceScore ?? 0
          const leftPct   = scoreToLeft(score)
          const badgeCls  = BADGE_COLORS[c.performanceLabel] ?? 'bg-slate-500 text-white'

          return (
            <div
              key={c.candidateId}
              className={cn(
                'relative flex items-center overflow-hidden rounded-lg',
                isLeader
                  ? 'border border-yellow-500/30 bg-yellow-500/5'
                  : 'bg-secondary/20',
              )}
              style={{ height: 52 }}
            >
              {/* Left strip ── days in bestseller + store avatar + short title */}
              <div className="z-10 flex w-56 shrink-0 items-center gap-2 px-2">
                <span className="w-5 text-right text-xs font-bold tabular-nums text-muted-foreground">
                  {String(c.daysInBestseller ?? 0).padStart(2, '0')}
                </span>
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                    avatarColor(c.storeName),
                  )}
                  title={c.storeName}
                >
                  {storeInitial(c.storeName)}
                </div>
                <span
                  className="max-w-[140px] truncate text-xs text-muted-foreground"
                  title={c.productTitle}
                >
                  {shortTitle(c.productTitle)}
                </span>
              </div>

              {/* Track area */}
              <div className="relative flex-1 self-stretch">
                {/* Center rail */}
                <div className="absolute inset-y-0 left-0 right-10 flex items-center">
                  <div className="h-px w-full bg-border/50" />
                </div>

                {/* Finish line (dashed) */}
                <div className="absolute bottom-0 right-10 top-0 border-l border-dashed border-yellow-500/40" />

                {/* Trophy — only for leader */}
                {isLeader && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Trophy className="h-5 w-5 text-yellow-400 drop-shadow-sm" />
                  </div>
                )}

                {/* Horse + score badge — absolutely positioned by score */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1"
                  style={{ left: `${leftPct}%` }}
                >
                  {/* horse emoji, flipped so it faces right */}
                  <span
                    className="select-none text-xl leading-none"
                    style={{ display: 'inline-block', transform: 'scaleX(-1)' }}
                    aria-hidden
                  >
                    🐎
                  </span>
                  <span
                    className={cn(
                      'whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold tabular-nums',
                      badgeCls,
                    )}
                  >
                    {score.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Footer: ver más / ocultar ── */}
      {candidates.length > 0 && (
        <div className="border-t border-border px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {candidates.length} candidatos en total
          </span>
          <button
            onClick={onToggleTable}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {showTable ? 'Ocultar tabla' : 'Ver todos'}
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                showTable && 'rotate-180',
              )}
            />
          </button>
        </div>
      )}
    </div>
  )
}
