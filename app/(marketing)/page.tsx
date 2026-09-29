import './marketing.css'
import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ArrowRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { PhaseBadge } from '@/components/tracker/phase-badge'
import { Brand, HowCard, StoreRow } from '@/components/marketing/landing-parts'
import { LiveProductMock } from '@/components/marketing/live-product-mock'
import { ProductArt, type ProductArtKey } from '@/components/marketing/product-art'
import { RevealOnScroll } from '@/components/marketing/reveal-on-scroll'
import { SampleTag } from '@/components/marketing/sample-tag'
import { ScaleBlock } from '@/components/marketing/scale-block'
import { publishableScale } from '@/lib/marketing/scale'
import { cn } from '@/lib/utils'

// Landing (fase 3.1 del rediseño; spec en docs/redesign/landing-auth-onboarding/02-prototipo-y-spec.md).
// Server Component: el texto llega en el HTML. Las islas cliente son el mock del hero, el
// contador del bloque de escala y la entrada al hacer scroll.
// Tema oscuro solo en esta página: la clase .dark de globals.css en el contenedor, sin tocar
// <html> ni el tema claro del resto de la app (D-7).

export const viewport: Viewport = { themeColor: '#080A15' }

// Solo título y descripción: openGraph vive en app/layout.tsx, junto a app/opengraph-image.tsx.
// Si esta página definiera openGraph, Next lo reemplazaría entero y la imagen se perdería.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Landing.meta')
  return { title: t('title'), description: t('description') }
}

const WRAP = 'mx-auto w-full max-w-[1200px] px-5 lg:px-8'
const KICKER = 'font-mono text-xs font-semibold tracking-[0.06em] text-primary-text uppercase'
const BTN = 'mkt-btn h-12 rounded-[10px] px-5 text-[15px] font-semibold'
const delay = (d: number) => ({ '--d': d }) as React.CSSProperties

const RISING: { art: ProductArtKey; name: string; store: string; cc: string; phase: string }[] = [
  { art: 'masajeador', name: 'neck', store: 'storeC', cc: 'MX', phase: 'Despegue' },
  { art: 'soporte', name: 'mount', store: 'storeD', cc: 'CL', phase: 'Despegue' },
  { art: 'bandas', name: 'bands', store: 'storeA', cc: 'PE', phase: 'Rebote' },
]

const PLANS = ['basic', 'pro', 'agency'] as const

