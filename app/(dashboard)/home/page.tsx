'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Store } from 'lucide-react'
import { PageLayout } from '@/components/layout/page-layout'
import { buttonVariants } from '@/components/ui/button'
import { useGetTrackerCandidatesQuery } from '../services/dashboardApi'
import { useGetStoresQuery } from '../stores/services/storeApi'
import { todayEvents, todayHeadline, storeHealth } from '@/lib/today'
import { ChangesFeed } from '@/components/home/changes-feed'
import { MarketRow } from '@/components/home/market-row'
import { StoreHealth } from '@/components/home/store-health'
import { cn } from '@/lib/utils'

// Hoy (CHANGE-136, Fase 2e del rediseño). Reemplaza Inicio y Resumen: en 30 segundos, qué cambió
// en tus tiendas desde el último corte y qué está ganando en el mercado. Antes Inicio tenía un
// logo gigante, un buscador que solo miraba tus tiendas y 10 productos del pool (hoy está ⌘K),
// accesos rápidos que repetían el menú y "Qué hacer ahora" con mensajes genéricos; Resumen tenía
// tres indicadores de inventario y el mejor producto por tienda.

export default function TodayPage() {
  const { data: candidates = [], isLoading: loadingCandidates } = useGetTrackerCandidatesQuery({})
  const { data: stores = [], isLoading: loadingStores } = useGetStoresQuery()

  const events = useMemo(() => todayEvents(candidates), [candidates])
  const headline = useMemo(() => todayHeadline(events), [events])
  const health = useMemo(() => storeHealth(stores, candidates), [stores, candidates])

  const todayRaw = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
  const today = todayRaw.charAt(0).toUpperCase() + todayRaw.slice(1)
  const activeStores = stores.filter((s) => s.isActive).length
  const loading = loadingCandidates || loadingStores
  const noStores = !loading && activeStores === 0

  return (
    <PageLayout>
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-6">
        <header>
          <h1 className="font-display text-[26px] font-semibold leading-8 tracking-tight text-foreground">Hoy</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {today}
            {activeStores > 0 && <> · {activeStores === 1 ? 'tu tienda' : `tus ${activeStores} tiendas`} y el mercado</>}
          </p>
        </header>

        {loading ? (
          <div className="grid gap-4">
            <div className="h-20 animate-pulse rounded-xl bg-secondary" />
            <div className="h-72 animate-pulse rounded-xl bg-secondary" />
          </div>
        ) : noStores ? (
          // Sin tiendas (la prueba recién creada): primero lo que Dropspy ya vigila, después seguir una
          <section className="flex flex-wrap items-center gap-4 rounded-xl border border-primary-border bg-primary-subtle p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-primary-text">
              <Store className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-semibold text-foreground">Sigue las tiendas de tu competencia</h2>
              <p className="text-sm text-muted-foreground">
                Dropspy ya vigila el mercado. Si además sigues tiendas, aquí verás cada día qué lanzan y qué les funciona.
              </p>
            </div>
            <Link href="/stores" className={buttonVariants({ variant: 'brand' })}>Seguir una tienda</Link>
          </section>
        ) : (
          <>
            <section className="flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-card sm:flex-row sm:items-center">
              <p className="min-w-0 font-display text-lg font-semibold leading-snug text-foreground text-balance sm:flex-1">{headline}</p>
              <Link
                href={events.length > 0 ? `/tracker/${events[0].candidate.candidateId}?storeId=${events[0].candidate.storeId}` : '/pool'}
                className={cn(buttonVariants({ variant: 'brand' }), 'shrink-0')}
              >
                {events.length > 0 ? 'Ver el cambio más fuerte' : 'Ir al Radar'}
              </Link>
            </section>
            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <ChangesFeed events={events} />
              <StoreHealth rows={health} />
            </div>
          </>
        )}

        <MarketRow />
      </div>
    </PageLayout>
  )
}
