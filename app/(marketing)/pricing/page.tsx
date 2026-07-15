'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check, X, Users, Globe, Lock } from 'lucide-react'
import { DropspyIcon } from '@/components/ui/dropspy-logo'
import { useAppSelector } from '@/store/hooks'
import { mpCheckoutUrl } from '@/lib/mercadopago'

function cop(n: number) {
  return n.toLocaleString('es-CO')
}

const PLANS = [
  {
    id: 'starter',
    name: 'Básico',
    monthly: 59900,
    annual: 49900,
    annualTotal: 598800,
    description: 'Para marcas en crecimiento',
    limits: {
      stores: '15 tiendas',
      candidates: '150 testeos',
      history: '30 días de historial',
      niches: 'Todos los nichos',
    },
    features: [
      { label: 'Pool global de productos', included: true },
      { label: 'Alertas por email', included: true },
      { label: 'Exportar datos', included: false },
      { label: 'Datos privados', included: false },
      { label: 'Seats múltiples', included: false },
    ],
    privacy: 'community',
    cta: 'Suscribirse',
    ctaHref: '/login?tab=signup&plan=starter',
    ctaVariant: 'outline' as const,
    trial: null,
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 119900,
    annual: 99900,
    annualTotal: 1198800,
    description: 'Para equipos que escalan',
    limits: {
      stores: '40 tiendas',
      candidates: '500 testeos',
      history: '90 días de historial',
      niches: 'Todos los nichos',
    },
    features: [
      { label: 'Pool global de productos', included: true },
      { label: 'Alertas por email', included: true },
      { label: 'Exportar CSV', included: true },
      { label: 'Datos privados', included: true },
      { label: 'Seats múltiples', included: false },
    ],
    privacy: 'private',
    cta: 'Suscribirse',
    ctaHref: '/login?tab=signup&plan=pro',
    ctaVariant: 'default' as const,
    trial: null,
    highlighted: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    monthly: 239900,
    annual: 199900,
    annualTotal: 2398800,
    description: 'Para agencias y operaciones grandes',
    limits: {
      stores: '100 tiendas',
      candidates: 'Testeos ilimitados',
      history: '1 año de historial',
      niches: 'Todos los nichos',
    },
    features: [
      { label: 'Pool global de productos', included: true },
      { label: 'Alertas email + Slack', included: true },
      { label: 'Exportar CSV + API', included: true },
      { label: 'Datos privados', included: true },
      { label: 'Seats múltiples', included: true },
    ],
    privacy: 'private',
    cta: 'Suscribirse',
    ctaHref: '/login?tab=signup&plan=agency',
    ctaVariant: 'outline' as const,
    trial: null,
    highlighted: false,
  },
]

