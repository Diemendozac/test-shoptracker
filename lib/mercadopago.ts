// Mercado Pago — links de suscripción reales (cuenta Dropspy, verificados en checkout
// 2026-07-08, ver wiki scout-pasarela-mercadopago del vault). Activación manual por
// ahora: no hay webhook, se concilia por el email con el que se paga. Lemon Squeezy
// queda descartado — ver docs/CHANGES.md CHANGE-085.

export type MpPlan = 'starter' | 'pro' | 'agency'
export type MpBilling = 'monthly' | 'annual'

const MP_LINKS: Record<MpPlan, Record<MpBilling, string>> = {
  starter: { monthly: 'https://mpago.la/1X8zV8q', annual: 'https://mpago.la/2qURrF5' },
  pro:     { monthly: 'https://mpago.la/19QyfEA', annual: 'https://mpago.la/1CYR7k4' },
  agency:  { monthly: 'https://mpago.la/2ZnQDoy', annual: 'https://mpago.la/1qK3z8U' },
}

export function mpCheckoutUrl(plan: string, billing: MpBilling = 'monthly'): string | null {
  const entry = MP_LINKS[plan as MpPlan]
  return entry ? entry[billing] : null
}
