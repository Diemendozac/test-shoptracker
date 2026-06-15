'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/store/hooks'
import { useGetMeQuery } from '@/app/(dashboard)/services/userApi'
import { useGetAdminUsersQuery, useUpdateUserPlanMutation } from '@/app/(dashboard)/services/adminApi'
import { cn } from '@/lib/utils'

const PLAN_COLORS: Record<string, string> = {
  admin:   'bg-violet-500/15 text-violet-600',
  pro:     'bg-blue-500/15 text-blue-600',
  agency:  'bg-amber-500/15 text-amber-600',
  starter: 'bg-emerald-500/15 text-emerald-600',
  free:    'bg-secondary text-muted-foreground',
}

const PLAN_OPTIONS = ['free', 'starter', 'pro', 'agency', 'admin'] as const

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', PLAN_COLORS[plan] ?? PLAN_COLORS.free)}>
      {plan}
    </span>
  )
}

function PlanSelector({ userId, currentPlan }: { userId: string; currentPlan: string }) {
  const [open, setOpen] = useState(false)
  const [updatePlan, { isLoading }] = useUpdateUserPlanMutation()

  async function handleSelect(plan: string) {
    if (plan === currentPlan) { setOpen(false); return }
    await updatePlan({ userId, plan })
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o: boolean) => !o)}
        disabled={isLoading}
        className={cn(
          'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-opacity',
          PLAN_COLORS[currentPlan] ?? PLAN_COLORS.free,
          isLoading && 'opacity-50',
        )}
      >
        {isLoading ? '…' : currentPlan}
        <svg className="h-2.5 w-2.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[90px] overflow-hidden rounded-lg border border-border bg-card shadow-lg">
            {PLAN_OPTIONS.map(plan => (
              <button
                key={plan}
                onClick={() => handleSelect(plan)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-secondary',
                  plan === currentPlan && 'font-semibold',
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', PLAN_COLORS[plan]?.split(' ')[0])} />
                {plan}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function isActiveLastWeek(lastLogin: string | null) {
  if (!lastLogin) return false
  return new Date(lastLogin) > new Date(Date.now() - 7 * 86400_000)
}

export default function AdminPage() {
  const router = useRouter()
  const { token } = useAppSelector(s => s.auth)

  const { data: me, isLoading: meLoading } = useGetMeQuery()
  const { data, isLoading, error } = useGetAdminUsersQuery(undefined, { skip: !me })

  useEffect(() => {
    if (!token) { router.replace('/login'); return }
    if (!meLoading && me && me.plan !== 'admin') router.replace('/dashboard')
  }, [me, meLoading, token, router])

  if (meLoading || !me) return null
  if (me.plan !== 'admin') return null

  const planOrder = ['admin', 'agency', 'pro', 'starter', 'free']

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Panel de administración</h1>
        <p className="text-sm text-muted-foreground">Vista interna — solo admins</p>
      </div>

      {/* Counters */}
      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total usuarios" value={data.totalUsers} />
          <StatCard label="Activos (7d)" value={data.activeLastWeek} />
          {planOrder.filter(p => data.byPlan[p]).map(p => (
            <StatCard key={p} label={`Plan ${p}`} value={data.byPlan[p]} plan={p} />
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">

        {/* Column headers */}
        <div className="grid grid-cols-[minmax(0,2fr)_80px_100px_130px_130px_90px_90px] gap-3 border-b border-border bg-secondary/30 px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <div>Email</div>
          <div>Plan</div>
          <div>Registro</div>
          <div>Último login</div>
          <div>Tiendas</div>
          <div className="text-center">Candidatos</div>
          <div className="text-center">Activo</div>
        </div>

        <div className="divide-y divide-border/50">
          {isLoading && (
            [...Array(5)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse bg-secondary/30 mx-4 my-2 rounded-lg" />
            ))
          )}

          {error && (
            <p className="py-8 text-center text-sm text-rose-500">No se pudo cargar la lista de usuarios.</p>
          )}

          {data?.users.map(u => (
            <div
              key={u.userId}
              className="grid grid-cols-[minmax(0,2fr)_80px_100px_130px_130px_90px_90px] items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-secondary/20"
            >
              {/* Email */}
              <span className="truncate font-medium text-foreground" title={u.email}>{u.email}</span>

              {/* Plan */}
              <PlanSelector userId={u.userId} currentPlan={u.plan} />

              {/* Registro */}
              <span className="text-xs text-muted-foreground tabular-nums">{fmt(u.createdAt)}</span>

              {/* Último login */}
              <span className="text-xs text-muted-foreground tabular-nums">{fmtTime(u.lastLogin)}</span>

              {/* Tiendas activas / límite */}
              <div>
                <span className="text-xs tabular-nums">
                  <span className="font-semibold text-foreground">{u.activeStores}</span>
                  <span className="text-muted-foreground"> / {u.maxStores === 999 ? '∞' : u.maxStores} activas</span>
                </span>
                {u.totalStores > u.activeStores && (
                  <span className="ml-1 text-[10px] text-muted-foreground/60">({u.totalStores} total)</span>
                )}
              </div>

              {/* Candidatos */}
              <div className="text-center">
                <span className="text-xs font-semibold text-foreground tabular-nums">{u.candidates}</span>
              </div>

              {/* Activo últimos 7d */}
              <div className="flex justify-center">
                {isActiveLastWeek(u.lastLogin) ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">Activo</span>
                ) : (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">Inactivo</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, plan }: { label: string; value: number; plan?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-2xl font-bold tabular-nums text-foreground">{value}</span>
        {plan && <PlanBadge plan={plan} />}
      </div>
    </div>
  )
}
