import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formatea un número en K/M para displays compactos (p.ej. 53000 → "53K") */
export function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K`
  return String(Math.round(n))
}

/** Redondea unidades/día al entero más cercano (mínimo 1). Usar solo si u >= 0.5 */
export function fmtUnits(u: number): string {
  return String(Math.max(1, Math.round(u)))
}
