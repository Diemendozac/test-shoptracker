'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  Zap,
  Target,
  TrendingUp,
  BarChart3,
  Eye,
  Bell,
  Shield,
  Check,
  X,
  Globe,
  Lock,
} from 'lucide-react'
import { DropspyIcon } from '@/components/ui/dropspy-logo'

const stats = [
  { value: '10x', label: 'faster product discovery' },
  { value: '50+', label: 'stores per account' },
  { value: '30', label: 'day tracking window' },
  { value: '24/7', label: 'automated monitoring' },
]

const features = [
  {
    icon: Eye,
    title: 'Automated Snapshots',
    description: 'Daily captures of best-selling and recent product collections from any Shopify store.',
  },
  {
    icon: Target,
    title: 'New Product Detection',
    description: 'Instantly detect when competitors launch new products and start tracking their performance.',
  },
  {
    icon: TrendingUp,
    title: 'Performance Scoring',
    description: 'AI-calculated scores based on how products climb through store rankings.',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Get notified when tracked products hit key milestones or show breakout potential.',
  },
  {
    icon: BarChart3,
    title: 'Trend Analysis',
    description: 'Visualize rank history and identify patterns across your competitive landscape.',
  },
  {
    icon: Shield,
    title: 'Data Isolation',
    description: 'Your tracked stores and insights are completely private and never shared.',
  },
]

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    annual: 0,
    annualTotal: 0,
    description: 'Para explorar la plataforma',
    limits: ['3 tiendas', '30 candidatos', '7d historial', '2 nichos'],
    features: [
      { label: 'Pool global de productos', included: true },
      { label: 'Alertas', included: false },
      { label: 'Exportar datos', included: false },
      { label: 'Datos privados', included: false },
    ],
    privacy: 'community' as const,
    cta: 'Empezar gratis',
    ctaHref: '/login?tab=signup',
    ctaVariant: 'outline' as const,
    trial: null,
    highlighted: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    monthly: 49,
    annual: 39,
    annualTotal: 468,
    description: 'Para marcas en crecimiento',
    limits: ['15 tiendas', '150 candidatos', '30d historial', 'Todos los nichos'],
    features: [
      { label: 'Pool global de productos', included: true },
      { label: 'Alertas por email', included: true },
      { label: 'Exportar datos', included: false },
      { label: 'Datos privados', included: false },
    ],
    privacy: 'community' as const,
    cta: 'Probar 7 días gratis',
    ctaHref: '/login?tab=signup&plan=starter',
    ctaVariant: 'outline' as const,
    trial: 'Incluye Pro desbloqueado durante el trial · Con tarjeta',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 99,
    annual: 79,
    annualTotal: 948,
    description: 'Para equipos que escalan',
    limits: ['40 tiendas', '500 candidatos', '90d historial', 'Todos los nichos'],
    features: [
      { label: 'Pool global de productos', included: true },
      { label: 'Alertas por email', included: true },
      { label: 'Exportar CSV', included: true },
      { label: 'Datos privados', included: true },
    ],
    privacy: 'private' as const,
    cta: 'Suscribirse',
    ctaHref: '/login?tab=signup&plan=pro',
    ctaVariant: 'default' as const,
    trial: null,
    highlighted: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    monthly: 199,
    annual: 159,
    annualTotal: 1908,
    description: 'Para agencias y operaciones grandes',
    limits: ['100 tiendas', 'Candidatos ilimitados', '1 año historial', 'Todos los nichos'],
    features: [
      { label: 'Pool global de productos', included: true },
      { label: 'Alertas email + Slack', included: true },
      { label: 'Exportar CSV + API', included: true },
      { label: 'Datos privados', included: true },
    ],
    privacy: 'private' as const,
    cta: 'Suscribirse',
    ctaHref: '/login?tab=signup&plan=agency',
    ctaVariant: 'outline' as const,
    trial: null,
    highlighted: false,
  },
]

