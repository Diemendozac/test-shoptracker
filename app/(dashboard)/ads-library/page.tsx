'use client'

// Biblioteca de anuncios (2026-09-15, wiki scout-biblioteca-anuncios-propuesta) — pantalla
// nueva, separada de "Explorar testeos": lista anuncios en sí (no candidatos), sin depender de
// que el candidato siga en tracking activo. Depende de FIX-074 (status/days_running reales) —
// ver docs/FIXES.md en el backend para el detalle de esa parte.

import { useState } from 'react'
import { Lock, Video } from 'lucide-react'
import { useGetAdsLibraryQuery } from '@/app/(dashboard)/services/dashboardApi'
import { AdSlide, FloatingVideoPanel, useHoverPanel } from '@/components/tracker/product-ads'
import { usePlanTier } from '@/lib/view-as'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'

// Las 13 categorías completas de scout-clasificacion-nicho, incluido el catch-all "Otro" —
// a diferencia del NICHES de pool-winners.tsx (que solo tiene 9, discrepancia preexistente sin
// tocar acá), esta lista tiene que ser exhaustiva: "ningún anuncio sin categoría" fue un
// requisito explícito de Daniel.
const NICHES = [
  'Belleza & Cuidado', 'Hogar & Cocina', 'Mascotas', 'Deportes & Fitness',
  'Tecnología & Gadgets', 'Moda & Accesorios', 'Jardín & Exterior', 'Bebés & Niños',
  'Herramientas & Auto', 'Salud & Bienestar', 'Joyería & Relojes',
  'Juguetes & Entretenimiento', 'Otro',
]

type StatusFilter = 'all' | 'active' | 'inactive'
type RuntimePreset = 'all' | '7' | '30' | '90'

const RUNTIME_PRESETS: { id: RuntimePreset; label: string; minDays?: number }[] = [
  { id: 'all', label: 'Cualquier duración' },
  { id: '7',   label: '7+ días',  minDays: 7  },
  { id: '30',  label: '30+ días', minDays: 30 },
  { id: '90',  label: '90+ días', minDays: 90 },
]

export default function AdsLibraryPage() {
  const { allowMetaLink } = usePlanTier()
  const { hoveredAd, hoverPos, handleHover, handleLeave, handlePanelEnter, handlePanelLeave } = useHoverPanel()

  const [page, setPage] = useState(0)
  const [status, setStatus] = useState<StatusFilter>('all')
  const [runtime, setRuntime] = useState<RuntimePreset>('all')
  const [niches, setNiches] = useState<string[]>([])

  const minDaysRunning = RUNTIME_PRESETS.find(r => r.id === runtime)?.minDays

  const { data, isLoading } = useGetAdsLibraryQuery({
    page, size: 24,
    ...(status !== 'all' && { status }),
    ...(minDaysRunning != null && { minDaysRunning }),
    ...(niches.length > 0 && { niche: niches }),
  })

  function toggleNiche(n: string) {
    setPage(0)
    setNiches(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])
  }

  if (data && !data.isPro) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <Lock className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="text-lg font-semibold text-foreground">Biblioteca de anuncios</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Disponible para planes Pro y Agency — mismo acceso que "Anuncios activos" en el detalle de un candidato.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Video className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold text-foreground">Biblioteca de anuncios</h1>
        {data && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {data.total} anuncios
          </span>
        )}
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap items-start gap-6 rounded-xl border border-border bg-card p-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
          <div className="flex gap-1">
            {(['all', 'active', 'inactive'] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(0) }}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  status === s ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground',
                )}
              >
                {s === 'all' ? 'Todos' : s === 'active' ? 'Activos' : 'Inactivos'}
              </button>
            ))}
          </div>
        </div>

        <div>
          {/* La premisa del producto: más tiempo activo = más ganador. Ver wiki. */}
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Runtime</p>
          <div className="flex gap-1">
            {RUNTIME_PRESETS.map(r => (
              <button
                key={r.id}
                onClick={() => { setRuntime(r.id); setPage(0) }}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  runtime === r.id ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-[280px] flex-1">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categoría</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {NICHES.map(n => (
              <label key={n} className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                <Checkbox checked={niches.includes(n)} onCheckedChange={() => toggleNiche(n)} />
                {n}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[9/16] animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : !data || data.ads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Ningún anuncio coincide con estos filtros.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {data.ads.map((ad, i) => (
              <AdSlide
                key={ad.id}
                ad={ad}
                index={i}
                allowMetaLink={allowMetaLink}
                onHover={handleHover}
                onLeave={handleLeave}
              />
            ))}
          </div>

          {/* Paginación simple — prev/next, coherente con el volumen esperado de esta vista */}
          {data.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="text-xs text-muted-foreground">
                Página {page + 1} de {data.totalPages}
              </span>
              <button
                disabled={page + 1 >= data.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {hoveredAd && (
        <FloatingVideoPanel
          ad={hoveredAd} top={hoverPos.top} left={hoverPos.left}
          onMouseEnter={handlePanelEnter} onMouseLeave={handlePanelLeave}
        />
      )}
    </div>
  )
}
