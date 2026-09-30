// Precios y datos de los planes que muestra /pricing. Es la única fuente de la página: las
// tarjetas, la tabla, el anuncio para lectores de pantalla y las preguntas frecuentes leen de acá.
// Los links de pago siguen en lib/mercadopago.ts y los textos en messages/es.json (Pricing).
import type { MpPlan } from '@/lib/mercadopago'

export type PaidPlan = Exclude<MpPlan, 'agency'>

/** Moneda de los precios publicados. formatCurrency (lib/utils.ts) la muestra como "$". */
export const PRICE_CURRENCY = 'COP'

/** Precio por mes, en pesos. En anual se cobra annualMonthly × 12 en un solo pago. */
export const PLAN_PRICES: Record<PaidPlan, { monthly: number; annualMonthly: number }> = {
  starter: { monthly: 59_900, annualMonthly: 49_900 },
  pro: { monthly: 119_900, annualMonthly: 99_900 },
}

/** Tiendas propias por plan, como se publican. Tienen que coincidir con PLAN_MAX_STORES del backend. */
export const PLAN_STORES: Record<MpPlan, number> = { starter: 15, pro: 40, agency: 100 }

export function annualTotal(plan: PaidPlan): number {
  return PLAN_PRICES[plan].annualMonthly * 12
}

/**
 * Meses que se pagan en anual ("pagas 10 meses y usas 12"). Se redondea hacia arriba y se toma el
 * peor caso entre planes, para que el texto nunca prometa más ahorro del real. Hoy:
 * 598.800 / 59.900 = 9,997 → 10 (el ahorro real es 16,7 %). El 1e-9 evita que un 10 exacto con
 * error de coma flotante suba a 11.
 */
export const ANNUAL_MONTHS_PAID = Math.max(
  ...(Object.keys(PLAN_PRICES) as PaidPlan[]).map((p) => Math.ceil(annualTotal(p) / PLAN_PRICES[p].monthly - 1e-9)),
)

/**
 * Contacto de Agency ("Habla con nosotros"). El canal decidido es WhatsApp; mientras llega el
 * número, es el correo que ya estaba publicado en /pricing.
 */
export const AGENCY_CONTACT_EMAIL = 'hola@dropspy.io'
