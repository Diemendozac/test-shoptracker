// Lemon Squeezy — configuración de planes y checkout
// Completa las constantes cuando tengas los productos creados en el dashboard de LS

// Slug de tu store (ej: si es dropspy.lemonsqueezy.com → 'dropspy')
const LS_STORE = 'dropspy'

// Variant IDs — copiar desde el dashboard de LS, sección Products → cada variante
export const LS_VARIANTS = {
  starter_monthly: '1739614',
  starter_annual:  '1739601',
  pro_monthly:     '1739623',
  pro_annual:      '1739640',
  agency_monthly:  '1739668',
  agency_annual:   '1739669',
} as const

export type LsPlan    = 'starter' | 'pro' | 'agency'
export type LsBilling = 'monthly' | 'annual'

export function lsVariantId(plan: LsPlan, billing: LsBilling): string {
  return LS_VARIANTS[`${plan}_${billing}`]
}

export function lsCheckoutUrl(variantId: string, email?: string, userId?: string): string {
  if (!variantId) return '/pricing'
  const url = new URL(`https://${LS_STORE}.lemonsqueezy.com/buy/${variantId}`)
  if (email)  url.searchParams.set('checkout[email]', email)
  if (userId) url.searchParams.set('checkout[custom][user_id]', userId)
  return url.toString()
}

