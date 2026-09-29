'use client'

import { useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Campos y piezas de la tarjeta de registro e ingreso (components/auth/auth-card.tsx).
// Cada error queda enlazado a su campo con aria-invalid y aria-describedby.

export type FieldName = 'name' | 'email' | 'password'
export type FieldErrors = Partial<Record<FieldName, string>>

/** Enfoca el primer campo con error. Devuelve true si había alguno. */
export function focusFirstInvalid(form: HTMLFormElement | null, errors: FieldErrors): boolean {
  const first = (['name', 'email', 'password'] as FieldName[]).find((f) => errors[f])
  if (!first) return false
  form?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus()
  return true
}

export function FormHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-1">
      <h1 className="font-display text-[26px] leading-tight font-semibold tracking-[-0.02em]">{title}</h1>
      <p className="mt-1 text-[15px] text-muted-foreground">{subtitle}</p>
    </div>
  )
}

export interface FieldProps {
  name: FieldName
  label: string
  type: 'text' | 'email' | 'password'
  autoComplete: string
  placeholder: string
  value: string
  error?: string
  hint?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  onChange: (value: string) => void
  /** Botón dentro del campo (mostrar contraseña) */
  trailing?: React.ReactNode
}

export function Field({ name, label, type, autoComplete, placeholder, value, error, hint, inputMode, onChange, trailing }: FieldProps) {
  const id = `auth-${name}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-sm font-semibold">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn('h-12 rounded-[10px] bg-card text-base md:text-base', trailing && 'pr-12')}
        />
        {trailing}
      </div>
      {hint && <small id={`${id}-hint`} className="text-[13px] text-subtle-foreground">{hint}</small>}
      {error && <small id={`${id}-error`} className="text-[13px] font-medium text-danger-foreground">{error}</small>}
    </div>
  )
}

export function PasswordField(props: Omit<FieldProps, 'name' | 'label' | 'type' | 'trailing'>) {
  const t = useTranslations('Auth.fields')
  const [visible, setVisible] = useState(false)
  return (
    <Field
      {...props}
      name="password"
      label={t('passwordLabel')}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t('hidePassword') : t('showPassword')}
          aria-pressed={visible}
          className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      }
    />
  )
}

export function SubmitRow({ error, loading, label, loadingLabel }: { error: string | null; loading: boolean; label: string; loadingLabel: string }) {
  return (
    <div className="grid gap-3">
      {error && (
        <p role="alert" className="rounded-lg border border-danger-border bg-danger-subtle px-3 py-2.5 text-sm text-danger-foreground">
          {error}
        </p>
      )}
      <Button type="submit" variant="brand" disabled={loading} className="mkt-btn h-12 w-full rounded-[10px] text-[15px] font-semibold">
        {loading ? loadingLabel : label}
        {!loading && <ArrowRight className="mkt-arrow" aria-hidden="true" />}
      </Button>
    </div>
  )
}

export function SwitchLine({ prompt, action, onSwitch }: { prompt: string; action: string; onSwitch: () => void }) {
  return (
    <p className="text-center text-sm text-muted-foreground">
      {prompt}{' '}
      <button type="button" onClick={onSwitch} className="rounded font-semibold text-primary-text underline-offset-[3px] outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50">
        {action}
      </button>
    </p>
  )
}
