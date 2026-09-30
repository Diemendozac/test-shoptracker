'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Store, Package, Sparkles, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { useGetStoresQuery } from '@/app/(dashboard)/stores/services/storeApi'
import { useGetTrackerCandidatesQuery, useGetPoolWinnersQuery } from '@/app/(dashboard)/services/dashboardApi'
import { useViewAs } from '@/lib/view-as'
import { NAV_ITEMS } from '@/components/layout/app-sidebar'

// Buscador global (CHANGE-132). Reemplaza la lupa sin acción que se quitó en CHANGE-131 y el
// buscador de Inicio, que solo miraba tus tiendas y 10 productos del pool.
//   - Tus tiendas y tus testeos: se filtran en el navegador (ya están cargados en la app).
//   - Radar: búsqueda literal en el servidor (/pool/winners?q=), con las mismas reglas de plan
//     que la pantalla del pool. No usa la búsqueda con IA por cada tecla: esa se abre con Enter
//     en "Buscar con IA en el Radar", que lleva a /pool?q=.
//   - Anuncios: no se buscan. /ads-library no acepta texto en el backend.

/** Minúsculas y sin tildes, para que "lampara" encuentre "Lámpara". */
function norm(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

function Thumb({ src }: { src: string | null }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/api/image-proxy?url=${encodeURIComponent(src)}`} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" />
  ) : (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-subtle-foreground">
      <Package className="h-4 w-4" />
    </span>
  )
}

export function CommandSearch() {
  const router = useRouter()
  const { effectivePlan } = useViewAs()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [isMac, setIsMac] = useState(true)

  // ⌘K en Mac, Ctrl+K en el resto. Abre y cierra.
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent))
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250)
    return () => clearTimeout(t)
  }, [query])

  const q = norm(query.trim())
  const hasQuery = q.length > 0

  const { data: stores = [] } = useGetStoresQuery(undefined, { skip: !open })
  const { data: tracker = [] } = useGetTrackerCandidatesQuery({}, { skip: !open })
  // Mismos parámetros que la pantalla del pool: el admin (sin simular otro plan) ve todo;
  // el resto, solo productos con video. El backend decide si el plan lo tiene bloqueado.
  const { data: poolData, isFetching: poolFetching } = useGetPoolWinnersQuery(
    { q: debounced, page: 0, size: 6, hasVideo: effectivePlan === 'admin' ? undefined : true },
    { skip: !open || debounced.length < 2 },
  )

  const storeResults = useMemo(
    () => (hasQuery ? stores.filter((s) => norm(s.storeName).includes(q) || norm(s.baseUrl ?? '').includes(q)).slice(0, 4) : []),
    [stores, q, hasQuery],
  )
  const trackerResults = useMemo(
    () => (hasQuery ? tracker.filter((c) => norm(c.productTitle).includes(q)).slice(0, 5) : []),
    [tracker, q, hasQuery],
  )
  const poolResults = useMemo(() => {
    if (!hasQuery || !poolData || poolData.locked) return []
    const mine = new Set(tracker.map((c) => c.candidateId))
    return poolData.winners.filter((w) => !mine.has(w.candidateId)).slice(0, 6)
  }, [poolData, tracker, hasQuery])

  function go(href: string) {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buscar"
        className={cn(
          'flex h-9 shrink-0 items-center gap-2 rounded-lg text-muted-foreground transition-colors hover:text-foreground',
          'w-9 justify-center hover:bg-accent',
          'xl:w-auto xl:justify-start xl:border xl:border-border xl:bg-card xl:px-3 xl:hover:border-border-hover xl:hover:bg-card',
        )}
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden text-xs xl:inline">Buscar</span>
        <kbd className="ml-3 hidden rounded border border-border bg-secondary px-1.5 font-mono text-[10px] text-subtle-foreground xl:inline">
          {isMac ? '⌘K' : 'Ctrl K'}
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQuery('') }}>
        <DialogContent showCloseButton={false} className="top-[12%] translate-y-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogTitle className="sr-only">Buscar en Dropspy</DialogTitle>
          <DialogDescription className="sr-only">Productos, tiendas y pantallas</DialogDescription>
          <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-subtle-foreground">
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Busca un producto o una tienda…"
              className="h-12 text-sm"
            />
            <CommandList className="max-h-[min(60vh,420px)]">
              {!hasQuery && (
                <CommandGroup heading="Ir a">
                  {NAV_ITEMS.map((item) => (
                    <CommandItem key={item.key} value={`nav-${item.key}`} onSelect={() => go(item.href)}>
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </CommandItem>
                  ))}
                  <CommandItem value="nav-settings" onSelect={() => go('/settings')}>
                    <Settings className="h-4 w-4" />
                    Configuración
                  </CommandItem>
                </CommandGroup>
              )}

              {hasQuery && (
                <>
                  {storeResults.length > 0 && (
                    <CommandGroup heading="Tus tiendas">
                      {storeResults.map((s) => (
                        <CommandItem key={s.storeId} value={`store-${s.storeId}`} onSelect={() => go(`/stores/${s.storeId}`)}>
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-subtle text-primary-text">
                            <Store className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{s.storeName}</span>
                            <span className="block truncate text-xs text-subtle-foreground">{s.baseUrl?.replace(/^https?:\/\//, '')}</span>
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {trackerResults.length > 0 && (
                    <CommandGroup heading="Productos de tus tiendas">
                      {trackerResults.map((c) => (
                        <CommandItem key={c.candidateId} value={`tracker-${c.candidateId}`}
                          onSelect={() => go(`/tracker/${c.candidateId}?storeId=${c.storeId}`)}>
                          <Thumb src={c.productImage} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{c.productTitle}</span>
                            <span className="block truncate text-xs text-subtle-foreground">{c.storeName}</span>
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {poolResults.length > 0 && (
                    <CommandGroup heading="Radar">
                      {poolResults.map((w) => (
                        <CommandItem key={w.candidateId} value={`pool-${w.candidateId}`}
                          onSelect={() => go(`/tracker/${w.candidateId}?storeId=${w.storeId}&from=pool`)}>
                          <Thumb src={w.productImage} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{w.productTitle}</span>
                            <span className="block truncate text-xs text-subtle-foreground">{w.storeName}</span>
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  <CommandGroup heading={poolFetching ? 'Buscando en el Radar…' : 'Más resultados'}>
                    <CommandItem value="pool-ai" onSelect={() => go(`/pool?q=${encodeURIComponent(query.trim())}`)}>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-subtle text-primary-text">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        Buscar &ldquo;{query.trim()}&rdquo; con IA en el Radar
                      </span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}

              <CommandEmpty>Sin resultados.</CommandEmpty>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}
