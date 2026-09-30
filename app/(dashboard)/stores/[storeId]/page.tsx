'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, ExternalLink, Lock, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import { computeSignal } from '@/lib/signal'
import { usePlanTier } from '@/lib/view-as'
import { storeHealth } from '@/lib/today'
import { formatShortDate } from '@/lib/format-date'
import { useGetStoresQuery, useGetAdvertiserPagesQuery } from '@/app/(dashboard)/stores/services/storeApi'
import { useGetTrackerCandidatesQuery, useGetPoolWinnersQuery, useGetStoreAdsCountQuery } from '@/app/(dashboard)/services/dashboardApi'
import type { TrackerCandidate } from '@/app/(dashboard)/types'
import { HoverImagePreview } from '@/components/ui/image-preview'
import { SignalBadge } from '@/components/tracker/signal-badge'
import { StoreVideosGrid } from '@/components/tracker/product-ads'
import { StoreLaunches } from '@/components/stores/store-launches'

// Ficha de tienda (CHANGE-138, Fase 3b del rediseño). Su trabajo: entender la estrategia de una
// tienda (cuánto prueba, cuánto le funciona y cómo lo vende). Antes: el estado en mayúsculas sin
// explicación ("ZOMBIE"), tres indicadores (en testeo, en alza, score promedio) y una tabla de
// todos los productos que repetía Mis testeos. Solo existe para tus tiendas (el backend verifica
// que la tienda sea tuya).

const TONE = {
  ok: 'border-success-border bg-success-subtle text-success-foreground',
  warn: 'border-warning-border bg-warning-subtle text-warning-foreground',
  bad: 'border-danger-border bg-danger-subtle text-danger-foreground',
  none: 'border-border bg-secondary text-muted-foreground',
} as const

const COUNTRY: Record<string, string> = { CO: 'Colombia', MX: 'México', CL: 'Chile', PE: 'Perú', EC: 'Ecuador', AR: 'Argentina', US: 'Estados Unidos', ES: 'España' }

export default function StoreDetailPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-muted-foreground">Cargando…</div>}>
      <StoreDetailContent />
    </Suspense>
  )
}

function StoreLogo({ name, domain }: { name: string; domain: string }) {
  const initials = name.slice(0, 2).toUpperCase()
  if (!domain) {
    return <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-subtle text-lg font-bold text-primary-text">{initials}</div>
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
      alt=""
      className="h-14 w-14 shrink-0 rounded-2xl bg-secondary object-contain p-2"
      onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
    />
  )
}

