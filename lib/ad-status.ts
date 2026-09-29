// Cómo se nombra el estado de un anuncio en pantalla.
//
// Con los datos de hoy, `inactive` no quiere decir "terminó": el job solo lee una parte
// de los anuncios de cada tienda y marca inactivo lo que no vio (tope de 50, matcheo por
// handle, tiendas sin visitar, barrido de vencidos). Por eso se dice "No visto desde…" y
// no "Terminado". Y un `active` cuya tienda no se revisa hace días avisa "visto hace N d".
// Ver docs/redesign/biblioteca-anuncios/01-diagnostico.md (A1) y 02-propuesta.md (1.3).

import type { Ad } from '@/app/(dashboard)/types'
import { formatShortDate, parseApiDate } from '@/lib/format-date'

/** Un activo visto hace más de estos días se marca como "visto hace N d". */
export const STALE_AFTER_DAYS = 2

export interface AdStatusDescription {
  /** "Activo" | "No visto" */
  label: string
  /** ok: verde · warn: ámbar (no sabemos si sigue) */
  tone: 'ok' | 'warn'
  /** "desde 15 ene", "visto hace 9 d", "desde el 27 sept". Vacío si falta la fecha. */
  detail: string
  /** El detalle va en ámbar: activo cuya tienda no se revisa hace días */
  detailWarn: boolean
  /** Explicación para el tooltip */
  hint?: string
}

/** Días de calendario (locales) entre dos fechas, sin que el horario de verano mueva la cuenta. */
function calendarDaysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((b - a) / 86_400_000)
}

export function describeAdStatus(
  ad: Pick<Ad, 'status' | 'first_seen' | 'last_seen'>,
  today: Date = new Date(),
): AdStatusDescription {
  const lastSeen = parseApiDate(ad.last_seen)

  if (ad.status === 'active') {
    const seenAgo = lastSeen ? calendarDaysBetween(lastSeen, today) : null
    if (seenAgo != null && seenAgo > STALE_AFTER_DAYS) {
      return {
        label: 'Activo',
        tone: 'ok',
        detail: `visto hace ${seenAgo} d`,
        detailWarn: true,
        hint: `Su tienda no se revisó desde el ${formatShortDate(ad.last_seen)}: puede que ya no esté corriendo`,
      }
    }
    return {
      label: 'Activo',
      tone: 'ok',
      detail: parseApiDate(ad.first_seen) ? `desde ${formatShortDate(ad.first_seen)}` : '',
      detailWarn: false,
    }
  }

  return {
    label: 'No visto',
    tone: 'warn',
    detail: lastSeen ? `desde el ${formatShortDate(ad.last_seen)}` : '',
    detailWarn: false,
    hint: 'No apareció en la última revisión de su tienda: puede haber terminado o no haberse revisado',
  }
}
