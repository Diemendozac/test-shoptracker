'use client'

import type { MouseEvent as ReactMouseEvent } from 'react'
import Link from 'next/link'
import { ExternalLink, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { computeSignal } from '@/lib/signal'
import { HoverImagePreview } from '@/components/ui/image-preview'
import { FormattedPrice } from '@/components/ui/formatted-price'
import { Sparkline } from '@/components/tracker/sparkline'
import { SignalBadge } from '@/components/tracker/signal-badge'
import { AdsCell, AdsCount } from '@/components/tracker/ads-cell'
import { ShareButton } from '@/components/tracker/share-button'
import { StoryAvatar } from '@/components/tracker/story-ring'

// Fila de producto compartida (CHANGE-134, Fase 2b). La usa el Radar en los dos alcances
// (todo el mercado y tus tiendas). Reemplaza a PoolWinnerRow, que mostraba el mismo dato con
// cuatro escalas distintas (score, tendencia, crecimiento y "Élite/Fuerte/Medio"). Ahora cada
// producto muestra cuatro evidencias: señal, movimiento del puesto, edad y pauta.
//
// Anchos:
//   full     ≥1280 px: todas las columnas.
//   medium   768–1279 px: la edad y los anuncios pasan debajo del nombre.
//   compact  con el panel de detalle abierto al lado.
//   card     por debajo de 768 px: tarjeta. Con onOpenStories, la foto es redonda y, si el
//            producto tiene videos, lleva el anillo de historias (CHANGE-142).

export interface RowProduct {
  candidateId: string
  storeId: string
  productTitle: string
  productImage: string | null
  productPrice: number | null
  currency: string | null
  storeName: string
  storeCountry: string | null
  pagoAnticipado: boolean | null
  daysElapsed: number
  performanceScore: number | null
  rankHistory?: number[]
}

export type RowLayout = 'full' | 'medium' | 'compact'

export const ROW_COLS: Record<RowLayout, string> = {
  full: 'grid-cols-[24px_52px_minmax(0,1fr)_112px_132px_64px_84px_150px_76px]',
  medium: 'grid-cols-[24px_48px_minmax(0,1fr)_112px_132px_76px]',
  compact: 'grid-cols-[24px_40px_minmax(0,1fr)_104px_116px]',
}

function countryFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return ''
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)))
}

function ageText(days: number): string {
  if (days <= 0) return 'hoy'
  return days === 1 ? 'hace 1 día' : `hace ${days} días`
}

interface ProductRowProps {
  product: RowProduct
  href: string
  variant: 'row' | 'card'
  layout?: RowLayout
  preferredCurrency: string
  isFavorite: boolean
  onToggleFavorite: (id: string) => void
  isSelected?: boolean
  onSelect?: (candidateId: string, storeId: string) => void
  /** Solo en la tarjeta: tocar la foto abre los videos del producto como historias */
  onOpenStories?: (candidateId: string) => void
}

