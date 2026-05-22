// Tasas de cambio aproximadas — actualizar periódicamente
// Base: 1 USD
const USD_TO_COP = 4_150
const USD_TO_MXN = 17.5
const USD_TO_ARS = 960

const RATES: Record<string, Record<string, number>> = {
  USD: { USD: 1,            COP: USD_TO_COP,          MXN: USD_TO_MXN,          ARS: USD_TO_ARS },
  COP: { USD: 1/USD_TO_COP, COP: 1,                   MXN: USD_TO_MXN/USD_TO_COP, ARS: USD_TO_ARS/USD_TO_COP },
  MXN: { USD: 1/USD_TO_MXN, COP: USD_TO_COP/USD_TO_MXN, MXN: 1,                 ARS: USD_TO_ARS/USD_TO_MXN },
  ARS: { USD: 1/USD_TO_ARS, COP: USD_TO_COP/USD_TO_ARS, MXN: USD_TO_MXN/USD_TO_ARS, ARS: 1 },
}

export function convertCurrency(
  amount: number,
  from: string | null | undefined,
  to: string | null | undefined,
): number {
  if (!from || !to || from === to) return amount
  const rate = RATES[from]?.[to]
  return rate != null ? amount * rate : amount
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', COP: '$', MXN: '$', ARS: '$',
}

export const SUPPORTED_CURRENCIES = ['USD', 'COP', 'MXN', 'ARS'] as const
