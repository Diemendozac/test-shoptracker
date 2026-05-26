'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  ExternalLink, MoreVertical, CheckCircle,
  XCircle, Clock, RefreshCw, Trash2, Edit,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { StoreResponse } from '../types'
import { getStoreStatus } from '../utils/storeStatus'

function formatLastScraped(dateStr: string) {
  const diffHours = Math.round(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60)
  )
  if (diffHours < 1) return 'Justo ahora'
  if (diffHours < 24) return `Hace ${diffHours}h`
  return `Hace ${Math.floor(diffHours / 24)}d`
}

interface StoreRowProps {
  store: StoreResponse
  isSyncing: boolean
  isDeleting: boolean
  onSync: () => void
  onDelete: () => void
}

export function StoreRow({ store, isSyncing, isDeleting, onSync, onDelete }: StoreRowProps) {
  return (
    <div className={cn(
      'grid grid-cols-[40px_1fr_80px_60px_96px_96px_80px] items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/30',
      !store.isActive && 'opacity-50',
    )}>
      {/* Logo */}
      <StoreLogo storeName={store.storeName} baseUrl={store.baseUrl} />

      {/* Name + URL + products */}
      <div className="min-w-0">
        <Link
          href={`/stores/${store.storeId}`}
          className="block truncate text-sm font-medium text-foreground hover:text-primary hover:underline transition-colors"
        >
          {store.storeName}
        </Link>
        <a
          href={store.baseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-primary"
        >
          {store.baseUrl.replace(/^https?:\/\//, '')}
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
        {store.productCount != null && store.productCount > 0 && (
          <p className="text-[10px] text-muted-foreground/50 tabular-nums">
            {store.productCount} productos
          </p>
        )}
      </div>

      {/* Niche */}
      <div className="min-w-0">
        {store.niche ? (
          <span className="block truncate rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {store.niche}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground/40">—</span>
        )}
      </div>

      {/* Currency */}
      <div className="text-center">
        {store.currency ? (
          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            {store.currency}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground/40">—</span>
        )}
      </div>

      {/* Pago anticipado */}
      <div className="text-center">
        {store.pagoAnticipado === true ? (
          <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
            Anticipado
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground/40">—</span>
        )}
      </div>

      {/* Status + last scraped — single unified badge */}
      <div className="min-w-0 text-center">
        {(() => {
          const status = getStoreStatus(store)
          if (status === 'ACTIVA') return (
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
              <CheckCircle className="h-2.5 w-2.5" />Activa
            </div>
          )
          return (
            <div className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
              status === 'ZOMBIE' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-600',
            )}>
              {status}
            </div>
          )
        })()}
        <p className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="h-2.5 w-2.5" />
          {store.lastScrapedAt ? formatLastScraped(store.lastScrapedAt) : 'Nunca'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={!store.isActive || isSyncing}
          onClick={onSync}
          title="Sync Now"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2">
              <Edit className="h-4 w-4" />
              Editar tienda
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              {store.isActive
                ? <><XCircle className="h-4 w-4" />Pausar</>
                : <><CheckCircle className="h-4 w-4" />Reanudar</>
              }
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              disabled={isDeleting}
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Eliminando...' : 'Eliminar tienda'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ─── StoreLogo ────────────────────────────────────────────────────────────────

function StoreLogo({ storeName, baseUrl }: { storeName: string; baseUrl: string }) {
  const [failed, setFailed] = useState(false)
  const initials = storeName.slice(0, 2).toUpperCase()
  const domain = baseUrl ? baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '') : null
  // Use proxy route: parses <link rel="icon"> from the homepage (Shopify stores
  // keep their favicon on the CDN, not at /favicon.ico). Returns 404 → initials fallback.
  const faviconUrl = domain ? `/api/favicon?domain=${encodeURIComponent(domain)}` : null

  if (!faviconUrl || failed) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {initials}
      </div>
    )
  }

  return (
    <img
      src={faviconUrl}
      alt=""
      className="h-9 w-9 shrink-0 rounded-full object-contain bg-secondary p-0.5"
      onError={() => setFailed(true)}
    />
  )
}
