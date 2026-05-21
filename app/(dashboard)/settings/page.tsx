'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageLayout } from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button'
import { useAppDispatch } from '@/store/hooks'
import { logout } from '@/app/(auth)/store/authSlice'
import { useGetMeQuery, useChangePasswordMutation, useUpdatePreferencesMutation } from '@/app/(dashboard)/services/userApi'
import { User, Mail, Bell, Shield, CreditCard, LogOut, Eye, EyeOff, Check, X, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Plan badge ───────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:    { label: 'Free',    color: 'bg-secondary text-muted-foreground' },
  basic:   { label: 'Básico',  color: 'bg-blue-500/20 text-blue-400' },
  pro:     { label: 'Pro',     color: 'bg-primary/20 text-primary' },
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router   = useRouter()
  const dispatch = useAppDispatch()
  const { data: me, isLoading } = useGetMeQuery()

  const [updatePreferences] = useUpdatePreferencesMutation()
  const [notifications, setNotifications] = useState({
    dailyDigest:  false,
    risingAlerts: true,
    weeklyReport: false,
  })

  function toggleNotif(key: keyof typeof notifications) {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleLogout() {
    dispatch(logout())
    router.push('/login')
  }

  const plan = me?.plan ?? 'free'
  const planMeta = PLAN_LABELS[plan] ?? PLAN_LABELS.free
  const avatarLetter = me?.email?.charAt(0).toUpperCase() ?? '—'
  const joinedDate = me?.createdAt
    ? new Date(me.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  return (
    <PageLayout title="Settings" description="Manage your account and preferences">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* ── Profile ── */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="flex items-center gap-2 font-semibold text-foreground">
              <User className="h-4 w-4" />
              Perfil
            </h2>
          </div>
          <div className="p-6 space-y-5">
            {isLoading ? (
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 animate-pulse rounded-full bg-secondary" />
                <div className="space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-secondary" />
                  <div className="h-3 w-24 animate-pulse rounded bg-secondary" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary">
                  {avatarLetter}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{me?.email ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">Miembro desde {joinedDate}</p>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <div className="flex h-10 items-center rounded-lg border border-border bg-input px-3 text-sm text-muted-foreground">
                  <Mail className="mr-2 h-3.5 w-3.5 shrink-0" />
                  {me?.email ?? '—'}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Plan</label>
                <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-input px-3 text-sm">
                  <span className={cn('rounded px-2 py-0.5 text-xs font-semibold', planMeta.color)}>
                    {planMeta.label}
                  </span>
                  <span className="text-muted-foreground">
                    {me?.maxStores ?? 1} {me?.maxStores === 1 ? 'tienda' : 'tiendas'} máx.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Notifications ── */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="flex items-center gap-2 font-semibold text-foreground">
              <Bell className="h-4 w-4" />
              Notificaciones
            </h2>
          </div>
          <div className="divide-y divide-border">
            {([
              { key: 'dailyDigest',  label: 'Resumen diario',      desc: 'Email con los top productos de cada día' },
              { key: 'risingAlerts', label: 'Alertas Rising',       desc: 'Te avisamos cuando un producto entra en tendencia' },
              { key: 'weeklyReport', label: 'Reporte semanal',      desc: 'Resumen completo de performance cada semana' },
            ] as const).map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Toggle
                  checked={notifications[key]}
                  onChange={() => toggleNotif(key)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Automatización ── */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="flex items-center gap-2 font-semibold text-foreground">
              <Zap className="h-4 w-4" />
              Automatización
            </h2>
          </div>
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-foreground">Detectar candidatos automáticamente</p>
                <p className="text-xs text-muted-foreground">
                  Cuando está activo, cada sync detecta productos nuevos y los muestra en Tracker para que los testees.
                  Si está inactivo, los candidatos no se agregan hasta que lo hagas manualmente.
                </p>
              </div>
              <Toggle
                checked={Boolean(me?.autoDetectCandidates)}
                onChange={(v) => updatePreferences({ autoDetectCandidates: v })}
              />
            </div>
          </div>
        </div>

        {/* ── Security ── */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="flex items-center gap-2 font-semibold text-foreground">
              <Shield className="h-4 w-4" />
              Seguridad
            </h2>
          </div>
          <div className="p-6">
            <PasswordSection />
          </div>
        </div>

        {/* ── Billing ── */}
        {plan !== 'admin' && (
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border p-4">
              <h2 className="flex items-center gap-2 font-semibold text-foreground">
                <CreditCard className="h-4 w-4" />
                Plan
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4">
                <div>
                  <p className="font-semibold text-foreground">Actualizar a Pro</p>
                  <p className="text-sm text-muted-foreground">Más tiendas, historial ilimitado y señales del pool</p>
                </div>
                <Button>Ver planes</Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Session ── */}
        <div className="rounded-xl border border-destructive/30 bg-card">
          <div className="border-b border-destructive/30 p-4">
            <h2 className="flex items-center gap-2 font-semibold text-destructive">
              <LogOut className="h-4 w-4" />
              Sesión
            </h2>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Cerrar sesión</p>
              <p className="text-sm text-muted-foreground">Salir de tu cuenta en este dispositivo</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        </div>

      </div>
    </PageLayout>
  )
}
