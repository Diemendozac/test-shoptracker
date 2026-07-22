'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setAnswer, markOnboardingCompleted, dismissOnboarding } from '@/app/(auth)/store/onboardingSlice'
import { useSubmitOnboardingMutation } from '@/app/(dashboard)/services/userApi'

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

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-input text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  )
}

function ChipGroup({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt])
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <Chip key={opt} label={opt} selected={value.includes(opt)} onClick={() => toggle(opt)} />
      ))}
    </div>
  )
}

export function OnboardingModal() {
  const t = useTranslations('Onboarding')
  const tModal = useTranslations('Onboarding.modal')
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const { justRegistered, completed, answers } = useAppSelector((s) => s.onboarding)
  const [submitOnboarding, { isLoading }] = useSubmitOnboardingMutation()
  const [error, setError] = useState<string | null>(null)

  const open = isAuthenticated && justRegistered && !completed

  const update = (fields: Partial<typeof answers>) => dispatch(setAnswer(fields))
  const handleDismiss = () => dispatch(dismissOnboarding())

  const isValid =
    !!answers.country &&
    !!answers.phone &&
    !!answers.soloOrTeam &&
    !!answers.businessModel &&
    !!answers.objective &&
    answers.niches.length > 0 &&
    answers.platforms.length > 0

  const handleSubmit = async () => {
    setError(null)
    try {
      await submitOnboarding(answers).unwrap()
      dispatch(markOnboardingCompleted())
    } catch {
      setError(tModal('genericError'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) handleDismiss() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tModal('title')}</DialogTitle>
          <DialogDescription>{tModal('subtitle')}</DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('countryLabel')}</Label>
              <Select value={answers.country} onValueChange={(v) => update({ country: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={tModal('choosePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('phoneLabel')}</Label>
              <Input
                type="tel"
                placeholder={t('phonePlaceholder')}
                value={answers.phone}
                onChange={(e) => update({ phone: e.target.value })}
              />
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <Checkbox
              checked={answers.phoneOptIn}
              onCheckedChange={(checked) => update({ phoneOptIn: checked === true })}
              className="mt-0.5 border-muted-foreground"
            />
            {t('optIn')}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('aboutYouLabel')}</Label>
              <Select value={answers.soloOrTeam} onValueChange={(v) => update({ soloOrTeam: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={tModal('choosePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solo">{t('solo')}</SelectItem>
                  <SelectItem value="equipo">{t('team')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('modelLabel')}</Label>
              <Select value={answers.businessModel} onValueChange={(v) => update({ businessModel: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={tModal('choosePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pago_anticipado">{t('prepaid')}</SelectItem>
                  <SelectItem value="contra_entrega">{t('cod')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t('objectiveLabel')}</Label>
            <Select value={answers.objective} onValueChange={(v) => update({ objective: v })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tModal('choosePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {OBJECTIVE_VALUES.map((v) => (
                  <SelectItem key={v} value={v}>{t(`objectives.${v}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t('nichesLabel')}</Label>
            <ChipGroup options={NICHES} value={answers.niches} onChange={(v) => update({ niches: v })} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t('platformsLabel')}</Label>
            <ChipGroup options={PLATFORMS} value={answers.platforms} onChange={(v) => update({ platforms: v })} />
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={!isValid || isLoading} className="w-full">
          {isLoading ? tModal('saving') : tModal('continueBtn')}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
