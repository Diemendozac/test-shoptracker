'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { DropspyIcon } from '@/components/ui/dropspy-logo'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setAnswer, nextStep, prevStep, resetOnboarding } from '../store/onboardingSlice'
import { useSubmitOnboardingMutation } from '@/app/(dashboard)/services/userApi'

// ─── Static option catalogs ─────────────────────────────────────────────────

const COUNTRIES = ['Colombia', 'México', 'Chile', 'Perú', 'Ecuador', 'Paraguay', 'Panamá', 'Otro']

const OBJECTIVE_VALUES = ['scale', 'reduce_losses', 'start', 'diversify'] as const

// Must match the product_niche taxonomy used by NicheClassificationService (see scout-clasificacion-nicho wiki page) —
// same 13 categories, so onboarding answers can join against classified candidates later.
const NICHES = [
  'Belleza & Cuidado', 'Hogar & Cocina', 'Mascotas', 'Deportes & Fitness',
  'Tecnología & Gadgets', 'Moda & Accesorios', 'Jardín & Exterior', 'Bebés & Niños',
  'Herramientas & Auto', 'Salud & Bienestar', 'Joyería & Relojes', 'Juguetes & Entretenimiento', 'Otro',
]

const PLATFORMS = ['Shopify', 'TikTok Shop', 'WooCommerce', 'Amazon', 'Otro']

// ─── Step components ────────────────────────────────────────────────────────

