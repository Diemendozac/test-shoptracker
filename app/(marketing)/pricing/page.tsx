import '../marketing.css'
import type { CSSProperties } from 'react'
import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ArrowRight, Check, Lock, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Brand } from '@/components/marketing/landing-parts'
import { RevealOnScroll } from '@/components/marketing/reveal-on-scroll'
import { BillingPlans } from '@/components/pricing/billing-plans'
import { CompareTable } from '@/components/pricing/compare-table'
import { PricingFaq } from '@/components/pricing/pricing-faq'
import { SessionSwitch } from '@/components/pricing/session-switch'
import { cn } from '@/lib/utils'

// /pricing (rediseño, fase 3). Server Component: el texto y los precios llegan en el HTML.
// Islas cliente: el interruptor con las tarjetas (billing-plans), lo que cambia con la sesión
// (session-switch) y la entrada al hacer scroll. Mismo tema oscuro y primitivas de movimiento que
// la landing (.dark.marketing-dark). La barra y el pie son propios: este cambio no toca la landing.
// Solo un botón de marca (degradado) por vista: el de Pro. Por eso "Empieza gratis" de la barra
// va sólido acá.

export const viewport: Viewport = { themeColor: '#080A15' }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Pricing.meta')
  return { title: t('title'), description: t('description') }
}

const WRAP = 'mx-auto w-full max-w-[1200px] px-5 lg:px-8'
const KICKER = 'font-mono text-xs font-semibold tracking-[0.06em] text-primary-text uppercase'
const SECTION = 'py-14 lg:py-[88px]'
const BTN = 'mkt-btn h-12 rounded-[10px] px-5 text-[15px] font-semibold'
const NAV_BTN = 'mkt-btn h-10 rounded-[10px] px-3.5 text-sm font-semibold'
const BOX = 'grid content-start gap-2.5 rounded-[14px] border border-border bg-card p-4'
const LIST = 'grid gap-2 text-[15px] text-muted-foreground'
const delay = (d: number) => ({ '--d': d }) as CSSProperties

const TRIAL_IN = ['days', 'pool', 'ads', 'store', 'alerts'] as const
const TRIAL_OUT = ['pool', 'metrics', 'videos', 'advertiser'] as const
const STEPS = ['choose', 'pay', 'activate'] as const

