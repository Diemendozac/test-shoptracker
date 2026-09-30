import { mpCheckoutUrl, type MpBilling, type MpPlan } from '@/lib/mercadopago'

// Plan elegido en /pricing que viaja a /login como ?plan=&billing= (CHANGE-125).
// Solo se aceptan los tres planes pagos y el link de pago se arma acá con mpCheckoutUrl:
// nunca se toma una URL del query, así que no queda una redirección abierta.

export interface CheckoutIntent {
  plan: MpPlan
  billing: MpBilling
}

const PAID_PLANS: readonly string[] = ['starter', 'pro', 'agency'] satisfies MpPlan[]

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export function parseCheckoutIntent(
  plan: string | string[] | undefined,
  billing: string | string[] | undefined,
): CheckoutIntent | null {
  const p = first(plan)
  if (!p || !PAID_PLANS.includes(p)) return null
  return { plan: p as MpPlan, billing: first(billing) === 'annual' ? 'annual' : 'monthly' }
}

/** Link de Mercado Pago del plan elegido, o undefined si no se eligió un plan. */
export function checkoutHref(intent: CheckoutIntent | null | undefined): string | undefined {
  return intent ? mpCheckoutUrl(intent.plan, intent.billing) ?? undefined : undefined
}
