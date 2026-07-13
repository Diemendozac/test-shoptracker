'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { DropspyIcon } from '@/components/ui/dropspy-logo'

// ─── Subcomponents ────────────────────────────────────────────────────────────

function GoogleButton() {
  return (
    <Button type="button" variant="outline" className="w-full gap-2">
      <svg className="h-4 w-4" viewBox="0 0 24 24">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Google
    </Button>
  )
}

function Divider() {
  const t = useTranslations('Auth.divider')
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-card px-2 text-muted-foreground">{t('orContinueWith')}</span>
      </div>
    </div>
  )
}

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm() {
  const t = useTranslations('Auth.login')
  const { login, isLoginLoading, loginError } = useAuth()

  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(form)
  }

  const errorMessage = loginError
    ? 'error' in loginError
      ? (loginError as { error: string }).error
      : t('genericError')
    : null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {errorMessage && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">{t('emailLabel')}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="login-email"
              type="email"
              value={form.email}
              placeholder="tu@empresa.com"
              className="pl-10"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">{t('passwordLabel')}</Label>
            <Link href="#" className="text-xs text-primary hover:underline">
              {t('forgotPassword')}
            </Link>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              placeholder={t('passwordPlaceholder')}
              className="pl-10 pr-10"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full gap-2" disabled={isLoginLoading}>
        {isLoginLoading ? t('submitLoading') : t('submit')}
        {!isLoginLoading && <ArrowRight className="h-4 w-4" />}
      </Button>

      <Divider />
      <GoogleButton />
    </form>
  )
}

// ─── Signup Form ──────────────────────────────────────────────────────────────

function SignupForm() {
  const t = useTranslations('Auth.signup')
  const { register, isRegisterLoading, registerError } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  })

  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await register(form)
  }

  const errorMessage = registerError
    ? 'error' in registerError
      ? (registerError as { error: string }).error
      : t('genericError')
    : null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {errorMessage && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signup-name">{t('nameLabel')}</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signup-name"
              type="text"
              placeholder={t('namePlaceholder')}
              className="pl-10"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-email">{t('emailLabel')}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signup-email"
              type="email"
              placeholder="tu@empresa.com"
              className="pl-10"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-password">{t('passwordLabel')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('passwordPlaceholder')}
              className="pl-10 pr-10"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            {t('passwordHint')}
          </p>
        </div>
      </div>

      <Button type="submit" className="w-full gap-2" disabled={isRegisterLoading}>
        {isRegisterLoading ? t('submitLoading') : t('submit')}
        {!isRegisterLoading && <ArrowRight className="h-4 w-4" />}
      </Button>

      <Divider />
      <GoogleButton />

      <p className="text-center text-xs text-muted-foreground">
        {t('termsPrefix')}{' '}
        <Link href="#" className="text-primary hover:underline">
          {t('termsLink')}
        </Link>{' '}
        {t('and')}{' '}
        <Link href="#" className="text-primary hover:underline">
          {t('privacyLink')}
        </Link>
      </p>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const t = useTranslations('Auth.page')
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login'
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(defaultTab)

  return (
    <div className="flex min-h-screen flex-col bg-background">

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/4 left-1/4 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-1/4 right-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <header className="relative z-10 flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <DropspyIcon size={28} className="text-foreground" />
          <span className="text-xl font-bold tracking-tight leading-none"
            style={{ fontFamily: 'var(--font-outfit, var(--font-inter, sans-serif))' }}>
            dropspy
          </span>
        </Link>

        <Link href="/">
          <Button variant="ghost" size="sm">
            {t('backToHome')}
          </Button>
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card/80 p-8 shadow-xl backdrop-blur-sm">

            <div className="mb-8 flex rounded-lg bg-secondary p-1">
              {(['login', 'signup'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'login' ? t('tabLogin') : t('tabSignup')}
                </button>
              ))}
            </div>

            {activeTab === 'login' ? <LoginForm /> : <SignupForm />}

          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {t('trustBadge')}
          </p>
        </div>
      </main>

    </div>
  )
}