export default async function LandingPage() {
  const t = await getTranslations('Landing')
  const scale = publishableScale()
  // Sin cifras publicables no hay bloque de escala: "Ver el mercado" y "El mercado" apuntarían a
  // la nada, así que el botón secundario lleva a "Cómo funciona" y el enlace de la barra no está.
  const secondary = scale
    ? { href: '#mercado', label: t('hero.ctaMarket') }
    : { href: '#como-funciona', label: t('hero.ctaHow') }

  return (
    <div id="landing" className="dark marketing-dark relative min-h-screen overflow-x-clip bg-background font-sans text-foreground">
      <a
        href="#contenido"
        className="absolute -left-[999px] top-2 z-[100] rounded-lg border border-border bg-card px-3.5 py-2.5 focus:left-2"
      >
        {t('skip')}
      </a>
      <div aria-hidden="true" className="mkt-grid pointer-events-none absolute inset-x-0 top-0 h-[900px]" />

      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className={cn(WRAP, 'flex h-[60px] items-center justify-between gap-3')}>
          <Link href="/" aria-label={t('nav.home')} className="rounded-lg">
            <Brand />
          </Link>
          <nav aria-label={t('nav.label')} className="hidden gap-6 text-sm text-muted-foreground lg:flex">
            {scale && <a href="#mercado" className="hover:text-foreground">{t('nav.market')}</a>}
            <a href="#como-funciona" className="hover:text-foreground">{t('nav.howItWorks')}</a>
            <a href="#planes" className="hover:text-foreground">{t('nav.plans')}</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="inline-flex min-h-11 items-center px-1.5 text-sm text-muted-foreground hover:text-foreground">
              {t('nav.login')}
            </Link>
            <Button asChild variant="brand" className="mkt-btn h-10 rounded-[10px] px-3.5 text-sm font-semibold">
              <Link href="/login?tab=signup">{t('nav.getStarted')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="contenido" className="relative">
        {/* ─── Hero ─────────────────────────────────────────────────────────── */}
        <section className="overflow-x-clip pt-7 pb-12 lg:pt-16 lg:pb-[72px]">
          <div className={cn(WRAP, 'grid gap-7 lg:grid-cols-[1fr_1.02fr] lg:items-start lg:gap-x-14')}>
            <div className="lg:pt-7">
              <span className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.06em] text-primary-text uppercase">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
                {t('hero.eyebrow')}
              </span>
              <h1 className="mkt-h1">
                {t('hero.title')} <span className="mkt-hl">{t('hero.titleHighlight')}</span>
              </h1>
              <p className="mb-[22px] max-w-[34em] text-[17px] text-muted-foreground lg:text-lg">{t('hero.lead')}</p>
              <div className="flex flex-wrap gap-2.5">
                <Button asChild variant="brand" className={BTN}>
                  <Link href="/login?tab=signup">
                    {t('hero.ctaPrimary')} <ArrowRight className="mkt-arrow" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" className={cn(BTN, 'border border-border-hover')}>
                  <a href={secondary.href}>{secondary.label}</a>
                </Button>
              </div>
              <p className="mt-3 font-mono text-xs text-subtle-foreground">{t('hero.micro')}</p>
            </div>

            <div className="relative grid gap-3">
              <div aria-hidden="true" className="mkt-radar pointer-events-none absolute -top-[110px] -right-[120px] -z-10 hidden size-[460px] rounded-full lg:block">
                <div className="mkt-sweep absolute inset-0 rounded-full" />
              </div>
              <LiveProductMock />
              <section aria-label={t('rising.label')} className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-card lg:block">
                <div className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-2.5 font-mono text-xs text-subtle-foreground">
                  <span className="tracking-[0.06em] uppercase">{t('rising.title')}</span>
                  <SampleTag>{t('sampleShort')}</SampleTag>
                </div>
                <ul className="py-1.5">
                  {RISING.map((r) => (
                    <li key={r.name} className="flex items-center gap-2.5 px-3.5 py-2">
                      <ProductArt kind={r.art} size="sm" />
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-sm font-semibold">{t(`rising.${r.name}`)}</b>
                        <span className="text-xs text-subtle-foreground">{t(`rising.${r.store}`)} · {r.cc}</span>
                      </span>
                      <PhaseBadge phase={r.phase} size="md" />
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </section>

        {/* ─── Bloque de escala: solo con cifras publicables (lib/marketing/scale.ts) ─── */}
        {scale && <ScaleBlock scale={scale} />}

        {/* ─── Cómo funciona ───────────────────────────────────────────────── */}
        <section id="como-funciona" aria-labelledby="h-como" className="scroll-mt-20 py-14 lg:py-[88px]">
          <div className={WRAP}>
            <span data-reveal className={KICKER}>{t('how.kicker')}</span>
            <h2 id="h-como" data-reveal style={delay(1)} className="mkt-h2">{t('how.title')}</h2>
            <p data-reveal style={delay(2)} className="max-w-[40em] text-muted-foreground">{t('how.subtitle')}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <HowCard index={t('how.market.index')} title={t('how.market.title')} body={t('how.market.body')} tag={t('sampleShort')} d={0}>
                <div className="grid gap-2">
                  <StoreRow letter="A" domain="tienda-de-ejemplo-a.com" cc="CO" />
                  <StoreRow letter="B" domain="tienda-de-ejemplo-b.com" cc="MX" />
                  <StoreRow letter="C" domain="tienda-de-ejemplo-c.com" cc="CL" />
                </div>
              </HowCard>
              <HowCard index={t('how.ranking.index')} title={t('how.ranking.title')} body={t('how.ranking.body')} tag={t('sampleShort')} d={1}>
                <svg viewBox="0 0 200 64" preserveAspectRatio="none" className="absolute inset-x-3 top-3 h-[46px] w-[calc(100%-24px)]">
                  <polyline
                    points="0,58 16,56 32,59 48,50 64,45 80,40 96,33 112,27 128,22 144,17 160,13 176,10 200,7"
                    fill="none" stroke="var(--primary)" strokeWidth={2} vectorEffect="non-scaling-stroke"
                    strokeLinejoin="round" strokeLinecap="round"
                  />
                </svg>
                <span className="absolute bottom-2.5 left-3 font-mono text-xs text-muted-foreground">{t('how.ranking.spark')}</span>
              </HowCard>
              <HowCard index={t('how.score.index')} title={t('how.score.title')} body={t('how.score.body')} tag={t('sampleShort')} d={2}>
                <div className="flex items-center gap-3">
                  {/* Datos de ejemplo: puntaje de un producto con varios días observados */}
                  <ScoreRing score={73} size="sm" showLabel={false} confidence={1} />
                  <div className="grid min-w-0 flex-1 gap-[7px]">
                    {([['growth', 0.5], ['position', 0.3], ['momentum', 0.2]] as const).map(([k, w]) => (
                      <div key={k} className="grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-[3px] text-xs text-subtle-foreground">
                        <span>{t(`how.score.${k}`)}</span>
                        <span>{w * 100} %</span>
                        <b className="col-span-2 block h-1.5 overflow-hidden rounded-[3px] bg-border">
                          <i className="block h-full origin-left bg-primary" style={{ transform: `scaleX(${w})` }} />
                        </b>
                      </div>
                    ))}
                  </div>
                </div>
              </HowCard>
              <HowCard index={t('how.phase.index')} title={t('how.phase.title')} body={t('how.phase.body')} d={3}>
                <div className="flex h-full flex-wrap content-center gap-2">
                  {['Despegue', 'Meseta', 'Caída', 'Rebote'].map((p) => <PhaseBadge key={p} phase={p} size="md" />)}
                </div>
              </HowCard>
            </div>
          </div>
        </section>

        {/* ─── Tus competidores (secundario) ───────────────────────────────── */}
        <section aria-labelledby="h-own" className="py-14 lg:py-[88px]">
          <div className={cn(WRAP, 'grid gap-6 lg:grid-cols-[1fr_420px] lg:items-center lg:gap-x-14')}>
            <div>
              <span data-reveal className={KICKER}>{t('own.kicker')}</span>
              <h2 id="h-own" data-reveal style={delay(1)} className="mkt-h2">{t('own.title')}</h2>
              <p data-reveal style={delay(2)} className="max-w-[40em] text-muted-foreground">{t('own.subtitle')}</p>
            </div>
            <div data-reveal style={delay(3)} aria-hidden="true" className="max-w-[420px] overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-2.5 font-mono text-xs text-subtle-foreground">
                <span className="tracking-[0.06em] uppercase">{t('own.panel')}</span>
                <SampleTag>{t('sampleShort')}</SampleTag>
              </div>
              <div className="p-3.5">
                <StoreRow letter="M" domain="mi-competidor.com" cc="CO" />
              </div>
              <div className="mx-3.5 mb-3.5 flex items-center gap-2 rounded-[10px] border border-dashed border-border-hover px-3 py-2.5 text-sm text-muted-foreground">
                <Plus className="size-4" /> {t('own.add')}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Planes ──────────────────────────────────────────────────────── */}
        <section id="planes" aria-labelledby="h-planes" className="scroll-mt-20 py-14 lg:py-[88px]">
          <div className={WRAP}>
            <span data-reveal className={KICKER}>{t('plans.kicker')}</span>
            <h2 id="h-planes" data-reveal style={delay(1)} className="mkt-h2">{t('plans.title')}</h2>
            <p data-reveal style={delay(2)} className="max-w-[40em] text-muted-foreground">{t('plans.subtitle')}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {PLANS.map((p, i) => (
                <article key={p} data-reveal style={delay(i)} className="rounded-[14px] border border-border bg-card px-[18px] py-4">
                  <h3 className="mb-2 font-display text-lg font-semibold">{t(`plans.${p}.name`)}</h3>
                  <ul className="grid gap-1 text-[15px] text-muted-foreground">
                    <li>{t('plans.pool')}</li>
                    <li><b className="text-foreground">{t(`plans.${p}.stores`)}</b></li>
                    <li>{t(`plans.${p}.tests`)}</li>
                    <li>{t(`plans.${p}.history`)}</li>
                    <li className="text-sm text-subtle-foreground">{t(`plans.${p}.privacy`)}</li>
                  </ul>
                </article>
              ))}
            </div>
            <p data-reveal className="mt-4 text-[15px]">
              <Link href="/pricing" className="font-semibold text-primary-text underline-offset-[3px] hover:underline">{t('plans.seePricing')}</Link>
              <span className="text-subtle-foreground"> · {t('plans.pricingNote')}</span>
            </p>
          </div>
        </section>

        {/* ─── Cierre ──────────────────────────────────────────────────────── */}
        <section aria-labelledby="h-cta" className="pt-4 pb-14 lg:pb-[88px]">
          <div className={WRAP}>
            <div data-reveal className="grid justify-items-start gap-4 rounded-[18px] border border-border bg-card px-5 py-7 sm:justify-items-center sm:px-7 sm:py-10 sm:text-center">
              <h2 id="h-cta" className="mkt-h2 m-0">{t('cta.title')}</h2>
              <Button asChild variant="brand" className={BTN}>
                <Link href="/login?tab=signup">
                  {t('cta.button')} <ArrowRight className="mkt-arrow" aria-hidden="true" />
                </Link>
              </Button>
              <p className="m-0 font-mono text-xs text-subtle-foreground">{t('cta.micro')}</p>
            </div>
          </div>
        </section>
      </main>

      {/* Privacidad, términos y contacto no se enlazan hasta que existan los textos reales */}
      <footer className="relative border-t border-border pt-7 pb-12">
        <div className={cn(WRAP, 'flex flex-wrap items-center justify-between gap-4')}>
          <Brand size={20} className="text-base" />
          <div className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground">{t('footer.plans')}</Link>
            <Link href="/login" className="hover:text-foreground">{t('footer.login')}</Link>
            <span className="text-subtle-foreground">{t('footer.rights')}</span>
          </div>
        </div>
      </footer>

      <RevealOnScroll rootId="landing" />
    </div>
  )
}

