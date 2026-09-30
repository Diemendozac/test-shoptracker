'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageLayout } from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button'
import { useAppDispatch } from '@/store/hooks'
import { logout } from '@/app/(auth)/store/authSlice'
import { useGetMeQuery, useChangePasswordMutation, useUpdatePreferencesMutation } from '@/app/(dashboard)/services/userApi'
import { User, Mail, Bell, Shield, CreditCard, LogOut, Eye, EyeOff, Check, X, Zap, ArrowUpRight, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mpCheckoutUrl } from '@/lib/mercadopago'
import { usePlanTier, useTrialStatus } from '@/lib/view-as'
import { useGetStoresQuery } from '@/app/(dashboard)/stores/services/storeApi'
import { AGENCY_CONTACT_EMAIL, PLAN_STORES } from '@/lib/pricing'

// ─── Plan badge ───────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:    { label: 'Prueba gratis', color: 'bg-secondary text-muted-foreground' },
  starter: { label: 'Básico',  color: 'bg-blue-500/20 text-blue-400' },
  basic:   { label: 'Básico',  color: 'bg-blue-500/20 text-blue-400' }, // alias legacy
  pro:     { label: 'Pro',     color: 'bg-primary/20 text-primary' },
  agency:  { label: 'Agency',  color: 'bg-violet-500/20 text-violet-400' },
  admin:   { label: 'Admin',   color: 'bg-amber-500/20 text-amber-400' },
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className={cn(
        'relative h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
        checked ? 'bg-primary' : 'bg-secondary'
      )}
    >
      <span className={cn(
        'block h-5 w-5 rounded-full bg-white shadow transition-transform',
        checked ? 'translate-x-[22px]' : 'translate-x-0.5'
      )} />
    </button>
  )
}

// ─── Password form ────────────────────────────────────────────────────────────

