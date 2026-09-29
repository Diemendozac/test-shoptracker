'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { useAuth } from '@/app/(auth)/hooks/useAuth'
import { cn } from '@/lib/utils'
import {
  Field, FormHead, PasswordField, SubmitRow, SwitchLine, focusFirstInvalid,
  type FieldErrors,
} from './auth-fields'

// Tarjeta de registro e ingreso (fase 3.2). La pestaña inicial la lee el servidor de ?tab= y
// llega como prop: el formulario viene en el HTML, sin el useSearchParams que forzaba a
// renderizar todo en el cliente (B3.2). Pestañas con role="tab" y flechas (B4.1).

export type AuthTab = 'signup' | 'login'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 8
const TABS: AuthTab[] = ['signup', 'login']

/** Mensaje para el error de la mutation de RTK Query, o null si no hay error. */
function useServerError(error: FetchBaseQueryError | SerializedError | undefined, tab: AuthTab): string | null {
  const t = useTranslations('Auth')
  if (!error) return null
  if ('status' in error) {
    if (error.status === 'FETCH_ERROR' || error.status === 'TIMEOUT_ERROR') return t('errors.network')
    // Una respuesta que no es JSON (p. ej. "Bad credentials" en texto) llega como PARSING_ERROR
    const status = typeof error.status === 'number' ? error.status : 'originalStatus' in error ? error.originalStatus : 0
    if (status >= 500) return t('errors.server')
    if (status >= 400 && tab === 'login') return t('login.invalidCredentials')
  }
  return tab === 'login' ? t('login.invalidCredentials') : t('signup.genericError')
}

