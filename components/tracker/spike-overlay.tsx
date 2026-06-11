'use client'

import type { SpikeState } from '@/lib/spike-store'

interface SpikeOverlayProps {
  children: React.ReactNode
  state: SpikeState
  level: number   // 0–4
  size: number
}

// Spine positions: top edge (x as fraction of size) and side edges (y as fraction).
const TOP_SPINES: Record<number, number[]> = {
  0: [],
  1: [0.5],
  2: [0.3, 0.7],
  3: [0.2, 0.5, 0.8],
  4: [0.15, 0.38, 0.62, 0.85],
}

const SIDE_SPINES: Record<number, Array<{ side: 'left' | 'right'; y: number }>> = {
  0: [],
  1: [],
  2: [{ side: 'right', y: 0.5 }],
  3: [{ side: 'right', y: 0.35 }, { side: 'right', y: 0.65 }],
  4: [
    { side: 'right', y: 0.3 }, { side: 'right', y: 0.7 },
    { side: 'left',  y: 0.3 }, { side: 'left',  y: 0.7 },
  ],
}

export function SpikeOverlay({ children, state, level, size }: SpikeOverlayProps) {
  if (!state || state === 'dead') return <>{children}</>

  const pad = 14
  const svgW = size + pad * 2
  const svgH = size + pad * 2 + 10  // extra bottom room for roots
  const spineH = 10 + level * 2     // spine height grows with level

  const color = state === 'shrinking' ? '#f59e0b' : '#10b981'
  const opacity = state === 'shrinking' ? 0.75 : 0.9

  const topSpines = TOP_SPINES[level] ?? []
  const sideSpines = SIDE_SPINES[level] ?? []

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {children}

      <svg
        width={svgW}
        height={svgH}
        style={{
          position: 'absolute',
          top: -pad,
          left: -pad,
          pointerEvents: 'none',
          overflow: 'visible',
          zIndex: 10,
        }}
        aria-hidden="true"
      >
        {/* Roots — always visible in spike mode */}
        {[-9, -3, 3, 9].map((offset, i) => (
          <line
            key={`root-${i}`}
            x1={pad + size / 2 + offset}
            y1={pad + size}
            x2={pad + size / 2 + offset * 1.6}
            y2={pad + size + 9}
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity={0.65}
          />
        ))}

        {/* Top spines */}
        {topSpines.map((fx, i) => {
          const x = pad + fx * size
          const baseW = 3
          return (
            <polygon
              key={`top-${i}`}
              points={`${x},${pad - spineH} ${x - baseW},${pad} ${x + baseW},${pad}`}
              fill={color}
              opacity={opacity}
            />
          )
        })}

        {/* Side spines */}
        {sideSpines.map((sp, i) => {
          const y = pad + sp.y * size
          const baseW = 2.5
          const tipX = sp.side === 'right'
            ? pad + size + spineH - 2
            : pad - spineH + 2
          const baseX = sp.side === 'right' ? pad + size : pad
          return (
            <polygon
              key={`side-${i}`}
              points={`${tipX},${y} ${baseX},${y - baseW} ${baseX},${y + baseW}`}
              fill={color}
              opacity={opacity}
            />
          )
        })}
      </svg>
    </div>
  )
}