function PasswordSection() {
  const [open, setOpen]             = useState(false)
  const [current, setCurrent]       = useState('')
  const [next, setNext]             = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext]     = useState(false)
  const [success, setSuccess]       = useState(false)
  const [errorMsg, setErrorMsg]     = useState('')

  const [changePassword, { isLoading }] = useChangePasswordMutation()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    if (next.length < 8) { setErrorMsg('La nueva contraseña debe tener al menos 8 caracteres'); return }
    if (next !== confirm) { setErrorMsg('Las contraseñas no coinciden'); return }
    try {
      await changePassword({ currentPassword: current, newPassword: next }).unwrap()
      setSuccess(true)
      setCurrent(''); setNext(''); setConfirm('')
      setTimeout(() => { setSuccess(false); setOpen(false) }, 2000)
    } catch (err: any) {
      setErrorMsg(err?.data?.message ?? 'Contraseña actual incorrecta')
    }
  }

  function handleCancel() {
    setOpen(false); setCurrent(''); setNext(''); setConfirm(''); setErrorMsg('')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground">Cambiar contraseña</p>
          <p className="text-sm text-muted-foreground">Actualiza tu contraseña de acceso</p>
        </div>
        {!open && (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Cambiar
          </Button>
        )}
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border bg-secondary/20 p-4">
          {/* Current password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Contraseña actual</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
                className="h-9 w-full rounded-lg border border-border bg-input px-3 pr-9 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nueva contraseña</label>
            <div className="relative">
              <input
                type={showNext ? 'text' : 'password'}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
                className="h-9 w-full rounded-lg border border-border bg-input px-3 pr-9 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button type="button" onClick={() => setShowNext(!showNext)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNext ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {next && next.length < 8 && (
              <p className="text-[10px] text-amber-400">Mínimo 8 caracteres</p>
            )}
          </div>

          {/* Confirm */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Confirmar contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="h-9 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {confirm && next !== confirm && (
              <p className="text-[10px] text-red-400">No coinciden</p>
            )}
          </div>

          {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}
          {success && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Check className="h-3.5 w-3.5" /> Contraseña actualizada
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

// ─── Billing section ─────────────────────────────────────────────────────────

// Solo diferencias que el plan da de verdad, las mismas de /pricing (lib/pricing.ts y
// messages/es.json → Pricing). Antes vendía "Datos privados", "Exportar CSV", "Seats múltiples"
// y "API access", que no existen (CHANGE-131). Agency se arma conversando, como en /pricing:
// lleva a escribirnos, no a un link de pago con un precio que no está publicado.
const UPGRADE_OPTIONS: Record<string, { nextPlan: string; label: string; desc: string; contact?: boolean } | null> = {
  free:    { nextPlan: 'starter', label: 'Suscríbete a Básico', desc: `Sigues después de los 7 días · ${PLAN_STORES.starter} tiendas · el pool completo, no solo la primera página` },
  starter: { nextPlan: 'pro',     label: 'Actualizar a Pro',    desc: `${PLAN_STORES.pro} tiendas · anunciante y link a Meta de cada anuncio` },
  basic:   { nextPlan: 'pro',     label: 'Actualizar a Pro',    desc: `${PLAN_STORES.pro} tiendas · anunciante y link a Meta de cada anuncio` },
  pro:     { nextPlan: 'agency',  label: `Más de ${PLAN_STORES.pro} tiendas: plan Agency`, desc: 'Lo armamos a tu medida, conversando.', contact: true },
  agency:  null,
}

function BillingSection({ plan }: { plan: string; email?: string; userId?: string }) {
  const upgrade = UPGRADE_OPTIONS[plan] ?? null

  // Mercado Pago: links estáticos de suscripción (no llevan user_id) — la activación
  // se concilia manualmente por el email con el que se paga. Ver lib/mercadopago.ts.
  const checkoutHref = upgrade ? mpCheckoutUrl(upgrade.nextPlan, 'monthly') ?? '#' : '#'
  const contactHref = `mailto:${AGENCY_CONTACT_EMAIL}?subject=${encodeURIComponent('Plan Agency')}`

  return (
    <div className="space-y-3">
      {/* Upgrade CTA */}
      {upgrade && (
        <div className="flex flex-col items-start gap-3 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-foreground">{upgrade.label}</p>
            <p className="text-sm text-muted-foreground">{upgrade.desc}</p>
          </div>
          {upgrade.contact ? (
            <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
              <a href={contactHref}>
                <Button size="sm">Escríbenos</Button>
              </a>
              <p className="text-[11px] text-muted-foreground sm:text-right">{AGENCY_CONTACT_EMAIL}</p>
            </div>
          ) : (
            <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
              <a href={checkoutHref} target="_blank" rel="noopener noreferrer">
                <Button size="sm">
                  Actualizar <ExternalLink className="ml-1.5 h-3 w-3" />
                </Button>
              </a>
              <p className="text-[11px] text-muted-foreground sm:text-right">
                Paga con el mismo correo de tu cuenta
              </p>
            </div>
          )}
        </div>
      )}

      {/* Cancelar — solo planes pagos. El correo va como texto copiable además del link. */}
      {plan !== 'free' && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Para cancelar o cambiar el método de pago</span>, escríbenos a{' '}
          <a href={`mailto:${AGENCY_CONTACT_EMAIL}`} className="select-all text-primary-text underline-offset-4 hover:underline">
            {AGENCY_CONTACT_EMAIL}
          </a>. También puedes cancelar la suscripción desde tu cuenta de Mercado Pago.
        </p>
      )}
    </div>
  )
}

// ─── Tu plan, con consumo real (CHANGE-139) ────────────────────────────────────

function UsageRow({ label, value, detail, ratio, tone = 'brand' }: {
  label: string
  value: string
  detail?: string
  ratio?: number
  tone?: 'brand' | 'warn'
}) {
  return (
    <div className="grid gap-1.5 py-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
      </div>
      {ratio != null && (
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden>
          <div className={cn('h-full rounded-full', tone === 'warn' ? 'bg-warning' : 'bg-primary')} style={{ width: `${Math.max(2, Math.min(100, ratio * 100))}%` }} />
        </div>
      )}
      {detail && <span className="text-xs text-subtle-foreground">{detail}</span>}
    </div>
  )
}

