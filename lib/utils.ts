import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { currencySymbol } from '@/lib/currency'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Monto con el símbolo de su moneda, separadores de es-CO y sin decimales:
 * (59900, 'COP') → "$59.900", (12, 'USD') → "US$12". Es el formato que ya usan FormattedPrice
 * y el inicio. Sin monto (null, undefined o NaN) → "—". No agrega "~": si el número es una
 * estimación, el prefijo lo pone quien llama.
 */
export function formatCurrency(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return '—'
  const digits = Math.abs(amount).toLocaleString('es-CO', { maximumFractionDigits: 0 })
  return `${amount < 0 ? '-' : ''}${currencySymbol(currency)}${digits}`
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
