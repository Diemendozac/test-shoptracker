'use client'

import { useState, useEffect } from 'react'

export type RatesMap = Record<string, number>

// Hardcoded fallback — used while loading or when API is unreachable
export const FALLBACK_RATES: RatesMap = {
  USD: 1, COP: 4_150, MXN: 17.5, ARS: 960,
  EUR: 0.92, GBP: 0.79, BRL: 5.0, PEN: 3.7,
  CLP: 900, CAD: 1.36, AUD: 1.52,
}

const CACHE_KEY = 'shoptracker_fx_v2'
const TTL = 24 * 60 * 60 * 1000 // 24 hours

// Module-level cache: shared across all hook instances in the same page session,
// avoids multiple fetches even before localStorage is checked.
let modRates: RatesMap | null = null
let modTs = 0

export function useExchangeRates(): { rates: RatesMap; loaded: boolean } {
  const [rates, setRates] = useState<RatesMap>(FALLBACK_RATES)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const now = Date.now()

    // 1. Module cache (warm path after first fetch in session)
    if (modRates && now - modTs < TTL) {
      setRates(modRates)
      setLoaded(true)
      return
    }

    // 2. localStorage cache (survives page reload within 24 h)
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) {
        const { rates: r, ts } = JSON.parse(raw) as { rates: RatesMap; ts: number }
        if (r && now - ts < TTL) {
          modRates = r
          modTs = ts
          setRates(r)
          setLoaded(true)
          return
        }
      }
    } catch {}

    // 3. Fetch live from the API route (Next.js revalidates server-side every 24 h)
    fetch('/api/exchange-rates')
      .then(r => r.json())
      .then(({ rates: r }: { rates?: RatesMap }) => {
        if (r && typeof r === 'object') {
          modRates = r
          modTs = Date.now()
          setRates(r)
          setLoaded(true)
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ rates: r, ts: modTs }))
          } catch {}
        }
      })
      .catch(() => {
        setLoaded(true) // keep fallback rates, mark as "loaded" so UI doesn't spin
      })
  }, [])

  return { rates, loaded }
}
