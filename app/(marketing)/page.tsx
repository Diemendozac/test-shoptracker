'use client'

import Link from 'next/link'
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
  Check
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

const plans = [
  {
    name: 'Starter',
    price: '$49',
    description: 'Perfect for small brands',
    features: ['Up to 10 stores', 'Daily snapshots', 'Basic analytics', 'Email support'],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$149',
    description: 'For growing e-commerce teams',
    features: ['Up to 50 stores', 'Real-time alerts', 'Advanced analytics', 'Priority support', 'API access'],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations',
    features: ['Unlimited stores', 'Custom integrations', 'Dedicated support', 'SLA guarantee', 'Custom reports'],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground">
              <DropspyIcon size={20} className="text-background" />
            </div>
            <span className="text-xl font-bold tracking-tight leading-none"
              style={{ fontFamily: 'var(--font-outfit, var(--font-inter, sans-serif))' }}>
              dropspy
            </span>
          </Link>
          
          <div className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
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
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free, scale as you grow. No hidden fees.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-xl border p-8 ${
                  plan.highlighted
                    ? 'border-primary bg-card shadow-lg shadow-primary/10'
                    : 'border-border bg-card/50'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <div className="text-sm font-medium text-muted-foreground">{plan.name}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-muted-foreground">/month</span>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link href="/login?tab=signup" className="mt-8 block">
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
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
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground">
                <DropspyIcon size={20} className="text-background" />
              </div>
              <span className="text-xl font-bold tracking-tight leading-none"
                style={{ fontFamily: 'var(--font-outfit, var(--font-inter, sans-serif))' }}>
                dropspy
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
