'use client'

import { useState } from 'react'
import { PoolWinnersSection } from '@/components/tracker/pool-winners'
import { useGetPoolWinnersQuery } from '@/app/(dashboard)/services/dashboardApi'
import { cn } from '@/lib/utils'
import { LayoutGrid, TrendingUp, CreditCard, Star, Flame } from 'lucide-react'

export type PoolPreset = 'all' | 'rising' | 'pago_anticipado' | 'top_score' | 'new'

const TABS: { id: PoolPreset; label: string; icon: React.ElementType }[] = [
  { id: 'all',            label: 'Todos los productos',  icon: LayoutGrid  },
  { id: 'rising',         label: 'En alza',              icon: Flame       },
  { id: 'pago_anticipado',label: 'Pago anticipado',      icon: CreditCard  },
  { id: 'top_score',      label: 'Top score',            icon: Star        },
  { id: 'new',            label: 'Nuevos esta semana',   icon: TrendingUp  },
]

export default function PoolPage() {
  const [page, setPage] = useState(0)
  const [preset, setPreset] = useState<PoolPreset>('all')
  const { data, isLoading } = useGetPoolWinnersQuery({
    page,
    size: 20,
    pagoAnticipado: preset === 'pago_anticipado' ? true : undefined,
  })

  function handleTab(id: PoolPreset) {
    setPreset(id)
    setPage(0)
  }

  return (
    <div className="flex flex-col">
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
        <PoolWinnersSection
          data={data}
          isLoading={isLoading}
          page={page}
          onPageChange={setPage}
          preset={preset}
        />
      </div>
    </div>
  )
}
