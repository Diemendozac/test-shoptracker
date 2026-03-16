'use client'

import { useState } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { mockStores } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { 
  Plus, 
  ExternalLink, 
  MoreVertical, 
  CheckCircle, 
  XCircle,
  Clock,
  RefreshCw,
  Trash2,
  Edit
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function StoresPage() {
  const [stores] = useState(mockStores)

  const formatLastScraped = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffHours = Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <PageLayout title="Stores" description="Manage your tracked Shopify stores">
      {/* Header Actions */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{stores.length}</span> of 50 stores registered
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Store
        </Button>
      </div>

      {/* Stores Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <div
            key={store.storeId}
            className={cn(
              'group relative overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:shadow-lg',
              store.isActive 
                ? 'border-border hover:border-primary/40 hover:shadow-primary/5' 
                : 'border-border/50 opacity-60'
            )}
          >
            {/* Status indicator */}
            <div className={cn(
              'absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
              store.isActive 
                ? 'bg-rising/10 text-rising' 
                : 'bg-muted text-muted-foreground'
            )}>
              {store.isActive ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Paused
                </>
              )}
            </div>

            <div className="p-5">
              {/* Store Header */}
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-lg font-bold text-muted-foreground">
                  {store.storeName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-foreground">{store.storeName}</h3>
                  <a
                    href={store.baseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                  >
                    {store.baseUrl.replace('https://', '')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Store Info */}
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Bestseller path</span>
                  <span className="truncate pl-2 text-xs font-mono text-foreground">
                    {store.bestsellerPath.slice(0, 25)}...
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Last scraped</span>
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {formatLastScraped(store.lastScrapedAt)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  disabled={!store.isActive}
                >
                  <RefreshCw className="h-3 w-3" />
                  Sync Now
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
                      {store.isActive ? (
                        <>
                          <XCircle className="h-4 w-4" />
                          Pause Tracking
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Resume Tracking
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                      <Trash2 className="h-4 w-4" />
                      Delete Store
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}

        {/* Add Store Card */}
        <button className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card/50 text-muted-foreground transition-all hover:border-primary/40 hover:bg-card hover:text-foreground">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
            <Plus className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="font-medium">Add New Store</p>
            <p className="text-xs text-muted-foreground">Track up to 50 Shopify stores</p>
          </div>
        </button>
      </div>
    </PageLayout>
  )
}