export default function LandingPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <DropspyIcon size={28} className="text-foreground" />
            <span className="text-xl font-bold tracking-tight leading-none"
              style={{ fontFamily: 'var(--font-outfit, var(--font-inter, sans-serif))' }}>
              Dropspy
            </span>
          </Link>
          
          <div className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
            <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Documentation
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/login?tab=signup">
              <Button size="sm">Get Started</Button>
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
              <span className="text-muted-foreground">Competitive Intelligence for Shopify</span>
            </div>
            
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Track competitors.{' '}
              <span className="text-primary">Spot trends.</span>{' '}
              Win markets.
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
              Automate competitive intelligence for Shopify stores. Detect new products, 
              track their climb through store rankings, and identify breakout winners
              before anyone else.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/login?tab=signup">
                <Button size="lg" className="gap-2">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg">
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
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
              Everything you need to stay ahead
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful tools for e-commerce teams who want data-driven competitive insights.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:bg-card/80"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
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
              How Dropspy works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three simple steps to competitive intelligence automation.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-12 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Add Stores',
                description: 'Enter any public Shopify store URL. We handle the rest.',
              },
              {
                step: '02',
                title: 'We Track',
                description: 'Daily snapshots capture new products and ranking changes automatically.',
              },
              {
                step: '03',
                title: 'You Win',
                description: 'Get insights on which products are trending before they go viral.',
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary text-lg font-bold text-primary">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-t border-border bg-card/30 py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Precios simples y transparentes
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Empieza gratis. Escala cuando necesites.
            </p>
          </div>

          {/* Toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={cn('text-sm font-medium', !annual ? 'text-foreground' : 'text-muted-foreground')}>
              Mensual
            </span>
            <button
              onClick={() => setAnnual((v) => !v)}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                annual ? 'bg-primary' : 'bg-border',
              )}
              aria-label="Toggle annual billing"
            >
              <span className={cn(
                'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                annual ? 'translate-x-5' : 'translate-x-0',
              )} />
            </button>
            <span className={cn('text-sm font-medium', annual ? 'text-foreground' : 'text-muted-foreground')}>
              Anual
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
              Ahorra 20%
            </span>
          </div>

          <div className="mx-auto mt-10 grid max-w-6xl gap-5 md:grid-cols-2 xl:grid-cols-4">
            {PLANS.map((plan) => {
              const price = annual && plan.annual > 0 ? plan.annual : plan.monthly
              const monthlySavings = plan.monthly * 12 - plan.annualTotal
              const isFree = plan.monthly === 0

              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative flex flex-col rounded-2xl border p-6',
                    plan.highlighted
                      ? 'border-primary bg-card shadow-xl shadow-primary/10 ring-1 ring-primary/20 scale-[1.02]'
                      : 'border-border bg-card/50',
                  )}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3.5 py-1 text-[11px] font-semibold text-primary-foreground">
                      Más popular
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{plan.name}</p>
                    {plan.privacy === 'private' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                        <Lock className="h-2.5 w-2.5" />Datos privados
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                        <Globe className="h-2.5 w-2.5" />Pool comunitario
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    {isFree ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">Gratis</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold">${price}</span>
                          <span className="text-sm text-muted-foreground">/mes</span>
                        </div>
                        {annual && (
                          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                            ${plan.annualTotal}/año · ahorras ${monthlySavings}
                          </p>
                        )}
                      </>
                    )}
                    <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="mt-4 space-y-1 rounded-xl bg-secondary/40 px-3 py-2.5">
                    {plan.limits.map((l) => (
                      <p key={l} className="text-xs text-foreground/80">{l}</p>
                    ))}
                  </div>

                  <ul className="mt-4 flex-1 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f.label} className="flex items-center gap-2 text-sm">
                        {f.included
                          ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                          : <X className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />}
                        <span className={f.included ? 'text-foreground' : 'text-muted-foreground/60'}>{f.label}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 space-y-1.5">
                    <Link href={plan.ctaHref} className="block">
                      <Button variant={plan.ctaVariant} className="w-full">{plan.cta}</Button>
                    </Link>
                    {plan.trial && (
                      <p className="text-center text-[10px] leading-snug text-muted-foreground">{plan.trial}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Ready to outsmart your competition?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of e-commerce teams using Dropspy to stay ahead.
            </p>
            <div className="mt-8">
              <Link href="/login?tab=signup">
                <Button size="lg" className="gap-2">
                  Start Your Free Trial
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
                Dropspy
              </span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground">Privacy</Link>
              <Link href="#" className="hover:text-foreground">Terms</Link>
              <Link href="#" className="hover:text-foreground">Contact</Link>
            </div>

            <div className="text-sm text-muted-foreground">
              2026 Dropspy. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
