// Fechas cortas en español, seguras para null y para fechas sin hora.
//
// `new Date('2026-09-19')` se interpreta como medianoche UTC, así que en cualquier
// huso al oeste de UTC (toda Latinoamérica) se ve el día anterior. Por eso las
// fechas `YYYY-MM-DD` se arman como fecha local. Ver
// docs/redesign/detalle-producto/01-diagnostico.md (P10).

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic']
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/** Convierte un string de la API en Date, o null si falta o no es válido. */
export function parseApiDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const m = DATE_ONLY.exec(value)
  const date = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * "19 sept". Agrega el año cuando no es el actual ("19 sept 2025"), salvo con
 * `year: 'never'` (ejes de gráficos). Sin fecha válida devuelve "—".
 */
export function formatShortDate(
  value: string | null | undefined,
  { year = 'auto' }: { year?: 'auto' | 'never' } = {},
): string {
  const date = parseApiDate(value)
  if (!date) return '—'
  const base = `${date.getDate()} ${MESES[date.getMonth()]}`
  return year === 'auto' && date.getFullYear() !== new Date().getFullYear()
    ? `${base} ${date.getFullYear()}`
    : base
}