export default async function PricingPage() {
  const t = await getTranslations('Pricing')
  const landing = await getTranslations('Landing')

  return (
    <div id="pricing" className="dark marketing-dark relative min-h-screen overflow-x-clip bg-background font-sans text-foreground">
      <a
        href="#contenido"
        className="absolute -left-[999px] top-2 z-[100] rounded-lg border border-border bg-card px-3.5 py-2.5 focus:left-2"
      >
        {landing('skip')}
      </a>
      <div aria-hidden="true" className="mkt-grid pointer-events-none absolute inset-x-0 top-0 h-[900px]" />

      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className={cn(WRAP, 'flex h-[60px] items-center justify-between gap-3')}>
          <Link href="/" aria-label={landing('nav.home')} className="rounded-lg">
            <Brand />
          </Link>
          <nav aria-label={landing('nav.label')} className="hidden gap-6 text-sm text-muted-foreground lg:flex">
            <Link href="/#como-funciona" className="hover:text-foreground">{landing('nav.howItWorks')}</Link>
            <Link href="/pricing" aria-current="page" className="text-foreground">{landing('nav.plans')}</Link>
          </nav>
          <div className="flex items-center gap-2">
            <SessionSwitch
              guest={
                <>
                  <Link href="/login" className="inline-flex min-h-11 items-center px-1.5 text-sm text-muted-foreground hover:text-foreground">
                    {landing('nav.login')}
                  </Link>
                  <Button asChild className={NAV_BTN}>
                    <Link href="/login?tab=signup">{landing('nav.getStarted')}</Link>
                  </Button>
                </>
              }
              session={
                <Button asChild variant="outline" className={NAV_BTN}>
                  <Link href="/dashboard">{t('nav.backToApp')}</Link>
                </Button>
              }
            />
          </div>
        </div>
      </header>

      <main id="contenido" className="relative">
        {/* ─── Hero, interruptor y planes (sin data-reveal: el precio no espera) ──────── */}
        <section aria-labelledby="h-precios" className="pt-7 pb-2 lg:pt-16">
          <div className={WRAP}>
            <span className={KICKER}>{t('hero.eyebrow')}</span>
            <h1 id="h-precios" className="mkt-h1 max-w-[16em]">
              {t('hero.title')} <span className="mkt-hl inline-block">{t('hero.titleHighlight')}</span>
            </h1>
            <p className="mb-[22px] max-w-[34em] text-[17px] text-muted-foreground lg:text-lg">{t('hero.lead')}</p>
            <BillingPlans />
          </div>
        </section>

        {/* ─── Prueba gratis ───────────────────────────────────────────────────────────── */}
        <section id="prueba" aria-labelledby="h-prueba" className={SECTION}>
          <div className={WRAP}>
            <span data-reveal className={KICKER}>{t('trial.kicker')}</span>
            <h2 id="h-prueba" data-reveal style={delay(1)} className="mkt-h2">{t('trial.title')}</h2>
            <p data-reveal style={delay(2)} className="max-w-[40em] text-muted-foreground">{t('trial.subtitle')}</p>
            <div className="mt-[22px] grid gap-3 lg:grid-cols-2">
              <div data-reveal className={BOX}>
                <h3 className="flex items-center gap-2 text-[17px] font-semibold">
                  <Check aria-hidden="true" className="size-4" />
                  {t('trial.includes')}
                </h3>
                <ul className={LIST}>
                  {TRIAL_IN.map((k) => (
                    <li key={k} className="flex items-start gap-2">
                      <Check aria-hidden="true" className="mt-[3px] size-4 shrink-0 text-success-foreground" />
                      {t(`trial.in.${k}`)}
                    </li>
                  ))}
                </ul>
              </div>
              <div data-reveal style={delay(1)} className={BOX}>
                <h3 className="flex items-center gap-2 text-[17px] font-semibold">
                  <Lock aria-hidden="true" className="size-4" />
                  {t('trial.excludes')}
                </h3>
                <ul className={LIST}>
                  {TRIAL_OUT.map((k) => (
                    <li key={k} className="flex items-start gap-2">
                      <Minus aria-hidden="true" className="mt-[3px] size-4 shrink-0 text-subtle-foreground" />
                      {t(`trial.out.${k}`)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* Con sesión no hay nada que empezar: el botón desaparece */}
            <SessionSwitch
              guest={
                <p data-reveal className="mt-[18px]">
                  <Button asChild variant="brand" className={BTN}>
                    <Link href="/login?tab=signup">
                      {t('trial.cta')}
                      <ArrowRight aria-hidden="true" className="mkt-arrow" />
                    </Link>
                  </Button>
                </p>
              }
              session={null}
            />
          </div>
        </section>

        {/* ─── Comparación ─────────────────────────────────────────────────────────────── */}
        <section id="comparar" aria-labelledby="h-comparar" className={SECTION}>
          <div className={WRAP}>
            <span data-reveal className={KICKER}>{t('compare.kicker')}</span>
            <h2 id="h-comparar" data-reveal style={delay(1)} className="mkt-h2">{t('compare.title')}</h2>
            <p data-reveal style={delay(2)} className="max-w-[40em] text-muted-foreground">{t('compare.subtitle')}</p>
            <CompareTable />
          </div>
        </section>

        {/* ─── Cómo funciona el pago ───────────────────────────────────────────────────── */}
        <section id="pago" aria-labelledby="h-pago" className={SECTION}>
          <div className={WRAP}>
            <span data-reveal className={KICKER}>{t('payment.kicker')}</span>
            <h2 id="h-pago" data-reveal style={delay(1)} className="mkt-h2">{t('payment.title')}</h2>
            <ol className="mt-[22px] grid gap-3 lg:grid-cols-3">
              {STEPS.map((k, i) => (
                <li
                  key={k}
                  data-reveal
                  style={delay(i)}
                  className="grid grid-cols-[36px_1fr] items-start gap-3 rounded-[14px] border border-border bg-card px-4 py-3.5"
                >
                  <span
                    aria-hidden="true"
                    className="rounded-[10px] border border-primary-border bg-primary-subtle text-center font-mono text-[13px] leading-9 font-semibold text-primary-text"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <b className="mb-0.5 block text-base">{t(`payment.${k}.title`)}</b>
                    <span className="text-[15px] text-muted-foreground">{t(`payment.${k}.body`)}</span>
                  </div>
                </li>
              ))}
            </ol>
            <p data-reveal className="mt-3 rounded-[14px] border border-border bg-card p-4 text-[15px] text-muted-foreground">
              {t('payment.honest')}
            </p>
          </div>
        </section>

        {/* ─── Preguntas frecuentes ────────────────────────────────────────────────────── */}
        <section id="preguntas" aria-labelledby="h-preguntas" className={SECTION}>
          <div className={WRAP}>
            <span data-reveal className={KICKER}>{t('faq.kicker')}</span>
            <h2 id="h-preguntas" data-reveal style={delay(1)} className="mkt-h2">{t('faq.title')}</h2>
            <PricingFaq />
          </div>
        </section>

        {/* ─── Cierre ──────────────────────────────────────────────────────────────────── */}
        <section aria-labelledby="h-cierre" className="pt-10 pb-[72px]">
          <div className={WRAP}>
            <div data-reveal className="grid justify-items-start gap-3.5 rounded-[18px] border border-border bg-card p-6 lg:p-9">
              <h2 id="h-cierre" className="mkt-h2 m-0">{t('closing.title')}</h2>
              <SessionSwitch
                guest={
                  <>
                    <Button asChild variant="brand" className={BTN}>
                      <Link href="/login?tab=signup">
                        {t('closing.cta')}
                        <ArrowRight aria-hidden="true" className="mkt-arrow" />
                      </Link>
                    </Button>
                    <span className="font-mono text-[13px] text-subtle-foreground">{t('closing.note')}</span>
                  </>
                }
                session={
                  <Button asChild variant="brand" className={BTN}>
                    <Link href="/dashboard">
                      {t('nav.backToApp')}
                      <ArrowRight aria-hidden="true" className="mkt-arrow" />
                    </Link>
                  </Button>
                }
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-border pt-7 pb-12">
        <div className={cn(WRAP, 'flex flex-wrap items-center justify-between gap-4')}>
          <Brand size={20} className="text-base" />
          <div className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">{t('footer.home')}</Link>
            <Link href="/login" className="hover:text-foreground">{landing('footer.login')}</Link>
            <span className="text-subtle-foreground">{landing('footer.rights')}</span>
          </div>
        </div>
      </footer>

      <RevealOnScroll rootId="pricing" />
    </div>
  )
}
