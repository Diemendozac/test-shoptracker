'use client'

import { PageLayout } from '@/components/layout/page-layout'
import { PendingCandidatesSection } from '@/components/tracker/pending-candidates'

export default function PendientesPage() {
  return (
    <PageLayout title="Pendientes" description="Productos detectados que aún no están en testeo">
      <PendingCandidatesSection />
    </PageLayout>
  )
}
