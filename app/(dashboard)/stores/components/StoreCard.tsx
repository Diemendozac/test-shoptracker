
'use client'

import { useState } from 'react'
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
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}

interface StoreCardProps {
  store: StoreResponse
  isSyncing: boolean
  isDeleting: boolean
  onSync: () => void
  onDelete: () => void
}

export function StoreCard({ store, isSyncing, isDeleting, onSync, onDelete }: StoreCardProps) {
  const status = getStoreStatus(store)

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:shadow-lg',
        status === 'ACTIVA'
          ? 'border-border hover:border-primary/40 hover:shadow-primary/5'
          : 'border-border/50 opacity-70',
      )}
    >
      {/* Single status badge — only shown when not healthy */}
      {status !== 'ACTIVA' && (
        <div className={cn(
          'absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
          status === 'ZOMBIE' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-600',
        )}>
          {status}
        </div>
      )}

      <div className="p-5">
        {/* Store header */}
        <div className="mb-4 flex items-start gap-3">
          <StoreLogo storeName={store.storeName} baseUrl={store.baseUrl} />

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-foreground">{store.storeName}</h3>
            
            <a href={store.baseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              {store.baseUrl.replace('https://', '')}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Store info */}
        <div className="mb-4 space-y-2">
          {/* Currency + pago anticipado badges */}
          {(store.currency || store.pagoAnticipado != null) && (
            <div className="flex flex-wrap gap-1.5">
              {store.currency && (
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {store.currency}
                </span>
              )}
              {store.country && (
                <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {store.country}
                </span>
              )}
              {store.pagoAnticipado === true && (
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                  Pago anticipado
                </span>
              )}
              {store.niche && (
                <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                  {store.niche}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">URL de scraping</span>
            <span className="truncate pl-2 font-mono text-xs text-foreground">
              {store.bestsellerPath ? store.bestsellerPath.slice(0, 25) + '...' : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Last scraped</span>
            <span className="flex items-center gap-1.5 text-foreground">
              <Clock className="h-3 w-3 text-muted-foreground" />
              {store.lastScrapedAt ? formatLastScraped(store.lastScrapedAt) : 'Never'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={!store.isActive || isSyncing}
            onClick={onSync}
          >
            <RefreshCw className={cn('h-3 w-3', isSyncing && 'animate-spin')} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2">
                <Edit className="h-4 w-4" />
                Edit Store
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                {store.isActive
                  ? <><XCircle className="h-4 w-4" />Pause Tracking</>
                  : <><CheckCircle className="h-4 w-4" />Resume Tracking</>
                }
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-destructive focus:text-destructive"
                disabled={isDeleting}
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete Store'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

// ─── StoreLogo ────────────────────────────────────────────────────────────────

function StoreLogo({ storeName, baseUrl }: { storeName: string; baseUrl: string }) {
  const [imgFailed, setImgFailed] = useState(false)
  // Use favicon.ico directly — returns 404 when missing so onError fires correctly.
  // Google's favicon API always returns 200 (with a generic globe) so we can't detect failures.
  const faviconUrl = baseUrl
    ? `/api/image-proxy?url=${encodeURIComponent(baseUrl.replace(/\/$/, '') + '/favicon.ico')}`
    : ''

  return (
    <div className="relative h-12 w-12 shrink-0">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-lg font-bold text-muted-foreground">
        {storeName.charAt(0).toUpperCase()}
      </div>
      {!imgFailed && faviconUrl && (
        <img
          src={faviconUrl}
          alt=""
          className="absolute inset-0 h-12 w-12 rounded-xl object-contain p-1.5 bg-secondary"
          onError={() => setImgFailed(true)}
        />
      )}
    </div>
  )
}