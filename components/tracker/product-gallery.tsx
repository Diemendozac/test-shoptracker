'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'

// Galería de fotos del producto con visor a pantalla completa. Se movió sin cambios desde
// tracker/[candidateId]/page.tsx para que la use la ficha única (CHANGE-135).
export function ProductGallery({ images, productTitle }: { images: string[]; productTitle: string }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState(0)
  const [thumbOffset, setThumbOffset] = useState(0)
  const VISIBLE_THUMBS = 4

  const prev = useCallback(() => setActiveIdx(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setActiveIdx(i => (i + 1) % images.length), [images.length])

  const openLightbox = (idx: number) => { setLightboxIdx(idx); setLightboxOpen(true) }
  const closeLightbox = useCallback(() => setLightboxOpen(false), [])
  const lightboxPrev = useCallback(() => setLightboxIdx(i => (i - 1 + images.length) % images.length), [images.length])
  const lightboxNext = useCallback(() => setLightboxIdx(i => (i + 1) % images.length), [images.length])

  useEffect(() => {
    if (!lightboxOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') lightboxPrev()
      if (e.key === 'ArrowRight') lightboxNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxOpen, closeLightbox, lightboxPrev, lightboxNext])

  // sync thumb strip when active image changes
  useEffect(() => {
    if (activeIdx < thumbOffset) setThumbOffset(activeIdx)
    else if (activeIdx >= thumbOffset + VISIBLE_THUMBS) setThumbOffset(activeIdx - VISIBLE_THUMBS + 1)
  }, [activeIdx, thumbOffset])

  if (images.length === 0) return null

  const canScrollUp = thumbOffset > 0
  const canScrollDown = thumbOffset + VISIBLE_THUMBS < images.length

  return (
    <>
      <div className="flex gap-2 shrink-0">
        {/* Main image */}
        <div
          className="relative group w-52 h-52 rounded-xl overflow-hidden bg-secondary cursor-zoom-in"
          onClick={() => openLightbox(activeIdx)}
        >
          <img
            src={images[activeIdx]}
            alt={productTitle}
            className="w-full h-full object-cover"
          />
          {images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prev() }}
                className="absolute left-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); next() }}
                className="absolute right-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
          <div className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <ZoomIn className="h-3.5 w-3.5" />
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={cn('h-1.5 w-1.5 rounded-full', i === activeIdx ? 'bg-white' : 'bg-white/40')}
                />
              ))}
            </div>
          )}
        </div>

        {/* Vertical thumbnail strip */}
        {images.length > 1 && (
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setThumbOffset(o => Math.max(0, o - 1))}
              disabled={!canScrollUp}
              className="flex h-5 w-10 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <div className="flex flex-col gap-1">
              {images.slice(thumbOffset, thumbOffset + VISIBLE_THUMBS).map((img, relIdx) => {
                const absIdx = thumbOffset + relIdx
                return (
                  <button
                    key={absIdx}
                    onClick={() => setActiveIdx(absIdx)}
                    className={cn(
                      'h-[46px] w-[46px] shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                      absIdx === activeIdx ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100',
                    )}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setThumbOffset(o => Math.min(images.length - VISIBLE_THUMBS, o + 1))}
              disabled={!canScrollDown}
              className="flex h-5 w-10 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          {/* Main lightbox image */}
          <div
            className="relative flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={lightboxPrev}
              className="absolute -left-14 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <img
              src={images[lightboxIdx]}
              alt={productTitle}
              className="max-h-[70vh] max-w-[80vw] rounded-xl object-contain"
            />
            <button
              onClick={lightboxNext}
              className="absolute -right-14 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Lightbox thumbnail strip */}
          {images.length > 1 && (
            <div
              className="mt-4 flex items-center gap-2"
              onClick={e => e.stopPropagation()}
            >
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIdx(i)}
                  className={cn(
                    'h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                    i === lightboxIdx ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80',
                  )}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          <p className="absolute bottom-4 text-sm text-white/60">
            {lightboxIdx + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  )
}
