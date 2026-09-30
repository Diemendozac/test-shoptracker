// Escala de señal única — CHANGE-134 (Fase 2b del rediseño). Regla aprobada por Daniel el
// 2026-09-30. Es solo lógica de visualización: no cambia el puntaje ni nada del backend.
//
// Por qué una regla nueva: el `performanceLabel` del backend es una banda de puntaje
// (Rocket ≥70, Rising ≥50, Steady ≥30, Declining ≥15, Watching <15; ver CLAUDE.md). "Declining"
// no significa que el producto esté cayendo, así que no sirve para decir "Cayendo". Esta regla
// mira el movimiento real del puesto en el ranking de más vendidos.
//
// La regla, sobre los últimos 7 registros de rank (menor número = mejor puesto):
//   Nuevo       2 días o menos de seguimiento.
//   Despegando  subió 3+ puestos Y 20 %+, con 3+ subidas seguidas, y puntaje 50 o más.
//   Creciendo   subió 3+ puestos Y 10 %+.
//   Cayendo     bajó 3+ puestos Y 20 %+, con 3+ bajadas en esos registros.
//   Estable     todo lo demás, o menos de 3 registros de rank.
// Confianza = días de datos, lo mismo que el backend guarda como signalConfidence (días ÷ 15):
//   1–4 baja · 5–9 media · 10+ alta.
//
// Límite conocido: el historial de rank solo tiene los días en que el producto estuvo en más
// vendidos (DailyTrackingRepository.findRankHistoryByCandidateId filtra los null). Si sale del
// ranking no queda registro, así que no se marca como Cayendo.

export type SignalState = 'nuevo' | 'despegando' | 'creciendo' | 'estable' | 'cayendo'
export type SignalConfidence = 'baja' | 'media' | 'alta'

export interface Signal {
  state: SignalState
  confidence: SignalConfidence
  /** Puesto en el último registro. */
  rank: number | null
  /** Puestos ganados en la ventana: positivo = subió, negativo = bajó. null si no hay 2 registros. */
  rankChange: number | null
  /** Los registros usados (hasta 7), del más viejo al más nuevo. */
  window: number[]
}

export const SIGNAL_WINDOW = 7

export const SIGNAL_LABEL: Record<SignalState, string> = {
  nuevo: 'Nuevo',
  despegando: 'Despegando',
  creciendo: 'Creciendo',
  estable: 'Estable',
  cayendo: 'Cayendo',
}

export function signalConfidence(daysElapsed: number | null | undefined): SignalConfidence {
  const d = daysElapsed ?? 0
  if (d >= 10) return 'alta'
  if (d >= 5) return 'media'
  return 'baja'
}

export function computeSignal(input: {
  daysElapsed: number | null | undefined
  rankHistory?: number[] | null
  performanceScore?: number | null
}): Signal {
  const confidence = signalConfidence(input.daysElapsed)
  const window = (input.rankHistory ?? [])
    .filter((r): r is number => typeof r === 'number' && Number.isFinite(r) && r > 0)
    .slice(-SIGNAL_WINDOW)
  const rank = window.length > 0 ? window[window.length - 1] : null
  const rankChange = window.length >= 2 ? window[0] - window[window.length - 1] : null

  const base = { confidence, rank, rankChange, window }

  if ((input.daysElapsed ?? 0) <= 2) return { ...base, state: 'nuevo' }
  if (window.length < 3 || rankChange == null) return { ...base, state: 'estable' }

  const first = window[0]
  const relative = rankChange / first

  let downs = 0
  let streak = 0
  let maxUpStreak = 0
  for (let i = 1; i < window.length; i++) {
    if (window[i] < window[i - 1]) {
      streak++
      maxUpStreak = Math.max(maxUpStreak, streak)
    } else {
      if (window[i] > window[i - 1]) downs++
      streak = 0
    }
  }

  const score = input.performanceScore ?? 0
  if (rankChange >= 3 && relative >= 0.2 && maxUpStreak >= 3 && score >= 50) return { ...base, state: 'despegando' }
  if (rankChange >= 3 && relative >= 0.1) return { ...base, state: 'creciendo' }
  if (rankChange <= -3 && -relative >= 0.2 && downs >= 3) return { ...base, state: 'cayendo' }
  return { ...base, state: 'estable' }
}
