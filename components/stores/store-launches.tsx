import { cn } from '@/lib/utils'
import type { TrackerCandidate } from '@/app/(dashboard)/types'

// "Cómo prueba esta tienda" (CHANGE-138, Fase 3b). Solo con los productos que Dropspy sigue hoy
// en la tienda (el seguimiento dura unos 30 días por producto), así que habla de ese período.
//
// Acierto (decisión de Daniel, 2026-09-30): el producto llegó al top 10 % del catálogo de la
// tienda, es decir, su mejor puesto registrado es ≤ 10 % de los productos de la tienda. Es justo
// entre tiendas de catálogos muy distintos: top 10 de 30 productos no es lo mismo que de 500.

export const HIT_SHARE = 0.1

export function storeTestingStats(candidates: TrackerCandidate[], catalogSize: number | null) {
  const weeks = [0, 0, 0, 0]
  for (const c of candidates) {
    const w = Math.floor(c.daysElapsed / 7)
    if (w >= 0 && w < 4) weeks[3 - w]++
  }
  const cutoff = catalogSize && catalogSize > 0 ? Math.max(1, Math.floor(catalogSize * HIT_SHARE)) : null
  const hits = cutoff == null ? null : candidates.filter((c) => {
    const ranks = (c.rankHistory ?? []).filter((r) => r > 0)
    const best = ranks.length > 0 ? Math.min(...ranks) : c.currentRank
    return best != null && best <= cutoff
  }).length
  const span = candidates.reduce((max, c) => Math.max(max, c.daysElapsed), 0)
  return { weeks, cutoff, hits, total: candidates.length, span }
}

export function StoreLaunches({ candidates, catalogSize }: { candidates: TrackerCandidate[]; catalogSize: number | null }) {
  const { weeks, cutoff, hits, total, span } = storeTestingStats(candidates, catalogSize)
  const max = Math.max(1, ...weeks)
  const labels = ['hace 4 sem.', 'hace 3 sem.', 'hace 2 sem.', 'esta semana']

  let sentence: string
  if (total === 0) {
    sentence = 'Dropspy todavía no sigue productos de esta tienda. Aparecen después del próximo corte.'
  } else if (hits == null || cutoff == null) {
    sentence = `Dropspy sigue ${total} ${total === 1 ? 'producto' : 'productos'} de esta tienda. No sabemos el tamaño de su catálogo, así que no podemos medir cuántos acertaron.`
  } else {
    const ratio = hits > 0 && hits < total ? Math.round(total / hits) : null
    const tail = hits === total && total > 1 ? ': todos acertaron' : ratio && ratio > 1 ? `: acierta 1 de cada ${ratio}` : ''
    sentence = `De los ${total} ${total === 1 ? 'producto' : 'productos'} que Dropspy siguió en los últimos ${Math.max(span, 1)} días, ${hits} ${hits === 1 ? 'llegó' : 'llegaron'} al top 10 % de su catálogo (puesto ${cutoff} o mejor)${tail}.`
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card" aria-labelledby="como-prueba">
      <h2 id="como-prueba" className="text-sm font-semibold text-foreground">Cómo prueba esta tienda</h2>
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-foreground">{sentence}</p>
      {total > 0 && (
        <div className="mt-4 grid grid-cols-4 items-end gap-3" role="img" aria-label={`Productos nuevos por semana: ${weeks.join(', ')}`}>
          {weeks.map((n, i) => (
            <div key={i} className="grid justify-items-center gap-1">
              <span className="text-xs font-semibold tabular-nums text-foreground">{n}</span>
              <span className={cn('w-full max-w-12 rounded-md', i === 3 ? 'bg-primary' : 'bg-primary-subtle')} style={{ height: `${8 + (n / max) * 56}px` }} />
              <span className="text-[11px] text-subtle-foreground">{labels[i]}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
