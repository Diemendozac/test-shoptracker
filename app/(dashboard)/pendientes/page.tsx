'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { PageLayout } from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button'
import { PendingCandidatesSection } from '@/components/tracker/pending-candidates'
import { usePlanTier } from '@/lib/view-as'

export default function PendientesPage() {
  const { canTrackStores } = usePlanTier()

  // Prueba gratis: sin rastreador de tiendas, así que Pendientes siempre estaría vacío.
  if (!canTrackStores) {
    return (
      <PageLayout title="Pendientes" description="Productos detectados que aún no están en testeo">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card py-24 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Pendientes se desbloquea con un plan pago</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              La prueba gratis no incluye rastreador de tiendas. Suscríbete para empezar a rastrear tus propias tiendas.
            </p>
          </div>
          <Link href="/pricing">
            <Button size="sm" className="mt-1">Ver planes</Button>
          </Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Pendientes" description="Productos detectados que aún no están en testeo">
      <PendingCandidatesSection />
    </PageLayout>
  )
}
