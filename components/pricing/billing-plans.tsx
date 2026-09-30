'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowRight, Check, Clock, Mail, Users, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { mpCheckoutUrl, type MpBilling } from '@/lib/mercadopago'
import {
  AGENCY_CONTACT_EMAIL, ANNUAL_MONTHS_PAID, PLAN_PRICES, PLAN_STORES, PRICE_CURRENCY, annualTotal, type PaidPlan,
} from '@/lib/pricing'
import { cn, formatCurrency } from '@/lib/utils'
import { PriceAmount } from './price-amount'
import { useHasSession } from './session-switch'

// Interruptor mensual/anual y tarjetas de /pricing. Comparten la facturación elegida y dependen de
// la sesión, por eso son una isla cliente; el resto de la página es del servidor.
// Nada se anima al cargar: el precio se lee desde el primer frame y solo cuenta (240 ms) al
// cambiar la facturación. Las tarjetas no llevan data-reveal por la misma razón.
// En escritorio, subgrid: nombre, precio, nota, funciones y botón quedan a la misma altura en las
// tres tarjetas aunque una descripción ocupe dos líneas (Agency deja vacía la fila de la nota).

const PAID: PaidPlan[] = ['starter', 'pro']
const CARD = 'grid content-start gap-3.5 rounded-2xl border border-border bg-card p-[18px] lg:row-span-5 lg:grid-rows-subgrid lg:p-6'
const BTN = 'mkt-btn h-12 w-full rounded-[10px] px-5 text-[15px] font-semibold'
const TITLE = 'font-display text-xl leading-tight font-semibold tracking-[-0.01em]'
const FOR = 'mt-1 text-[15px] text-pretty text-muted-foreground'
const NOTE = '-mt-1.5 text-center text-[13px] text-balance text-subtle-foreground'
const FADE = 'col-start-1 row-start-1 transition-opacity duration-160 ease-(--mkt-ease)'

const money = (n: number) => formatCurrency(n, PRICE_CURRENCY)

