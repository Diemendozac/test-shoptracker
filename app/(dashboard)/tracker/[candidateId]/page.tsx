'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { PageLayout } from '@/components/layout/page-layout'
import { ProductSheet } from '@/components/tracker/product-sheet'

// Ficha de producto a página completa (CHANGE-135, Fase 2d). Es la misma ficha que el panel del
// Radar (components/tracker/product-sheet.tsx). Antes esta página tenía su propia versión, con
// "Volver al Tracker", 4 indicadores sueltos, puntaje con decaimiento calculado en el navegador y
// el resumen en letra chica al final.

export default function CandidateDetailPage() {
  return (
    <Suspense fallback={<PageLayout><div className="py-24 text-center text-sm text-muted-foreground">Cargando…</div></PageLayout>}>
      <CandidateDetailContent />
    </Suspense>
  )
}

function CandidateDetailContent() {
  const searchParams = useSearchParams()
  const { candidateId } = useParams<{ candidateId: string }>()
  const storeId = searchParams.get('storeId')
  // Volver adonde se abrió: el Radar completo o el alcance "Mis tiendas"
  const backHref = searchParams.get('from') === 'pool' ? '/pool' : '/pool?alcance=mis-tiendas'

  const back = (
    <Link href={backHref} className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
      <ArrowLeft className="h-4 w-4" />
      Volver al Radar
    </Link>
  )

  if (!storeId) {
    return (
      <PageLayout>
        {back}
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-muted-foreground">
          <AlertCircle className="h-10 w-10 opacity-40" />
          <p className="text-sm">Falta la tienda de este producto en el link. Ábrelo de nuevo desde el Radar.</p>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      {back}
      <div className="mx-auto max-w-5xl">
        <ProductSheet candidateId={candidateId} storeId={storeId} variant="page" />
      </div>
    </PageLayout>
  )
}
