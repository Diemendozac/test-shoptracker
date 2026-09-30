import type { CSSProperties, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { AGENCY_CONTACT_EMAIL, ANNUAL_MONTHS_PAID, PRICE_CURRENCY, annualTotal } from '@/lib/pricing'
import { formatCurrency } from '@/lib/utils'

// Preguntas frecuentes de /pricing: <details> nativo, sin JS y sin animar la altura. Una sola
// columna también en escritorio: en dos, abrir una pregunta deja un hueco en la otra y se pierde el
// orden de lectura. Solo preguntas con respuesta real: cancelación y factura entran cuando haya dato.
const ITEMS = ['card', 'trialEnd', 'howToPay', 'activation', 'annual', 'privacy', 'downgrade', 'agency'] as const

export async function PricingFaq() {
  const t = await getTranslations('Pricing.faq')
  const values = {
    paid: ANNUAL_MONTHS_PAID,
    starterTotal: formatCurrency(annualTotal('starter'), PRICE_CURRENCY),
    proTotal: formatCurrency(annualTotal('pro'), PRICE_CURRENCY),
    email: AGENCY_CONTACT_EMAIL,
    mail: (chunks: ReactNode) => (
      <a href={`mailto:${AGENCY_CONTACT_EMAIL}`} className="font-semibold text-primary-text underline-offset-[3px] hover:underline">
        {chunks}
      </a>
    ),
  }

  return (
    <div className="mt-[22px] grid max-w-[760px] gap-2">
      {ITEMS.map((id, i) => (
        <details
          key={id}
          data-reveal
          style={{ '--d': Math.min(i, 3) } as CSSProperties}
          className="group rounded-xl border border-border bg-card"
        >
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3.5 font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
            {t(`${id}.q`)}
            <ChevronDown
              aria-hidden="true"
              className="size-4 shrink-0 text-subtle-foreground transition-transform duration-160 ease-(--mkt-ease) group-open:rotate-180"
            />
          </summary>
          <p className="px-4 pb-4 text-[15px] text-muted-foreground">{t.rich(`${id}.a`, values)}</p>
        </details>
      ))}
    </div>
  )
}
