'use client'

import Link from 'next/link'
import { ArrowRight, FlaskConical } from 'lucide-react'
import { HoverImagePreview } from '@/components/ui/image-preview'
import { useGetPendingCandidatesQuery } from '@/app/(dashboard)/services/candidateApi'

export function PendingCandidatesSection() {
  const { data: pending = [], isLoading } = useGetPendingCandidatesQuery()

  if (isLoading) return <Skeleton />
  if (pending.length === 0) return null

  const shown = pending.slice(0, 5)
  const rest = pending.length - shown.length

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/40">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-200/60 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <FlaskConical className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold text-foreground">Pendientes de testeo</span>
          <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white leading-none">
            {pending.length}
          </span>
        </div>
        <Link
          href="/tracker"
          className="flex items-center gap-1 text-xs font-medium text-amber-600 transition-colors hover:text-amber-700"
        >
          Ver todos
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Lista */}
      <div className="divide-y divide-amber-100">
        {shown.map((p) => (
          <div
            key={p.candidateId}
            className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-amber-50/70"
          >
            <HoverImagePreview
              src={p.productImage}
              fallback={p.productTitle.charAt(0)}
              proxy
              size={64}
              previewSize={220}
            />

            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-semibold text-foreground">
                {p.productTitle}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {p.storeName}
                </span>
                {p.productPrice != null && (
                  <span className="text-[11px] font-semibold text-primary">
                    ${p.productPrice.toLocaleString('es-CO')}
                  </span>
                )}
                {p.firstSeenRank != null && (
                  <span className="text-[10px] text-muted-foreground">
                    Rank #{p.firstSeenRank}
                  </span>
                )}
              </div>
            </div>

            <Link
              href="/tracker"
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-600"
            >
              <FlaskConical className="h-3.5 w-3.5" />
              Testear
            </Link>
          </div>
        ))}

        {rest > 0 && (
          <Link
            href="/tracker"
            className="flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-700"
          >
            +{rest} producto{rest !== 1 ? 's' : ''} más esperando
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-amber-200/60 bg-amber-50/20">
      <div className="border-b border-amber-100 px-5 py-3">
        <div className="h-5 w-44 animate-pulse rounded bg-amber-100" />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3">
          <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-amber-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-52 animate-pulse rounded bg-amber-100" />
            <div className="h-3 w-32 animate-pulse rounded bg-amber-100" />
          </div>
          <div className="h-8 w-20 animate-pulse rounded-lg bg-amber-100" />
        </div>
      ))}
    </div>
  )
}
