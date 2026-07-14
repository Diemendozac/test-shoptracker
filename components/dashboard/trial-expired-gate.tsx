'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppDispatch } from '@/store/hooks'
import { logout } from '@/app/(auth)/store/authSlice'
import { useTrialStatus } from '@/lib/view-as'

// Bloqueo solo-frontend cuando la prueba gratis de 7 días expiró.
// No es un límite de seguridad real (el backend no lo enforce todavía,
// ver docs/CHANGES.md CHANGE-076) — evita que un usuario en prueba siga
// usando la app desde la UI normal una vez pasados los 7 días.
export function TrialExpiredGate({ children }: { children: React.ReactNode }) {
  const { isExpired } = useTrialStatus()
  const dispatch = useAppDispatch()
  const router = useRouter()

  if (!isExpired) return <>{children}</>

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">Tu prueba gratis de 7 días terminó</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Suscríbete a un plan para seguir rastreando productos, ver videos de ads y agregar tiendas.
        </p>
        <Link href="/pricing" className="mt-6 block">
          <Button className="w-full">Ver planes</Button>
        </Link>
        <button
          onClick={() => { dispatch(logout()); router.push('/login') }}
          className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