export function ProductRow({
  product: p, href, variant, layout = 'full', preferredCurrency,
  isFavorite, onToggleFavorite, isSelected, onSelect, onOpenStories,
}: ProductRowProps) {
  const signal = computeSignal({ daysElapsed: p.daysElapsed, rankHistory: p.rankHistory, performanceScore: p.performanceScore })

  function handleOpen(e: ReactMouseEvent<HTMLAnchorElement>) {
    if (!onSelect) return // sin panel al lado: navega a la ficha
    if (e.metaKey || e.ctrlKey || e.button === 1) return // abrir en pestaña nueva
    e.preventDefault()
    onSelect(p.candidateId, p.storeId)
  }

  const favorite = (
    <button
      type="button"
      onClick={() => onToggleFavorite(p.candidateId)}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
      className="flex h-8 w-6 items-center justify-center"
    >
      <Star className={cn('h-4 w-4 transition-colors', isFavorite ? 'fill-warning text-warning' : 'text-subtle-foreground/50 hover:text-warning')} />
    </button>
  )

  const flag = p.storeCountry && (
    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-card text-[13px] leading-none shadow-sm ring-1 ring-border">
      {countryFlag(p.storeCountry)}
    </span>
  )

  const image = (size: number) => (
    <div className="relative inline-block shrink-0 self-start">
      <HoverImagePreview src={p.productImage} fallback={p.productTitle.charAt(0)} size={size} proxy />
      {flag}
    </div>
  )

  const facts = (
    <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-subtle-foreground">
      <span className="max-w-[12rem] truncate">{p.storeName}</span>
      <span aria-hidden>·</span>
      <FormattedPrice amount={p.productPrice} originalCurrency={p.currency} preferredCurrency={preferredCurrency} compact />
      {p.pagoAnticipado && (
        <span className="rounded-full border border-primary-border bg-primary-subtle px-1.5 text-[11px] font-medium text-primary-text">
          Pago anticipado
        </span>
      )}
    </span>
  )

  const movement = (
    <div className="flex items-center gap-2">
      <Sparkline data={signal.window.map((r) => -r)} width={52} height={24} />
      <div className="min-w-0 leading-tight">
        <div className="text-sm font-semibold tabular-nums">{signal.rank != null ? `#${signal.rank}` : '—'}</div>
        <div className={cn(
          'text-xs tabular-nums',
          signal.rankChange != null && signal.rankChange > 0 ? 'text-success-foreground'
            : signal.rankChange != null && signal.rankChange < 0 ? 'text-danger-foreground'
            : 'text-subtle-foreground',
        )}>
          {signal.rankChange == null ? 'sin historial'
            : signal.rankChange > 0 ? `subió ${signal.rankChange}`
            : signal.rankChange < 0 ? `bajó ${-signal.rankChange}`
            : 'sin cambio'}
        </div>
      </div>
    </div>
  )

  const title = (
    <Link href={href} onClick={handleOpen}
      className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors hover:text-primary-text hover:underline">
      {p.productTitle}
    </Link>
  )

  if (variant === 'card') {
    return (
      <div className={cn('flex gap-3 px-4 py-3', isSelected && 'bg-primary-subtle')}>
        {onOpenStories
          ? <StoryAvatar candidateId={p.candidateId} title={p.productTitle} image={p.productImage} size={68} onOpen={onOpenStories} badge={flag} />
          : image(64)}
        <div className="grid min-w-0 flex-1 gap-1.5">
          {title}
          {facts}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <SignalBadge signal={signal} />
            <span className="text-xs tabular-nums text-muted-foreground">
              {signal.rank != null ? `#${signal.rank}` : ''}
              {signal.rankChange != null && signal.rankChange !== 0 && (
                <span className={signal.rankChange > 0 ? 'text-success-foreground' : 'text-danger-foreground'}>
                  {' '}{signal.rankChange > 0 ? `↑${signal.rankChange}` : `↓${-signal.rankChange}`}
                </span>
              )}
            </span>
            <span className="text-xs text-subtle-foreground">{ageText(p.daysElapsed)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <AdsCount candidateId={p.candidateId} />
            {favorite}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'grid items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/40',
      ROW_COLS[layout],
      isSelected && 'bg-primary-subtle ring-1 ring-inset ring-primary-border',
    )}>
      {favorite}
      {image(layout === 'compact' ? 40 : layout === 'medium' ? 48 : 52)}
      <div className="grid min-w-0 gap-1">
        {title}
        {facts}
        {layout === 'medium' && (
          <span className="flex flex-wrap items-center gap-x-1.5 text-xs text-subtle-foreground">
            <span>Detectado {ageText(p.daysElapsed)}</span>
            <span aria-hidden>·</span>
            <AdsCount candidateId={p.candidateId} />
          </span>
        )}
      </div>
      <SignalBadge signal={signal} showConfidence={layout !== 'compact'} />
      {movement}
      {layout === 'full' && (
        <>
          <span className="text-sm tabular-nums text-muted-foreground">
            {p.performanceScore != null ? Math.round(p.performanceScore) : '—'}
          </span>
          <span className="text-xs text-muted-foreground">{ageText(p.daysElapsed)}</span>
          <AdsCell candidateId={p.candidateId} />
        </>
      )}
      {layout !== 'compact' && (
        <div className="flex flex-col items-center gap-1">
          <Link href={href} onClick={handleOpen}
            className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
            Ver <ExternalLink className="h-3 w-3" />
          </Link>
          <ShareButton candidateId={p.candidateId} />
        </div>
      )}
    </div>
  )
}