export function AuthCard({ initialTab }: { initialTab: AuthTab }) {
  const t = useTranslations('Auth')
  const [tab, setTab] = useState<AuthTab>(initialTab)
  // El correo se comparte entre pestañas: si alguien empieza en la equivocada, no lo reescribe
  const [email, setEmail] = useState('')
  const tabRefs = useRef<Record<AuthTab, HTMLButtonElement | null>>({ signup: null, login: null })

  function select(next: AuthTab, focus = false) {
    setTab(next)
    if (focus) tabRefs.current[next]?.focus()
    // La URL refleja la pestaña (recargar o compartir abre la misma) y conserva otros parámetros (?plan=)
    const params = new URLSearchParams(window.location.search)
    if (next === 'signup') params.set('tab', 'signup')
    else params.delete('tab')
    const query = params.toString()
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname)
  }

  function onTabKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    const i = TABS.indexOf(tab)
    const next =
      e.key === 'ArrowRight' ? TABS[(i + 1) % TABS.length]
      : e.key === 'ArrowLeft' ? TABS[(i - 1 + TABS.length) % TABS.length]
      : e.key === 'Home' ? TABS[0]
      : e.key === 'End' ? TABS[TABS.length - 1]
      : null
    if (!next) return
    e.preventDefault()
    select(next, true)
  }

  return (
    <div className="w-full max-w-[440px] justify-self-center rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
      <div role="tablist" aria-label={t('page.tabsLabel')} className="mb-5 grid grid-cols-2 gap-1 rounded-[10px] border border-border bg-background p-1">
        {TABS.map((id) => (
          <button
            key={id}
            ref={(el) => { tabRefs.current[id] = el }}
            type="button"
            role="tab"
            id={`auth-tab-${id}`}
            aria-selected={tab === id}
            aria-controls="auth-panel"
            tabIndex={tab === id ? 0 : -1}
            onClick={() => select(id)}
            onKeyDown={onTabKeyDown}
            className={cn(
              'min-h-10 rounded-[7px] text-sm font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
              tab === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {id === 'signup' ? t('page.tabSignup') : t('page.tabLogin')}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="auth-panel" aria-labelledby={`auth-tab-${tab}`}>
        {tab === 'signup'
          ? <SignupForm email={email} onEmail={setEmail} onSwitch={() => select('login', true)} />
          : <LoginForm email={email} onEmail={setEmail} onSwitch={() => select('signup', true)} />}
      </div>
    </div>
  )
}

// ─── Formularios ──────────────────────────────────────────────────────────────

interface FormProps {
  email: string
  onEmail: (value: string) => void
  onSwitch: () => void
}

function SignupForm({ email, onEmail, onSwitch }: FormProps) {
  const t = useTranslations('Auth')
  const { register, isRegisterLoading, registerError } = useAuth()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const serverError = useServerError(registerError, 'signup')
  const formRef = useRef<HTMLFormElement>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const next: FieldErrors = {}
    if (!name.trim()) next.name = t('validation.nameRequired')
    if (!EMAIL.test(email.trim())) next.email = t('validation.emailInvalid')
    if (password.length < MIN_PASSWORD) next.password = t('validation.passwordShort')
    setErrors(next)
    if (focusFirstInvalid(formRef.current, next)) return
    try {
      await register({ name: name.trim(), email: email.trim(), password })
    } catch {
      // El mensaje sale del estado de la mutation (serverError)
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-4">
      <FormHead title={t('signup.title')} subtitle={t('signup.subtitle')} />
      <Field
        name="name" label={t('fields.nameLabel')} type="text" autoComplete="name"
        placeholder={t('fields.namePlaceholder')} value={name} error={errors.name}
        onChange={(v) => { setName(v); setErrors((p) => ({ ...p, name: undefined })) }}
      />
      <Field
        name="email" label={t('fields.emailLabel')} type="email" autoComplete="email" inputMode="email"
        placeholder={t('fields.emailPlaceholder')} value={email} error={errors.email}
        onChange={(v) => { onEmail(v); setErrors((p) => ({ ...p, email: undefined })) }}
      />
      <PasswordField
        autoComplete="new-password" placeholder={t('signup.passwordPlaceholder')}
        hint={t('signup.passwordHint')} value={password} error={errors.password}
        onChange={(v) => { setPassword(v); setErrors((p) => ({ ...p, password: undefined })) }}
      />
      <SubmitRow
        error={serverError} loading={isRegisterLoading}
        label={t('signup.submit')} loadingLabel={t('signup.submitLoading')}
      />
      <SwitchLine prompt={t('signup.switchPrompt')} action={t('signup.switchAction')} onSwitch={onSwitch} />
    </form>
  )
}

function LoginForm({ email, onEmail, onSwitch }: FormProps) {
  const t = useTranslations('Auth')
  const { login, isLoginLoading, loginError } = useAuth()
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const serverError = useServerError(loginError, 'login')
  const formRef = useRef<HTMLFormElement>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const next: FieldErrors = {}
    if (!EMAIL.test(email.trim())) next.email = t('validation.emailInvalid')
    // Sin mínimo de largo al ingresar: una cuenta vieja puede tener una contraseña más corta
    if (!password) next.password = t('validation.passwordRequired')
    setErrors(next)
    if (focusFirstInvalid(formRef.current, next)) return
    try {
      await login({ email: email.trim(), password })
    } catch {
      // El mensaje sale del estado de la mutation (serverError)
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-4">
      <FormHead title={t('login.title')} subtitle={t('login.subtitle')} />
      <Field
        name="email" label={t('fields.emailLabel')} type="email" autoComplete="email" inputMode="email"
        placeholder={t('fields.emailPlaceholder')} value={email} error={errors.email}
        onChange={(v) => { onEmail(v); setErrors((p) => ({ ...p, email: undefined })) }}
      />
      <PasswordField
        autoComplete="current-password" placeholder={t('login.passwordPlaceholder')}
        value={password} error={errors.password}
        onChange={(v) => { setPassword(v); setErrors((p) => ({ ...p, password: undefined })) }}
      />
      <SubmitRow
        error={serverError} loading={isLoginLoading}
        label={t('login.submit')} loadingLabel={t('login.submitLoading')}
      />
      <SwitchLine prompt={t('login.switchPrompt')} action={t('login.switchAction')} onSwitch={onSwitch} />
    </form>
  )
}