function PlanCard({ plan, maxStores, createdAt }: { plan: string; maxStores: number | undefined; createdAt: string | undefined }) {
  const { data: stores = [] } = useGetStoresQuery()
  const { isPro, maxPoolPage } = usePlanTier()
  const { isTrial, isExpired, daysLeft } = useTrialStatus()
  const planMeta = PLAN_LABELS[plan] ?? PLAN_LABELS.free
  const active = stores.filter((s) => s.isActive).length
  const unlimited = maxStores == null || maxStores >= 999
  const trialEnds = isTrial && createdAt
    ? new Date(new Date(createdAt).getTime() + 7 * 86_400_000).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })
    : null

  return (
    <section aria-labelledby="tu-plan" className="rounded-xl border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="text-xs font-medium text-subtle-foreground">Tu plan</p>
          <h2 id="tu-plan" className="font-display text-xl font-semibold text-foreground">
            {planMeta.label}
            {isTrial && !isExpired && <span className="ml-2 text-base font-normal text-muted-foreground">· {daysLeft === 1 ? 'te queda 1 día' : `te quedan ${daysLeft} días`}</span>}
          </h2>
          {trialEnds && <p className="text-xs text-subtle-foreground">La prueba termina el {trialEnds}.</p>}
        </div>
        <Link href="/pricing" className="flex items-center gap-1 text-xs font-medium text-primary-text hover:underline">
          Ver todos los planes <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="divide-y divide-border px-5">
        <UsageRow
          label="Tiendas que sigues"
          value={unlimited ? `${active} · sin límite` : `${active} de ${maxStores}`}
          ratio={unlimited ? undefined : active / Math.max(1, maxStores!)}
          tone={!unlimited && active >= maxStores! ? 'warn' : 'brand'}
          detail={!unlimited && active >= maxStores! ? 'Llegaste al límite de tu plan.' : undefined}
        />
        <UsageRow
          label="Radar del mercado"
          value={maxPoolPage === 0 ? 'Primera página' : 'Completo'}
          detail={maxPoolPage === 0 ? 'La prueba ve los 20 productos más fuertes. Con un plan pago ves todo el mercado.' : undefined}
        />
        <UsageRow label="Biblioteca de anuncios" value={isPro ? 'Completa' : 'Sin anunciante ni links'} />
        <UsageRow label="Anunciante y link a Meta" value={isPro ? 'Incluido' : 'Solo en Pro'} />
      </div>
      {plan !== 'admin' && (
        <div className="border-t border-border p-5">
          <BillingSection plan={plan} />
        </div>
      )}
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
// Ajustes y plan (CHANGE-139, Fase 3d). Antes: un perfil con avatar grande, el plan repetido en
// dos lugares, la oferta abajo de todo y "Cerrar sesión" como sección aparte. Ahora el plan va
// primero, con lo que usas de verdad, y después avisos, preferencias y cuenta.

export default function SettingsPage() {
  const router   = useRouter()
  const dispatch = useAppDispatch()
  const { data: me, isLoading } = useGetMeQuery()
  const [updatePreferences] = useUpdatePreferencesMutation()

  function handleLogout() {
    dispatch(logout())
    router.push('/login')
  }

  const plan = me?.plan ?? 'free'
  const joinedDate = me?.createdAt
    ? new Date(me.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
    : null
  const card = 'rounded-xl border border-border bg-card shadow-card'
  const heading = 'flex items-center gap-2 text-sm font-semibold text-foreground'

  return (
    <PageLayout title="Ajustes y plan">
      <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)] gap-5">
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-xl bg-secondary" />
        ) : (
          <PlanCard plan={plan} maxStores={me?.maxStores} createdAt={me?.createdAt} />
        )}

        {/* Avisos (CHANGE-131): lo único que existe es el correo del backend */}
        <section className={card} aria-labelledby="avisos">
          <div className="px-5 py-4">
            <h2 id="avisos" className={heading}><Bell className="h-4 w-4" />Avisos por correo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cuando un producto de tus tiendas llega a la señal más fuerte, te escribimos a{' '}
              <span className="font-medium text-foreground">{me?.email ?? 'tu correo'}</span>. Por ahora no se configuran desde aquí.
            </p>
          </div>
        </section>

        <section className={card} aria-labelledby="preferencias">
          <div className="flex items-start justify-between gap-4 px-5 py-4">
            <div>
              <h2 id="preferencias" className={heading}><Zap className="h-4 w-4" />Detección automática</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Los productos nuevos de tus tiendas entran solos al Radar, sin pasar por “Nuevos por revisar” en Competidores.
              </p>
            </div>
            <Toggle
              checked={Boolean(me?.autoDetectCandidates)}
              onChange={(v) => updatePreferences({ autoDetectCandidates: v })}
            />
          </div>
        </section>

        <section className={card} aria-labelledby="cuenta">
          <div className="border-b border-border px-5 py-4">
            <h2 id="cuenta" className={heading}><User className="h-4 w-4" />Cuenta</h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />{me?.email ?? '—'}
              {joinedDate && <span className="text-subtle-foreground">· desde el {joinedDate}</span>}
            </p>
          </div>
          <div className="border-b border-border px-5 py-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground"><Shield className="h-4 w-4" />Contraseña</h3>
            <PasswordSection />
          </div>
          <div className="px-5 py-4">
            <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />Cerrar sesión
            </Button>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
