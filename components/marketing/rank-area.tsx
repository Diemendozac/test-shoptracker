import { useId } from 'react'
import { cn } from '@/lib/utils'

// Gráfico de rank liviano (SVG, sin Recharts) para el mock de la landing: Recharts pesa y no
// puede frenar el primer pintado. Sigue las reglas visuales de components/tracker/rank-chart.tsx:
// línea --primary de 2 px, área del 18 % al 0 %, eje Y invertido con "#", curva monótona,
// punto hueco en la entrada y relleno en la mejor posición. Si esas reglas cambian en
// RankChart, hay que cambiarlas acá también.

const W = 300
const H = 120

/** Curva monótona en X (la misma familia que type="monotone" de Recharts). */
function monotonePath(points: [number, number][]): string {
  const n = points.length
  if (n === 0) return ''
  if (n === 1) return `M${points[0][0]},${points[0][1]}`
  const dx: number[] = []
  const slope: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1][0] - points[i][0]
    slope[i] = (points[i + 1][1] - points[i][1]) / dx[i]
  }
  const t: number[] = [slope[0]]
  for (let i = 1; i < n - 1; i++) {
    t[i] = slope[i - 1] * slope[i] <= 0
      ? 0
      : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / slope[i - 1] + (dx[i] + 2 * dx[i - 1]) / slope[i])
  }
  t[n - 1] = slope[n - 2]
  let d = `M${points[0][0]},${points[0][1]}`
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3
    d += ` C${points[i][0] + h},${points[i][1] + h * t[i]} ${points[i + 1][0] - h},${points[i + 1][1] - h * t[i + 1]} ${points[i + 1][0]},${points[i + 1][1]}`
  }
  return d
}

interface RankAreaProps {
  /** Rank por día (1 = primero). Todos > 0 */
  ranks: number[]
  /** Último día visible (índice). La curva se revela hasta ahí. Default: todos */
  upTo?: number
  /** Peor rank del eje Y (abajo) */
  maxRank: number
  /** Ticks del eje Y, p. ej. [1, 20, 40] */
  yTicks: number[]
  xStart: string
  xEnd: string
  className?: string
}

export function RankArea({ ranks, upTo, maxRank, yTicks, xStart, xEnd, className }: RankAreaProps) {
  const gradientId = `rank-area-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const last = ranks.length - 1
  const shown = Math.max(0, Math.min(upTo ?? last, last))
  const yOf = (rank: number) => ((rank - 1) / Math.max(maxRank - 1, 1)) * H
  const points = ranks.map((r, i): [number, number] => [last > 0 ? (i / last) * W : 0, yOf(r)])
  const line = monotonePath(points)
  const area = `${line} L${W},${H} L0,${H} Z`

  let best = 0
  for (let i = 0; i <= shown; i++) if (ranks[i] < ranks[best]) best = i
  const pct = ([x, y]: [number, number]) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` })

  return (
    <div className={cn('relative h-[140px] lg:h-[168px]', className)}>
      {/* Área del gráfico: el SVG se estira (preserveAspectRatio none) y los puntos van en HTML para no deformarse */}
      <div className="absolute top-2 right-1.5 bottom-[22px] left-9">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.18} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
            <clipPath id={`${gradientId}-clip`}>
              <rect
                x="0" y="-10" width={W + 4} height={H + 20}
                className="rank-area-reveal"
                style={{ transform: `scaleX(${last > 0 ? shown / last : 1})` }}
              />
            </clipPath>
          </defs>
          <g clipPath={`url(#${gradientId}-clip)`}>
            <path d={area} fill={`url(#${gradientId})`} />
            <path
              d={line} fill="none" stroke="var(--primary)" strokeWidth={2}
              vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round"
            />
          </g>
        </svg>
        <span
          className="absolute -mt-1 -ml-1 size-2 rounded-full border-2 border-primary bg-card"
          style={pct(points[0])}
        />
        <span
          className={cn(
            'rank-area-dot absolute -mt-[5px] -ml-[5px] size-2.5 rounded-full border-2 border-card bg-primary shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_22%,transparent)]',
            best === 0 && 'opacity-0',
          )}
          style={pct(points[best])}
        />
      </div>
      <div className="absolute top-2 bottom-[22px] left-0 w-8 text-right text-xs leading-none text-subtle-foreground tabular-nums">
        {yTicks.map((tick) => (
          <span key={tick} className="absolute right-0 -translate-y-1/2" style={{ top: `${(yOf(tick) / H) * 100}%` }}>
            #{tick}
          </span>
        ))}
      </div>
      <div className="absolute right-1.5 bottom-0 left-9 flex justify-between text-xs leading-none text-subtle-foreground">
        <span>{xStart}</span>
        <span>{xEnd}</span>
      </div>
    </div>
  )
}