function StepCountry({ value, phone, phoneOptIn, onChange }: {
  value: string
  phone: string
  phoneOptIn: boolean
  onChange: (fields: { country?: string; phone?: string; phoneOptIn?: boolean }) => void
}) {
  const t = useTranslations('Onboarding.stepCountry')
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>{t('countryLabel')}</Label>
        <Select value={value} onValueChange={(v) => onChange({ country: v })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('countryPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="onboarding-phone">{t('phoneLabel')}</Label>
        <Input
          id="onboarding-phone"
          type="tel"
          placeholder={t('phonePlaceholder')}
          value={phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          required
        />
        <p className="text-xs text-muted-foreground">
          {t('phoneHint')}
        </p>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <Checkbox
          checked={phoneOptIn}
          onCheckedChange={(checked) => onChange({ phoneOptIn: checked === true })}
        />
        <span className="text-muted-foreground">
          {t('optIn')}
        </span>
      </label>
    </div>
  )
}

function StepAboutYou({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTranslations('Onboarding.stepAboutYou')
  return (
    <div className="space-y-2">
      <Label>{t('question')}</Label>
      <RadioGroup value={value} onValueChange={onChange} className="pt-2">
        {['solo', 'equipo'].map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm capitalize">
            <RadioGroupItem value={opt} />
            {opt === 'solo' ? t('solo') : t('team')}
          </label>
        ))}
      </RadioGroup>
    </div>
  )
}

function StepModel({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTranslations('Onboarding.stepModel')
  return (
    <div className="space-y-2">
      <Label>{t('question')}</Label>
      <RadioGroup value={value} onValueChange={onChange} className="pt-2">
        <label className="flex items-center gap-2 text-sm">
          <RadioGroupItem value="pago_anticipado" />
          {t('prepaid')}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <RadioGroupItem value="contra_entrega" />
          {t('cod')}
        </label>
      </RadioGroup>
    </div>
  )
}

function StepObjective({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTranslations('Onboarding')
  return (
    <div className="space-y-2">
      <Label>{t('stepObjective.question')}</Label>
      <RadioGroup value={value} onValueChange={onChange} className="pt-2">
        {OBJECTIVE_VALUES.map((v) => (
          <label key={v} className="flex items-center gap-2 text-sm">
            <RadioGroupItem value={v} />
            {t(`objectives.${v}`)}
          </label>
        ))}
      </RadioGroup>
    </div>
  )
}

function StepMultiSelect({ title, options, value, onChange }: {
  title: string
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt])
  }

  return (
    <div className="space-y-2">
      <Label>{title}</Label>
      <div className="grid grid-cols-2 gap-3 pt-2">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm">
            <Checkbox checked={value.includes(opt)} onCheckedChange={() => toggle(opt)} />
            {opt}
          </label>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const t = useTranslations('Onboarding')
  const STEP_LABELS = [
    t('steps.country'), t('steps.aboutYou'), t('steps.model'),
    t('steps.goals'), t('steps.niches'), t('steps.platforms'),
  ]
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { step, answers } = useAppSelector((s) => s.onboarding)
  const [submitOnboarding, { isLoading, error }] = useSubmitOnboardingMutation()
  const [localError, setLocalError] = useState<string | null>(null)

  const update = (fields: Partial<typeof answers>) => dispatch(setAnswer(fields))

  const canContinue = (() => {
    switch (step) {
      case 0: return !!answers.country && !!answers.phone
      case 1: return !!answers.soloOrTeam
      case 2: return !!answers.businessModel
      case 3: return !!answers.objective
      case 4: return answers.niches.length > 0
      case 5: return answers.platforms.length > 0
      default: return false
    }
  })()

  const isLastStep = step === STEP_LABELS.length - 1

  const handleContinue = async () => {
    setLocalError(null)
    if (!isLastStep) {
      dispatch(nextStep())
      return
    }
    try {
      await submitOnboarding(answers).unwrap()
      dispatch(resetOnboarding())
      router.push('/dashboard')
    } catch {
      setLocalError(t('page.genericError'))
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/4 left-1/4 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-1/4 right-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <header className="relative z-10 flex h-16 items-center px-6">
        <div className="flex items-center gap-2">
          <DropspyIcon size={28} className="text-foreground" />
          <span className="text-xl font-bold tracking-tight leading-none"
            style={{ fontFamily: 'var(--font-outfit, var(--font-inter, sans-serif))' }}>
            dropspy
          </span>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card/80 p-8 shadow-xl backdrop-blur-sm">

            <div className="mb-8 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {t('page.stepOf', { current: step + 1, total: STEP_LABELS.length })}
              </span>
              <span className="text-sm font-medium">{STEP_LABELS[step]}</span>
            </div>

            <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }}
              />
            </div>

            <div className="space-y-2 text-center mb-6">
              <h1 className="text-xl font-bold">{t('page.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('page.subtitle')}</p>
            </div>

            {(localError || error) && (
              <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                {localError ?? t('page.genericError')}
              </p>
            )}

            <div className="min-h-[220px]">
              {step === 0 && (
                <StepCountry
                  value={answers.country}
                  phone={answers.phone}
                  phoneOptIn={answers.phoneOptIn}
                  onChange={update}
                />
              )}
              {step === 1 && (
                <StepAboutYou value={answers.soloOrTeam} onChange={(v) => update({ soloOrTeam: v })} />
              )}
              {step === 2 && (
                <StepModel value={answers.businessModel} onChange={(v) => update({ businessModel: v })} />
              )}
              {step === 3 && (
                <StepObjective value={answers.objective} onChange={(v) => update({ objective: v })} />
              )}
              {step === 4 && (
                <StepMultiSelect
                  title={t('stepNiches.title')}
                  options={NICHES}
                  value={answers.niches}
                  onChange={(v) => update({ niches: v })}
                />
              )}
              {step === 5 && (
                <StepMultiSelect
                  title={t('stepPlatforms.title')}
                  options={PLATFORMS}
                  value={answers.platforms}
                  onChange={(v) => update({ platforms: v })}
                />
              )}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => dispatch(prevStep())}
                disabled={step === 0}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('page.back')}
              </Button>
              <Button
                type="button"
                onClick={handleContinue}
                disabled={!canContinue || isLoading}
                className="gap-2"
              >
                {isLastStep ? (isLoading ? t('page.saving') : t('page.finish')) : t('page.continueBtn')}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}