'use client'

import { useExchangeRates } from '@/lib/exchange-rates'
import { convertWithRates, currencySymbol } from '@/lib/currency'
import { cn } from '@/lib/utils'

interface FormattedPriceProps {
  amount: number | null | undefined
  originalCurrency: string | null | undefined
  preferredCurrency: string
  /** Use compact notation: 252k instead of 252.000 */
  compact?: boolean
  className?: string
}

/**
 * Renders a converted price with the original price/currency as a sub-label.
 *
 * - Live rates fetched once per session from /api/exchange-rates (Frankfurter).
 * - Falls back to hardcoded rates while loading or on network error.
 * - Shows "~" prefix when original currency is unknown.
 * - Shows original price only when a currency conversion actually happened.
 */
export function FormattedPrice({
  amount,
  originalCurrency,
  preferredCurrency,
  compact = false,
  className,
}: FormattedPriceProps) {
  const { rates } = useExchangeRates()

  if (amount == null) {
    return <span className={cn('text-[10px] text-muted-foreground/40', className)}>—</span>
  }

  const from = originalCurrency ?? null
  const currencyKnown = !!from
  const needsConversion = !!from && from !== preferredCurrency

  const converted = needsConversion
    ? convertWithRates(amount, from, preferredCurrency, rates)
    : amount

  const sym = currencySymbol(preferredCurrency)
  const convertedStr = compact
    ? fmtCompact(converted)
    : converted.toLocaleString('es-CO', { maximumFractionDigits: 0 })

  return (
    <div className={cn('flex flex-col items-end leading-none gap-0.5', className)}>
      <span className="text-xs font-semibold text-primary tabular-nums">
        {!currencyKnown && '~'}{sym}{convertedStr}
      </span>
      {needsConversion && from && (
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {currencySymbol(from)}{amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} {from}
        </span>
      )}
    </div>
  )
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toLocaleString('es-CO', { maximumFractionDigits: 0 })
}
