'use client'

import { useState } from 'react'
import { PoolWinnersSection } from '@/components/tracker/pool-winners'
import type { PagoFilter } from '@/components/tracker/pool-winners'
import { useGetPoolWinnersQuery } from '@/app/(dashboard)/services/dashboardApi'
import { cn } from '@/lib/utils'
import { LayoutGrid, TrendingUp, Star, Flame } from 'lucide-react'

export type PoolPreset = 'all' | 'rising' | 'top_score' | 'new'

const TABS: { id: PoolPreset; label: string; icon: React.ElementType }[] = [
  { id: 'all',       label: 'Todos los productos', icon: LayoutGrid },
  { id: 'rising',    label: 'En alza',             icon: Flame      },
  { id: 'top_score', label: 'Top score',           icon: Star       },
  { id: 'new',       label: 'Nuevos esta semana',  icon: TrendingUp },
]

export default function PoolPage() {
  const [page, setPage] = useState(0)
  const [preset, setPreset] = useState<PoolPreset>('all')
  const [pagoFilter, setPagoFilter] = useState<PagoFilter>('all')

  const { data, isLoading, error } = useGetPoolWinnersQuery({
    page,
    size: 20,
    pagoAnticipado: pagoFilter === 'anticipado' ? true
      : pagoFilter === 'contraentrega' ? false
      : undefined,
  })

  function handleTab(id: PoolPreset) {
    setPreset(id)
    setPage(0)
  }

  function handlePagoFilter(f: PagoFilter) {
    setPagoFilter(f)
    setPage(0)
  }

  return (
    <>
      {/* ── Tab header ── */}
      <div className="border-b border-border bg-card px-6">
        <div className="flex items-center gap-1 overflow-x-auto py-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTab(id)}
              className={cn(
                'flex shrink-0 items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-medium transition-colors whitespace-nowrap',
                preset === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-6">
        {error && !data && (
          <div className="rounded-xl border border-border bg-card px-6 py-8 text-center">
            <p className="text-sm font-medium text-foreground">No se pudo cargar el pool</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {'status' in error ? `Error ${(error as { status: number }).status}` : 'Error de red'} — intenta recargar la página
            </p>
          </div>
        )}
        <PoolWinnersSection
          data={data}
          isLoading={isLoading}
          page={page}
          onPageChange={setPage}
          preset={preset}
          pagoFilter={pagoFilter}
          onPagoFilterChange={handlePagoFilter}
        />
      </div>
    </>
  )
}
