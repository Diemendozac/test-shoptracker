'use client'
// Panel de detalle del Radar: la ficha de producto única (product-sheet.tsx, CHANGE-135) al lado
// de la tabla, sin perder el lugar. Antes este panel tenía su propia versión de la ficha, con
// datos y reglas de plan distintas a las de la página /tracker/[id].
import { cn } from '@/lib/utils'
import { ProductSheet } from '@/components/tracker/product-sheet'

interface PoolDetailPanelProps {
  candidateId: string
  storeId: string
  onClose: () => void
  /** split: al lado de la tabla (≥ 1280 px), sticky bajo el topbar. sheet: dentro de un Sheet (< 1280 px). */
  variant?: 'split' | 'sheet'
}

export function PoolDetailPanel({ candidateId, storeId, onClose, variant = 'split' }: PoolDetailPanelProps) {
  return (
    <aside
      className={cn(
        'bg-card',
        variant === 'split'
          // top-20 = topbar sticky de 64 px + 16 px de aire (con top-4 quedaba debajo del topbar)
          ? 'sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-border shadow-sm'
          : 'min-h-full',
      )}
    >
      <ProductSheet key={candidateId} candidateId={candidateId} storeId={storeId} variant="panel" onClose={onClose} />
    </aside>
  )
}