function TopProducts({ candidates }: { candidates: TrackerCandidate[] }) {
  const top = [...candidates].sort((a, b) => (b.performanceScore ?? 0) - (a.performanceScore ?? 0)).slice(0, 5)
  return (
    <section className="rounded-xl border border-border bg-card shadow-card" aria-labelledby="le-funciona">
      <h2 id="le-funciona" className="border-b border-border px-5 py-3 text-sm font-semibold text-foreground">Lo que le está funcionando</h2>
      {top.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">Todavía no hay productos en seguimiento.</p>
      ) : (
        <ul className="divide-y divide-border">
          {top.map((c) => {
            const signal = computeSignal({ daysElapsed: c.daysElapsed, rankHistory: c.rankHistory, performanceScore: c.performanceScore })
            return (
              <li key={c.candidateId}>
                <Link href={`/tracker/${c.candidateId}?storeId=${c.storeId}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/40">
                  <HoverImagePreview src={c.productImage} fallback={c.productTitle.charAt(0)} size={44} proxy />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{c.productTitle}</p>
                    <p className="text-xs tabular-nums text-subtle-foreground">
                      {signal.rank != null ? `#${signal.rank}` : 'sin puesto'}
                      {signal.rankChange != null && signal.rankChange !== 0 && (
                        <span className={signal.rankChange > 0 ? 'text-success-foreground' : 'text-danger-foreground'}>
                          {' '}{signal.rankChange > 0 ? `subió ${signal.rankChange}` : `bajó ${-signal.rankChange}`}
                        </span>
                      )}
                      {` · hace ${c.daysElapsed} ${c.daysElapsed === 1 ? 'día' : 'días'}`}
                    </p>
                  </div>
                  <SignalBadge signal={signal} />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function AdvertiserPages({ storeId }: { storeId: string }) {
  const { isPro } = usePlanTier()
  const { data: pages = [] } = useGetAdvertiserPagesQuery(storeId)
  if (pages.length === 0) return null
  // El anunciante es de Pro (misma regla que en anuncios y biblioteca, FIX-077/081). Este endpoint
  // todavía manda los nombres a todos los planes: aquí se ocultan, pero el cambio real es de backend.
  if (!isPro) {
    return (
      <p className="flex items-center gap-2 text-xs text-subtle-foreground">
        <Lock className="h-3.5 w-3.5" />
        Anuncia desde {pages.length === 1 ? '1 página de Facebook' : `${pages.length} páginas de Facebook`}. Cuáles son es parte del plan Pro.
      </p>
    )
  }
  return (
    <div className="flex flex-wrap gap-2">
      {pages.map((p) => (
        <a key={p.pageName} href={p.pageId ? `https://www.facebook.com/${p.pageId}` : undefined} target="_blank" rel="noopener noreferrer"
          className={cn('inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm', p.pageId && 'hover:border-border-hover hover:bg-secondary/40')}>
          <span className="font-medium text-foreground">{p.pageName}</span>
          {p.totalAds != null && <span className="text-xs tabular-nums text-subtle-foreground">{p.totalAds.toLocaleString('es-CO')} anuncios</span>}
          {p.pageId && <ExternalLink className="h-3 w-3 text-subtle-foreground" />}
        </a>
      ))}
    </div>
  )
}

function StoreDetailContent() {
  const { storeId } = useParams<{ storeId: string }>()
  const { data: stores } = useGetStoresQuery()
  const store = stores?.find((s) => s.storeId === storeId)
  const { data: candidates = [], isLoading } = useGetTrackerCandidatesQuery({ storeId })
  const { data: adsCount } = useGetStoreAdsCountQuery(storeId)

  // Videos: como antes, candidatos del pool de la misma tienda (por dominio), que son los que
  // tienen anuncios rastreados. Pide 500 productos del pool: es pesado y conviene un endpoint
  // de videos por tienda en el backend.
  const { data: poolData } = useGetPoolWinnersQuery({ size: 500 })
  const domain = store?.baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '') ?? ''
  const videoCandidates = (poolData?.winners ?? []).filter((w) => domain && w.baseUrl?.includes(domain)) as unknown as TrackerCandidate[]

  const back = (
    <Link href="/stores" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
      <ArrowLeft className="h-4 w-4" />Volver a Competidores
    </Link>
  )

  if (stores && !store) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {back}
        <div className="flex flex-col items-center gap-3 py-24 text-center text-muted-foreground">
          <Store className="h-10 w-10 opacity-40" />
          <p className="text-sm">No encontramos esta tienda entre las que sigues.</p>
        </div>
      </div>
    )
  }

  const health = store ? storeHealth([{ ...store, isActive: true }], candidates)[0] : null
  const tone = store && !store.isActive ? 'none' : health?.tone ?? 'none'
  const label = store && !store.isActive ? 'Pausada' : health?.label ?? '—'
  const country = store?.country ? COUNTRY[store.country] ?? store.country : null

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)] gap-6 px-4 py-8 sm:px-6">
      {back}

      {store && (
        <header className="flex flex-wrap items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-card">
          <StoreLogo name={store.storeName} domain={domain} />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold leading-tight text-foreground">{store.storeName}</h1>
            <a href={store.baseUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary-text">
              {domain}<ExternalLink className="h-3.5 w-3.5" />
            </a>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className={cn('rounded-full border px-2 py-0.5 font-semibold', TONE[tone])}>
                {label}{store.isActive && health ? ` · ${health.newThisWeek === 1 ? '1 producto nuevo' : `${health.newThisWeek} productos nuevos`} en 7 días` : ''}
              </span>
              {[country, store.currency, store.niche].filter(Boolean).map((t) => (
                <span key={t} className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">{t}</span>
              ))}
              {store.pagoAnticipado && <span className="rounded-full border border-primary-border bg-primary-subtle px-2 py-0.5 font-medium text-primary-text">Pago anticipado</span>}
            </div>
          </div>
          {store.lastScrapedAt && (
            <p className="w-full text-xs text-subtle-foreground sm:w-auto">Último corte: {formatShortDate(store.lastScrapedAt)}</p>
          )}
        </header>
      )}

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-secondary" />
      ) : (
        <StoreLaunches candidates={candidates} catalogSize={store?.productCount ?? null} />
      )}

      <TopProducts candidates={candidates} />

      <section className="grid gap-3" aria-labelledby="como-vende">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="como-vende" className="text-sm font-semibold text-foreground">Cómo lo vende</h2>
          {adsCount && (
            <span className="text-xs tabular-nums text-subtle-foreground">
              {adsCount.totalActiveAds === 1 ? '1 anuncio activo' : `${adsCount.totalActiveAds} anuncios activos`}
            </span>
          )}
        </div>
        <AdvertiserPages storeId={storeId} />
        {videoCandidates.length > 0 ? (
          <StoreVideosGrid candidates={videoCandidates} />
        ) : (
          <p className="rounded-xl border border-dashed border-border px-5 py-6 text-center text-sm text-muted-foreground">
            Todavía no hay videos de anuncios de esta tienda.
          </p>
        )}
      </section>

      {candidates.length > 0 && (
        <Link href={`/pool?alcance=mis-tiendas&tienda=${storeId}`} className="w-fit text-sm font-medium text-primary-text hover:underline">
          Ver sus {candidates.length} productos en el Radar →
        </Link>
      )}
    </div>
  )
}