function PrivacyBadge({ type }: { type: 'community' | 'private' }) {
  if (type === 'private') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
        <Lock className="h-2.5 w-2.5" />
        Datos 100% privados
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
      <Globe className="h-2.5 w-2.5" />
      Pool comunitario
    </span>
  )
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)
  // Si ya hay sesión (llegó aquí desde un CTA de upgrade dentro de la app), el botón
  // de cada plan va directo al link real de Mercado Pago — no al flujo de signup.
  // Anónimo: primero debe crear cuenta (la activación se concilia por email).

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <DropspyIcon size={28} className="text-foreground" />
            <span
              className="text-xl font-bold tracking-tight leading-none"
              style={{ fontFamily: 'var(--font-outfit, var(--font-inter, sans-serif))' }}
            >
              dropspy
            </span>
          </Link>

          {!isAuthenticated && (
            <div className="hidden items-center gap-8 md:flex">
              <Link href="/#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Funcionalidades
              </Link>
              <Link href="/pricing" className="text-sm font-medium text-foreground">
                Precios
              </Link>
            </div>
          )}

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  Sesión activa{user?.email ? ` — ${user.email}` : ''}
                </span>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">Volver a la app</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Iniciar sesión</Button>
                </Link>
                <Link href="/login?tab=signup">
                  <Button size="sm">Empezar prueba gratis</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6">
        <div className="mx-auto max-w-6xl">

          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Precios simples y transparentes
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Elige el plan que se ajuste a tu operación.
            </p>
          </div>

          {/* Toggle */}
          <div className="mt-10 flex items-center justify-center gap-3">
            <span className={cn('text-sm font-medium', !annual ? 'text-foreground' : 'text-muted-foreground')}>
              Mensual
            </span>
            <button
              onClick={() => setAnnual((v) => !v)}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                annual ? 'bg-primary' : 'bg-border',
              )}
              aria-label="Alternar facturación anual"
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                  annual ? 'translate-x-5' : 'translate-x-0',
                )}
              />
            </button>
            <span className={cn('text-sm font-medium', annual ? 'text-foreground' : 'text-muted-foreground')}>
              Anual
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
              Ahorra 20%
            </span>
          </div>

          {/* Cards */}
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 mx-auto max-w-4xl">
            {PLANS.map((plan) => {
              const price = annual && plan.annual > 0 ? plan.annual : plan.monthly
              const monthlySavings = plan.monthly * 12 - plan.annualTotal

              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative flex flex-col rounded-2xl border p-6 transition-all',
                    plan.highlighted
                      ? 'border-primary bg-card shadow-xl shadow-primary/10 ring-1 ring-primary/20 scale-[1.02]'
                      : 'border-border bg-card/60 hover:border-border/80 hover:bg-card',
                  )}
                >
                  {/* Most popular badge */}
                  {plan.highlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3.5 py-1 text-[11px] font-semibold text-primary-foreground">
                      Más popular
                    </div>
                  )}

                  {/* Plan name + privacy */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {plan.name}
                    </p>
                    <PrivacyBadge type={plan.privacy as 'community' | 'private'} />
                  </div>

                  {/* Price */}
                  <div className="mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-semibold text-muted-foreground">COP</span>
                      <span className="text-4xl font-bold">${cop(price)}</span>
                      <span className="text-sm text-muted-foreground">/mes</span>
                    </div>
                    {annual && (
                      <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                        ${cop(plan.annualTotal)}/año · ahorras ${cop(monthlySavings)}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  {/* Limits */}
                  <div className="mt-5 space-y-1.5 rounded-xl bg-secondary/40 px-3.5 py-3">
                    {Object.values(plan.limits).map((limit) => (
                      <p key={limit} className="text-xs text-foreground/80">{limit}</p>
                    ))}
                  </div>

                  {/* Features */}
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f.label} className="flex items-center gap-2 text-sm">
                        {f.included ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                        ) : (
                          <X className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                        )}
                        <span className={f.included ? 'text-foreground' : 'text-muted-foreground/60'}>
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className="mt-6 space-y-2">
                    {(() => {
                      const mpHref = isAuthenticated ? mpCheckoutUrl(plan.id, annual ? 'annual' : 'monthly') : null
                      return mpHref ? (
                        <a href={mpHref} target="_blank" rel="noopener noreferrer" className="block">
                          <Button variant={plan.ctaVariant} className="w-full">
                            {plan.cta}
                          </Button>
                        </a>
                      ) : (
                        <Link href={plan.ctaHref} className="block">
                          <Button
                            variant={plan.ctaVariant}
                            className="w-full"
                          >
                            {plan.cta}
                          </Button>
                        </Link>
                      )
                    })()}
                    {isAuthenticated && mpCheckoutUrl(plan.id) && (
                      <p className="text-center text-[10px] leading-snug text-muted-foreground">
                        Paga con el mismo correo de tu cuenta — activamos tu plan en menos de 24h.
                      </p>
                    )}
                    {plan.trial && (
                      <p className="text-center text-[10px] leading-snug text-muted-foreground">
                        {plan.trial}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Privacy explanation */}
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                  <Globe className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Pool comunitario — Básico</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Los productos que testeas alimentan el pool global visible para todos los usuarios de Dropspy.
                    Contribuyes al ecosistema a cambio de acceso a la inteligencia colectiva.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Lock className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Datos 100% privados — Pro y Agency</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tus testeos son completamente invisibles para otros usuarios. Nadie puede ver qué productos
                    estás siguiendo ni qué nichos estás explorando.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ CTA */}
          <div className="mt-16 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Tienes dudas?{' '}
              <Link href="mailto:hola@dropspy.io" className="font-medium text-primary underline-offset-4 hover:underline">
                Escríbenos
              </Link>
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}
