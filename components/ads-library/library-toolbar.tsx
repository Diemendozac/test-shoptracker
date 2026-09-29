'use client'

// Barra de filtros de la Biblioteca. En escritorio va pegada arriba al hacer scroll; en
// pantallas chicas deja a la vista el estado y pliega el resto en "Filtros", para que los
// anuncios empiecen en la primera pantalla. Ver docs/redesign/biblioteca-anuncios/02-propuesta.md (1.4).

import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Segmented } from '@/components/ui/segmented'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Las 13 categorías completas de scout-clasificacion-nicho, incluido el catch-all "Otro" —
// a diferencia del NICHES de pool-winners.tsx (que solo tiene 9, discrepancia preexistente sin
// tocar acá), esta lista tiene que ser exhaustiva: "ningún anuncio sin categoría" fue un
// requisito explícito de Daniel.
export const NICHES = [
  'Belleza & Cuidado', 'Hogar & Cocina', 'Mascotas', 'Deportes & Fitness',
  'Tecnología & Gadgets', 'Moda & Accesorios', 'Jardín & Exterior', 'Bebés & Niños',
  'Herramientas & Auto', 'Salud & Bienestar', 'Joyería & Relojes',
  'Juguetes & Entretenimiento', 'Otro',
]

export type StatusFilter = 'active' | 'inactive' | 'all'
export type RuntimePreset = 'all' | '7' | '30' | '90'

export interface LibraryFilters {
  status: StatusFilter
  runtime: RuntimePreset
  niches: string[]
  /** Código ISO de 2 letras, igual que el filtro de país del pool. '' = todos */
  country: string
}

// Activos por defecto: lo que se busca acá son anuncios que siguen corriendo hace mucho (B1).
export const DEFAULT_FILTERS: LibraryFilters = { status: 'active', runtime: 'all', niches: [], country: '' }

export const RUNTIME_MIN_DAYS: Record<RuntimePreset, number | undefined> = { all: undefined, '7': 7, '30': 30, '90': 90 }

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'No vistos' },
  { value: 'all', label: 'Todos' },
] as const

// La premisa del producto: más tiempo activo = más ganador.
const RUNTIME_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: '7', label: '7+ d' },
  { value: '30', label: '30+ d' },
  { value: '90', label: '90+ d' },
] as const

const regionNames = (() => {
  try { return new Intl.DisplayNames(['es'], { type: 'region' }) } catch { return null }
})()

export function countryName(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return code
  try { return regionNames?.of(code.toUpperCase()) ?? code } catch { return code }
}

function FilterLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('text-xs font-semibold text-muted-foreground', className)}>{children}</span>
}

export function LibraryToolbar({
  filters,
  onChange,
  onClear,
  countries,
}: {
  filters: LibraryFilters
  onChange: (next: Partial<LibraryFilters>) => void
  onClear: () => void
  countries: string[]
}) {
  const [moreOpen, setMoreOpen] = useState(false)
  const extraCount = (filters.runtime !== 'all' ? 1 : 0) + filters.niches.length + (filters.country ? 1 : 0)
  const isDefault = filters.status === DEFAULT_FILTERS.status && extraCount === 0

  function toggleNiche(n: string) {
    onChange({ niches: filters.niches.includes(n) ? filters.niches.filter(x => x !== n) : [...filters.niches, n] })
  }

  return (
    <section
      aria-label="Filtros"
      className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-card md:sticky md:top-16 md:z-30 md:p-4"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex items-center gap-2">
          <FilterLabel className="max-md:sr-only">Estado</FilterLabel>
          <Segmented
            ariaLabel="Estado"
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={status => onChange({ status })}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="ml-auto text-xs md:hidden"
          aria-expanded={moreOpen}
          aria-controls="library-more-filters"
          onClick={() => setMoreOpen(o => !o)}
        >
          Filtros
          {extraCount > 0 && (
            <span className="min-w-5 rounded-full bg-primary px-1.5 text-xs leading-5 text-primary-foreground tabular-nums">{extraCount}</span>
          )}
          <ChevronDown className={cn('transition-transform', moreOpen && 'rotate-180')} aria-hidden />
        </Button>

        {/* En md+ `contents` suelta estos controles en la misma fila; abajo de md se pliegan */}
        <div
          id="library-more-filters"
          className={cn(
            'w-full flex-wrap items-center gap-x-4 gap-y-3 border-t border-border pt-3 md:contents',
            moreOpen ? 'flex' : 'hidden',
          )}
        >
          <div className="flex items-center gap-2">
            <FilterLabel>Duración</FilterLabel>
            <Segmented
              ariaLabel="Duración"
              options={RUNTIME_OPTIONS}
              value={filters.runtime}
              onChange={runtime => onChange({ runtime })}
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs font-medium">
                Categoría
                {filters.niches.length > 0 && (
                  <span className="min-w-5 rounded-full bg-primary px-1.5 text-xs leading-5 text-primary-foreground tabular-nums">
                    {filters.niches.length}
                  </span>
                )}
                <ChevronDown aria-hidden />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-2">
              <div role="group" aria-label="Categorías" className="max-h-80 overflow-y-auto">
                {NICHES.map(n => (
                  <label key={n} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                    <Checkbox checked={filters.niches.includes(n)} onCheckedChange={() => toggleNiche(n)} />
                    {n}
                  </label>
                ))}
              </div>
              {filters.niches.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange({ niches: [] })}
                  className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-primary-text hover:bg-accent"
                >
                  Quitar categorías
                </button>
              )}
            </PopoverContent>
          </Popover>

          {countries.length > 1 && (
            <Select value={filters.country || 'all'} onValueChange={v => onChange({ country: v === 'all' ? '' : v })}>
              <SelectTrigger size="sm" aria-label="País" className="bg-card text-xs font-medium">
                <SelectValue>{filters.country ? countryName(filters.country) : 'País: todos'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los países</SelectItem>
                {countries.map(c => (
                  <SelectItem key={c} value={c}>{countryName(c)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {!isDefault && (
            <button type="button" onClick={onClear} className="text-xs font-medium text-primary-text hover:underline md:ml-auto">
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {filters.niches.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.niches.map(n => (
            <span
              key={n}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-primary-border bg-primary-subtle pl-2.5 pr-1 text-xs font-medium text-primary-text"
            >
              {n}
              <button
                type="button"
                onClick={() => toggleNiche(n)}
                aria-label={`Quitar ${n}`}
                className="flex size-5 items-center justify-center rounded-full hover:bg-primary/10"
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
