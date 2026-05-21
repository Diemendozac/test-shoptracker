'use client'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
}

export function Sparkline({ data, width = 80, height = 32 }: SparklineProps) {
  if (!data || data.length < 2) return (
    <div style={{ width, height }} className="flex items-center justify-center">
      <span className="text-[9px] text-muted-foreground/40">—</span>
    </div>
  )

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const pad = 2
  const w = width - pad * 2
  const h = height - pad * 2

  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * w,
    y: pad + h - ((v - min) / range) * h,
  }))

  // Smooth cubic bezier path
  const d = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)},${p.y.toFixed(1)}`
    const prev = pts[i - 1]
    const cpx = ((prev.x + p.x) / 2).toFixed(1)
    return `${acc} C ${cpx},${prev.y.toFixed(1)} ${cpx},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }, '')

  // Area fill path (close to bottom)
  const areaD = `${d} L ${pts[pts.length - 1].x.toFixed(1)},${(pad + h).toFixed(1)} L ${pts[0].x.toFixed(1)},${(pad + h).toFixed(1)} Z`

  const last  = data[data.length - 1]
  const first = data[0]
  const isUp  = last >= first
  const stroke = isUp ? '#34d399' : '#f87171'
  const fill   = isUp ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)'

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {/* Area */}
      <path d={areaD} fill={fill} />
      {/* Line */}
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      <circle
        cx={pts[pts.length - 1].x}
        cy={pts[pts.length - 1].y}
        r="2"
        fill={stroke}
      />
    </svg>
  )
}
