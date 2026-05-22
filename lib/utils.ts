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

/** Formatea unidades/día con 1 decimal si < 10, entero si ≥ 10 */
export function fmtUnits(u: number): string {
  return u < 10 ? u.toFixed(1) : String(Math.round(u))
}
