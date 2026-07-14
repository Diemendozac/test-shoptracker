'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Zap,
  Target,
  TrendingUp,
  BarChart3,
  Eye,
  Bell,
  Shield,
} from 'lucide-react'
import { DropspyIcon } from '@/components/ui/dropspy-logo'

const stats = [
  { value: '10x', key: 'discovery' as const },
  { value: '50+', key: 'stores' as const },
  { value: '30', key: 'window' as const },
  { value: '24/7', key: 'monitoring' as const },
]

const features = [
  { icon: Eye, key: 'snapshots' as const },
  { icon: Target, key: 'detection' as const },
  { icon: TrendingUp, key: 'scoring' as const },
  { icon: Bell, key: 'alerts' as const },
  { icon: BarChart3, key: 'trends' as const },
  { icon: Shield, key: 'privacy' as const },
]

export default function LandingPage() {
  const t = useTranslations('Landing')

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <DropspyIcon size={28} className="text-foreground" />
            <span className="text-xl font-bold tracking-tight leading-none"
              style={{ fontFamily: 'var(--font-outfit, var(--font-inter, sans-serif))' }}>
              dropspy
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t('nav.features')}
            </Link>
            <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t('nav.docs')}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">{t('nav.login')}</Button>
            </Link>
            <Link href="/login?tab=signup">
              <Button size="sm">{t('nav.getStarted')}</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">{t('hero.badge')}</span>
            </div>

            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              {t('hero.titleLine1')}{' '}
              <span className="text-primary">{t('hero.titleHighlight')}</span>{' '}
              {t('hero.titleLine2')}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
              {t('hero.description')}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/login?tab=signup">
                <Button size="lg" className="gap-2">
                  {t('hero.ctaPrimary')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg">
                  {t('hero.ctaSecondary')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.key} className="text-center">
                <div className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{t(`stats.${stat.key}`)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border bg-card/30 py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              {t('features.title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.key}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:bg-card/80"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{t(`features.${feature.key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`features.${feature.key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              {t('howItWorks.title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('howItWorks.subtitle')}
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-12 md:grid-cols-3">
            {(['step1', 'step2', 'step3'] as const).map((stepKey, i) => (
              <div key={stepKey} className="relative text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary text-lg font-bold text-primary">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="text-xl font-semibold">{t(`howItWorks.${stepKey}.title`)}</h3>
                <p className="mt-2 text-muted-foreground">{t(`howItWorks.${stepKey}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              {t('cta.title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('cta.subtitle')}
            </p>
            <div className="mt-8">
              <Link href="/login?tab=signup">
                <Button size="lg" className="gap-2">
                  {t('cta.button')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <DropspyIcon size={28} className="text-foreground" />
              <span className="text-xl font-bold tracking-tight leading-none"
                style={{ fontFamily: 'var(--font-outfit, var(--font-inter, sans-serif))' }}>
                dropspy
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground">{t('footer.privacy')}</Link>
              <Link href="#" className="hover:text-foreground">{t('footer.terms')}</Link>
              <Link href="#" className="hover:text-foreground">{t('footer.contact')}</Link>
            </div>

            <div className="text-sm text-muted-foreground">
              {t('footer.rights')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
