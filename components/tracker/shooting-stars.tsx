'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'
import type { TrackerCandidate } from '@/app/(dashboard)/types'

interface ShootingStarsProps {
  candidates: TrackerCandidate[]
  onRequestFullTable: () => void
  showFullTable: boolean
}

// ─── Cinematic composition — intentional art direction, not algorithmic ─────────
// Each position chosen for visual rhythm: high-low-high-low-mid creates
// asymmetric balance. The eye enters at #1 (upper-left anchor) and travels
// diagonally but not mechanically.
const POSITIONS = [
  { x: 9,  y: 19 },  // #1 — dominant anchor, upper-left, visual gravity
  { x: 33, y: 54 },  // #2 — drops lower, creates pull-down tension
  { x: 56, y: 27 },  // #3 — rises unexpectedly, breaks pattern, breathing room
  { x: 72, y: 63 },  // #4 — descends again, receding into depth
  { x: 88, y: 44 },  // #5 — mid-height close to horizon, not cornered
]

// Tail angle: all comets travel the same direction (meteor shower physics)
const TAIL_ANGLE = 45

// Visual hierarchy — the gap between #1 and #5 is intentionally dramatic
const HEAD_SIZES   = [114, 84, 68, 56, 46]
const BASE_LENGTHS = [560, 400, 295, 210, 148]
const BASE_THICK   = [11,   7,   5,   4,   3]

// Drift: per-rank speed + stagger so comets feel independent
const DRIFT_DUR   = ['2.8s', '3.6s', '4.5s', '5.8s', '7.2s']
const DRIFT_DELAY = ['0s',  '1.1s', '0.5s', '1.8s', '0.9s']

// ─── Color palette — ordered by rank ──────────────────────────────────────────
const COLORS = [
  { head: '#a78bfa', rgb: '167,139,250', inner: '#ede9fe' },  // violet  #1
  { head: '#fb923c', rgb: '251,146,60',  inner: '#ffedd5' },  // orange  #2
  { head: '#86efac', rgb: '134,239,172', inner: '#f0fdf4' },  // emerald #3
  { head: '#60a5fa', rgb: '96,165,250',  inner: '#dbeafe' },  // blue    #4
  { head: '#22d3ee', rgb: '34,211,238',  inner: '#ecfeff' },  // cyan    #5
]

// ─── Deterministic fields — no Math.random (avoids hydration mismatch) ────────
const STARS_FAR = Array.from({ length: 70 }, (_, i) => ({
  cx: ((i * 41 + 17) % 97) + 1,
  cy: ((i * 29 + 11) % 93) + 3,
  r:  i % 11 === 0 ? 1.6 : i % 5 === 0 ? 1.0 : 0.45,
  o:  0.03 + (i % 9) * 0.03,
}))
const STARS_MID = Array.from({ length: 25 }, (_, i) => ({
  cx: ((i * 67 + 31) % 95) + 2,
  cy: ((i * 53 + 7)  % 89) + 5,
  r:  i % 4 === 0 ? 1.2 : 0.65,
  o:  0.08 + (i % 5) * 0.04,
}))
// Foreground dust — bottom 45% of canvas only
const DUST = Array.from({ length: 24 }, (_, i) => ({
  cx:  ((i * 83 + 19) % 95) + 2,
  cy:  54 + ((i * 47 + 9) % 40),
  r:   0.3 + (i % 3) * 0.2,
  o:   0.03 + (i % 6) * 0.015,
  dur: `${19 + (i % 7) * 5}s`,
  del: `${(i * 2.1) % 13}s`,
}))

