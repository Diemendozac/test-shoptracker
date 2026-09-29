import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft, Check } from 'lucide-react'
import { AuthCard, type AuthTab } from '@/components/auth/auth-card'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { PhaseBadge } from '@/components/tracker/phase-badge'
import { Brand } from '@/components/marketing/landing-parts'
import { ProductArt } from '@/components/marketing/product-art'
import { SampleTag } from '@/components/marketing/sample-tag'

// Registro e ingreso (fase 3.2; spec en docs/redesign/landing-auth-onboarding/02-prototipo-y-spec.md).
// Server Component: lee ?tab= acá y se lo pasa a la tarjeta, así el formulario viene en el HTML
// (antes useSearchParams bajo un Suspense vacío lo dejaba en blanco hasta hidratar, B3.2).
// El tema oscuro lo pone app/(auth)/layout.tsx.

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth.meta')
  return { title: t('title') }
}

const WRAP = 'mx-auto w-full max-w-[1200px] px-5 lg:px-8'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>
}) {
  const { tab } = await searchParams
  const initialTab: AuthTab = tab === 'signup' ? 'signup' : 'login'
  const t = await getTranslations('Auth')

  return (
    <>
      <div aria-hidden="true" className="mkt-grid pointer-events-none absolute inset-x-0 top-0 h-[900px]" />
      <header className="relative border-b border-border">
        <div className={`${WRAP} flex h-[60px] items-center justify-between gap-3`}>
          <Link href="/" aria-label={t('page.home')} className="rounded-lg">
            <Brand />
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 px-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t('page.backToHome')}
          </Link>
        </div>
      </header>

      <main className={`${WRAP} relative grid gap-7 pt-6 pb-24 lg:grid-cols-[1fr_440px] lg:items-start lg:gap-x-16 lg:pt-14`}>
        {/* En el celular, la tarjeta del formulario va primero y el resumen de valor debajo */}
        <div className="lg:order-2">
          <AuthCard initialTab={initialTab} />
        </div>

        <section aria-labelledby="auth-side-title" className="lg:order-1 lg:pt-3">
          <span className="font-mono text-xs font-semibold tracking-[0.06em] text-primary-text uppercase">{t('side.kicker')}</span>
          <h2 id="auth-side-title" className="mkt-h2 text-[clamp(24px,6vw,34px)]">{t('side.title')}</h2>
          <ul className="mt-3.5 mb-5 grid gap-2 text-muted-foreground">
            {(['factTrial', 'factDaily', 'factOwn'] as const).map((k) => (
              <li key={k} className="flex items-start gap-2">
                <Check className="mt-1 size-4 flex-none text-success-foreground" aria-hidden="true" />
                {t(`side.${k}`)}
              </li>
            ))}
          </ul>
          <div aria-hidden="true" className="max-w-[420px] overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-2.5 font-mono text-xs text-subtle-foreground">
              <span className="tracking-[0.06em] uppercase">{t('side.mockTitle')}</span>
              <SampleTag>{t('side.sample')}</SampleTag>
            </div>
            <div className="flex items-center gap-3 px-3.5 py-3">
              <ProductArt kind="licuadora" />
              <span className="min-w-0 flex-1">
                <b className="block truncate text-sm font-semibold">{t('side.mockProduct')}</b>
                <span className="text-xs text-subtle-foreground">{t('side.mockMeta')}</span>
              </span>
            </div>
            <div className="flex items-center gap-3 px-3.5 pb-3.5">
              {/* Datos de ejemplo: el mismo producto del mock de la landing, en el día 14 */}
              <ScoreRing score={73} size="sm" showLabel={false} confidence={1} />
              <PhaseBadge phase="Despegue" size="md" />
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
