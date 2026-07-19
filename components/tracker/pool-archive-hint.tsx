'use client'

import Link from 'next/link'
import { Archive } from 'lucide-react'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { FormattedPrice } from '@/components/ui/formatted-price'
import { useCurrency } from '@/store/hooks'
import type { PoolWinnersResponse } from '@/app/(dashboard)/types'

// Sección compacta para /pool/search (FIX-053) — candidatos que ya salieron del tracking
// activo (completed/winner) pero siguen siendo buscables. A propósito NO reutiliza la tabla
// completa del pool (esa tiene ads, favoritos y paginación pesada, es más de lo que necesita
// un "también encontramos esto en el archivo").
export function PoolArchiveHint({
  data,
  isLoading,
}: {
  data: PoolWinnersResponse | undefined
  isLoading: boolean
}) {
  const { currency: preferredCurrency } = useCurrency()

  if (isLoading || !data || data.locked || data.winners.length === 0) return null

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Archive className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground">
          También encontrado en el archivo
        </span>
        <span className="text-[10px] text-muted-foreground">
          — productos que ya salieron del tracking activo
        </span>
      </div>

      <div className="divide-y divide-border">
        {data.winners.map((winner) => (
          <Link
            key={winner.candidateId}
            href={`/tracker/${winner.candidateId}?storeId=${winner.storeId}&from=pool`}
            className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-secondary/40"
          >
            <img
              src={winner.productImage || 'https://picsum.photos/seed/placeholder/80/80'}
              alt=""
              className="h-9 w-9 shrink-0 rounded-lg object-cover"
            />
            <span className="min-w-0 flex-1 truncate text-xs text-foreground">
              {winner.productTitle}
            </span>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              <FormattedPrice
                amount={winner.productPrice}
                originalCurrency={winner.currency}
                preferredCurrency={preferredCurrency ?? 'USD'}
                compact
              />
            </span>
            <ScoreRing score={winner.performanceScore} size="sm" showLabel={false} />
          </Link>
        ))}
      </div>
    </div>
  )
}
