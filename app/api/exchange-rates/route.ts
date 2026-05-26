import { NextResponse } from 'next/server'

// Server-side revalidation every 24 h via Next.js fetch cache
export const revalidate = 86400

export async function GET() {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD', {
      next: { revalidate: 86400 },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    // Frankfurter omits the base currency from rates — add USD=1 explicitly
    const rates = { USD: 1, ...data.rates }
    return NextResponse.json({ rates, base: 'USD', date: data.date })
  } catch {
    return NextResponse.json({ error: 'rates_unavailable' }, { status: 503 })
  }
}