export function BillingPlans() {
  const t = useTranslations('Pricing')
  const hasSession = useHasSession()
  const [annual, setAnnual] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const billing: MpBilling = annual ? 'annual' : 'monthly'

  function choose(next: boolean) {
    if (next === annual) return
    setAnnual(next)
    // Solo al cambiar, nunca al cargar: el lector de pantalla oye los precios finales
    setAnnouncement(next
      ? t('billing.announceAnnual', {
          starter: money(PLAN_PRICES.starter.annualMonthly), starterTotal: money(annualTotal('starter')),
          pro: money(PLAN_PRICES.pro.annualMonthly), proTotal: money(annualTotal('pro')),
        })
      : t('billing.announceMonthly', { starter: money(PLAN_PRICES.starter.monthly), pro: money(PLAN_PRICES.pro.monthly) }))
  }

  const label = (on: boolean) => cn('cursor-pointer text-[15px] select-none', on ? 'font-semibold text-foreground' : 'text-subtle-foreground')

  return (
    <>
      {/* Las etiquetas son un atajo para el mouse; el control accesible es el switch */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
        <span aria-hidden="true" onClick={() => choose(false)} className={label(!annual)}>{t('billing.monthly')}</span>
        <button
          type="button"
          role="switch"
          aria-checked={annual}
          aria-label={t('billing.switchLabel')}
          onClick={() => choose(!annual)}
          className={cn(
            'relative h-[30px] w-[52px] shrink-0 cursor-pointer rounded-full border outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
            annual ? 'border-primary bg-primary' : 'border-input bg-secondary',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'absolute top-[3px] left-[3px] size-[22px] rounded-full transition-transform duration-160 ease-(--mkt-ease)',
              annual ? 'translate-x-[22px] bg-primary-foreground' : 'bg-foreground',
            )}
          />
        </button>
        <span aria-hidden="true" onClick={() => choose(true)} className={label(annual)}>{t('billing.annual')}</span>
        <span className="rounded-full border border-success-border bg-success-subtle px-2.5 py-[5px] text-[13px] font-semibold text-success-foreground">
          {t('billing.saving', { paid: ANNUAL_MONTHS_PAID })}
        </span>
      </div>
      <p aria-live="polite" className="sr-only">{announcement}</p>

      <section aria-labelledby="h-planes" className="mt-7 lg:mt-9">
        <h2 id="h-planes" className="sr-only">{t('plans.title')}</h2>
        <div className="grid gap-3 lg:grid-cols-3 lg:grid-rows-[repeat(5,auto)] lg:gap-y-0">
          {PAID.map((id) => (
            <PlanCard key={id} id={id} annual={annual} billing={billing} hasSession={hasSession} />
          ))}
          <AgencyCard />
        </div>
        <p className="mt-3.5 text-sm text-subtle-foreground">{t('plans.foot')}</p>
      </section>
    </>
  )
}

function PlanCard({ id, annual, billing, hasSession }: { id: PaidPlan; annual: boolean; billing: MpBilling; hasSession: boolean }) {
  const t = useTranslations('Pricing.plans')
  const price = PLAN_PRICES[id]
  // Con sesión, el link real de Mercado Pago de ese plan y esa facturación. Sin sesión, el registro
  // con el plan y la facturación, que después sigue al pago (CHANGE-125).
  const payHref = hasSession ? mpCheckoutUrl(id, billing) : null
  const features: Feature[] = [
    { icon: Check, text: t('pool') },
    { icon: Check, text: t('stores', { count: PLAN_STORES[id] }), strong: true },
    ...(id === 'pro' ? [{ icon: Check, text: t('advertiser') }, { icon: Check, text: t('library') }] : []),
    { icon: Check, text: t('alerts') },
    id === 'starter'
      ? { icon: Users, text: t('communityPool'), soft: true }
      : { icon: Clock, text: t('privacySoon'), soft: true },
  ]

  return (
    <article aria-labelledby={`p-${id}`} className={CARD}>
      <header className="lg:row-start-1">
        <h3 id={`p-${id}`} className={TITLE}>{t(`${id}.name`)}</h3>
        <p className={FOR}>{t(`${id}.for`)}</p>
      </header>
      <p className="flex flex-wrap items-baseline gap-1.5 lg:row-start-2 lg:self-end">
        <span className="text-[13px] font-semibold text-subtle-foreground">{t('currency')}</span>
        <PriceAmount
          value={annual ? price.annualMonthly : price.monthly}
          currency={PRICE_CURRENCY}
          className="text-[34px] leading-none font-bold tracking-[-0.02em]"
        />
        <span className="text-[15px] text-subtle-foreground">{t('perMonth')}</span>
      </p>
      {/* Las dos notas ocupan la misma celda y se cruzan (160 ms): la tarjeta no cambia de alto */}
      <p className="-mt-2 grid text-sm text-subtle-foreground lg:row-start-3">
        <span aria-hidden={annual || undefined} className={cn(FADE, annual && 'opacity-0')}>{t('noteMonthly')}</span>
        <span aria-hidden={!annual || undefined} className={cn(FADE, !annual && 'opacity-0')}>
          {t('noteAnnual', { total: money(annualTotal(id)) })}
        </span>
      </p>
      <FeatureList items={features} />
      <div className="grid gap-3 lg:row-start-5 lg:self-start">
        <Button asChild variant={id === 'pro' ? 'brand' : 'outline'} className={BTN}>
          {payHref ? (
            <a href={payHref} target="_blank" rel="noopener noreferrer">
              {t('ctaSession')}
              <ArrowRight aria-hidden="true" className="mkt-arrow" />
            </a>
          ) : (
            <Link href={`/login?tab=signup&plan=${id}&billing=${billing}`}>
              {t('cta')}
              <ArrowRight aria-hidden="true" className="mkt-arrow" />
            </Link>
          )}
        </Button>
        <p className={NOTE}>{payHref ? t('ctaNoteSession') : t('ctaNote')}</p>
      </div>
    </article>
  )
}

// Agency no tiene precio publicado: se arma conversando. El canal decidido es WhatsApp; mientras
// llega el número, el correo (lib/pricing.ts).
function AgencyCard() {
  const t = useTranslations('Pricing.plans')
  const mailto = `mailto:${AGENCY_CONTACT_EMAIL}?subject=${encodeURIComponent(t('agency.mailSubject'))}`

  return (
    <article aria-labelledby="p-agency" className={CARD}>
      <header className="lg:row-start-1">
        <h3 id="p-agency" className={TITLE}>{t('agency.name')}</h3>
        <p className={FOR}>{t('agency.for', { stores: PLAN_STORES.pro })}</p>
      </header>
      <p className="font-display text-[22px] leading-tight font-semibold lg:row-start-2 lg:self-end">{t('agency.price')}</p>
      <FeatureList
        items={[
          { icon: Check, text: t('agency.allPro') },
          { icon: Check, text: t('stores', { count: PLAN_STORES.agency }), strong: true },
          { icon: Clock, text: t('privacySoon'), soft: true },
        ]}
      />
      <div className="grid gap-3 lg:row-start-5 lg:self-start">
        <Button asChild variant="outline" className={BTN}>
          <a href={mailto}>
            {t('agency.cta')}
            <Mail aria-hidden="true" />
          </a>
        </Button>
        <p className={NOTE}>{t('agency.ctaNote', { email: AGENCY_CONTACT_EMAIL })}</p>
      </div>
    </article>
  )
}

interface Feature { icon: LucideIcon; text: string; strong?: boolean; soft?: boolean }

function FeatureList({ items }: { items: Feature[] }) {
  return (
    <ul className="grid content-start gap-2 text-[15px] lg:row-start-4">
      {items.map(({ icon: Icon, text, strong, soft }) => (
        <li key={text} className={cn('flex items-start gap-2', soft && 'text-sm text-subtle-foreground')}>
          <Icon aria-hidden="true" className={cn('mt-[3px] size-4 shrink-0', soft ? 'text-subtle-foreground' : 'text-primary-text')} />
          <span className={cn(strong && 'font-semibold text-foreground')}>{text}</span>
        </li>
      ))}
    </ul>
  )
}