const AVATAR_BG = ['#4c1d95', '#1e3a8a', '#7c2d12', '#831843', '#064e3b', '#312e81']
function avatarBg(seed: string) {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % AVATAR_BG.length
  return AVATAR_BG[h]
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ShootingStars({ candidates }: ShootingStarsProps) {
  const top5 = [...candidates]
    .sort((a, b) => (b.performanceScore ?? 0) - (a.performanceScore ?? 0))
    .slice(0, 5)

  if (top5.length === 0) return null

  const maxScore = Math.max(...top5.map(c => c.performanceScore ?? 0))

  return (
    <div className="mb-4 overflow-hidden rounded-xl" style={{
      border: '1px solid rgba(255,255,255,0.05)',
      background: '#020914',
    }}>
      {/* Header — restrained, typographic */}
      <div className="flex items-center justify-between px-5 py-3" style={{
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div className="flex items-center gap-3">
          <Zap className="h-3 w-3 text-violet-400" strokeWidth={2.5} />
          <span className="text-[11px] font-semibold tracking-[0.18em] uppercase"
            style={{ color: 'rgba(255,255,255,0.55)' }}>
            Top Winners
          </span>
          <span className="rounded px-1.5 py-0.5 text-[9px] font-medium tabular-nums"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.28)' }}>
            {top5.length} signals
          </span>
        </div>
        <span className="text-[9px] tracking-[0.14em] uppercase"
          style={{ color: 'rgba(255,255,255,0.16)' }}>
          trail · momentum &nbsp;·&nbsp; scale · dominance
        </span>
      </div>

      {/* ── Cinematic canvas ── */}
      <div className="relative overflow-hidden select-none" style={{ height: 400, background: '#020914' }}>

        {/* Atmospheric base — directional volumetric lighting */}
        <div className="pointer-events-none absolute inset-0" style={{
          background: [
            // Primary light source anchored at #1 position (upper-left)
            'radial-gradient(ellipse 65% 70% at 12% 15%, rgba(109,40,217,0.22) 0%, transparent 60%)',
            // Secondary ambient near horizon
            'radial-gradient(ellipse 80% 30% at 50% 100%, rgba(15,40,100,0.35) 0%, transparent 55%)',
            // Mid-field light spill
            'radial-gradient(ellipse 45% 40% at 78% 65%, rgba(8,100,140,0.10) 0%, transparent 60%)',
          ].join(','),
        }} />

        {/* Nebula fog — 3 soft breathing volumes, not decorative blobs */}
        <div className="pointer-events-none absolute" style={{
          top: '-15%', left: '-5%', width: '55%', height: '90%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(76,29,149,0.16) 0%, rgba(76,29,149,0.04) 50%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'nebula-drift 16s ease-in-out infinite',
          ['--nb-o' as string]: '0.16',
        }} />
        <div className="pointer-events-none absolute" style={{
          top: '20%', right: '-5%', width: '40%', height: '60%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(8,100,140,0.12) 0%, transparent 70%)',
          filter: 'blur(70px)',
          animation: 'nebula-drift 22s ease-in-out infinite 6s',
          ['--nb-o' as string]: '0.12',
        }} />
        <div className="pointer-events-none absolute" style={{
          bottom: '5%', left: '30%', width: '40%', height: '50%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(20,50,120,0.10) 0%, transparent 70%)',
          filter: 'blur(55px)',
          animation: 'nebula-drift 28s ease-in-out infinite 11s',
          ['--nb-o' as string]: '0.10',
        }} />

        {/* Far stars — slowest parallax layer */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ animation: 'star-far 32s ease-in-out infinite', willChange: 'transform' }}>
          {STARS_FAR.map((s, i) => (
            <circle key={i} cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r} fill="white" opacity={s.o} />
          ))}
        </svg>

        {/* Mid stars — faster parallax */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ animation: 'star-near 20s ease-in-out infinite', willChange: 'transform' }}>
          {STARS_MID.map((s, i) => (
            <circle key={i} cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r} fill="white" opacity={s.o} />
          ))}
        </svg>

        {/* Foreground dust — bottom of frame, slowest, greatest parallax */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {DUST.map((d, i) => (
            <circle key={i} cx={`${d.cx}%`} cy={`${d.cy}%`} r={d.r} fill="white" opacity={d.o}
              style={{ animation: `dust-flow ${d.dur} ease-in-out infinite ${d.del}` }} />
          ))}
        </svg>

        {/* ── Comets ── */}
        {top5.map((c, i) => {
          const score      = c.performanceScore ?? 0
          const SIZE       = HEAD_SIZES[i]
          const half       = SIZE / 2
          const isTop      = i === 0
          const color      = COLORS[i]
          const g          = `rgba(${color.rgb},`

          // Data-encoded visual properties
          const confidence  = Math.max(0, Math.min(1, c.signalConfidence ?? 0))
          const bestseller  = c.daysInBestseller ?? 0
          const scoreBoost  = Math.max(0, (score - 48) * 2.2)
          const trailLen    = Math.round(BASE_LENGTHS[i] + scoreBoost)
          const trailThick  = Math.max(2, BASE_THICK[i] + Math.min(5, bestseller * 0.4))
          const trailOpac   = 0.58 + confidence * 0.42
          const strength    = maxScore > 0 ? score / maxScore : 0

          const pos   = POSITIONS[i]
          // Clamp Y so head never clips the top edge
          const minY  = (half / 400) * 100 + 1.5
          const xPct  = pos.x
          const yPct  = Math.max(minY, pos.y)
          const rank         = String(i + 1).padStart(2, '0')
          const scoreFontSize = [22, 18, 15, 13, 12][i]
          const barWidth      = [52, 44, 36, 30, 26][i]

          return (
            <Link key={c.candidateId}
              href={`/tracker/${c.candidateId}?storeId=${c.storeId}`}
              className="group absolute"
              style={{
                left: `${xPct}%`,
                top:  `${yPct}%`,
                animation: `comet-drift ${DRIFT_DUR[i]} ease-in-out infinite ${DRIFT_DELAY[i]}`,
                willChange: 'transform',
              }}
            >
              {/* ── Trail system — radial-gradient cone + additive screen blending ──
                  Key insight: radial-gradient(ellipse at right center) on a wide div
                  naturally produces a tapered cone — bright and wide at the head,
                  dissolving to nothing at the tip. No hard edges, no flat bars.
                  mix-blend-mode:screen = additive light (overlapping trails glow brighter).

                  Layer anatomy:
                    1. Volumetric field  — wide atmospheric haze, very blurred
                    2. Energy cone       — main body, data-encoded, tapered shape
                    3. Luminous spine    — bright narrow core along center axis
                    4. White-hot tip     — acceleration peak near the head
              */}

              {/* 1. Volumetric field — atmospheric light spill, very wide, near invisible */}
              <div className="pointer-events-none absolute" style={{
                right: SIZE - half * 0.3,
                top: '50%',
                width:  Math.round(trailLen * 1.4),
                height: Math.round(trailThick * 22),
                borderRadius: '50%',
                transformOrigin: 'right center',
                transform: `translateY(-50%) rotate(${TAIL_ANGLE}deg)`,
                background: `radial-gradient(ellipse ${Math.round(trailLen * 1.1)}px ${Math.round(trailThick * 11)}px at right center, ${g}${(trailOpac * 0.24).toFixed(2)}) 0%, transparent 70%)`,
                filter: 'blur(16px)',
                mixBlendMode: 'screen',
              }} />

              {/* 2. Energy cone — tapered shape, carries data-encoded opacity + length */}
              <div className="pointer-events-none absolute" style={{
                right: SIZE - half * 0.15,
                top: '50%',
                width:  trailLen,
                height: Math.round(trailThick * 10),
                borderRadius: '50%',
                transformOrigin: 'right center',
                transform: `translateY(-50%) rotate(${TAIL_ANGLE}deg)`,
                background: `radial-gradient(ellipse ${Math.round(trailLen * 0.85)}px ${Math.round(trailThick * 5)}px at right center, ${g}${(trailOpac * 0.80).toFixed(2)}) 0%, ${g}${(trailOpac * 0.30).toFixed(2)}) 40%, transparent 75%)`,
                filter: 'blur(5px)',
                mixBlendMode: 'screen',
              }} />

              {/* 3. Luminous spine — tight bright center, no blur, pure momentum */}
              <div className="pointer-events-none absolute" style={{
                right: SIZE,
                top: '50%',
                width:  Math.round(trailLen * 0.62),
                height: Math.round(trailThick * 3),
                borderRadius: '50%',
                transformOrigin: 'right center',
                transform: `translateY(-50%) rotate(${TAIL_ANGLE}deg)`,
                background: `radial-gradient(ellipse ${Math.round(trailLen * 0.48)}px ${Math.round(trailThick * 1.5)}px at right center, ${color.inner} 0%, ${g}${trailOpac.toFixed(2)}) 30%, transparent 80%)`,
                filter: 'blur(1.5px)',
                mixBlendMode: 'screen',
              }} />

              {/* 4. White-hot tip — pure white core at peak acceleration, screen-blended */}
              <div className="pointer-events-none absolute" style={{
                right: SIZE,
                top: '50%',
                width:  Math.round(trailLen * 0.18),
                height: Math.round(trailThick * 1.2),
                borderRadius: '50%',
                transformOrigin: 'right center',
                transform: `translateY(-50%) rotate(${TAIL_ANGLE}deg)`,
                background: `radial-gradient(ellipse ${Math.round(trailLen * 0.12)}px ${Math.round(trailThick * 0.6)}px at right center, rgba(255,255,255,0.95) 0%, ${color.inner} 35%, transparent)`,
                mixBlendMode: 'screen',
              }} />

              {/* Glow halo — soft radial, not hard ring */}
              <div className="pointer-events-none absolute rounded-full" style={{
                width:  SIZE + (isTop ? 70 : 30),
                height: SIZE + (isTop ? 70 : 30),
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle, ${g}${isTop ? '0.42)' : '0.20)'} 0%, ${g}0.08) 50%, transparent 75%)`,
                filter: `blur(${isTop ? 28 : 16}px)`,
                zIndex: 1,
              }} />

              {/* #1 only: two expanding corona rings */}
              {isTop && (<>
                <div className="pointer-events-none absolute rounded-full" style={{
                  width: SIZE + 72, height: SIZE + 72,
                  top: '50%', left: '50%',
                  border: `1px solid ${g}0.40)`,
                  animation: 'corona-ring-1 2.8s ease-in-out infinite',
                  zIndex: 0,
                }} />
                <div className="pointer-events-none absolute rounded-full" style={{
                  width: SIZE + 116, height: SIZE + 116,
                  top: '50%', left: '50%',
                  border: `1px solid ${g}0.16)`,
                  animation: 'corona-ring-2 2.8s ease-in-out infinite 0.8s',
                  zIndex: 0,
                }} />
              </>)}

              {/* ── Head ── */}
              <div style={{
                position: 'relative', width: SIZE, height: SIZE,
                transform: `translate(-${half}px, -${half}px)`,
                zIndex: 2,
              }}>
                {/* #1 leader marker — thin vertical signal above head */}
                {isTop && (
                  <div className="pointer-events-none absolute" style={{
                    top: -32, left: 0, right: 0, textAlign: 'center', zIndex: 5,
                  }}>
                    <span style={{
                      fontSize: 7, fontWeight: 700, letterSpacing: '0.26em',
                      textTransform: 'uppercase', color: color.head,
                      opacity: 0.75, display: 'block',
                    }}>
                      LEADER
                    </span>
                    <div style={{
                      width: 1, height: 11, margin: '4px auto 0',
                      background: `linear-gradient(to bottom, ${g}0.40), transparent)`,
                    }} />
                  </div>
                )}

                {/* Product image */}
                {c.productImage ? (
                  <img
                    src={`/api/image-proxy?url=${encodeURIComponent(c.productImage)}`}
                    alt=""
                    className="rounded-full object-cover"
                    style={{
                      width: SIZE, height: SIZE,
                      border: `${isTop ? 2.5 : 1.5}px solid ${g}0.70)`,
                      boxShadow: [
                        `0 0 ${isTop ? 48 : 20}px ${g}${isTop ? '0.65)' : '0.45)'})`,
                        `inset 0 0 24px rgba(0,0,0,0.45)`,
                      ].join(', '),
                    }}
                    onError={e => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  <div className="flex items-center justify-center rounded-full font-black text-white" style={{
                    width: SIZE, height: SIZE,
                    fontSize: isTop ? 30 : 17,
                    background: `radial-gradient(circle at 35% 35%, ${avatarBg(c.productTitle)}cc, ${avatarBg(c.productTitle)})`,
                    border: `${isTop ? 2.5 : 1.5}px solid ${g}0.70)`,
                    boxShadow: `0 0 ${isTop ? 48 : 20}px ${g}${isTop ? '0.65)' : '0.45)'})`,
                  }}>
                    {c.productTitle.trim().charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Rank badge — lower-right, stamped outside the circle */}
                <div className="pointer-events-none absolute" style={{
                  bottom: -7, right: -7, zIndex: 4,
                  padding: isTop ? '2px 8px 3px' : '1px 6px 2px',
                  background: 'rgba(3, 6, 16, 0.92)',
                  border: `1.5px solid ${color.head}`,
                  borderRadius: 5,
                  backdropFilter: 'blur(10px)',
                  boxShadow: `0 0 14px ${g}0.28), inset 0 0 6px ${g}0.06)`,
                }}>
                  <span style={{
                    display: 'block',
                    fontSize: isTop ? 14 : 10,
                    fontWeight: 900,
                    color: color.head,
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    textShadow: `0 0 10px ${g}0.60)`,
                  }}>
                    {rank}
                  </span>
                </div>
              </div>

              {/* ── Metrics panel — right of head, vertically centered on head ── */}
              {/* Geometry:
                  - left: half + 14  →  14px gap from visual head right edge
                  - top: -half        →  aligns container top with visual head top
                  - height: SIZE      →  same span as the visual head, flex-center fills the rest
              */}
              <div className="pointer-events-none absolute" style={{
                left: half + 14,
                top: -half,
                height: SIZE,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 0,
                zIndex: 3,
                whiteSpace: 'nowrap',
              }}>
                {/* Score — primary metric */}
                <div>
                  <p style={{
                    fontSize: 7, fontWeight: 600,
                    letterSpacing: '0.20em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.24)', lineHeight: 1, marginBottom: 3,
                  }}>
                    SCR
                  </p>
                  <p style={{
                    fontSize: scoreFontSize, fontWeight: 900,
                    color: color.head,
                    letterSpacing: '-0.03em', lineHeight: 1,
                    textShadow: `0 0 20px ${g}0.55)`,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {Math.round(score)}
                  </p>
                </div>

                {/* Growth — secondary, only when available */}
                {c.growthPct != null && (
                  <p style={{
                    fontSize: isTop ? 11 : 9, fontWeight: 700,
                    marginTop: 5, letterSpacing: '0.03em',
                    color: c.growthPct > 0
                      ? color.head
                      : c.growthPct < 0
                        ? '#f87171'
                        : 'rgba(255,255,255,0.22)',
                  }}>
                    {c.growthPct > 0 ? '+' : ''}{Math.round(c.growthPct)}%
                  </p>
                )}

                {/* Strength bar — tertiary, relative dominance */}
                <div style={{
                  marginTop: 8,
                  width: barWidth, height: 1.5,
                  borderRadius: 9999,
                  background: 'rgba(255,255,255,0.07)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 9999,
                    width: `${Math.round(strength * 100)}%`,
                    background: color.head, opacity: 0.65,
                  }} />
                </div>
              </div>

              {/* Hover tooltip */}
              <div className="pointer-events-none absolute z-20 opacity-0 transition-opacity duration-200 group-hover:opacity-100 whitespace-nowrap"
                style={{ bottom: half + 16, left: '50%', transform: `translateX(calc(-50% - ${half}px))` }}>
                <div className="rounded-xl px-3 py-2.5 text-xs shadow-2xl" style={{
                  background: 'rgba(8,14,28,0.95)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  backdropFilter: 'blur(12px)',
                }}>
                  <p className="font-semibold leading-tight text-white">{c.productTitle}</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>{c.storeName}</p>
                  <div style={{
                    marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: '2px 16px', fontSize: 10,
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>Score</span>
                    <span style={{ textAlign: 'right', fontWeight: 600, color: color.head }}>~{Math.round(score)}</span>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>Confianza</span>
                    <span style={{ textAlign: 'right', fontWeight: 500, color: 'rgba(255,255,255,0.65)' }}>{Math.round(confidence * 100)}%</span>
                    {bestseller > 0 && <>
                      <span style={{ color: 'rgba(255,255,255,0.35)' }}>Bestseller</span>
                      <span style={{ textAlign: 'right', fontWeight: 500, color: 'rgba(255,255,255,0.65)' }}>{bestseller}d</span>
                    </>}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}

        {/* Planet horizon — soft atmospheric edge, not decorative ring */}
        <div className="pointer-events-none absolute" style={{
          bottom: -130, left: '-12%', right: '-12%', height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 2%, rgba(20,45,110,0.38) 0%, rgba(8,16,38,0.50) 40%, transparent 68%)',
          borderTop: '1px solid rgba(120,140,200,0.04)',
          boxShadow: '0 -50px 140px rgba(15,60,180,0.09)',
        }} />

        {/* Vignette — draws the eye inward, away from edges */}
        <div className="pointer-events-none absolute inset-0" style={{
          background: 'radial-gradient(ellipse 85% 80% at 50% 46%, transparent 42%, rgba(2,9,20,0.80) 100%)',
        }} />

      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-2" style={{
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)' }}>
          {candidates.length} candidatos activos
        </span>
        <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.12)' }}>
          #1 dominancia máxima
        </span>
      </div>
    </div>
  )
}
