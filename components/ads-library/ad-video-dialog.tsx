'use client'

// Modal del anuncio en la Biblioteca: el video completo (con sonido y controles) al lado
// de todo lo que se sabe del anuncio. Reemplaza, solo en esta pantalla, al panel flotante
// del hover, que tapaba las tarjetas vecinas y no existía en celular.
// Ver docs/redesign/biblioteca-anuncios/02-propuesta.md (1.5).

import type { RefObject } from 'react'
import { ExternalLink, Lock, Package, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { describeAdStatus } from '@/lib/ad-status'
import type { AdLibraryItem } from '@/app/(dashboard)/types'
import { AdStatusLine, advertiserLabel, proxiedImage, safeMetaUrl } from './library-ad-card'

export function AdVideoDialog({
  ad,
  open,
  onOpenChange,
  allowMetaLink,
  returnFocusTo,
}: {
  ad: AdLibraryItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  allowMetaLink: boolean
  /** Sin DialogTrigger, Radix no sabe a dónde devolver el foco al cerrar: se lo decimos */
  returnFocusTo: RefObject<HTMLElement | null>
}) {
  if (!ad) return null
  const label = advertiserLabel(ad)
  const status = describeAdStatus(ad)
  const productImg = proxiedImage(ad.productImage)
  const days = typeof ad.days_running === 'number' ? ad.days_running : null
  const metaUrl = safeMetaUrl(ad.ad_snapshot_url)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] gap-0 overflow-y-auto bg-card p-4 sm:max-w-3xl md:p-5"
        onCloseAutoFocus={e => {
          e.preventDefault()
          returnFocusTo.current?.focus()
        }}
      >
        {/* Cierre propio con fondo: en celular cae sobre el video negro y el de shadcn no se ve */}
        <DialogClose className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-xs transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <X className="size-4" aria-hidden />
          <span className="sr-only">Cerrar</span>
        </DialogClose>
        <div className="grid gap-5 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-xl bg-black">
            {ad.video_url_r2 ? (
              <video
                key={ad.id}
                src={ad.video_url_r2}
                poster={ad.thumbnail_url || undefined}
                controls
                autoPlay
                playsInline
                className="mx-auto aspect-[9/16] max-h-[44vh] w-full object-contain md:max-h-none"
              />
            ) : ad.thumbnail_url ? (
              <img src={ad.thumbnail_url} alt="" className="mx-auto aspect-[9/16] max-h-[44vh] w-full object-contain md:max-h-none" />
            ) : (
              <div className="flex aspect-[9/16] max-h-[44vh] w-full items-center justify-center text-sm text-white/70 md:max-h-none">
                Sin video guardado
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-3 pr-6 md:pr-8">
            <AdStatusLine ad={ad} />
            {status.hint && (status.tone === 'warn' || status.detailWarn) && (
              // En celular no hay tooltip: el porqué del ámbar se lee acá.
              <p className="-mt-1.5 text-xs text-subtle-foreground">{status.hint}.</p>
            )}

            <DialogTitle className="font-display text-xl font-semibold leading-7 text-foreground">{label}</DialogTitle>
            <DialogDescription className="sr-only">Video y datos del anuncio</DialogDescription>

            <div className="flex flex-wrap gap-1.5">
              {days != null && (
                <span className="rounded-full border border-border bg-secondary px-2 text-xs font-medium leading-5 text-muted-foreground">
                  {ad.status === 'active' ? `${days} días corriendo` : `corrió al menos ${days} días`}
                </span>
              )}
              {ad.country && (
                <span className="rounded-full border border-border bg-secondary px-2 text-xs font-medium leading-5 text-muted-foreground">
                  {ad.country}
                </span>
              )}
            </div>

            {ad.body_text ? (
              <p className="whitespace-pre-line text-sm leading-[21px] text-foreground">{ad.body_text}</p>
            ) : (
              <p className="text-sm text-subtle-foreground">Todavía no tenemos el texto de este anuncio.</p>
            )}

            {ad.productTitle && (
              <div className="flex min-w-0 items-center gap-2.5 rounded-lg border border-border bg-background p-2.5">
                {productImg ? (
                  <img src={productImg} alt="" className="size-10 shrink-0 rounded-md border border-border object-cover" />
                ) : (
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-subtle-foreground">
                    <Package className="size-4" aria-hidden />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-5 text-foreground">{ad.productTitle}</span>
                  {ad.productNiche && <span className="block text-xs text-subtle-foreground">{ad.productNiche}</span>}
                </span>
              </div>
            )}

            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              {allowMetaLink && metaUrl ? (
                <Button asChild variant="outline">
                  <a href={metaUrl} target="_blank" rel="noopener noreferrer">
                    Ver en Meta
                    <ExternalLink aria-hidden />
                  </a>
                </Button>
              ) : !allowMetaLink ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-subtle-foreground">
                  <Lock className="size-3.5" aria-hidden />
                  El link a Meta es del plan Pro
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
